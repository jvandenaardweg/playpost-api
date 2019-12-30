import LocaleCode from 'locale-code';
import { getRepository, Repository } from 'typeorm';

import { BaseService } from '.';
import { EVoiceGender, EVoiceSynthesizer, Voice } from '../database/entities/voice';
import { Sentry } from '../sentry';
import { logger } from '../utils';
import { SynthesizerName, SynthesizerService } from './synthesizer-service';

export class VoiceService extends BaseService {
  private readonly voiceRepository: Repository<Voice>;

  constructor() {
    super();
    this.voiceRepository = getRepository(Voice);
  }

  public findAll = (): Promise<Voice[]> => {
    return this.voiceRepository.find();
  }

  public addAllSynthesizerVoices = async (synthesizerName: SynthesizerName): Promise<void> => {
    logger.info('Checking if we need to add new voices to the database...');

    const synthesizerService = new SynthesizerService(synthesizerName);
    const voices = await synthesizerService.getAllVoices();

    if (synthesizerName === 'aws') {
      await this.addAllAWSVoices(voices);
    }

    if (synthesizerName === 'google') {
      await this.addAllGoogleVoices(voices);
    }
  };

  public addAllAWSVoices = async (voices: any[]) => {
    const voicesAlreadyInDatabase = await this.findAll();

    for (const voice of voices) {
      const voiceId = voice.Id;
      const voiceName = voice.Name;
      const voiceLanguageCode = voice.LanguageCode;
      const voiceGender = voice.Gender === 'Male' ? EVoiceGender.MALE : EVoiceGender.FEMALE;

      const foundVoice = voicesAlreadyInDatabase.find(availableVoice => availableVoice.name === voiceId);

      if (foundVoice) {
        logger.info(`AWS Polly: Voice ${voiceId} already present. We don't need to add it (again) to the database.`);
      } else {
        if (!voiceLanguageCode) {
          logger.warn(`AWS Polly: Got no LanguageCode for ${voiceId}. We don't add it to the database.`);
        } else {
          let countryCode = LocaleCode.getCountryCode(voiceLanguageCode);

          if (voiceLanguageCode === 'cmn-CN') {
            // cmn-CH is Chinese Mandarin
            countryCode = LocaleCode.getCountryCode('zh-CN')
          }

          if (!countryCode) {
            logger.warn(`AWS Polly: Cannot determine countryCode for ${voiceId}. We don't add it to the database.`, voice);
          } else {
            try {
              const voiceToCreate = this.voiceRepository.create({
                countryCode,
                languageCode: voiceLanguageCode,
                name: voiceId,
                label: voiceName,
                gender: voiceGender,
                synthesizer: EVoiceSynthesizer.AWS
              });

              const createdVoice = await this.voiceRepository.save(voiceToCreate);

              logger.info('AWS Polly: Added new voice to database: ', createdVoice.name);
            } catch (err) {
              logger.error('AWS Polly: Failed to create the voice in the database', err);

              Sentry.withScope(scope => {
                scope.setLevel(Sentry.Severity.Critical);
                scope.setExtra('voice', voice);
                scope.setExtra('foundVoice', foundVoice);
                scope.setExtra('countryCode', countryCode);
                Sentry.captureException(err);
              });

              throw err;
            }
          }
        }
      }
    }
  }

  public addAllGoogleVoices = async (voices: any[]) => {
    const voicesAlreadyInDatabase = await this.findAll();

    for (const voice of voices) {
      const voiceName = voice.name;
      // @ts-ignore
      const voiceLanguageCode = voice.languageCodes[0];
      const voiceGender = voice.ssmlGender as EVoiceGender;

      const foundVoice = voicesAlreadyInDatabase.find(availableVoice => availableVoice.name === voiceName);

      if (foundVoice) {
        logger.info(`Google Text To Speech: Voice ${voiceName} already present. We don't need to add it (again) to the database.`);
      } else {
        let countryCode = LocaleCode.getCountryCode(voiceLanguageCode);

        if (voiceLanguageCode === 'cmn-CN') {
          // cmn-CH is Chinese Mandarin
          countryCode = LocaleCode.getCountryCode('zh-CN')
        }

        if (!countryCode) {
          logger.warn(`Google Text To Speech: Cannot determine countryCode for ${voiceName}. We don't add it to the database.`);
        } else {
          try {
            const voiceToCreate = this.voiceRepository.create({
              countryCode,
              languageCode: voiceLanguageCode,
              name: voiceName,
              label: voiceName,
              gender: voiceGender,
              synthesizer: EVoiceSynthesizer.GOOGLE
            });

            const createdVoice = await this.voiceRepository.save(voiceToCreate);

            logger.info('Google Text To Speech: Added new voice to database: ', createdVoice.name);
          } catch (err) {
            logger.error('Google Text To Speech: Failed to create the voice in the database', err);

            Sentry.withScope(scope => {
              scope.setLevel(Sentry.Severity.Critical);
              scope.setExtra('voice', voice);
              scope.setExtra('foundVoice', foundVoice);
              scope.setExtra('countryCode', countryCode);
              Sentry.captureException(err);
            });

            throw err;
          }
        }
      }
    }
  }
}
