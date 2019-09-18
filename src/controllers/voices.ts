import { Request, Response } from 'express';
import joi from 'joi';
import { FindConditions, getCustomRepository, getRepository } from 'typeorm';

import { Voice } from '../database/entities/voice';

import * as storage from '../storage/google-cloud';

import { CACHE_ONE_DAY } from '../constants/cache';
import { VoiceRepository } from '../database/repositories/voice';
import { voiceInputValidationSchema } from '../database/validators';

export const findAll = async (req: Request, res: Response) => {
  const voiceRepository = getRepository(Voice);
  const { isActive }: {isActive: string } = req.query;

  const where: FindConditions<Voice> = {}

  if (isActive) {
    where.isActive = isActive === 'true' ? true : isActive === 'false' ? false : undefined
  }

  const cacheKey = JSON.stringify(where);

  const voices = await voiceRepository.find({
    where,
    relations: ['language'],
    cache: {
      id: `${Voice.name}:${cacheKey}`,
      milliseconds: CACHE_ONE_DAY
    }
  });

  return res.json(voices);
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
