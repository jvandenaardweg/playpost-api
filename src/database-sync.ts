/* tslint:disable:no-unused-variable */
import * as Sentry from '@sentry/node';
import { createConnection, DeepPartial, getCustomRepository, getRepository, In, IsNull } from 'typeorm';

import { connectionOptions } from './database/connection-options';
import { Country } from './database/entities/country';
import { InAppSubscription } from './database/entities/in-app-subscription';
import { Language } from './database/entities/language';
import { EVoiceQuality, EVoiceSynthesizer, Voice } from './database/entities/voice';
import { VoiceRepository } from './database/repositories/voice';
import countries from './database/seeds/countries';
import inAppSubscriptions from './database/seeds/in-app-subscriptions';
import languages from './database/seeds/languages';
import { VoiceService } from './services/voice-service';
import { logger } from './utils/logger';

const syncCountries = async () => {
  const loggerPrefix = 'Sync Countries:';
  const countryRepository = getRepository(Country);

  try {
    logger.info(loggerPrefix, 'Adding countries to the database...');

    const countryCodes = Object.keys(countries);
    logger.info(loggerPrefix, `Got ${countryCodes.length} countries from seed file.`);

    const availableCountries = await countryRepository.find();
    logger.info(loggerPrefix, `Found ${availableCountries.length} countries in database.`);

    for (const countryCode of countryCodes) {
      const country = countries[countryCode];

      const foundCountry = availableCountries.find(availableCountry => availableCountry.code === countryCode);

      const countryToSync = new Country();

      // If the country exists, use the ID, so we can update it
      if (foundCountry) {
        countryToSync.id = foundCountry.id;
      }

      countryToSync.code = countryCode;
      countryToSync.name = country.name;
      countryToSync.nativeName = country.native;
      countryToSync.continent = country.continent;
      countryToSync.currency = country.currency;

      if (foundCountry) {
        logger.info(loggerPrefix, 'Trying to update:', countryToSync.code, countryToSync.name, countryToSync.nativeName, '...');
      } else {
        logger.info(loggerPrefix, 'Trying to add:', countryToSync.code, countryToSync.name, countryToSync.nativeName, '...');
      }

      // Update, make sure it's in sync
      await countryRepository.save(countryToSync);
    }
  } catch (err) {
    logger.error(loggerPrefix, 'An error happened.', err);
    throw err;
  } finally {
    logger.info(loggerPrefix, 'Done!');
  }
}

const syncLanguages = async () => {
  const loggerPrefix = 'Sync Languages:';
  const languageRepository = getRepository(Language);
  const countryRepository = getRepository(Country);

  try {
    logger.info(loggerPrefix, 'Adding languages to the database...');

    const languageCodes = Object.keys(languages);
    logger.info(loggerPrefix, `Got ${languageCodes.length} languages from seed file.`);

    const availableCountries = await countryRepository.find();
    logger.info(loggerPrefix, `Found ${availableCountries.length} countries in database.`);

    const availableLanguages = await languageRepository.find();
    logger.info(loggerPrefix, `Found ${availableLanguages.length} languages in database.`);

    for (const languageCode of languageCodes) {
      const language = languages[languageCode];
      const foundLanguage = availableLanguages.find(availableLanguage => availableLanguage.code === languageCode);

      const foundCountries = availableCountries.filter(country => {
        const seed = countries[country.code]; // Uses the seed file
        return seed.languages.includes(languageCode);
      });

      const languageToSync = new Language();

      if (foundLanguage) {
        languageToSync.id = foundLanguage.id;
      }

      languageToSync.code = languageCode;
      languageToSync.name = language.name;
      languageToSync.nativeName = language.native;
      languageToSync.rightToLeft = !!language.rtl;
      languageToSync.countries = foundCountries;

      if (foundLanguage) {
        logger.info(loggerPrefix, 'Trying to update:', languageToSync.code, languageToSync.name, languageToSync.nativeName, '...');
      } else {
        logger.info(loggerPrefix, 'Trying to add:', languageToSync.code, languageToSync.name, languageToSync.nativeName, '...');
      }

      // Update language or insert if it does not exist yet
      await languageRepository.save(languageToSync);

      logger.info(loggerPrefix, 'Successfully synced:', languageCode, language.name, language.native);
    }
  } catch (err) {
    logger.error(loggerPrefix, 'An error happened.', err);
    throw err;
  } finally {
    logger.info(loggerPrefix, 'Done!');
  }
};

