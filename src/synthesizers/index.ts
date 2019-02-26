import { googleSsmlPartsToSpeech } from './google';
import { awsSsmlPartsToSpeech } from './aws';

export type SynthesizerOptions = {
  synthesizer: string,
  languageCode: string,
  name: string,
  source: string
}

/* eslint-disable no-console */

export const ssmlPartsToSpeech = (id: string, ssmlParts: string[], synthesizerOptions: SynthesizerOptions): Promise<string[]> => {
  const { synthesizer } = synthesizerOptions;
  const availableSynthesizers = ['Google', 'AWS'];

  if (!availableSynthesizers.includes(synthesizer)) {
    throw new Error(`Synthesizer option ${synthesizer} is not available. Please use: ${availableSynthesizers.join(' or ')}`);
  }

  console.log(`Using synthesizer "${synthesizer}".`);

  if (synthesizer === 'Google') {
    return googleSsmlPartsToSpeech(id, ssmlParts, synthesizerOptions);
  }

  return awsSsmlPartsToSpeech(id, ssmlParts, synthesizerOptions);
};
