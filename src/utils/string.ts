import normalizeUrl from 'normalize-url';

/**
 * Trims a string at a certain length and makes sure we don't trim it in the middle of a word.
 */
export const trimTextAtWords = (text: string, maxLength: number = 200): string => {
  if (text.length < maxLength) { return text; }

  const trimmedText = text.substr(0, maxLength);
  return `${trimmedText.substr(0, Math.min(trimmedText.length, trimmedText.lastIndexOf(' ')))}...`;
};

export const getNormalizedUrl = (url: string) => {
  return normalizeUrl(url, {
    removeQueryParameters: [/^utm_\w+/i],
    sortQueryParameters: true,
    removeTrailingSlash: true,
    stripWWW: false,
    stripAuthentication: true,
    normalizeProtocol: true,
    defaultProtocol: 'https://'
  });
};

export const getTextFromSSML = (ssml: string) => {
  const textFromSSML = ssml.replace(/<[^>]+>/g, '').replace(/\./g, '. ').trim()
  return textFromSSML;
}

export const getHTMLFromSSML = (ssml: string) => {
  const strippedSSML = ssml
  // Strip XML tags except <p>
  .replace(/<\/?(?!(?:p)\b)[a-z](?:[^>"']|"[^"]*"|'[^']*')*>/g, '')
  // Make sure there is correct spacing between periods (sentence endings)
  .replace(/\./g, '. ')
  // Make sure the is no space on an paragraph ending with a period
  .replace(/.\s<\/p>/g, '.</p>')
  .trim()
  return strippedSSML;
}
