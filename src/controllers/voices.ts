import { Request, Response } from 'express';
import joi from 'joi';
import { getCustomRepository, getRepository } from 'typeorm';

import { Voice } from '../database/entities/voice';

import * as storage from '../storage/google-cloud';

import { CACHE_ONE_DAY } from '../constants/cache';
import { VoiceRepository } from '../database/repositories/voice';
import { voiceInputValidationSchema } from '../database/validators';

export const findAll = async (req: Request, res: Response) => {
  const voiceRepository = getRepository(Voice);

  const voices = await voiceRepository.find({
    relations: ['language'],
    cache: {
      id: 'voices_all',
      milliseconds: CACHE_ONE_DAY
    }
  });

  return res.json(voices);
};

export const findAllActive = async (req: Request, res: Response) => {
  const voiceRepository = getRepository(Voice);

  const activeVoices = await voiceRepository.find({
    where: {
      isActive: true,
    },
    cache: {
      id: 'voices_active',
      milliseconds: CACHE_ONE_DAY
    }
  });

  return res.json(activeVoices);
};

export const findAllActivePremiumVoices = async (req: Request, res: Response) => {
  const voiceRepository = getRepository(Voice);

  const activePremiumVoices = await voiceRepository.find({
    where: {
      isPremium: true,
      isActive: true
    },
    cache: {
      id: 'voices_active_premium',
      milliseconds: CACHE_ONE_DAY
    }
  });

  return res.json(activePremiumVoices);
};

export const findAllActiveFreeVoices = async (req: Request, res: Response) => {
  const voiceRepository = getRepository(Voice);

  const activeFreeVoices = await voiceRepository.find({
    where: {
      isPremium: false,
      isActive: true
    },
    cache: {
      id: 'voices_active_free',
      milliseconds: CACHE_ONE_DAY
    }
  });

  return res.json(activeFreeVoices);
};

export const createVoicePreview = async (req: Request, res: Response) => {
  const { voiceId } = req.params;

  const voiceRepository = getCustomRepository(VoiceRepository);

  const updatedVoice = await voiceRepository.createVoicePreview(voiceId);

  return res.json(updatedVoice);
};

export const deleteVoicePreview = async (req: Request, res: Response) => {
  const userEmail = req.user.email;
  const { voiceId } = req.params;
  const voiceRepository = getRepository(Voice);

  if (userEmail !== 'jordyvandenaardweg@gmail.com') { return res.status(403).json({ message: 'You dont have access to this endpoint.' }); }

  const { error } = joi.validate(req.params, voiceInputValidationSchema.requiredKeys('voiceId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const voice = await voiceRepository.findOne(voiceId);

  if (!voice) { return res.status(400).json({ message: 'Voice not found!' }); }

  if (!voice.exampleAudioUrl) { return res.status(400).json({ message: 'This voice has no voice preview. Nothing to be deleted!' }); }

  // Delete the URL from the voice in the database
  await voiceRepository.update(voiceId, {
    exampleAudioUrl: undefined
  });

  // Dlete the file from our storage
  await storage.deleteVoicePreview(voiceId);

  return res.json({ message: 'Voice preview is deleted!' });
};
