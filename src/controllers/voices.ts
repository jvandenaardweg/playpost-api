import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import fsExtra from 'fs-extra';

import { Voice } from '../database/entities/voice';
import { googleSsmlToSpeech, GoogleSynthesizerOptions } from '../synthesizers/google';
import { getAudioFileDurationInSeconds } from '../utils/audio';
import * as storage from '../storage/google-cloud';
import { AudiofileEncoding } from '../database/entities/audiofile';

export const findAll = async (req: Request, res: Response) => {
  const voiceRepository = getRepository(Voice);

  const voices = await voiceRepository.find();

  return res.json(voices);
};

export const findAllActive = async (req: Request, res: Response) => {
  const voiceRepository = getRepository(Voice);

  const activeVoices = await voiceRepository.find({
    isActive: true
  });

  return res.json(activeVoices);
};

export const findAllActivePremiumVoices = async (req: Request, res: Response) => {
  const voiceRepository = getRepository(Voice);

  const activePremiumVoices = await voiceRepository.find({
    isPremium: true,
    isActive: true
  });

  return res.json(activePremiumVoices);
};

export const findAllActiveFreeVoices = async (req: Request, res: Response) => {
  const voiceRepository = getRepository(Voice);

  const activeFreeVoices = await voiceRepository.find({
    isPremium: false,
    isActive: true
  });

  return res.json(activeFreeVoices);
};

export const createVoicePreview = async (req: Request, res: Response) => {
  const { voiceId } = req.params;
  const voiceRepository = getRepository(Voice);

  const previewSsml = `
    <speak>
      <p>This is a voice preview to demonstrate how it sounds. I will read to you a paragraph taken from Wikipedia's Earth page.</p>
      <p>
        Earth is the third planet from the Sun and the only astronomical object known to harbor life.
        According to radiometric dating and other sources of evidence, Earth formed over 4.5 billion years ago.
        Earth's gravity interacts with other objects in space, especially the Sun and the Moon, Earth's only natural satellite.
        Earth revolves around the Sun in 365.26 days, a period known as an Earth year.
        During this time, Earth rotates about its axis about 366.26 times.
      </p>
      <p>Thanks for listening.</p>
    </speak>
  `;

  const voice = await voiceRepository.findOne(voiceId);

  if (!voice) return res.status(400).json({ message: 'Voice not found, cannot create preview.' });

  if (voice.synthesizer === 'Google') {
    const encoding = AudiofileEncoding.LINEAR16;

    const synthesizerOptions: GoogleSynthesizerOptions = {
      audioConfig: {
        audioEncoding: encoding
      },
      voice: {
        languageCode: voice.languageCode,
        name: voice.name,
        ssmlGender: voice.gender
      },
      input: {
        ssml: previewSsml
      }
    };

    // Step 2: Send the SSML parts to Google's Text to Speech API and download the audio files
    const localAudiofilePath = await googleSsmlToSpeech(
      0,
      synthesizerOptions.input.ssml,
      'preview',
      voice.id,
      synthesizerOptions,
      voice.id
    );

    // Step 4: Get the length of the audiofile
    const audiofileLength = await getAudioFileDurationInSeconds(localAudiofilePath);

    // Step 5: Upload the one mp3 file to Google Cloud Storage
    const uploadResponse = await storage.uploadVoicePreviewAudiofile(
      voice,
      localAudiofilePath,
      encoding,
      audiofileLength
    );

    // Step 6: Delete the local file, we don't need it anymore
    await fsExtra.remove(localAudiofilePath);

    // Step 7: Create a publicfile URL our users can use
    const publicFileUrl = storage.getPublicFileUrl(uploadResponse);

    await voiceRepository.update(voice.id, {
      exampleAudioUrl: publicFileUrl
    });

    const updatedVoice = await voiceRepository.findOne(voice.id);

    return res.json(updatedVoice);
  }
};
