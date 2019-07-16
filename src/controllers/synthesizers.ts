import { Request, Response } from 'express';
import { AwsSynthesizer, AWSVoice } from '../synthesizers/aws';
import { GoogleSynthesizer, GoogleVoice } from '../synthesizers/google';
import { logger } from '../utils/logger';

export const findAllVoices = async (req: Request, res: Response) => {
  const loggerPrefix = 'Synthesizers Controller:';
  const { synthesizerName }: { synthesizerName: string } = req.params;

  if (!synthesizerName) {
    return res.status(400).json({ message: 'synthesizerName is required.' });
  }

  try {
    let voices: GoogleVoice[] | AWSVoice[] | undefined;

    if (synthesizerName === 'google') {
      const googleSynthesizer = new GoogleSynthesizer();
      voices = await googleSynthesizer.getAllVoices(loggerPrefix);
    } else if (synthesizerName === 'aws') {
      const awsSynthesizer = new AwsSynthesizer();
      voices = await awsSynthesizer.getAllVoices();
    }

    return res.json(voices);
  } catch (err) {
    logger.error(loggerPrefix, err);
    throw err;
  }
};
