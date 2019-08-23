import { Request, Response } from 'express';
import { AwsSynthesizer, AWSVoice } from '../synthesizers/aws';
import { GoogleSynthesizer, GoogleVoice } from '../synthesizers/google';
import { MicrosoftSynthesizer, MicrosoftVoice } from '../synthesizers/microsoft';

import { logger } from '../utils/logger';

export const findAllVoices = async (req: Request, res: Response) => {
  const loggerPrefix = 'Synthesizers Controller:';
  const { synthesizerName } = req.params;

  if (!synthesizerName) {
    return res.status(400).json({ message: 'synthesizerName is required.' });
  }

  try {
    let voices: GoogleVoice[] | AWSVoice[] | MicrosoftVoice[] | undefined;

    if (synthesizerName === 'google') {
      const googleSynthesizer = new GoogleSynthesizer();
      voices = await googleSynthesizer.getAllVoices(loggerPrefix);
    } else if (synthesizerName === 'aws') {
      const awsSynthesizer = new AwsSynthesizer();
      voices = await awsSynthesizer.getAllVoices();
    } else if (synthesizerName === 'microsoft') {
      const microsoftSynthesizer = new MicrosoftSynthesizer();
      voices = await microsoftSynthesizer.getAllVoices();
    }

    return res.json(voices);
  } catch (err) {
    logger.error(loggerPrefix, err);
    throw err;
  }
};
