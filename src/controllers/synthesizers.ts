import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { AwsSynthesizer } from '../synthesizers/aws';
import { GoogleSynthesizer } from '../synthesizers/google';
import { MicrosoftSynthesizer } from '../synthesizers/microsoft';

import { Voice, EVoiceSynthesizer } from '../database/entities/voice';
import { logger } from '../utils/logger';

export const findAllVoices = async (req: Request, res: Response) => {
  const loggerPrefix = 'Synthesizers Controller:';
  const { synthesizerName, status } = req.params;

  if (!synthesizerName) {
    return res.status(400).json({ message: 'synthesizerName is required.' });
  }

  try {

    if (synthesizerName === 'google') {
      const googleSynthesizer = new GoogleSynthesizer();
      const voices = await googleSynthesizer.getAllVoices(loggerPrefix);

      if (status === 'new') {
        const savedVoices = await getRepository(Voice).find({
          where: {
            synthesizer: EVoiceSynthesizer.GOOGLE
          }
        })

        // Only display the voices that are not in the database yet
        const newVoices = voices.filter(voice => {
          return !savedVoices.find(savedVoice => savedVoice.name !== voice.name)
        })

        return res.json(newVoices)
      }

      return res.json(voices)
    }

    if (synthesizerName === 'aws') {
      const awsSynthesizer = new AwsSynthesizer();
      const voices = await awsSynthesizer.getAllVoices();

      if (status === 'new') {
        const savedVoices = await getRepository(Voice).find({
          where: {
            synthesizer: EVoiceSynthesizer.AWS
          }
        })

        // Only display the voices that are not in the database yet
        const newVoices = voices.filter(voice => {
          return !savedVoices.find(savedVoice => savedVoice.name !== voice.Name)
        })

        return res.json(newVoices)
      }

      return res.json(voices)
    }

    if (synthesizerName === 'microsoft') {
      const microsoftSynthesizer = new MicrosoftSynthesizer();
      const voices = await microsoftSynthesizer.getAllVoices();

      if (status === 'new') {
        const savedVoices = await getRepository(Voice).find({
          where: {
            synthesizer: EVoiceSynthesizer.MICROSOFT
          }
        })

        // Only display the voices that are not in the database yet
        const newVoices = voices.filter(voice => {
          return !savedVoices.find(savedVoice => savedVoice.name !== voice.Name)
        })

        return res.json(newVoices)
      }

      return res.json(voices);

    }

    return res.status(400).json({ message: `Synthesizer "${synthesizerName}" does not exist.`});

  } catch (err) {
    logger.error(loggerPrefix, err);
    throw err;
  }
};
