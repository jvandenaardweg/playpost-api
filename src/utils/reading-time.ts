import readingTime from 'reading-time';

export const getReadingTimeInSeconds = (text: string | null, language: string | null) => {
  // https://medium.com/free-code-camp/how-to-more-accurately-estimate-read-time-for-medium-articles-in-javascript-fb563ff0282a
  const CHINESE_KOREAN_CHARACTERS_PER_MINUTE = 500; // important: this is characters per minute, not words

  let readingTimeInSeconds = 0;

  if (!text || !text.length) { return 0; }

  // For Korean, Japanese and Chinese
  if (language && ['ko', 'ja', 'zh'].includes(language)) {
    // Source: https://github.com/pritishvaidya/read-time-estimate/blob/master/src/utils/words-read-time.js
    // In combination with: https://stackoverflow.com/a/52989471/3194288
    const pattern = '[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]';
    const reg = new RegExp(pattern, 'g');
    const count = (text.match(reg) || []).length;

    readingTimeInSeconds = (count / CHINESE_KOREAN_CHARACTERS_PER_MINUTE) * 60;

    return readingTimeInSeconds;
  }

  // For all other languages
  const { minutes } = readingTime(text);
  readingTimeInSeconds = minutes * 60;

  return readingTimeInSeconds;
};

export const getPossibleListeningTimeInSeconds = (text: string | null, language: string | null) => {
  if (!text || !text.length) { return 0; }

  const readingTimeInSeconds = getReadingTimeInSeconds(text, language);

  const possibleListeningTimeInSeconds = readingTimeInSeconds * 1.10;

  return possibleListeningTimeInSeconds;
};
