/**
 * Trims a string at a certain length and makes sure we don't trim it in the middle of a word.
 */
export const trimTextAtWords = (text: string, maxLength: number = 200): string => {
  if (text.length < maxLength) return text;

  const trimmedText = text.substr(0, maxLength);
  return `${trimmedText.substr(0, Math.min(trimmedText.length, trimmedText.lastIndexOf(' ')))}...`;
};
