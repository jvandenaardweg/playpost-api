import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';
import joi from 'joi';
import { getCustomRepository, getRepository } from 'typeorm';
import uuid from 'uuid';

import * as storage from '../storage/google-cloud';

import { Article, ArticleStatus } from '../database/entities/article';
import { Audiofile, AudiofileMimeType } from '../database/entities/audiofile';
import { UserVoiceSetting } from '../database/entities/user-voice-setting';
import { Voice } from '../database/entities/voice';
import { AudiofileRepository } from '../database/repositories/audiofile';
import { UserRepository } from '../database/repositories/user';

import { audiofileInputValidationSchema } from '../database/validators';
import { synthesizeArticleToAudiofile } from '../synthesizers';
import { logger } from '../utils';

export const findById = async (req: Request, res: Response) => {
  const { audiofileId } = req.params;
  const audiofileRepository = getRepository(Audiofile);
  const { error } = joi.validate(req.params, audiofileInputValidationSchema.requiredKeys('audiofileId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const audiofile = await audiofileRepository.findOne(audiofileId, { relations: ['voice'] });

  if (!audiofile) { return res.status(400).json({ message: 'Audiofile not found.' }); }

  return res.json(audiofile);
};

/**
 * Create's an audiofile using the article's SSML.
 *
 */
export const createAudiofile = async (req: Request, res: Response) => {
  interface IRequestBody {
    mimeType: AudiofileMimeType;
    voiceId: string;
  }

  const hrstart = process.hrtime();

  const loggerPrefix = 'Create Audiofile:';

  const userId = req.user.id;
  const { articleId } = req.params;
  const { mimeType } = req.body as IRequestBody;

  const articleRepository = getRepository(Article);
  const voiceRepository = getRepository(Voice);
  const audiofileRepository = getCustomRepository(AudiofileRepository);
  const userVoiceSettingRepository = getRepository(UserVoiceSetting);
  const userRepository = getCustomRepository(UserRepository);

  const { error } = joi.validate({ ...req.params, ...req.body }, audiofileInputValidationSchema.requiredKeys('articleId', 'mimeType'));

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  const user = await userRepository.findUserDetails(userId);

  if (!user) { return res.status(400).json({ message: 'User not found.' }); }

  const userIsSubscribed = !!user.activeUserInAppSubscription;
  const userSubscriptionLimits = user.limits.audiofiles;
  const userAudiofilesUsage = user.used.audiofiles;

  logger.info(loggerPrefix, `User "${userId}" is subscribed:`, userIsSubscribed);
  logger.info(loggerPrefix, `User "${userId}" limits:`, userSubscriptionLimits);
  logger.info(loggerPrefix, `User "${userId}" current month audiofile usage in seconds:`, userAudiofilesUsage.currentMonthInSeconds);

  // Check to see if the current user is already above it's monthly limit
  if (userAudiofilesUsage.currentMonthInSeconds > userSubscriptionLimits.limitSecondsPerMonth) {
    const limitInMinutesPerMonth = userSubscriptionLimits.limitSecondsPerMonth / 60;

    // Check if there's a higher subscription available for the user
    const subscriptionUpgradeOption = await userRepository.findSubscriptionUpgradeOption(userId);
    const isEligibleForTrial = !user.usedInAppSubscriptionTrials.length;

    // Fallback message, this happens when there is no upgrade option (probably when the user is already on Plus)
    // When this happens, we probably should introduce an unlimited subscription option
    let upgradeMessagePart = `Please contact our support to have a chat about more audio minutes.`;

    if (subscriptionUpgradeOption) {
      // tslint:disable-next-line: prefer-conditional-expression
      if (!isEligibleForTrial) {
        upgradeMessagePart =  `To continue using Playpost you can upgrade to a "${subscriptionUpgradeOption.name}" subscription for more minutes.`;
      } else {
        upgradeMessagePart = `To continue using Playpost start your free "${subscriptionUpgradeOption.name}" trial today!`;
      }
    }

    const message = `You have reached the monthly limit of ${limitInMinutesPerMonth} minutes of audio. ${upgradeMessagePart}`;

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      scope.setExtra('userIsSubscribed', userIsSubscribed);
      scope.setExtra('subscriptionUpgradeOption', subscriptionUpgradeOption);
      Sentry.captureMessage(message);
    });

    // status code 402 = "Payment Required"
    return res.status(402).json({ message, isEligibleForTrial, subscriptionUpgradeOption, limitInMinutesPerMonth });
  }

  // Fetch the article (without SSML)
  // The article is without SSML because we don't want to send the SSML to our users
  const article = await articleRepository.findOne(articleId);

  // Check if article exists
  if (!article) {
    const message = 'Article does not exist, cannot create audio.';

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      scope.setExtra('article', article);
      scope.setExtra('userIsSubscribed', userIsSubscribed);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // Seperately get the SSML, as this is hidden from the article entity by default
  const articleWithSsml = await articleRepository.findOne(articleId, { select: ['id', 'ssml'] });
  article.ssml = articleWithSsml && articleWithSsml.ssml ? articleWithSsml.ssml : '';

  // Check if article status is correct to create audiofiles for
  if (article.status !== ArticleStatus.FINISHED) {
    const message = `The given article is not processed successfully. Current status: ${article.status}. We cannot generate audio for this article.`;

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      scope.setExtra('article', article);
      scope.setExtra('userIsSubscribed', userIsSubscribed);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  const articleReadingTimeInSeconds = article.readingTime && article.readingTime;

  // Check to see of the current article readingtime length will go above the user's monthly limit
  if (userAudiofilesUsage.currentMonthInSeconds + articleReadingTimeInSeconds > userSubscriptionLimits.limitSecondsPerMonth) {
    const limitInMinutesPerMonth = userSubscriptionLimits.limitSecondsPerMonth / 60;

    // Check if there's a higher subscription available for the user
    const subscriptionUpgradeOption = await userRepository.findSubscriptionUpgradeOption(userId);
    const isEligibleForTrial = !user.usedInAppSubscriptionTrials.length;

    // Fallback message, this happens when there is no upgrade option (probably when the user is already on Plus)
    // When this happens, we probably should introduce an unlimited subscription option
    let upgradeMessagePart = `Please contact our support to have a chat about more audio minutes.`;

    if (subscriptionUpgradeOption) {
      // tslint:disable-next-line: prefer-conditional-expression
      if (!isEligibleForTrial) {
        upgradeMessagePart =  `To continue using Playpost you can upgrade to a "${subscriptionUpgradeOption.name}" subscription for more minutes.`;
      } else {
        upgradeMessagePart = `To continue using Playpost start your free "${subscriptionUpgradeOption.name}" trial today!`;
      }
    }

    const message = `This article's audio exceeds your monthly limit of ${limitInMinutesPerMonth} minutes per month. ${upgradeMessagePart}`;

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      scope.setExtra('article', article);
      scope.setExtra('userIsSubscribed', userIsSubscribed);
      scope.setExtra('subscriptionUpgradeOption', subscriptionUpgradeOption);
      scope.setExtra('userSubscriptionLimits', userSubscriptionLimits);
      Sentry.captureMessage(message);
    });

    // status code 402 = "Payment Required"
    return res.status(402).json({ message, isEligibleForTrial, subscriptionUpgradeOption, limitInMinutesPerMonth });
  }

  // Check to see of the current article length length will go above the user's monthly limit
  // Important: there might be some slack, because the readingtime could be different then the final audiofile length in seconds, but that doesnt matter
  if (articleReadingTimeInSeconds > userSubscriptionLimits.limitSecondsPerArticle) {
    const limitInMinutesPerArticle = userSubscriptionLimits.limitSecondsPerArticle / 60;

    // Check if there's a higher subscription available for the user
    const message = `This article's audio exceeds the limit of ${limitInMinutesPerArticle} minutes per article. We cannot create audio for this article. Please contact our support to enable higher limits.`;

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      scope.setExtra('article', article);
      scope.setExtra('userIsSubscribed', userIsSubscribed);
      scope.setExtra('userSubscriptionLimits', userSubscriptionLimits);
      // scope.setExtra('subscriptionUpgradeOption', subscriptionUpgradeOption);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);

    return res.status(400).json({ message });
  }

  // Check if the language is supported
  const articleLanguage = article && article.language;
  const articleLanguageCode = articleLanguage && articleLanguage.code;
  const articleLanguageName = articleLanguage && articleLanguage.name;
  const articleLanguageIsActive = articleLanguage && articleLanguage.isActive;

  if (!articleLanguage) {
    const message = 'The language of the article is unknown. We cannot create audio for this article.';

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      scope.setExtra('article', article);
      scope.setExtra('userIsSubscribed', userIsSubscribed);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // Check if the article's language is supported
  if (!articleLanguageIsActive) {
    const message = `The language (${articleLanguageName}) of this article is currently not supported by Playpost. We have made a note about this and will try to add support in future updates.`;

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      scope.setExtra('article', article);
      scope.setExtra('userIsSubscribed', userIsSubscribed);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // Check if the article has any SSML
  if (!article.ssml) {
    const message = 'Article has no SSML data. We cannot generate audio for this article.';

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      scope.setExtra('article', article);
      scope.setExtra('userIsSubscribed', userIsSubscribed);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // Only allow one audiofile for free accounts
  if (!userIsSubscribed && article.audiofiles && article.audiofiles.length) {
    const message = 'You are on a free account and an audiofile for this article already exists. Please use the available audiofile.';

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      scope.setExtra('article', article);
      scope.setExtra('userIsSubscribed', userIsSubscribed);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message, id: article.audiofiles[0].id });
  }

  logger.info(loggerPrefix, 'Determining what voice to use for this article...');

  if (!articleLanguageCode) {
    const message = `Could not determine the language using article language code: ${articleLanguageCode}`;

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      scope.setExtra('article', article);
      scope.setExtra('userIsSubscribed', userIsSubscribed);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // Check if the user has a voice set for this article's language
  const userVoiceSetting = await userVoiceSettingRepository.findOne({
    user: {
      id: userId
    },
    language: {
      id: articleLanguage.id
    }
  });

  let voice = userVoiceSetting && userVoiceSetting.voice;

  // Check if the user is subscribed when it is a Premium voice
  if (userVoiceSetting && userVoiceSetting.voice.isPremium) {
    // Show an API message when the user is not subscribed anymore
    // So he cannot use this Premium voice anymore
    if (!userIsSubscribed) {
      const languageName = article.language ? article.language.name : 'Unknown';
      const message = `You do not have an active subscription to use this Premium voice. Please upgrade or choose a different voice for this ${languageName} article.`;

      Sentry.withScope(scope => {
        scope.setLevel(Sentry.Severity.Error);
        scope.setExtra('body', req.body);
        scope.setExtra('params', req.params);
        scope.setUser(req.user);
        scope.setExtra('article', article);
        scope.setExtra('userIsSubscribed', userIsSubscribed);
        scope.setExtra('userVoiceSetting', userVoiceSetting);
        Sentry.captureMessage(message);
      });

      logger.error(loggerPrefix, message);
      return res.status(400).json({ message });
    }
  }

  // Check if the voice or language is active
  // We only create audiofiles for languages and voices that are active
  if (userVoiceSetting && (!userVoiceSetting.voice.isActive || !userVoiceSetting.language.isActive)) {
    const message = `The chosen voice or language is not active. We cannot create audio for this article. Please change your voice for ${articleLanguageName} articles.`;

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      scope.setExtra('article', article);
      scope.setExtra('userIsSubscribed', userIsSubscribed);
      scope.setExtra('userVoiceSetting', userVoiceSetting);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // If there's no voice set, the user is probably unsubscribed
  // Determine if the user has high quality previews left, else, get the default voice for this language
  if (!userVoiceSetting) {
    const hasUsedIntroductionHighQualityVoices = !userIsSubscribed && user.hasUsedIntroductionHighQualityVoices;
    const isSubscribedLanguageDefault = userIsSubscribed || hasUsedIntroductionHighQualityVoices;

    // A new (unsubscribed) user can use a Very High quality voice for his first X articles
    if (hasUsedIntroductionHighQualityVoices) {
      logger.info(loggerPrefix, `User is not subscribed has high quality voice previews left. We use a the default high quality voice for this article language.`);
    }

    if (isSubscribedLanguageDefault) {
      // Get the the highest quality previewable voice for the language
      voice = await voiceRepository.findOne({
        isSubscribedLanguageDefault: true,
        isActive: true,
        language: {
          id: articleLanguage.id
        }
      });

      if (!voice) {
        const message = `Could not find the highest quality voice for language: ${articleLanguageCode}. Please contact our support.`;

        Sentry.withScope(scope => {
          scope.setLevel(Sentry.Severity.Error);
          scope.setExtra('body', req.body);
          scope.setExtra('params', req.params);
          scope.setUser(req.user);
          scope.setExtra('article', article);
          scope.setExtra('voice', voice);
          scope.setExtra('userIsSubscribed', userIsSubscribed);
          scope.setExtra('userVoiceSetting', userVoiceSetting);
          Sentry.captureMessage(message);
        });

        logger.error(loggerPrefix, message);
        return res.status(400).json({ message });
      }
    } else {
      logger.info(loggerPrefix, 'User is not subscribed and has no previews left. We fallback to the default voice for the article language...');

      // Get the cheapest voice for the language for users on a free account
      voice = await voiceRepository.findOne({
        isUnsubscribedLanguageDefault: true,
        isActive: true,
        language: {
          id: articleLanguage.id
        }
      });

      if (!voice) {
        const message = `Could not get the active default voice for language: ${articleLanguageCode}. Please contact our support.`;

        Sentry.withScope(scope => {
          scope.setLevel(Sentry.Severity.Error);
          scope.setExtra('body', req.body);
          scope.setExtra('params', req.params);
          scope.setUser(req.user);
          scope.setExtra('article', article);
          scope.setExtra('voice', voice);
          scope.setExtra('userIsSubscribed', userIsSubscribed);
          scope.setExtra('userVoiceSetting', userVoiceSetting);
          Sentry.captureMessage(message);
        });

        logger.error(loggerPrefix, message);
        return res.status(400).json({ message });
      }
    }
  }

  // Check if we have a voice to be used
  if (!voice) {
    const message = 'The given voice to be used to create the audio cannot be found.';

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      scope.setExtra('article', article);
      scope.setExtra('voice', voice);
      scope.setExtra('userIsSubscribed', userIsSubscribed);
      scope.setExtra('userVoiceSetting', userVoiceSetting);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // Check if audiofile for same voice already exists on this article
  // This generally should not happen, we should prevent this from within the app
  if (voice && article.audiofiles.length) {
    const voiceId = voice && voice.id;
    const existingAudiofileForVoice = article.audiofiles.find(audiofile => audiofile.voice.id === voiceId);

    if (existingAudiofileForVoice) {
      const message = `An audiofile for this article with the voice "${voice.label}" already exists. Therefore, we do not create a new audiofile for this article.`;

      Sentry.withScope(scope => {
        scope.setLevel(Sentry.Severity.Error);
        scope.setExtra('body', req.body);
        scope.setExtra('params', req.params);
        scope.setUser(req.user);
        scope.setExtra('article', article);
        scope.setExtra('voice', voice);
        scope.setExtra('userIsSubscribed', userIsSubscribed);
        scope.setExtra('userVoiceSetting', userVoiceSetting);
        Sentry.captureMessage(message);
      });

      logger.error(loggerPrefix, message);
      return res.status(400).json({ message });
    }
  }

  // Passed all checks. We can now start generating an audiofile for this user...

  logger.info(loggerPrefix, 'Start generating audio using voice:', voice.id);

  try {
    // Manually generate a UUID.
    // So we can use this ID to upload a file to storage, before we insert it into the database.
    const audiofileId = uuid.v4();

    logger.info(loggerPrefix, 'Creating audiofile placeholder...');

    // Prepare the audiofile
    const audiofile = audiofileRepository.create({
      id: audiofileId,
      article: {
        id: articleId
      },
      user: {
        id: userId
      },
      voice: {
        id: voice.id
      }
    });

    logger.info(loggerPrefix, `Created audiofile placeholder using ID: ${audiofile.id}`);

    logger.info(loggerPrefix, "Now synthesizing the article's SSML...");

    // // Synthesize and return an uploaded audiofile for use to use in the database
    const audiofileToCreate = await synthesizeArticleToAudiofile(voice, article, audiofile, mimeType);

    logger.info(loggerPrefix, "Successfully synthesized the article's SSML!");

    logger.info(loggerPrefix, 'Saving the audiofile in the database...');

    // Then save it in the database
    const createdAudiofile = await audiofileRepository.save(audiofileToCreate);

    logger.info(loggerPrefix, 'Saved the audiofile in the database! Audiofile ID:', createdAudiofile.id);

    const hrend = process.hrtime(hrstart);
    const ds = hrend[0];
    const dms = hrend[1] / 1000000;
    logger.info(loggerPrefix, `Execution time: ${ds} ${dms}ms`);

    return res.json(createdAudiofile);
  } catch (err) {
    const errorMessage = err && err.message ? err.message : 'An unknown error happenend while generating the audio for this article.';

    Sentry.withScope(scope => {
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      scope.setExtra('article', article);
      scope.setExtra('voice', voice);
      scope.setExtra('userIsSubscribed', userIsSubscribed);
      scope.setExtra('userVoiceSetting', userVoiceSetting);
      Sentry.captureException(err);
    });

    return res.status(500).json({ message: errorMessage });
  }
};

/**
 * Gets all the audiofiles from the database.
 * This endpoint is not visible for other users.
 */
export const findAllAudiofiles = async (req: Request, res: Response) => {
  const userEmail = req.user.email;
  const audiofileRepository = getRepository(Audiofile);

  if (userEmail !== 'jordyvandenaardweg@gmail.com') { return res.status(403).json({ message: 'You dont have access to this endpoint.' }); }

  const audiofiles = await audiofileRepository.findAndCount();

  return res.json(audiofiles);
};

/**
 * Get's an audiofile out of the database using an URL parameter
 */
export const findAudiofileById = async (req: Request, res: Response) => {
  const { audiofileId } = req.params;
  const audiofileRepository = getRepository(Audiofile);

  const { error } = joi.validate(req.params, audiofileInputValidationSchema.requiredKeys('audiofileId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const audiofile = await audiofileRepository.findOne(audiofileId);

  if (!audiofile) { return res.status(400).json({ message: 'Audiofile not found.' }); }

  return res.json(audiofile);
};

/**
 * Deletes an article from the database.
 * Also deletes the audiofile from our cloud storage using AfterRemove on the Audiofile entity.
 */
export const deleteById = async (req: Request, res: Response) => {
  const userEmail = req.user.email;
  const { audiofileId } = req.params;
  const audiofileRepository = getRepository(Audiofile);

  if (userEmail !== 'jordyvandenaardweg@gmail.com') { return res.status(403).json({ message: 'You dont have access to this endpoint.' }); }

  const audiofile = await audiofileRepository.findOne(audiofileId, { relations: ['article'] });

  if (!audiofile) { return res.status(400).json({ message: 'Audiofile not found.' }); }

  const articleId = audiofile.article.id;

  // Delete from the database
  await audiofileRepository.remove(audiofile);

  // Delete audiofile from our storage
  await storage.deleteAudiofile(articleId, audiofileId);

  return res.json({ message: 'Audiofile is deleted!' });
};