const syncVoices = async () => {
  const loggerPrefix = 'Sync Voices:';

  const voiceRepository = getRepository(Voice);
  const languageRepository = getRepository(Language);
  const countryRepository = getRepository(Country);

  const voiceService = new VoiceService();

  try {
    logger.info(loggerPrefix, 'Checking for new voices at Google, AWS and Microsoft...');

    await voiceService.addAllSynthesizerVoices(EVoiceSynthesizer.GOOGLE);
    await voiceService.addAllSynthesizerVoices(EVoiceSynthesizer.AWS);

    const foundCountries = await countryRepository.find();
    logger.info(loggerPrefix, `Got ${foundCountries.length} countries from database.`);

    const foundLanguages = await languageRepository.find();
    logger.info(loggerPrefix, `Got ${foundLanguages.length} languages from database.`);

    const availableVoices = await voiceRepository.find();
    logger.info(loggerPrefix, `Got ${availableVoices.length} voices from database.`);

    logger.info(loggerPrefix, 'Checking which voices are not connected to a language yet...');

    for (const availableVoice of availableVoices) {
      let languageCode = availableVoice.languageCode.split('-')[0]; // "en-US" => "en", "nl-NL" => "nl"

      // It seems that Google uses "nb" for Norwegian Bokmål, we just connect that to "Norwegian"
      if (languageCode === 'nb') {
        languageCode = 'no';
      }

      // CMN = Chinese Mandarin
      // We just connect it Chinese
      if (languageCode === 'cmn') {
        languageCode = 'zh';
      }

      const language = foundLanguages.find(foundLanguage => foundLanguage.code === languageCode);
      const country = foundCountries.find(foundCountry => foundCountry.code === availableVoice.countryCode);

      logger.info(loggerPrefix, 'Trying to update:', availableVoice.id, language && languageCode, country && country.code);

      // Connect the voice to the correct language and country
      await voiceRepository.update(availableVoice.id, { language, country });
    }
  } catch (err) {
    logger.error(loggerPrefix, 'An error happened.', err);
    throw err;
  } finally {
    logger.info(loggerPrefix, 'Done!');
  }
};

/**
 * Method to make sure we have the same label's for voices on every environment
 */
