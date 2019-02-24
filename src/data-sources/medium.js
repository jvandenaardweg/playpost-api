const fetch = require('node-fetch');

const SYNTHESIZE_COST_PER_LETTER = 16 / 1000000;
// 16 dollar per 1 million letters. First 1 million is free.

// TODO: Amazon is way cheaper: https://aws.amazon.com/polly/pricing/
// https://medium.com/@housemd/google-wavenet-vs-amazon-polly-eace00c16035

const getArticleIdFromUrl = (url) => {
  return new Promise((resolve, reject) => {
    console.log(`Getting Medium Post ID from url: ${url}...`);

    // Possibilities:
    // https://medium.freecodecamp.org/learn-typescript-in-5-minutes-13eda868daeb
    // https://medium.com/p/13eda868daeb
    let possibleId;

    if (url.includes('https://medium.com/p/')) {
      possibleId = url.split('https://medium.com/p/')[1];
    } else {
      const urlItems = url.split('-');
      possibleId = urlItems[urlItems.length - 1];
    }

    if (possibleId.length !== 12) {
      return reject(new Error(`Could not get the correct Medium Post ID from URL '${url}'.`));
    }

    console.log(`Got Medium Post ID: ${possibleId}...`)

    return resolve(possibleId);
  });
};

const getArticle = (url) => {
  console.log(`Getting Medium Post data from URL: ${url}...`);

  return fetch(`${url}?format=json`)
    .then(response => response.text())
    .then(text => JSON.parse(text.split('</x>')[1]).payload)
    .then((json) => {
      const firstAuthor = (json.references.User) ? Object.values(json.references.User)[0] : {};
      const firstCollection = (json.references.Collection) ? Object.values(json.references.Collection)[0] : {};

      const mediumId = json.value.id;
      const title = json.value.title;
      const url = json.value.canonicalUrl;
      const subtitle = json.value.content.subtitle;
      const previewImageId = json.value.virtuals.previewImage.imageId;
      const previewImageUrl = (previewImageId) ? `https://cdn-images-1.medium.com/fit/c/160/160/${previewImageId}` : null;
      const readingTime = (json.value.virtuals.readingTime) ? json.value.virtuals.readingTime : null;
      const wordCount = (json.value.virtuals.wordCount) ? json.value.virtuals.wordCount : null;
      const detectedLanguage = (json.value.detectedLanguage) ? json.value.detectedLanguage : null;
      const authorName = (firstAuthor.name) ? firstAuthor.name : null;
      const authorUrl = (firstAuthor.username) ? `https://medium.com/@${firstAuthor.username}` : null; // TODO: is this always valid?
      const publicationName = (firstCollection.name) ? firstCollection.name : null; // TODO: is this always valid?
      const publicationUrl = (firstCollection.domain) ? `https://${firstCollection.domain}` : null; // TODO: is this always valid?

      const paragraphs = json.value.content.bodyModel.paragraphs
        .filter((paragraph) => {
          return [1, 3, 7, 9, 13].includes(paragraph.type) && paragraph.text;
          // 3, 13 = headings
          // 1, 3, 7, 9 = paragraph
        });

      const ssmlParagraphs = paragraphs
        .map((paragraph, index) => {
          // const hasTrailingPeriod = paragraph.text.endsWith('.');
          const isHeading = [3, 13].includes(paragraph.type);

          // First heading is the article title
          if (isHeading && index === 0) {
            return `<emphasis level="moderate">${title}, written by: ${authorName}, in publication: ${publicationName}</emphasis><break time="500ms" />`;
          }

          // Give emphasis to headings
          if (isHeading) {
            return `<emphasis level="moderate">${paragraph.text}</emphasis><break time="500ms" />`;
          }

          return `<p>${paragraph.text}</p>`;
        });

      const ssml = `<speak>${ssmlParagraphs.join('')}</speak>`;

      const contentLength = paragraphs.join('').length;

      const synthesizeSpeechCostInUSD = Number((contentLength * SYNTHESIZE_COST_PER_LETTER).toFixed(2));

      return {
        mediumId,
        title,
        subtitle,
        url,
        previewImageId,
        previewImageUrl,
        readingTime,
        wordCount,
        detectedLanguage,
        authorName,
        authorUrl,
        publicationName,
        publicationUrl,
        ssml,
        contentLength,
        synthesizeSpeechCostInUSD
      };
    });
};

const getArticleById = (mediumPostId) => {
  console.log(`Getting Medium Post by ID: ${mediumPostId}...`);
  return getArticle(`https://medium.com/p/${mediumPostId}`);
};

module.exports = {
  getArticle,
  getArticleById,
  getArticleIdFromUrl
};
