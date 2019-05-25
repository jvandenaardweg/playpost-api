require('dotenv').config();
import { createConnection, getRepository, IsNull } from 'typeorm';

import { connectionOptions } from './connection-options';
import { Language } from './entities/language';
import { Voice } from './entities/voice';
import { Subscription } from './entities/subscription';
import languages from './seeds/languages';
import subscriptions from './seeds/subscriptions';

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

const seedSubscriptions = async () => {
  const loggerPrefix = 'Seeding Subscriptions:';

  const subscriptionRepository = getRepository(Subscription);

  try {
    logger.info(loggerPrefix, 'Creating subscriptions...');

    for (const subscription of subscriptions) {
      const foundSubscription = await subscriptionRepository.findOne({ productId: subscription.productId });

      if (foundSubscription) {
        logger.warn(loggerPrefix, `Subscription with productId ${subscription.productId} already exists. We don't add it again`)
      } else {
        logger.info(loggerPrefix, 'Creating subscription:', subscription.name);
        const subscriptionToCreate = await subscriptionRepository.create(subscription);
        await subscriptionRepository.save(subscriptionToCreate);
        logger.info(loggerPrefix, 'Successfully created subscription:', subscription.name);
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
  await seedSubscriptions();

  process.exit();
})();
