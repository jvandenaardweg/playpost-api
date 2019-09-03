import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';
import joi from 'joi';
import { getConnection, getCustomRepository, getRepository, Repository } from 'typeorm';

import * as inAppSubscriptionsController from '../controllers/in-app-subscriptions';
import { ApiKey } from '../database/entities/api-key';
import { User } from '../database/entities/user';
import { UserVoiceSetting } from '../database/entities/user-voice-setting';
import { Voice } from '../database/entities/voice';

import { UserRepository } from '../database/repositories/user';
import { apiKeyInputValidationSchema, userInputValidationSchema, userVoiceSettingValidationSchema } from '../database/validators';

import * as cacheKeys from '../cache/keys';
import { logger } from '../utils';

const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is (already) deleted.';
const MESSAGE_ME_DELETED = 'Your account is deleted. This cannot be undone.';

export class MeController {
  customUserRepository: UserRepository
  userVoiceSettingRepository: Repository<UserVoiceSetting>
  voiceRepository: Repository<Voice>
  apiKeyRepository: Repository<ApiKey>
  apiKeyEntity: typeof ApiKey
  userEntity: typeof User

  constructor() {
    this.customUserRepository = getCustomRepository(UserRepository)
    this.userVoiceSettingRepository = getRepository(UserVoiceSetting)
    this.voiceRepository = getRepository(Voice)
    this.apiKeyRepository = getRepository(ApiKey)
    this.apiKeyEntity = ApiKey
    this.userEntity = User
  }

  findCurrentUser = async (req: Request, res: Response) => {
    const userId = req.user.id;

    // On each request of the user's own details, make sure all his subscriptions are correctly synced
    // So we can always provide the user with an up-to-date status of his subscriptions
    await inAppSubscriptionsController.syncExpiredSubscriptionsWithService(userId);

    const user = await this.customUserRepository.findUserDetails(userId);

    if (!user) {
      return res.status(400).json({ message: MESSAGE_ME_NOT_FOUND });
    }

    return res.json(user);
  }

  /**
   * Deprecated endpoint. In use in iOS app 1.1.3 and below.
   */
  updateEmail = async (req: Request, res: Response) => {
    return res.status(400).json({ message: 'Please update the App to the latest version to change your e-mail address.' });
  };

  /**
   * Deprecated endpoint. In use in iOS app 1.1.3 and below.
   */
  updatePassword = async (req: Request, res: Response) => {
    return res.status(400).json({ message: 'Please update the App to the latest version to change your password.' });
  };

  /**
   * Patches some fields of the user table.
   * For example, allow the user to update his "email" address or "password".
   *
   */
  patchMe = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const userId = req.user.id;
    const loggerPrefix = 'Patch User: ';

    const { error } = joi.validate(req.body, userInputValidationSchema.optionalKeys('email', 'password'));

    if (error) {
      const messageDetails = error.details.map(detail => detail.message).join(' and ');
      return res.status(400).json({ message: messageDetails });
    }

    if (!email && !password) {
      return res.status(400).json({ message: 'The given field is not patchable.' });
    }

    const user = await this.customUserRepository.findOne(userId);

    if (!user) {
      return res.status(400).json({ message: 'User not found.' })
    }

    const patchObject = this.customUserRepository.create(user)

    if (email) {
      const emailAddressNormalized = this.userEntity.normalizeEmail(email);

      // First, find out if the user can use this e-mail address
      const existingUser = await this.customUserRepository.findOne({
        where: {
          email: emailAddressNormalized
        }
      });

      if (existingUser && existingUser.id !== userId) {
        logger.info(loggerPrefix, `User ID "${userId}" tried to update his e-mail address, but it\s already in use by an other user.`);
        return res.status(400).json({ message: 'This e-mail address is already in use by an other user.' });
      }

      patchObject.email = emailAddressNormalized
    }

    if (password) {
      const hashedPassword = await this.userEntity.hashPassword(password);
      patchObject.password = hashedPassword
    }

    await this.customUserRepository.save(patchObject)

    // Remove the JWT verification cache as the user updated data
    const cache = await getConnection('default').queryResultCache;
    if (cache) { await cache.remove([cacheKeys.jwtVerifyUser(userId)]); }

    const updatedUser = await this.customUserRepository.findUserDetails(userId)

