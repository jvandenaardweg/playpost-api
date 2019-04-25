import { getRepository, createConnection } from 'typeorm';
import LocaleCode from 'locale-code';

import { connectionOptions } from './database/connection-options';
import { getAllVoices } from './synthesizers/google';
import { Voice, Gender, Synthesizer, AudioProfile } from './database/entities/voice';

interface TextToSpeechVoice {
  languageCodes: string[];
  name: string;
  ssmlGender: Gender;
  naturalSampleRateHertz: number;
}

createConnection(connectionOptions('default')).then(async (connection: any) => {
  try {
    const voiceRepository = getRepository(Voice);

    const voices: [TextToSpeechVoice] = await getAllVoices();

    for (const voice of voices) {
      const voiceName = voice.name;
      const voiceLanguageCode = voice.languageCodes[0];
      const voiceGender = voice.ssmlGender;
      const voiceNaturalSampleRateHertz = voice.naturalSampleRateHertz;

      const foundVoice = await voiceRepository.findOne({ name: voiceName });

      if (foundVoice) {
        console.log(`Voice ${voiceName} already present. We don't need to add it (again) to the database.`);
      } else {
        const voiceToCreate = await voiceRepository.create({
          languageCode: voiceLanguageCode,
          countryCode: LocaleCode.getCountryCode(voiceLanguageCode),
          languageName: LocaleCode.getLanguageName(voiceLanguageCode),
          name: voiceName,
          // label: null, // Use default
          gender: voiceGender,
          synthesizer: Synthesizer.GOOGLE,
          // audioProfile: AudioProfile.DEFAULT, // Use default
          // speakingRate: 1, // Use default
          // pitch: 0, // Use default
          naturalSampleRateHertz: voiceNaturalSampleRateHertz,
          // isActive: false, // Use default
          // isPremium: true, // Use default
          // exampleAudioUrl: null // Use default
        });

        const createdVoice = await voiceRepository.save(voiceToCreate);

        console.log('Added new voice to database: ', createdVoice.name);
      }
    }

  } finally {
    console.log('We are done checking for new voices. We close.');
    process.exit();
  }
})