const updateGoogleVoicesLabel = async () => {
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
      name: 'fr-FR-Standard-E',
      label: 'Juliette',
      gender: 'FEMALE'
    },
    {
      name: 'fr-FR-Wavenet-E',
      label: 'Francine',
      gender: 'FEMALE'
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
    },
    {
      name: 'cmn-CN-Standard-C',
      label: 'Li Qiang',
      gender: 'MALE'
    },
    {
      name: 'cmn-CN-Standard-B',
      label: 'Liu Wei',
      gender: 'MALE'
    },
    {
      name: 'cmn-CN-Standard-A',
      label: 'Li Xiu Ying',
      gender: 'FEMALE'
    },
    {
      name: 'cmn-CN-Wavenet-C',
      label: 'Zhang Yong',
      gender: 'MALE'
    },
    {
      name: 'cmn-CN-Wavenet-B',
      label: 'Zhang Wei',
      gender: 'MALE'
    },
    {
      name: 'cmn-CN-Wavenet-A',
      label: 'Li Na',
      gender: 'FEMALE'
    },
    {
      name: 'cmn-CN-Standard-D',
      label: 'Mei',
      gender: 'FEMALE'
    },
    {
      name: 'cmn-CN-Wavenet-D',
      label: 'Jiao',
      gender: 'FEMALE'
    },
    {
      name: 'ru-RU-Standard-E',
      label: 'Alla',
      gender: 'FEMALE'
    },
    {
      name: 'ru-RU-Wavenet-E',
      label: 'Christina',
      gender: 'FEMALE'
    },
    {
      name: 'ar-XA-Standard-D',
      label: 'Nadia',
      gender: 'FEMALE'
    },
    {
      name: 'de-DE-Wavenet-E',
      label: 'Jonas',
      gender: 'MALE'
    },
    {
      name: 'de-DE-Standard-E',
      label: 'Walter',
      gender: 'MALE'
    }
  ];

  try {
    const googleVoices = await voiceRepository.find({
      where: {
        synthesizer: EVoiceSynthesizer.GOOGLE
      }
    });

    const voicesToSave: DeepPartial<Voice>[] = googleVoices.map(voice => {
      const voiceMap = voiceLabelMapping.find(voiceLabelMap => voiceLabelMap.name === voice.name);
      const label = voiceMap ? voiceMap.label : voice.name;

      logger.info(loggerPrefix, `Update "${voice.name}" with label=${label}.`);

      return {
        id: voice.id,
        label
      }
    })

    const savedVoices = await voiceRepository.save(voicesToSave);

    logger.warn(loggerPrefix, `Saved ${savedVoices.length} voices.`);

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
    'Bianca', // IT
    'el-GR-Standard-A' // GR
  ];

  try {
    const voices = await voiceRepository.find();

    const voicesToSave: DeepPartial<Voice>[] = voices.map(voice => {
      const isLanguageDefault = !!voiceLanguageDefaultMapping.find(voiceName => voiceName === voice.name) || undefined;
      const isUnsubscribedLanguageDefault = !!voiceLanguageDefaultMapping.find(voiceName => voiceName === voice.name) || undefined;

      logger.info(loggerPrefix, `Update "${voice.name}" with isLanguageDefault=${isLanguageDefault} and isUnsubscribedLanguageDefault=${isUnsubscribedLanguageDefault}.`);

      return {
        id: voice.id,
        isLanguageDefault,
        isUnsubscribedLanguageDefault
      }
    })

    const savedVoices = await voiceRepository.save(voicesToSave);

    logger.info(loggerPrefix, `Saved "${savedVoices.length}" voices.`);

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
    },
    {
      "languageCode": "fi-FI"
    },
    {
      "languageCode": "tr-TR"
    },
    {
      "languageCode": "ar-XA"
    },
    {
      "languageCode": "hu-HU"
    },
    {
      "languageCode": "ja-JP"
    },
    {
      "languageCode": "sk-SK"
    },
    {
      "languageCode": "uk-UA"
    },
    {
      "languageCode": "is-IS"
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
    },
    {
      "name": "fr-FR-Wavenet-E"
    },
    {
      "name": "cmn-CN-Wavenet-B"
    },
    {
      "name": "cmn-CN-Wavenet-C",
    },
    {
      "name": "cmn-CN-Wavenet-A"
    },
    {
      "name": "cmn-CN-Wavenet-D"
    }
  ]

  try {
    const voices = await voiceRepository.find();

    const voicesToSave: DeepPartial<Voice>[] = voices.map(voice => {
      const isActive = !!isActiveMapping.find(mapping => mapping.languageCode === voice.languageCode);
      const isPremium = !!premiumVoicesMapping.find(mapping => mapping.name === voice.name);

      logger.info(loggerPrefix, `Update voice "${voice.name}" to be isActive=${isActive} and isPremium=${isPremium}.`);

      return {
        id: voice.id,
        isActive,
        isPremium
      }
    })

    const savedVoices = await voiceRepository.save(voicesToSave)

    logger.info(loggerPrefix, `Saved "${savedVoices.length}" voices.`);

  } catch (err) {
    logger.error(loggerPrefix, 'An error happened.', err);
    throw err;
  } finally {
    logger.info(loggerPrefix, 'Done.');
  }
};

