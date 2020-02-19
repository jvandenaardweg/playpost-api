import { Request, Response } from 'express';
import { getRepository } from 'typeorm';

import { EVoiceSynthesizer, Voice } from '../database/entities/voice';
import { SynthesizerService } from '../services/synthesizer-service';
import { logger } from '../utils/logger';

export const findAllVoices = async (req: Request, res: Response) => {
  const loggerPrefix = 'Synthesizers Controller:';
  const { synthesizerName } = req.params;
  const { status }: { status: string } = req.query;

  if (!synthesizerName) {
    return res.status(400).json({ message: 'synthesizerName is required.' });
  }

  try {

    if (synthesizerName === 'google') {
      const googleSynthesizerService = new SynthesizerService(EVoiceSynthesizer.GOOGLE);
      const voices = await googleSynthesizerService.getAllVoices();

      if (status === 'new' || status === 'inactive') {
        const savedVoices = await getRepository(Voice).find({
          where: {
            synthesizer: EVoiceSynthesizer.GOOGLE
          }
        })

        if (status === 'new') {
          // Only display the voices that are not in the database yet
          const newVoices = voices.filter(voice => {
            return !savedVoices.find(savedVoice => savedVoice.name !== voice.name)
          })

          return res.json(newVoices)
        }

        if (status === 'inactive') {
          // Only display the voices that are in the database, but seem to not be available anymore at the synthesizer
          const inactiveVoices = savedVoices.filter(savedVoice => {
            return !voices.find(voice => voice.name === savedVoice.name)
          })

          return res.json(inactiveVoices)
        }

      }

      return res.json(voices)
    }

    if (synthesizerName === 'aws') {
      const awsSynthesizerService = new SynthesizerService(EVoiceSynthesizer.AWS);
      const voices = await awsSynthesizerService.getAllVoices();

      if (status === 'new' || status === 'inactive') {
        const savedVoices = await getRepository(Voice).find({
          where: {
            synthesizer: EVoiceSynthesizer.AWS
          }
        })

        if (status === 'new') {
          // Only display the voices that are not in the database yet
          const newVoices = voices.filter(voice => {
            return !savedVoices.find(savedVoice => savedVoice.name !== voice.Id)
          })

          return res.json(newVoices)
        }

        if (status === 'inactive') {
          // Only display the voices that are in the database, but seem to not be available anymore at the synthesizer
          const inactiveVoices = savedVoices.filter(savedVoice => {
            return !voices.find(voice => voice.Id === savedVoice.name)
          })

          return res.json(inactiveVoices)
        }
      }

      return res.json(voices)
    }

    return res.status(400).json({ message: `Synthesizer "${synthesizerName}" does not exist.`});

  } catch (err) {
    logger.error(loggerPrefix, err);
    throw err;
  }
};
