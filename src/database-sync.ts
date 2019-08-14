import * as Sentry from '@sentry/node';
import { createConnection, getCustomRepository, getRepository, In, IsNull } from 'typeorm';

import { connectionOptions } from './database/connection-options';
import { InAppSubscription } from './database/entities/in-app-subscription';
import { Language } from './database/entities/language';
import { EVoiceQuality, EVoiceSynthesizer, Voice } from './database/entities/voice';
import { VoiceRepository } from './database/repositories/voice';
import inAppSubscriptions from './database/seeds/in-app-subscriptions';
import languages from './database/seeds/languages';
// import voicesData from './database/seeds/voices';
import { AwsSynthesizer } from './synthesizers/aws';
import { GoogleSynthesizer } from './synthesizers/google';
import { logger } from './utils/logger';
// import { MicrosoftSynthesizer } from './synthesizers/microsoft';

const seedLanguages = async () => {
  const loggerPrefix = 'Seeding Languages:';
  const languageRepository = getRepository(Language);

  try {
    logger.info(loggerPrefix, 'Adding languages to the database...');

    const languageCodes = Object.keys(languages);

    for (const languageCode of languageCodes) {
      const language = languages[languageCode];

      const languageData = {
        code: languageCode,
        name: language.name,
        nativeName: language.native,
        rightToLeft: !!language.rtl
      }

      logger.info(loggerPrefix, 'Trying to add:', languageCode, language.name, language.native, '...');

      const existingLanguage = await languageRepository.findOne({
        code: languageCode
      });

      if (existingLanguage) {
        // Update, make sure it's in sync
        await languageRepository.update(existingLanguage.id, languageData);

        logger.info(loggerPrefix, 'Language already exists, we update:', languageCode, language.name, language.native, '...');
      } else {
        // Create the languages
        const languageToCreate = await languageRepository.create(languageData);

        // Save it
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
  const awsSynthesizer = new AwsSynthesizer();
  const googleSynthesizer = new GoogleSynthesizer();
  // const microsoftSynthesizer = new MicrosoftSynthesizer();

  try {
    logger.info(loggerPrefix, 'Checking for new voices at Google, AWS and Microsoft...');
    await googleSynthesizer.addAllVoices(loggerPrefix);
    await awsSynthesizer.addAllVoices(loggerPrefix);
    // await microsoftSynthesizer.addAllVoices(loggerPrefix);

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

      // CMN = Chinese Mandarin
      // We just connect it Chinese
      if (languageCode === 'cmn') {
        languageCode = 'zh';
      }

      logger.info(loggerPrefix, `Connecting languageCode "${languageCode}" to voice ID "${voice.id}"...`);

      const language = await languageRepository.findOne({ code: languageCode });

      // Connect the voice to a language
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
      name: 'it-IT-Standard-D',
      label: 'Stefano',
      gender: 'MALE'
    },
    {
      name: 'it-IT-Standard-C',
      label: 'Gian',
      gender: 'MALE'
    },
    {
      name: 'it-IT-Standard-B',
      label: 'Carina',
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
      label: 'Hang',
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
    },
    {
      name: 'it-IT-Wavenet-B',
      label: 'Laura',
      gender: 'FEMALE'
    },
    {
      name: 'it-IT-Wavenet-D',
      label: 'Marco',
      gender: 'MALE'
    },
    {
      name: 'it-IT-Wavenet-C',
      label: 'Roberto',
      gender: 'MALE'
    }
  ];

  try {
    const googleVoices = await voiceRepository.find({
      where: {
        synthesizer: EVoiceSynthesizer.GOOGLE
      }
    });

    logger.warn(loggerPrefix, `Found ${googleVoices.length} Google voices to label.`);

    // Do the updates
    for (const voice of googleVoices) {
      const voiceMape = voiceLabelMapping.find(voiceMap => voiceMap.name === voice.name);
      const label = voiceMape ? voiceMape.label : voice.name;

      if (label === voice.name) { logger.warn(loggerPrefix, `Skipped "${voice.name}". No label found in mapping.`); }
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
    'Celine', // FR
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
    'vi-VN-Standard-C', // VN
    'hi-IN-Standard-B', // IN (Hindi Indian)
    // 'Ines' // PT, see BR
    'Zhiyu', // CN
    'Bianca' // IT
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

  // An array of voice languageCode's for voices that should be active
  const isActiveMapping = [
    {
      "languageCode" : "nl-NL"
    },
    {
      "languageCode" : "en-US"
    },
    {
      "languageCode" : "en-AU"
    },
    {
      "languageCode" : "fr-FR"
    },
    {
      "languageCode" : "hi-IN"
    },
    {
      "languageCode" : "pt-BR"
    },
    {
      "languageCode" : "cmn-CN"
    },
    {
      "languageCode" : "id-ID"
    },
    {
      "languageCode" : "de-DE"
    },
    {
      "languageCode" : "ru-RU"
    },
    {
      "languageCode" : "es-ES"
    },
    {
      "languageCode" : "pt-PT"
    },
    {
      "languageCode" : "pl-PL"
    },
    {
      "languageCode" : "en-GB"
    },
    {
      "languageCode": "it-IT"
    },
    {
      "languageCode": "en-IN"
    },
    {
      "languageCode": "fr-CA"
    },
    {
      "languageCode": "ko-KR",
    },
    {
      "languageCode": "ro-RO",
    },
    {
      "languageCode": "nb-NO",
    },
    {
      "languageCode": "es-MX",
    },
    {
      "languageCode": "cs-CZ"
    },
    {
      "languageCode": "el-GR"
    },
    {
      "languageCode": "sv-SE"
    },
    {
      "languageCode": "da-DK"
    },
    {
      "languageCode": "vi-VN"
    }
  ]

  // An array of voice name's that should be considered "Premium"
  const premiumVoicesMapping = [
    {
      "name" : "it-IT-Standard-B"
    },
    {
      "name" : "nl-NL-Standard-C"
    },
    {
      "name" : "en-AU-Wavenet-A"
    },
    {
      "name" : "en-US-Standard-E"
    },
    {
      "name" : "ja-JP-Standard-C"
    },
    {
      "name" : "es-ES-Standard-A"
    },
    {
      "name" : "it-IT-Standard-D"
    },
    {
      "name" : "Ivy"
    },
    {
      "name" : "pl-PL-Wavenet-A"
    },
    {
      "name" : "nl-NL-Wavenet-B"
    },
    {
      "name" : "Chantal"
    },
    {
      "name" : "hi-IN-Standard-C"
    },
    {
      "name" : "Lea"
    },
    {
      "name" : "en-US-Standard-D"
    },
    {
      "name" : "pl-PL-Standard-E"
    },
    {
      "name" : "en-US-Standard-C"
    },
    {
      "name" : "fr-CA-Wavenet-A"
    },
    {
      "name" : "id-ID-Wavenet-A"
    },
    {
      "name" : "hi-IN-Wavenet-B"
    },
    {
      "name" : "it-IT-Standard-C"
    },
    {
      "name" : "nl-NL-Standard-A"
    },
    {
      "name" : "en-US-Wavenet-B"
    },
    {
      "name" : "fr-CA-Standard-D"
    },
    {
      "name" : "tr-TR-Standard-A"
    },
    {
      "name" : "Miguel"
    },
    {
      "name" : "ar-XA-Standard-C"
    },
    {
      "name" : "ko-KR-Standard-A"
    },
    {
      "name" : "Ewa"
    },
    {
      "name" : "id-ID-Standard-B"
    },
    {
      "name" : "en-IN-Standard-A"
    },
    {
      "name" : "Amy"
    },
    {
      "name" : "Tatyana"
    },
    {
      "name" : "ja-JP-Standard-D"
    },
    {
      "name" : "Nicole"
    },
    {
      "name" : "en-IN-Wavenet-C"
    },
    {
      "name" : "ko-KR-Standard-C"
    },
    {
      "name" : "it-IT-Standard-A"
    },
    {
      "name" : "Takumi"
    },
    {
      "name" : "fr-FR-Wavenet-B"
    },
    {
      "name" : "Jan"
    },
    {
      "name" : "ru-RU-Standard-B"
    },
    {
      "name" : "pl-PL-Standard-D"
    },
    {
      "name" : "el-GR-Standard-A"
    },
    {
      "name" : "ar-XA-Standard-A"
    },
    {
      "name" : "en-US-Wavenet-F"
    },
    {
      "name" : "vi-VN-Standard-B"
    },
    {
      "name" : "Penelope"
    },
    {
      "name" : "en-IN-Wavenet-A"
    },
    {
      "name" : "ru-RU-Standard-D"
    },
    {
      "name" : "ko-KR-Wavenet-B"
    },
    {
      "name" : "ja-JP-Standard-A"
    },
    {
      "name" : "da-DK-Wavenet-A"
    },
    {
      "name" : "pl-PL-Standard-B"
    },
    {
      "name" : "tr-TR-Standard-B"
    },
    {
      "name" : "en-AU-Wavenet-D"
    },
    {
      "name" : "en-IN-Standard-B"
    },
    {
      "name" : "ko-KR-Standard-B"
    },
    {
      "name" : "vi-VN-Standard-D"
    },
    {
      "name" : "fr-CA-Standard-A"
    },
    {
      "name" : "Ines"
    },
    {
      "name" : "Emma"
    },
    {
      "name" : "de-DE-Standard-A"
    },
    {
      "name" : "Kimberly"
    },
    {
      "name" : "Carla"
    },
    {
      "name" : "Giorgio"
    },
    {
      "name" : "ru-RU-Wavenet-A"
    },
    {
      "name" : "ja-JP-Wavenet-D"
    },
    {
      "name" : "Jacek"
    },
    {
      "name" : "tr-TR-Standard-E"
    },
    {
      "name" : "Aditi"
    },
    {
      "name" : "da-DK-Standard-A"
    },
    {
      "name" : "fr-FR-Standard-A"
    },
    {
      "name" : "Lotte"
    },
    {
      "name" : "Naja"
    },
    {
      "name" : "pl-PL-Wavenet-E"
    },
    {
      "name" : "Salli"
    },
    {
      "name" : "Mia"
    },
    {
      "name" : "Kendra"
    },
    {
      "name" : "fr-FR-Standard-D"
    },
    {
      "name" : "hi-IN-Standard-A"
    },
    {
      "name" : "Dora"
    },
    {
      "name" : "Vitoria"
    },
    {
      "name" : "Lucia"
    },
    {
      "name" : "Justin"
    },
    {
      "name" : "Raveena"
    },
    {
      "name" : "Cristiano"
    },
    {
      "name" : "Russell"
    },
    {
      "name" : "Joey"
    },
    {
      "name" : "ru-RU-Standard-A"
    },
    {
      "name" : "ko-KR-Wavenet-D"
    },
    {
      "name" : "nb-NO-Wavenet-A"
    },
    {
      "name" : "ko-KR-Wavenet-C"
    },
    {
      "name" : "de-DE-Standard-B"
    },
    {
      "name" : "Brian"
    },
    {
      "name" : "de-DE-Wavenet-A"
    },
    {
      "name" : "hi-IN-Wavenet-A"
    },
    {
      "name" : "tr-TR-Standard-C"
    },
    {
      "name" : "ko-KR-Standard-D"
    },
    {
      "name" : "en-GB-Standard-D"
    },
    {
      "name" : "en-AU-Standard-D"
    },
    {
      "name" : "nl-NL-Wavenet-A"
    },
    {
      "name" : "Marlene"
    },
    {
      "name" : "en-AU-Standard-B"
    },
    {
      "name" : "Enrique"
    },
    {
      "name" : "Vicki"
    },
    {
      "name" : "en-GB-Standard-B"
    },
    {
      "name" : "ko-KR-Wavenet-A"
    },
    {
      "name" : "en-GB-Standard-C"
    },
    {
      "name" : "en-AU-Standard-C"
    },
    {
      "name" : "nb-NO-Standard-A"
    },
    {
      "name" : "nb-no-Wavenet-E"
    },
    {
      "name" : "Matthew"
    },
    {
      "name" : "Mathieu"
    },
    {
      "name" : "pt-BR-Standard-A"
    },
    {
      "name" : "fr-FR-Standard-B"
    },
    {
      "name" : "tr-TR-Standard-D"
    },
    {
      "name" : "pl-PL-Standard-C"
    },
    {
      "name" : "nb-no-Standard-E"
    },
    {
      "name" : "pt-PT-Standard-B"
    },
    {
      "name" : "sv-SE-Standard-A"
    },
    {
      "name" : "vi-VN-Standard-A"
    },
    {
      "name" : "pt-PT-Standard-D"
    },
    {
      "name" : "en-IN-Standard-C"
    },
    {
      "name" : "en-AU-Wavenet-B"
    },
    {
      "name" : "ja-JP-Wavenet-A"
    },
    {
      "name" : "ar-XA-Wavenet-B"
    },
    {
      "name" : "fi-FI-Wavenet-A"
    },
    {
      "name" : "tr-TR-Wavenet-C"
    },
    {
      "name" : "fr-CA-Wavenet-C"
    },
    {
      "name" : "en-IN-Wavenet-B"
    },
    {
      "name" : "tr-TR-Wavenet-B"
    },
    {
      "name" : "it-IT-Wavenet-A"
    },
    {
      "name" : "nb-NO-Standard-C"
    },
    {
      "name" : "sv-SE-Wavenet-A"
    },
    {
      "name" : "nl-NL-Wavenet-C"
    },
    {
      "name" : "nb-NO-Wavenet-D"
    },
    {
      "name" : "nb-NO-Standard-D"
    },
    {
      "name" : "fr-CA-Wavenet-D"
    },
    {
      "name" : "pt-PT-Wavenet-C"
    },
    {
      "name" : "nl-NL-Standard-E"
    },
    {
      "name" : "nb-NO-Wavenet-C"
    },
    {
      "name" : "hi-IN-Wavenet-C"
    },
    {
      "name" : "nl-NL-Wavenet-D"
    },
    {
      "name" : "id-ID-Standard-A"
    },
    {
      "name" : "cs-CZ-Wavenet-A"
    },
    {
      "name" : "en-GB-Wavenet-A"
    },
    {
      "name" : "pl-PL-Wavenet-B"
    },
    {
      "name" : "pl-PL-Wavenet-C"
    },
    {
      "name" : "en-GB-Wavenet-B"
    },
    {
      "name" : "pl-PL-Wavenet-D"
    },
    {
      "name" : "nb-NO-Wavenet-B"
    },
    {
      "name" : "en-US-Wavenet-A"
    },
    {
      "name" : "pt-PT-Standard-A"
    },
    {
      "name" : "nl-NL-Wavenet-E"
    },
    {
      "name" : "en-GB-Wavenet-D"
    },
    {
      "name" : "ru-RU-Wavenet-D"
    },
    {
      "name" : "en-AU-Wavenet-C"
    },
    {
      "name" : "pt-PT-Standard-C"
    },
    {
      "name" : "id-ID-Wavenet-B"
    },
    {
      "name" : "hu-HU-Wavenet-A"
    },
    {
      "name" : "fr-CA-Standard-B"
    },
    {
      "name" : "en-AU-Standard-A"
    },
    {
      "name" : "en-US-Wavenet-C"
    },
    {
      "name" : "it-IT-Wavenet-D"
    },
    {
      "name" : "en-GB-Standard-A"
    },
    {
      "name" : "it-IT-Wavenet-C"
    },
    {
      "name" : "pt-BR-Wavenet-A"
    },
    {
      "name" : "en-US-Standard-B"
    },
    {
      "name" : "ja-JP-Wavenet-C"
    },
    {
      "name" : "it-IT-Wavenet-B"
    },
    {
      "name" : "vi-VN-Wavenet-C"
    },
    {
      "name" : "id-ID-Wavenet-C"
    },
    {
      "name" : "ar-XA-Wavenet-A"
    },
    {
      "name" : "de-DE-Wavenet-D"
    },
    {
      "name" : "sk-SK-Wavenet-A"
    },
    {
      "name" : "fr-CA-Wavenet-B"
    },
    {
      "name" : "uk-UA-Wavenet-A"
    },
    {
      "name" : "nl-NL-Standard-D"
    },
    {
      "name" : "pt-PT-Wavenet-A"
    },
    {
      "name" : "vi-VN-Wavenet-A"
    },
    {
      "name" : "vi-VN-Wavenet-D"
    },
    {
      "name" : "ru-RU-Wavenet-C"
    },
    {
      "name" : "fr-FR-Wavenet-A"
    },
    {
      "name" : "fr-FR-Wavenet-C"
    },
    {
      "name" : "tr-TR-Wavenet-D"
    },
    {
      "name" : "de-DE-Wavenet-C"
    },
    {
      "name" : "vi-VN-Wavenet-B"
    },
    {
      "name" : "en-US-Wavenet-E"
    },
    {
      "name" : "tr-TR-Wavenet-E"
    },
    {
      "name" : "tr-TR-Wavenet-A"
    },
    {
      "name" : "ru-RU-Wavenet-B"
    },
    {
      "name" : "fr-CA-Standard-C"
    },
    {
      "name" : "ja-JP-Standard-B"
    },
    {
      "name" : "de-DE-Wavenet-B"
    },
    {
      "name" : "en-GB-Wavenet-C"
    },
    {
      "name" : "fr-FR-Standard-C"
    },
    {
      "name" : "pt-PT-Wavenet-D"
    },
    {
      "name" : "fr-FR-Wavenet-D"
    },
    {
      "name" : "ru-RU-Standard-C"
    },
    {
      "name" : "pl-PL-Standard-A"
    },
    {
      "name" : "pt-PT-Wavenet-B"
    },
    {
      "name" : "nl-NL-Standard-B"
    },
    {
      "name" : "en-US-Wavenet-D"
    },
    {
      "name" : "el-GR-Wavenet-A"
    },
    {
      "name" : "nb-NO-Standard-B"
    },
    {
      "name" : "ja-JP-Wavenet-B"
    },
    {
      "name" : "ar-XA-Wavenet-C"
    }
  ]

  try {
    for (const voice of isActiveMapping) {
      logger.info(loggerPrefix, `Update voices with languageCode "${voice.languageCode}" to be isActive.`);
      // Set voice isActive to true based on the language code
      await voiceRepository.update(
        {
          languageCode: voice.languageCode
        },
        {
          isActive: true
        }
      );
      logger.info(loggerPrefix, `Updated voice with languageCode "${voice.languageCode}"!`);
    }

    for (const voice of premiumVoicesMapping) {
      logger.info(loggerPrefix, `Update voices with name "${voice.name}" to be isPremium.`);
      // Set voice isPremium to true based on the voice name
      await voiceRepository.update(
        {
          name: voice.name
        },
        {
          isPremium: true
        }
      );
      logger.info(loggerPrefix, `Updated voice with name "${voice.name}"!`);
    }

    // Do the updates
    // for (const voice of voicesData) {
    //   logger.info(loggerPrefix, `Update "${voice.name}" to set isActive isPremium.`);

    //   const updatedColumns = {
    //     isActive: voice.isActive,
    //     isPremium: voice.isPremium
    //   };

    //   await voiceRepository.update(
    //     {
    //       name: voice.name
    //     },
    //     updatedColumns
    //   );

    //   logger.info(loggerPrefix, `Updated "${voice.name}" with: ${JSON.stringify(updatedColumns)}`);
    // }
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
      if (voice.synthesizer !== EVoiceSynthesizer.GOOGLE) {
        logger.info(loggerPrefix, `"${voice.name}" is not a Google voice, cannot set isHighestQuality to true.`);
      } else {
        const isHighestQuality = voice.name.toLowerCase().includes('wavenet') ? true : false;

        // If there's a need to update
        if (isHighestQuality !== voice.isHighestQuality) {
          await voiceRepository.update(voice.id, { isHighestQuality });

          logger.info(loggerPrefix, `Updated "${voice.name}" with isHighestQuality: ${isHighestQuality}`);
        } else {
          logger.info(loggerPrefix, `No update for "${voice.name}"`);
        }
      }
    }
  } catch (err) {
    logger.error(loggerPrefix, 'An error happened.', err);
    throw err;
  } finally {
    logger.info(loggerPrefix, 'Done.');
  }
};

const updateQualityForVoices = async () => {
  const loggerPrefix = 'Update quality column for Voices:';
  const voiceRepository = getRepository(Voice);

  try {
    const voices = await voiceRepository.find();

    // Do the updates
    for (const voice of voices) {

      // AWS Polly and everything else is "normal" quality
      let quality = EVoiceQuality.NORMAL;

      // All Google WaveNet voices are "very high" quality
      if (voice.synthesizer === 'Google') {
        if (voice.name.includes('Wavenet')) {
          quality = EVoiceQuality.VERY_HIGH
        }

        if (voice.name.includes('Standard')) {
          quality = EVoiceQuality.HIGH;
        }
      }

      if (voice.synthesizer === 'Microsoft') {

        if (voice.name.includes('Neural')) {
          quality = EVoiceQuality.VERY_HIGH;
        }

        if (voice.name.includes('RUS')) {
          quality = EVoiceQuality.HIGH;
        }
      }

      logger.info(loggerPrefix, `Update "${voice.name}" to set quality: ${quality}`);

      await voiceRepository.update(
        {
          id: voice.id
        },
        {
          quality
        }
      );

      logger.info(loggerPrefix, `Updated "${voice.name}" with: ${quality}`);
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
      const foundSubscription = await inAppSubscriptionRepository.findOne({ productId: inAppSubscription.productId, service: inAppSubscription.service });

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

    // Set quality for voices
    await updateQualityForVoices();

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