const updateIsSubscribedLanguageDefault = async () => {
  const loggerPrefix = 'Update isSubscribedLanguageDefault Voices:';
  const voiceRepository = getRepository(Voice);

  const voices = await voiceRepository.find()

  // An array of voice name's that should be considered the preferred highest quality voice
  const isSubscribedLanguageDefaultMapping = [
    {
      "name" : "en-US-Wavenet-F" // Emily
    },
    {
      "name": "sk-SK-Wavenet-A" // Nora
    },
    {
      "name": "fi-FI-Wavenet-A" // Aava
    },
    {
      "name": "pl-PL-Wavenet-D" // Mariola
    },
    {
      "name": "hi-IN-Wavenet-C" // Narenda
    },
    {
      "name": "tr-TR-Wavenet-D" // Eylül
    },
    {
      "name": "de-DE-Wavenet-C" // Edith
    },
    {
      "name": "pt-PT-Wavenet-D" // Maria
    },
    {
      "name": "vi-VN-Wavenet-D" // Anh Dung
    },
    {
      "name": "cs-CZ-Wavenet-A" // Adrianka
    },
    {
      "name": "el-GR-Wavenet-A" // Lydia
    },
    {
      "name": "da-DK-Wavenet-A" // Diana
    },
    {
      "name": "ja-JP-Wavenet-D" // Kenzou
    },
    {
      "name": "ar-XA-Wavenet-C" // Saabir
    },
    {
      "name": "fr-FR-Wavenet-C" // Esmee
    },
    {
      "name": "uk-UA-Wavenet-A" // Oleksander
    },
    {
      "name": "sv-SE-Wavenet-A" // Anja
    },
    {
      "name": "id-ID-Wavenet-C" // Panuta
    },
    {
      "name": "ru-RU-Wavenet-D" // Danil
    },
    {
      "name": "nl-NL-Wavenet-D" // Ineke
    },
    {
      "name": "nb-no-Wavenet-E" // Hilma
    },
    {
      "name": "ko-KR-Wavenet-D" // Jung
    },
    {
      "name": "cmn-CN-Wavenet-D" // Jiao
    },
    {
      "name": "it-IT-Wavenet-D" // Marco
    },
    {
      "name": "Karl"
    },
    {
      "name": "hu-HU-Wavenet-A"
    },
    {
      "name": "Carmen"
    },
    {
      "name": "Conchita"
    },
    {
      "name": "Gwyneth"
    }

  ]

  try {
    logger.info(loggerPrefix, `Update ${isSubscribedLanguageDefaultMapping.length} voices to be isSubscribedLanguageDefault.`);

    const voicesToSave: DeepPartial<Voice>[] = voices.map(voice => {
      const isSubscribedLanguageDefault = !!isSubscribedLanguageDefaultMapping.find(mapping => mapping.name === voice.name) || undefined;
      logger.info(loggerPrefix, `Should save ${voice.name} isSubscribedLanguageDefault to be: ${isSubscribedLanguageDefault}`);

      return {
        id: voice.id,
        isSubscribedLanguageDefault
      }
    })

    const savedVoices = await voiceRepository.save(voicesToSave);

    logger.info(loggerPrefix, `Saved ${savedVoices.length} voices.`);

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

    const voicesToSave: DeepPartial<Voice>[] = voices.map(voice => {
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

      return {
        id: voice.id,
        quality
      }
    })

    const savedVoices = await voiceRepository.save(voicesToSave);

    logger.info(loggerPrefix, `Saved ${savedVoices.length} voices`);

  } catch (err) {
    logger.error(loggerPrefix, 'An error happened.', err);
    throw err;
  } finally {
    logger.info(loggerPrefix, 'Done.');
  }
};

const syncInAppSubscriptions = async () => {
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
        const subscriptionToCreate = inAppSubscriptionRepository.create(inAppSubscription);
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
  const customVoiceRepository = getCustomRepository(VoiceRepository);
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
    const voicesWithoutPreview = await customVoiceRepository.find({
      where: {
        exampleAudioUrl: IsNull(),
        language: {
          id: In(languageIds)
        }
      }
    });

    logger.info(loggerPrefix, `Creating voice previews for ${voicesWithoutPreview.length} voices...`);

    for (const voice of voicesWithoutPreview) {
      const updatedVoice = await customVoiceRepository.createVoicePreview(voice.id);
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
 * This file ensures we have the same data on every environment we use
 */
(async () => {
  try {
    await createConnection(connectionOptions());

    // Run the syncers and seeders

    // Sync countries in the database with our seed file
    await syncCountries();

    // Insert the world's languages
    // We don't use them all, but insert them for completeness sake
    await syncLanguages();

    // After we insert the languages, and countries, we can seed the voices
    // The voices are fetched from the Google and AWS API's, so they require the API keys to be set in this project
    await syncVoices();

    // Create some subscriptions our app uses
    await syncInAppSubscriptions();

    // Run the updaters

    // Connect labels to our voices, to make sure they are the same on every environment
    await updateGoogleVoicesLabel();

    // Set default voices for languages
    await updateIsLanguageDefaultForVoices();

    // Set isActive and isPremium for voices
    await updateIsActiveIsPremiumForVoices();

    // Set quality for voices
    await updateQualityForVoices();

    await updateIsSubscribedLanguageDefault();

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
