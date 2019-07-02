require('dotenv').config();
import { createConnection, getRepository, IsNull, getCustomRepository, In } from 'typeorm';

import { connectionOptions } from './database/connection-options';
import { Language } from './database/entities/language';
import { Voice, Synthesizer } from './database/entities/voice';
import { InAppSubscription } from './database/entities/in-app-subscription';
import languages from './database/seeds/languages';
import inAppSubscriptions from './database/seeds/in-app-subscriptions';

import { addAllGoogleVoices } from './synthesizers/google';
import { addAllAWSVoices } from './synthesizers/aws';

import { logger } from './utils/logger';
import { Sentry } from './error-reporter';

import voicesData from './database/seeds/voices';
import { VoiceRepository } from './database/repositories/voice';

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
        code: languageCode
      });

      if (existingLanguage) {
        logger.warn(loggerPrefix, 'Language already exists, we do not add this:', languageCode, language.name, language.native, '...');
      } else {
        // Create the languages
        const languageToCreate = await languageRepository.create({
          code: languageCode,
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

      const language = await languageRepository.findOne({ code: languageCode });

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

/**
 * Method to make sure we have the same label's for voices on every environment
 */
const updateVoicesLabel = async () => {
  const loggerPrefix = 'Label Voices:';
  const voiceRepository = getRepository(Voice);

  // Using Postico:
  // 1. SELECT "name", "label", "gender" FROM "voice" WHERE "synthesizer"='Google' AND "name" = "voice"."label" ORDER BY "label" ASC
  // 2. right click -> copy special -> json

  const voiceLabelMapping = [
    {
      name: 'ar-XA-Standard-A',
      label: 'Fatima',
      gender: 'FEMALE'
    },
    {
      name: 'ar-XA-Standard-B',
      label: 'Hasan',
      gender: 'MALE'
    },
    {
      name: 'ar-XA-Standard-C',
      label: 'Abdul',
      gender: 'MALE'
    },
    {
      name: 'ar-XA-Wavenet-A',
      label: 'Maleeha',
      gender: 'FEMALE'
    },
    {
      name: 'ar-XA-Wavenet-B',
      label: 'Asmar',
      gender: 'MALE'
    },
    {
      name: 'ar-XA-Wavenet-C',
      label: 'Saabir',
      gender: 'MALE'
    },
    {
      name: 'cs-CZ-Standard-A',
      label: 'Adéla',
      gender: 'FEMALE'
    },
    {
      name: 'cs-CZ-Wavenet-A',
      label: 'Adrianka',
      gender: 'FEMALE'
    },
    {
      name: 'da-DK-Standard-A',
      label: 'Agnes',
      gender: 'FEMALE'
    },
    {
      name: 'da-DK-Wavenet-A',
      label: 'Diana',
      gender: 'FEMALE'
    },
    {
      name: 'de-DE-Standard-A',
      label: 'Eva',
      gender: 'FEMALE'
    },
    {
      name: 'de-DE-Standard-B',
      label: 'Adrian',
      gender: 'MALE'
    },
    {
      name: 'de-DE-Wavenet-A',
      label: 'Annika',
      gender: 'FEMALE'
    },
    {
      name: 'de-DE-Wavenet-B',
      label: 'Albert',
      gender: 'MALE'
    },
    {
      name: 'de-DE-Wavenet-C',
      label: 'Edith',
      gender: 'FEMALE'
    },
    {
      name: 'de-DE-Wavenet-D',
      label: 'Claus',
      gender: 'MALE'
    },
    {
      name: 'el-GR-Standard-A',
      label: 'Efthymía',
      gender: 'FEMALE'
    },
    {
      name: 'el-GR-Wavenet-A',
      label: 'Lydía',
      gender: 'FEMALE'
    },
    {
      name: 'en-AU-Standard-A',
      label: 'Olivia',
      gender: 'FEMALE'
    },
    {
      name: 'en-AU-Standard-B',
      label: 'Oliver',
      gender: 'MALE'
    },
    {
      name: 'en-AU-Standard-C',
      label: 'Charlotte',
      gender: 'FEMALE'
    },
    {
      name: 'en-AU-Standard-D',
      label: 'William',
      gender: 'MALE'
    },
    {
      name: 'en-AU-Wavenet-A',
      label: 'Evie',
      gender: 'FEMALE'
    },
    {
      name: 'en-AU-Wavenet-B',
      label: 'Isaac',
      gender: 'MALE'
    },
    {
      name: 'en-AU-Wavenet-C',
      label: 'Ava',
      gender: 'FEMALE'
    },
    {
      name: 'en-AU-Wavenet-D',
      label: 'Noah',
      gender: 'MALE'
    },
    {
      name: 'en-GB-Standard-A',
      label: 'Chloe',
      gender: 'FEMALE'
    },
    {
      name: 'en-GB-Standard-B',
      label: 'George',
      gender: 'MALE'
    },
    {
      name: 'en-GB-Standard-C',
      label: 'Rosie',
      gender: 'FEMALE'
    },
    {
      name: 'en-GB-Standard-D',
      label: 'Harry',
      gender: 'MALE'
    },
    {
      name: 'en-GB-Wavenet-A',
      label: 'Millie',
      gender: 'FEMALE'
    },
    {
      name: 'en-GB-Wavenet-B',
      label: 'Jack',
      gender: 'MALE'
    },
    {
      name: 'en-GB-Wavenet-C',
      label: 'Amelia',
      gender: 'FEMALE'
    },
    {
      name: 'en-GB-Wavenet-D',
      label: 'Jacob',
      gender: 'MALE'
    },
    {
      name: 'en-IN-Standard-A',
      label: 'Aabha',
      gender: 'FEMALE'
    },
    {
      name: 'en-IN-Standard-B',
      label: 'Aarav',
      gender: 'MALE'
    },
    {
      name: 'en-IN-Standard-C',
      label: 'Arjun',
      gender: 'MALE'
    },
    {
      name: 'en-IN-Wavenet-A',
      label: 'Aakriti',
      gender: 'FEMALE'
    },
    {
      name: 'en-IN-Wavenet-B',
      label: 'Reyansh',
      gender: 'MALE'
    },
    {
      name: 'en-IN-Wavenet-C',
      label: 'Vivaan',
      gender: 'MALE'
    },
    {
      name: 'en-US-Standard-B',
      label: 'Mason',
      gender: 'MALE'
    },
    {
      name: 'en-US-Standard-C',
      label: 'Sophia',
      gender: 'FEMALE'
    },
    {
      name: 'en-US-Standard-D',
      label: 'Ethan',
      gender: 'MALE'
    },
    {
      name: 'en-US-Standard-E',
      label: 'Susan',
      gender: 'FEMALE'
    },
    {
      name: 'en-US-Wavenet-A',
      label: 'John',
      gender: 'MALE'
    },
    {
      name: 'en-US-Wavenet-B',
      label: 'Michael',
      gender: 'MALE'
    },
    {
      name: 'en-US-Wavenet-C',
      label: 'Isabella',
      gender: 'FEMALE'
    },
    {
      name: 'en-US-Wavenet-D',
      label: 'Richard',
      gender: 'MALE'
    },
    {
      name: 'en-US-Wavenet-E',
      label: 'Rosalie',
      gender: 'FEMALE'
    },
    {
      name: 'en-US-Wavenet-F',
      label: 'Emily',
      gender: 'FEMALE'
    },
    {
      name: 'es-ES-Standard-A',
      label: 'Maya',
      gender: 'FEMALE'
    },
    {
      name: 'fi-FI-Standard-A',
      label: 'Aada',
      gender: 'FEMALE'
    },
    {
      name: 'fi-FI-Wavenet-A',
      label: 'Aava',
      gender: 'FEMALE'
    },
    {
      name: 'fr-CA-Standard-A',
      label: 'Adalene',
      gender: 'FEMALE'
    },
    {
      name: 'fr-CA-Standard-B',
      label: 'Louis',
      gender: 'MALE'
    },
    {
      name: 'fr-CA-Standard-C',
      label: 'Bernadette',
      gender: 'FEMALE'
    },
    {
      name: 'fr-CA-Standard-D',
      label: 'Jules ',
      gender: 'MALE'
    },
    {
      name: 'fr-CA-Wavenet-A',
      label: 'Danielle',
      gender: 'FEMALE'
    },
    {
      name: 'fr-CA-Wavenet-B',
      label: 'Léo',
      gender: 'MALE'
    },
    {
      name: 'fr-CA-Wavenet-C',
      label: 'Estelle',
      gender: 'FEMALE'
    },
    {
      name: 'fr-CA-Wavenet-D',
      label: 'Hugo',
      gender: 'MALE'
    },
    {
      name: 'fr-FR-Standard-A',
      label: 'Célia',
      gender: 'FEMALE'
    },
    {
      name: 'fr-FR-Standard-B',
      label: 'Lucas',
      gender: 'MALE'
    },
    {
      name: 'fr-FR-Standard-C',
      label: 'Amélie',
      gender: 'FEMALE'
    },
    {
      name: 'fr-FR-Standard-D',
      label: 'Gabriel',
      gender: 'MALE'
    },
    {
      name: 'fr-FR-Wavenet-A',
      label: 'Eloise',
      gender: 'FEMALE'
    },
    {
      name: 'fr-FR-Wavenet-B',
      label: 'Armand',
      gender: 'MALE'
    },
    {
      name: 'fr-FR-Wavenet-C',
      label: 'Esmée',
      gender: 'FEMALE'
    },
    {
      name: 'fr-FR-Wavenet-D',
      label: 'Francis',
      gender: 'MALE'
    },
    {
      name: 'hi-IN-Standard-A',
      label: 'Shresta',
      gender: 'FEMALE'
    },
    {
      name: 'hi-IN-Standard-B',
      label: 'Aadhish',
      gender: 'MALE'
    },
    {
      name: 'hi-IN-Standard-C',
      label: 'Aadhunik',
      gender: 'MALE'
    },
    {
      name: 'hi-IN-Wavenet-A',
      label: 'Shushma',
      gender: 'FEMALE'
    },
    {
      name: 'hi-IN-Wavenet-B',
      label: 'Aadi',
      gender: 'MALE'
    },
    {
      name: 'hi-IN-Wavenet-C',
      label: 'Narendra',
      gender: 'MALE'
    },
    {
      name: 'hu-HU-Standard-A',
      label: 'Hanna',
      gender: 'FEMALE'
    },
    {
      name: 'hu-HU-Wavenet-A',
      label: 'Jazmin',
      gender: 'FEMALE'
    },
    {
      name: 'id-ID-Standard-A',
      label: 'Dara',
      gender: 'FEMALE'
    },
    {
      name: 'id-ID-Standard-B',
      label: 'Agung',
      gender: 'MALE'
    },
    {
      name: 'id-ID-Standard-C',
      label: 'Eka',
      gender: 'MALE'
    },
    {
      name: 'id-ID-Wavenet-A',
      label: 'Iman',
      gender: 'FEMALE'
    },
    {
      name: 'id-ID-Wavenet-B',
      label: 'Gunadi',
      gender: 'MALE'
    },
    {
      name: 'id-ID-Wavenet-C',
      label: 'Panuta',
      gender: 'MALE'
    },
    {
      name: 'it-IT-Standard-A',
      label: 'Martina',
      gender: 'FEMALE'
    },
    {
      name: 'it-IT-Wavenet-A',
      label: 'Viola',
      gender: 'FEMALE'
    },
    {
      name: 'ja-JP-Standard-A',
      label: 'Aiko',
      gender: 'FEMALE'
    },
    {
      name: 'ja-JP-Standard-B',
      label: 'Miku',
      gender: 'FEMALE'
    },
    {
      name: 'ja-JP-Standard-C',
      label: 'Haruto',
      gender: 'MALE'
    },
    {
      name: 'ja-JP-Standard-D',
      label: 'Yamato',
      gender: 'MALE'
    },
    {
      name: 'ja-JP-Wavenet-A',
      label: 'Emica',
      gender: 'FEMALE'
    },
    {
      name: 'ja-JP-Wavenet-B',
      label: 'Emiko',
      gender: 'FEMALE'
    },
    {
      name: 'ja-JP-Wavenet-C',
      label: 'Genkei',
      gender: 'MALE'
    },
    {
      name: 'ja-JP-Wavenet-D',
      label: 'Kenzou',
      gender: 'MALE'
    },
    {
      name: 'ko-KR-Standard-A',
      label: 'Ha Eun',
      gender: 'FEMALE'
    },
    {
      name: 'ko-KR-Standard-B',
      label: 'Seo Ah',
      gender: 'FEMALE'
    },
    {
      name: 'ko-KR-Standard-C',
      label: 'Ha Joon',
      gender: 'MALE'
    },
    {
      name: 'ko-KR-Standard-D',
      label: 'Si Woo',
      gender: 'MALE'
    },
    {
      name: 'ko-KR-Wavenet-A',
      label: 'Chin-Sun',
      gender: 'FEMALE'
    },
    {
      name: 'ko-KR-Wavenet-B',
      label: 'Hwa-Young',
      gender: 'FEMALE'
    },
    {
      name: 'ko-KR-Wavenet-C',
      label: 'Hyun-Ki',
      gender: 'MALE'
    },
    {
      name: 'ko-KR-Wavenet-D',
      label: 'Jung',
      gender: 'MALE'
    },
    {
      name: 'nb-NO-Standard-A',
      label: 'Celina',
      gender: 'FEMALE'
    },
    {
      name: 'nb-NO-Standard-B',
      label: 'Edvard',
      gender: 'MALE'
    },
    {
      name: 'nb-NO-Standard-C',
      label: 'Evelyn',
      gender: 'FEMALE'
    },
    {
      name: 'nb-NO-Standard-D',
      label: 'Ivar',
      gender: 'MALE'
    },
    {
      name: 'nb-no-Standard-E',
      label: 'Hannah',
      gender: 'FEMALE'
    },
    {
      name: 'nb-NO-Wavenet-A',
      label: 'Berit',
      gender: 'FEMALE'
    },
    {
      name: 'nb-NO-Wavenet-B',
      label: 'Elena',
      gender: 'MALE'
    },
    {
      name: 'nb-NO-Wavenet-C',
      label: 'Anniken',
      gender: 'FEMALE'
    },
    {
      name: 'nb-NO-Wavenet-D',
      label: 'Jørgen',
      gender: 'MALE'
    },
    {
      name: 'nb-no-Wavenet-E',
      label: 'Hilma',
      gender: 'FEMALE'
    },
    {
      name: 'nl-NL-Standard-A',
      label: 'Mirjam',
      gender: 'FEMALE'
    },
    {
      name: 'nl-NL-Standard-B',
      label: 'Jeroen',
      gender: 'MALE'
    },
    {
      name: 'nl-NL-Standard-C',
      label: 'Sander',
      gender: 'MALE'
    },
    {
      name: 'nl-NL-Standard-D',
      label: 'Nienke',
      gender: 'FEMALE'
    },
    {
      name: 'nl-NL-Standard-E',
      label: 'Sabine',
      gender: 'FEMALE'
    },
    {
      name: 'nl-NL-Wavenet-A',
      label: 'Denise',
      gender: 'FEMALE'
    },
    {
      name: 'nl-NL-Wavenet-B',
      label: 'Stefan',
      gender: 'MALE'
    },
    {
      name: 'nl-NL-Wavenet-C',
      label: 'Koen',
      gender: 'MALE'
    },
    {
      name: 'nl-NL-Wavenet-D',
      label: 'Ineke',
      gender: 'FEMALE'
    },
    {
      name: 'nl-NL-Wavenet-E',
      label: 'Marije',
      gender: 'FEMALE'
    },
    {
      name: 'pl-PL-Standard-A',
      label: 'Helena',
      gender: 'FEMALE'
    },
    {
      name: 'pl-PL-Standard-B',
      label: 'Dariusz',
      gender: 'MALE'
    },
    {
      name: 'pl-PL-Standard-C',
      label: 'Mariusz',
      gender: 'MALE'
    },
    {
      name: 'pl-PL-Standard-D',
      label: 'Marzena',
      gender: 'FEMALE'
    },
    {
      name: 'pl-PL-Standard-E',
      label: 'Justyna',
      gender: 'FEMALE'
    },
    {
      name: 'pl-PL-Wavenet-A',
      label: 'Ania',
      gender: 'FEMALE'
    },
    {
      name: 'pl-PL-Wavenet-B',
      label: 'Mietek',
      gender: 'MALE'
    },
    {
      name: 'pl-PL-Wavenet-C',
      label: 'Igor',
      gender: 'MALE'
    },
    {
      name: 'pl-PL-Wavenet-D',
      label: 'Mariola',
      gender: 'FEMALE'
    },
    {
      name: 'pl-PL-Wavenet-E',
      label: 'Henryka',
      gender: 'FEMALE'
    },
    {
      name: 'pt-BR-Standard-A',
      label: 'Fernanda',
      gender: 'FEMALE'
    },
    {
      name: 'pt-BR-Wavenet-A',
      label: 'Maria',
      gender: 'FEMALE'
    },
    {
      name: 'pt-PT-Standard-A',
      label: 'Matilde',
      gender: 'FEMALE'
    },
    {
      name: 'pt-PT-Standard-B',
      label: 'Alberto',
      gender: 'MALE'
    },
    {
      name: 'pt-PT-Standard-C',
      label: 'Diego',
      gender: 'MALE'
    },
    {
      name: 'pt-PT-Standard-D',
      label: 'Carolina',
      gender: 'FEMALE'
    },
    {
      name: 'pt-PT-Wavenet-A',
      label: 'Mariana',
      gender: 'FEMALE'
    },
    {
      name: 'pt-PT-Wavenet-B',
      label: 'Fabiano',
      gender: 'MALE'
    },
    {
      name: 'pt-PT-Wavenet-C',
      label: 'Gilberto',
      gender: 'MALE'
    },
    {
      name: 'pt-PT-Wavenet-D',
      label: 'Beatriz',
      gender: 'FEMALE'
    },
    {
      name: 'ru-RU-Standard-A',
      label: 'Milana',
      gender: 'FEMALE'
    },
    {
      name: 'ru-RU-Standard-B',
      label: 'Aleksei',
      gender: 'MALE'
    },
    {
      name: 'ru-RU-Standard-C',
      label: 'Veronika',
      gender: 'FEMALE'
    },
    {
      name: 'ru-RU-Standard-D',
      label: 'Andrey',
      gender: 'MALE'
    },
    {
      name: 'ru-RU-Wavenet-A',
      label: 'Zhanna',
      gender: 'FEMALE'
    },
    {
      name: 'ru-RU-Wavenet-B',
      label: 'Aleksandr',
      gender: 'MALE'
    },
    {
      name: 'ru-RU-Wavenet-C',
      label: 'Arina',
      gender: 'FEMALE'
    },
    {
      name: 'ru-RU-Wavenet-D',
      label: 'Daniil',
      gender: 'MALE'
    },
    {
      name: 'sk-SK-Standard-A',
      label: 'Helga',
      gender: 'FEMALE'
    },
    {
      name: 'sk-SK-Wavenet-A',
      label: 'Nora',
      gender: 'FEMALE'
    },
    {
      name: 'sv-SE-Standard-A',
      label: 'Christine',
      gender: 'FEMALE'
    },
    {
      name: 'sv-SE-Wavenet-A',
      label: 'Anja',
      gender: 'FEMALE'
    },
    {
      name: 'tr-TR-Standard-A',
      label: 'Miray',
      gender: 'FEMALE'
    },
    {
      name: 'tr-TR-Standard-B',
      label: 'Adal',
      gender: 'MALE'
    },
    {
      name: 'tr-TR-Standard-C',
      label: 'Ecrin',
      gender: 'FEMALE'
    },
    {
      name: 'tr-TR-Standard-D',
      label: 'Azra',
      gender: 'FEMALE'
    },
    {
      name: 'tr-TR-Standard-E',
      label: 'Ahmet',
      gender: 'MALE'
    },
    {
      name: 'tr-TR-Wavenet-A',
      label: 'Zehra',
      gender: 'FEMALE'
    },
    {
      name: 'tr-TR-Wavenet-B',
      label: 'Mehmet',
      gender: 'MALE'
    },
    {
      name: 'tr-TR-Wavenet-C',
      label: 'Eda',
      gender: 'FEMALE'
    },
    {
      name: 'tr-TR-Wavenet-D',
      label: 'Eylül',
      gender: 'FEMALE'
    },
    {
      name: 'tr-TR-Wavenet-E',
      label: 'Asaf',
      gender: 'MALE'
    },
    {
      name: 'uk-UA-Standard-A',
      label: 'Natalia',
      gender: 'FEMALE'
    },
    {
      name: 'uk-UA-Wavenet-A',
      label: 'Oleksander',
      gender: 'FEMALE'
    },
    {
      name: 'vi-VN-Standard-A',
      label: 'Anh',
      gender: 'FEMALE'
    },
    {
      name: 'vi-VN-Standard-B',
      label: 'An',
      gender: 'MALE'
    },
    {
      name: 'vi-VN-Standard-C',
      label: 'Linh',
      gender: 'FEMALE'
    },
    {
      name: 'vi-VN-Standard-D',
      label: 'Bao',
      gender: 'MALE'
    },
    {
      name: 'vi-VN-Wavenet-A',
      label: 'Minh',
      gender: 'FEMALE'
    },
    {
      name: 'vi-VN-Wavenet-B',
      label: 'Bình',
      gender: 'MALE'
    },
    {
      name: 'vi-VN-Wavenet-C',
      label: 'Kim',
      gender: 'FEMALE'
    },
    {
      name: 'vi-VN-Wavenet-D',
      label: 'Anh Dung',
      gender: 'MALE'
    }
  ];

  try {
    const googleVoices = await voiceRepository.find({
      where: {
        synthesizer: Synthesizer.GOOGLE
      }
    });

    logger.warn(loggerPrefix, `Found ${googleVoices.length} Google voices to label.`);

    // Do the updates
    for (const voice of googleVoices) {
      const voiceMape = voiceLabelMapping.find(voiceMap => voiceMap.name === voice.name);
      const label = voiceMape ? voiceMape.label : voice.name;

      if (label === voice.name) logger.warn(loggerPrefix, `Skipped "${voice.name}". No label found in mapping.`);
      await voiceRepository.update(voice.id, { label });

      logger.info(loggerPrefix, `Updated "${voice.name}" with label: ${label}.`);
    }
  } catch (err) {
    logger.error(loggerPrefix, 'An error happened.', err);
    throw err;
  } finally {
    logger.info(loggerPrefix, 'Done.');
  }
};

const updateIsLanguageDefaultForVoices = async () => {
  const loggerPrefix = 'Language Default Voices:';
  const voiceRepository = getRepository(Voice);

  const voiceLanguageDefaultMapping = [
    'cs-CZ-Standard-A', // CZ
    'sk-SK-Standard-A', // SK
    'Mizuki', // JP
    'Maja', // PL
    'Carmen', // RO
    'Liv', // NO
    'Astrid', // SE
    'Gwyneth', // GB
    'Seoyeon', // KR
    'uk-UA-Standard-A', // UA
    'Hans', // DE
    'Céline', // FR
    'Filiz', // TR
    'ar-XA-Standard-B', // XA
    'Bianca', // IT
    'fi-FI-Standard-A', // FI
    'Conchita', // ES
    'Ricardo', // BR
    'Maxim', // RU
    'hu-HU-Standard-A', // HU
    'Karl', // IS
    'Joanna', // US
    'Ruben', // NL
    'id-ID-Standard-C', // ID
    'Mads', // DK
    'vi-VN-Standard-C' // VN
  ];

  try {
    // Do the updates
    for (const voiceName of voiceLanguageDefaultMapping) {
      logger.info(loggerPrefix, `Update "${voiceName}" to set as isLanguageDefault.`);

      await voiceRepository.update({ name: voiceName }, { isLanguageDefault: true });

      logger.info(loggerPrefix, `Updated "${voiceName}" with isLanguageDefault: true.`);
    }
  } catch (err) {
    logger.error(loggerPrefix, 'An error happened.', err);
    throw err;
  } finally {
    logger.info(loggerPrefix, 'Done.');
  }
};

const updateIsActiveIsPremiumForVoices = async () => {
  const loggerPrefix = 'Update isActive and isPremium Voices:';
  const voiceRepository = getRepository(Voice);

  try {
    // Do the updates
    for (const voice of voicesData) {
      logger.info(loggerPrefix, `Update "${voice.name}" to set isActive isPremium.`);

      const updatedColumns = {
        isActive: voice.isActive,
        isPremium: voice.isPremium
      };

      await voiceRepository.update(
        {
          name: voice.name
        },
        updatedColumns
      );

      logger.info(loggerPrefix, `Updated "${voice.name}" with: ${JSON.stringify(updatedColumns)}`);
    }
  } catch (err) {
    logger.error(loggerPrefix, 'An error happened.', err);
    throw err;
  } finally {
    logger.info(loggerPrefix, 'Done.');
  }
};

const updateIsHighestQualityForVoices = async () => {
  const loggerPrefix = 'Update isHighestQuality Voices:';
  const voiceRepository = getRepository(Voice);

  try {
    const voices = await voiceRepository.find();

    // Do the updates
    for (const voice of voices) {
      if (voice.synthesizer !== Synthesizer.GOOGLE) {
        logger.info(loggerPrefix, `"${voice.name}" is not a Google voice, cannot set isHighestQuality to true.`);
      } else {
        const isHighestQuality = voice.name.toLowerCase().includes('wavenet') ? true : false;
        await voiceRepository.update(voice.id, { isHighestQuality });

        logger.info(loggerPrefix, `Updated "${voice.name}" with isHighestQuality: ${isHighestQuality}`);
      }
    }
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
        logger.info(loggerPrefix, `Subscription with productId ${inAppSubscription.productId} already exists. We update it to make sure it's in sync.`);
        await inAppSubscriptionRepository.update(foundSubscription.id, inAppSubscription);
        logger.info(loggerPrefix, `Subscription with productId ${inAppSubscription.productId} updated!`);
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

const createVoicePreviews = async () => {
  const loggerPrefix = 'Create Voice Previews:';
  const voiceRepository = getCustomRepository(VoiceRepository);
  const languageRepository = getRepository(Language);

  try {
    // Only create voice previews for active languages
    const supportedLanguages = await languageRepository.find({
      where: {
        isActive: true
      }
    });

    const languageIds = supportedLanguages.map(language => language.id);

    // Find the voices without an exampleAudioUrl within our active languages
    const voicesWithoutPreview = await voiceRepository.find({
      where: {
        exampleAudioUrl: IsNull(),
        language: {
          id: In(languageIds)
        }
      }
    });

    logger.info(loggerPrefix, `Creating voice previews for ${voicesWithoutPreview.length} voices...`);

    for (const voice of voicesWithoutPreview) {
      const updatedVoice = await voiceRepository.createVoicePreview(voice.id);
      logger.info(loggerPrefix, `Created voice preview for: ${updatedVoice.name}`);
    }
  } catch (err) {
    logger.error(loggerPrefix, 'An error happened.', err);
    throw err;
  } finally {
    logger.info(loggerPrefix, 'Done.');
  }
};

/**
 * This file ensures we have the same basic data on every environment we use
 */
(async () => {
  try {
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

    // Run the updaters

    // Connect labels to our voices, to make sure they are the same on every environment
    await updateVoicesLabel();

    // Set default voices for languages
    await updateIsLanguageDefaultForVoices();

    // Set isActive and isPremium for voices
    await updateIsActiveIsPremiumForVoices();

    // Set isHighestQuality for voices
    await updateIsHighestQualityForVoices();

    // Creates voice previews for the active voices inside a language
    // Important: uses the Text To Speech API's
    await createVoicePreviews();
  } catch (err) {
    logger.error('Error during run');
    logger.error(err);
    Sentry.captureException(err);
  } finally {
    process.exit();
  }
})();
