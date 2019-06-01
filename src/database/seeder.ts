require('dotenv').config();
import { createConnection, getRepository, IsNull } from 'typeorm';

import { connectionOptions } from './connection-options';
import { Language } from './entities/language';
import { Voice } from './entities/voice';
import { InAppSubscription } from './entities/in-app-subscription';
import languages from './seeds/languages';
import inAppSubscriptions from './seeds/in-app-subscriptions';

import { addAllGoogleVoices } from '../synthesizers/google';
import { addAllAWSVoices } from '../synthesizers/aws';

import { logger } from '../utils/logger';

const seedLanguages = async () => {
  const loggerPrefix = 'Seeding Languages:';
  const languageRepository = getRepository(Language);

  try {
    logger.info(loggerPrefix, 'Adding languages to the database...');

    const languageCodes = Object.keys(languages);

    for (const languageCode of languageCodes) {
      const language = languages[languageCode];

      logger.info(loggerPrefix, 'Trying to add:', languageCode, language.name, language.native, '...');

      const existingLanguage = await languageRepository.findOne({
        languageCode
      });

      if (existingLanguage) {
        logger.warn(loggerPrefix, 'Language already exists, we do not add this:', languageCode, language.name, language.native, '...');
      } else {
        // Create the languages
        const languageToCreate = await languageRepository.create({
          languageCode,
          name: language.name,
          nativeName: language.native
        });

        await languageRepository.save(languageToCreate);

        logger.info(loggerPrefix, 'Successfully added:', languageCode, language.name, language.native);
      }
    }
  } catch (err) {
    logger.error(loggerPrefix, 'An error happened.', err);
    throw err;
  } finally {
    logger.info(loggerPrefix, 'Done!');
  }
};

const seedVoices = async () => {
  const loggerPrefix = 'Seeding Voices:';
  const voiceRepository = getRepository(Voice);
  const languageRepository = getRepository(Language);

  try {
    logger.info(loggerPrefix, 'Checking for new voices at Google and AWS...');
    await addAllGoogleVoices(loggerPrefix);
    await addAllAWSVoices(loggerPrefix);

    logger.info(loggerPrefix, 'Checking which voices are not connected to a language yet...');

    const voicesWithoutLanguage = await voiceRepository.find({
      language: IsNull()
    });

    logger.info(loggerPrefix, `Found ${voicesWithoutLanguage.length} voices without a language connected.`);

    for (const voice of voicesWithoutLanguage) {
      let languageCode = voice.languageCode.split('-')[0]; // "en-US" => "en", "nl-NL" => "nl"

      // It seems that Google uses "nb" for Norwegian Bokmål, we just connect that to "Norwegian"
      if (languageCode === 'nb') {
        languageCode = 'no';
      }

      logger.info(loggerPrefix, `Connecting languageCode "${languageCode}" to voice ID "${voice.id}"...`);

      const language = await languageRepository.findOne({ languageCode });

      await voiceRepository.update(voice.id, { language });

      logger.info(loggerPrefix, `Successfully connected languageCode "${languageCode}" to voice ID "${voice.id}"!`);
    }

    logger.info(loggerPrefix, 'Successfully seeded!');
  } catch (err) {
    logger.error(loggerPrefix, 'An error happened.', err);
    throw err;
  } finally {
    logger.info(loggerPrefix, 'Done.');
  }
};

const seedInAppSubscriptions = async () => {
  const loggerPrefix = 'Seeding In-App Subscriptions:';

  const inAppSubscriptionRepository = getRepository(InAppSubscription);

  try {
    logger.info(loggerPrefix, 'Creating subscriptions...');

    for (const inAppSubscription of inAppSubscriptions) {
      const foundSubscription = await inAppSubscriptionRepository.findOne({ productId: inAppSubscription.productId });

      if (foundSubscription) {
        logger.warn(loggerPrefix, `Subscription with productId ${inAppSubscription.productId} already exists. We don't add it again`)
      } else {
        logger.info(loggerPrefix, 'Creating subscription:', inAppSubscription.name);
        const subscriptionToCreate = await inAppSubscriptionRepository.create(inAppSubscription);
        await inAppSubscriptionRepository.save(subscriptionToCreate);
        logger.info(loggerPrefix, 'Successfully created subscription:', inAppSubscription.name);
      }
    }

    logger.info(loggerPrefix, 'Successfully seeded!');
  } catch (err) {
    logger.error(loggerPrefix, 'An error happened.', err);
    throw err;
  } finally {
    logger.info(loggerPrefix, 'Done.');
  }
};

(async() => {
  await createConnection(connectionOptions());

  // Run the seeders

  // Insert the world's languages
  // We don't use them all, but insert them for completeness sake
  await seedLanguages();

  // After we insert the languages, we can seed the voices
  // The voices are fetched from the Google and AWS API's, so they require the API keys to be set in this project
  await seedVoices();

  // Create some subscriptions our app uses
  await seedInAppSubscriptions();

  process.exit();
})();
