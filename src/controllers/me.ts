import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';
import joi from 'joi';
import { getConnection, getCustomRepository, getRepository } from 'typeorm';

import { User } from '../database/entities/user';
import { UserVoiceSetting } from '../database/entities/user-voice-setting';
import { Voice } from '../database/entities/voice';
import { userInputValidationSchema, userVoiceSettingValidationSchema } from '../database/validators';
import { logger } from '../utils';

import * as cacheKeys from '../cache/keys';
import { UserRepository } from '../database/repositories/user';

const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is (already) deleted.';
const MESSAGE_ME_DELETED = 'Your account is deleted. This cannot be undone.';

export const findCurrentUser = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRepository = getCustomRepository(UserRepository);

  const user = await userRepository.findUserDetails(userId);

  if (!user) { return res.status(400).json({ message: MESSAGE_ME_NOT_FOUND }); }

  return res.json(user);
};

export const updateEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  const userId = req.user.id;
  const userRepository = getRepository(User);
  const loggerPrefix = 'User Update E-mail: ';

  const { error } = joi.validate(req.body, userInputValidationSchema.requiredKeys('email'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const emailAddressNormalized = User.normalizeEmail(email);

  logger.info(loggerPrefix, `Try updating for user ID "${userId}"...`);

  const existingUser = await userRepository.findOne({
    where: {
      email: emailAddressNormalized
    }
  });

  if (existingUser && existingUser.id !== userId) {
    logger.info(loggerPrefix, `User ID "${userId}" tried to update his e-mail address, but it\s already in use by an other user.`);
    return res.status(400).json({ message: 'This e-mail address is already in use by an other user.' });
  }

  logger.info(loggerPrefix, `User ID "${userId}" is allowed to update to this e-mail address. Updating now...`);

  await userRepository.update(userId, { email: emailAddressNormalized });

  logger.info(loggerPrefix, 'Updated!');

  // Remove the JWT verification cache as the user updated data
  const cache = await getConnection('default').queryResultCache;
  if (cache) { await cache.remove([cacheKeys.jwtVerifyUser(userId)]); }

  const updatedUser = await userRepository.findOne(userId);

  if (!updatedUser) { return res.status(400).json({ message: 'Could not find your user details after updating the e-mail address.' }); }

  return res.json({ updatedUser });
};

export const updatePassword = async (req: Request, res: Response) => {
  const { password } = req.body;
  const userId = req.user.id;
  const userRepository = getRepository(User);

  const { error } = joi.validate(req.body, userInputValidationSchema.requiredKeys('password'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const hashedPassword = await User.hashPassword(password);

  await userRepository.update(userId, { password: hashedPassword });

  // Remove the JWT verification cache as the user updated data
  const cache = await getConnection('default').queryResultCache;
  if (cache) { await cache.remove([cacheKeys.jwtVerifyUser(userId)]); }

  const updatedUser = await userRepository.findOne(userId);

  return res.json(updatedUser);
};

export const deleteCurrentUser = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRepository = getRepository(User);

  const user = await userRepository.findOne(userId);

  if (!user) { return res.status(400).json({ message: 'User not found!' }); }

  await userRepository.remove(user);

  // Remove the JWT verification cache as the user is not there anymore
  const cache = await getConnection('default').queryResultCache;
  if (cache) { await cache.remove([cacheKeys.jwtVerifyUser(userId)]); }

  return res.json({ message: MESSAGE_ME_DELETED });
};

/**
 * Method where the user can set a default voice per language.
 * This default voice will then be used for articles with the same language.
 *
 * @param req
 * @param res
 */
export const createSelectedVoice = async (req: Request, res: Response) => {
  const loggerPrefix = 'User Create Selected Voice Setting:';
  const userId: string = req.user.id;
  const { voiceId }: { voiceId: string } = req.body;
  const userVoiceSettingRepository = getRepository(UserVoiceSetting);
  const voiceRepository = getRepository(Voice);
  const userRepository = getCustomRepository(UserRepository);

  const { error } = joi.validate(req.body, userVoiceSettingValidationSchema.requiredKeys('voiceId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    logger.error(loggerPrefix, messageDetails);
    return res.status(400).json({ message: messageDetails });
  }

  logger.info(loggerPrefix, 'Setting default voice...');

  try {
    // Check if the voice exists and is active
    const voice = await voiceRepository.findOne(voiceId, { where: { isActive: true } });

    if (!voice) {
      const errorMessage = 'Voice not found or voice is not active.';
      logger.error(loggerPrefix, errorMessage);
      throw new Error(errorMessage);
    }

    const user = await userRepository.findUserDetails(userId);

    if (!user) { return res.status(400).json({ message: 'User not found.' }); }

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
    const currentVoiceSetting = await userVoiceSettingRepository.findOne({
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
      await userVoiceSettingRepository.update(currentVoiceSetting.id, {
        voice: {
          id: voiceId
        }
      });
    } else {
      // Create a new setting
      const userVoiceSettingToCreate = await userVoiceSettingRepository.create({
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

      await userVoiceSettingRepository.save(userVoiceSettingToCreate);
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
