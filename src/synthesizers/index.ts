import { GooglessmlPartsToSpeech } from './google';
import { AWSssmlPartsToSpeech } from './aws';

/* eslint-disable no-console */

export const ssmlPartsToSpeech = (id: string, ssmlParts: Array<string>, synthesizerOptions: SynthesizerOptions) => {
  const { synthesizer } = synthesizerOptions;
  const availableSynthesizers = ['Google', 'AWS'];

  if (!availableSynthesizers.includes(synthesizer)) {
    throw new Error(`Synthesizer option ${synthesizer} is not available. Please use: ${availableSynthesizers.join(' or ')}`);
  }

  console.log(`Using synthesizer "${synthesizer}".`);

  if (synthesizer === 'Google') {
    return GooglessmlPartsToSpeech(id, ssmlParts, synthesizerOptions);
  }

  return AWSssmlPartsToSpeech(id, ssmlParts, synthesizerOptions);
};