    return res.json(updatedUser);
  };

  /**
   * Allows the loggedin user to completely delete his account and all related database data.
   *
   * The only thing we do not delete, is the purchase history.
   */
  deleteCurrentUser = async (req: Request, res: Response) => {
    const userId = req.user.id;

    await this.customUserRepository.removeById(userId);

    return res.json({ message: MESSAGE_ME_DELETED });
  };

  /**
   * Method where the user can set a default voice per language.
   * This default voice will then be used for articles with the same language.
   *
   */
  createSelectedVoice = async (req: Request, res: Response) => {
    const loggerPrefix = 'User Create Selected Voice Setting:';
    const userId: string = req.user.id;
    const { voiceId }: { voiceId: string } = req.body;

    const { error } = joi.validate(req.body, userVoiceSettingValidationSchema.requiredKeys('voiceId'));

    if (error) {
      const messageDetails = error.details.map(detail => detail.message).join(' and ');
      logger.error(loggerPrefix, messageDetails);
      return res.status(400).json({ message: messageDetails });
    }

    logger.info(loggerPrefix, 'Setting default voice...');

    try {
      // Check if the voice exists and is active
      const voice = await this.voiceRepository.findOne(voiceId, { where: { isActive: true } });

      if (!voice) {
        const errorMessage = 'Voice not found or voice is not active.';
        logger.error(loggerPrefix, errorMessage);
        throw new Error(errorMessage);
      }

      const user = await this.customUserRepository.findUserDetails(userId);

      if (!user) {
        return res.status(400).json({ message: 'User not found.' });
      }

      // If a user is not subscribed, but tries to change to a premium voice
      // Notify the user he cannot do this
      if (!user.isSubscribed && voice.isPremium) {
        const errorMessage = 'It appears you do not have an active Premium subscription to use this voice. If you want to use this voice, please upgrade to a Premium subscription.';
        logger.warn(loggerPrefix, errorMessage);
        throw new Error(errorMessage);
      }

      // Ok, the voice and language exists and can be used
      // Now set this voice as a default for this language for the user, overwriting existing setting for the language
      const voiceLanguageId = voice.language.id;

      // Get the current setting for the voice's language, so we can determine if we need to update it, or create a new setting
      const currentVoiceSetting = await this.userVoiceSettingRepository.findOne({
        user: {
          id: userId
        },
        language: {
          id: voiceLanguageId
        }
      });

      // If there's already a setting for the same language, just update the voice in that setting
      // Essentially enforcing the unique constraint
      if (currentVoiceSetting) {
        // Only update when there's a change in voice
        if (currentVoiceSetting.voice.id === voiceId) {
          // Just return a success
          return res.status(200).json({ message: 'Voice did not change. No need to update.' });
        }

        // Just update the voice, as the language from the voice is the same as the setting we already have
        await this.userVoiceSettingRepository.update(currentVoiceSetting.id, {
          voice: {
            id: voiceId
          }
        });
      } else {
        // Create a new setting
        const userVoiceSettingToCreate = await this.userVoiceSettingRepository.create({
          language: {
            id: voiceLanguageId
          },
          voice: {
            id: voiceId
          },
          user: {
            id: userId
          }
        });

        await this.userVoiceSettingRepository.save(userVoiceSettingToCreate);
      }

      logger.info(loggerPrefix, 'Done!');
      return res.status(200).json({ message: 'Voice set!' });
    } catch (err) {
      const errorMessage = err && err.message ? err.message : 'An unexpected error happened while setting this voice as a default for this language.';
      logger.error(loggerPrefix, errorMessage, err);
      Sentry.captureException(err);
      return res.status(400).json({ message: errorMessage });
    }
  };

  /**
   * Returns all the API keys of the user.
   *
   */
  findAllApiKeys = async (req: Request, res: Response) => {
    const userId = req.user.id;

    const userKeys = await this.apiKeyRepository.find({
      user: {
        id: userId
      }
    });

    return res.json(userKeys);
  };

  /**
   * Method to delete an API Key from the database.
   * This could only be done by the owner of the API key.
   *
   * @param req
   * @param res
   */
  deleteApiKey = async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { apiKeyId } = req.params;

    const { error } = joi.validate(req.params, apiKeyInputValidationSchema);

    if (error) {
      const messageDetails = error.details.map(detail => detail.message).join(' and ');
      return res.status(400).json({ message: messageDetails });
    }

    // Verify if the user has access to that key
    const existingKey = await this.apiKeyRepository.findOne(apiKeyId, {
      where: {
        user: {
          id: userId
        }
      }
    })

    if (!existingKey) {
      return res.status(400).json({ message: 'API key could not be found, or you do not have access to use this API key.' });
    }

    await this.apiKeyRepository.remove(existingKey);

    return res.json({ message: 'API Key is successfully deleted!' });
  };

  /**
   * Method to delete an API Key from the database.
   * This could only be done by the owner of the API key.
   *
   * @param req
   * @param res
   */
  createApiKey = async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { label } = req.body;

    const { error } = joi.validate(req.body, apiKeyInputValidationSchema);

    if (error) {
      const messageDetails = error.details.map(detail => detail.message).join(' and ');
      return res.status(400).json({ message: messageDetails });
    }

    // IMPORTANT: Only show this "apiKey" and "apiSecret" to the user ONCE
    const apiKey = this.apiKeyEntity.generateApiKey();
    const apiSecret = this.apiKeyEntity.generateApiSecret();

    // Store the signature in our database, so we can compare the user's API Key and API Secret when they send it to our server
    const signature = this.apiKeyEntity.generateApiKeySignature(apiKey, apiSecret);

    const apiKeyToCreate = await this.apiKeyRepository.create({
      key: apiKey,
      signature,
      label,
      user: {
        id: userId
      }
    });

    await this.apiKeyRepository.save(apiKeyToCreate);

    return res.json({
      apiKey,
      apiSecret
    });
  };

}
