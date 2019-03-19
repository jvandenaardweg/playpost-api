import { Request, Response } from 'express';
import nodeFetch from 'node-fetch';
import { getRepository, UpdateResult } from 'typeorm';
import { Translate } from '@google-cloud/translate';
import got from 'got';
import readingTime from 'reading-time';

import { trimTextAtWords } from '../utils/string';

import { getGoogleCloudCredentials } from '../utils/credentials';

import { Article } from '../database/entities/article';
import { Audiofile } from '../database/entities/audiofile';

const metascraper = require('metascraper')([
  require('metascraper-author')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-publisher')(),
  require('metascraper-title')(),
  require('metascraper-url')(),
  require('metascraper-readability')()
]);

// Creates a client
const translate = new Translate(getGoogleCloudCredentials());

const MESSAGE_ARTICLE_URL_REQUIRED = 'URL payload is required.';
const MESSAGE_ARTICLE_EXISTS = 'Article already exists.';

// export const createArticle = async (req: Request, res: Response) => {
//   const userId = req.user.id;
//   const { url } = req.body;
//   const articleRepository = getRepository(Article);

//   if (!url) return res.status(400).json({ message: MESSAGE_ARTICLE_URL_REQUIRED });

//   // TODO: sanitize url

//   const article = await articleRepository.find({ url, canonicalUrl: url });

//   if (article) return res.status(400).json({ message: MESSAGE_ARTICLE_EXISTS });

//   // TODO: use better crawler, for dev purposes this is now fine

//   // Crawl the URL to extract the article data
//   const articleDetails = await fetchArticleDetails(url);

//   if (articleDetails.language !== 'eng') {
//     return res.status(400).json({
//       message: `The language of the Article '${articleDetails.language}' is currently not supported. Please only add English articles.`,
//     });
//   }

//   const articleToCreate = await articleRepository.create({
//     url: articleDetails.url,
//     title: articleDetails.title,
//     sourceName: articleDetails.sourceName,
//     ssml: articleDetails.ssml,
//     text: articleDetails.text,
//     html: articleDetails.html,
//     description: articleDetails.description,
//     authorName: articleDetails.authorName,
//     languageCode: 'en', // TODO: make dynamic
//     user: {
//       id: userId
//     }
//   });

//   const createdArticle = await articleRepository.save(articleToCreate);

//   // Create an article with preview data: url, title, description, language and sourceName
//   return res.json(createdArticle);
// };

export const findArticleById = async (req: Request, res: Response) => {
  const { articleId } = req.params;
  const articleRepository = getRepository(Article);

  const article = await articleRepository.findOne(articleId, { relations: ['audiofiles'] });

  if (!article) {
    return res.status(400).json({
      message: `Could not get the article, bacause article with ID ${articleId} is not found.`,
    });
  }

  return res.json(article);
};

export const findAudiofileByArticleId = async (req: Request, res: Response) => {
  const { articleId } = req.params;
  const articleRepository = getRepository(Article);

  const article = await articleRepository.findOne(articleId, { relations: ['audiofiles'] });

  if (!article) {
    return res.status(400).json({
      message: `Could not get the article, bacause article with ID ${articleId} is not found.`,
    });
  }

  return res.json(article.audiofiles);
};

export const createAudiofileByArticleId = async (req: Request, res: Response) => {
  const { articleId } = req.params;
  // const options: SynthesizerOptions = req.body.options;

  // TODO: use options body to overwrite default options
  const defaultSynthesizerOptions = {
    synthesizer: 'Google',
    languageCode: 'en-US', // TODO: get from article
    name: 'en-US-Wavenet-D',
    encoding: 'mp3'
  };

  const audiofileRepository = getRepository(Audiofile);
  const articleRepository = getRepository(Article);

  if (!articleId) return res.status(400).json({ message: 'The article ID is required.' });

  const article = await articleRepository.findOne(articleId);

  if (!article) return res.status(400).json({ message: 'Article does not exist, we cannot create an audiofile for that. First create an article, then create an audiofile.' });

  // const audiofile = await audiofileRepository.findOne({ article: { id: articleId } });

  // If we already have an audiofile, just return it
  // if (audiofile) return res.json(audiofile);

  // Crawl article, get SSML, generate speech to text, upload to bucket, return bucket meta data, connect article to audiofile

  const audiofileToCreate = {
    article, // The article object we found by articleId
    url: null,
    bucket: null,
    name: null,
    length: 0,
    languageCode: defaultSynthesizerOptions.languageCode,
    encoding: defaultSynthesizerOptions.encoding,
    voice: defaultSynthesizerOptions.name,
    synthesizer: defaultSynthesizerOptions.synthesizer
  };

  // Validate the input
  // const validationResult = await validateInput(Audiofile, audiofileToCreate);
  // if (validationResult.errors.length) return res.status(400).json(validationResult);

  // Create the audiofile, so we can use the audiofileId to create a file in the storage
  const newAudiofileToSave = await audiofileRepository.create(audiofileToCreate);
  const createdAudiofile = await audiofileRepository.save(newAudiofileToSave);

  // Upon creation in the database, we synthesize the audiofile

  // Get the created audiofile and return it
  const newlyCreatedAudiofile = await audiofileRepository.findOne(createdAudiofile.id);

  return res.json(newlyCreatedAudiofile);
};

export const deleteById = async (req: Request, res: Response) => {
  const userEmail = req.user.email;
  const { articleId } = req.params;
  const articleRepository = getRepository(Article);

  if (userEmail !== 'jordyvandenaardweg@gmail.com') return res.status(403).json({ message: 'You dont have access to this endpoint.' });

  const article = await articleRepository.findOne(articleId);

  if (!article) return res.status(400).json({ message: 'Article not found.' });

  await articleRepository.remove(article);

  return res.json({ message: 'Article is deleted!' });
};

export const testCrawler = async (req: Request, res: Response) => {
  const { url } = req.query;

  const articleDetails = await fastFetchArticleDetails(url);
  console.log(articleDetails);
  return res.json(articleDetails);
}

/**
 * Method to quickly extract basic data from the article
 * Like: title, description, image, author and language
 * This data can be extracted without parsing the whole page
 */
export const fastFetchArticleDetails = async (articleUrl: string) => {
  const response = await got(articleUrl, {
    followRedirect: true,
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    }
  });

  const metadata = await metascraper({ url: response.url, html: response.body });

  const hostname = new URL(articleUrl).hostname;

  // Detect language using Google Translate API
  const textToDetectLanguage = (metadata.description.length > metadata.title.length) ? metadata.description : metadata.title;
  const detections = await translate.detect(textToDetectLanguage);
  const language = detections[0].language;

  return {
    hostname,
    language,
    ...metadata
  };
};

export const fetchFullArticleContents = async (articleUrl: string) => {
  const response: CrawlerResponse = await nodeFetch(
    `https://europe-west1-medium-audio.cloudfunctions.net/parse_article?url=${articleUrl}`,)
    .then(response => response.json());

  if (response && response.message) throw new Error(response.message);

  // Convert to proper paragraphs
  const preSsml = `<speak><p>${response.text.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p></speak>`;

  // Make sure each paragraph ends with a dot
  const ssmlWithoutParagraphEndings = preSsml.replace(/.<\/p>/g, '</p>'); // First remove the dots, so we don't end up with double dots ".."
  const ssmlWithParagraphEndsings = ssmlWithoutParagraphEndings.replace(/<\/p>/g, '.</p>'); // Then add a dot before every </p>, like so: ".</p>"
  const ssml = ssmlWithParagraphEndsings;

  return  {
    ssml,
    text: response.text,
    html: response.html
  };
};

/**
 * Takes the articleId and crawls the article URL to fetch the full article contents
 * This is a long running process and is done after the creation of a new article
 */
export const updateArticleToFull = async (articleId: string): Promise<UpdateResult> => {
  let readingTimeInSeconds = null;
  const articleRepository = getRepository(Article);
  const article = await articleRepository.findOne(articleId);

  const { ssml, text, html } = await fetchFullArticleContents(article.url);

  let description = article.description;

  if (text) {
    const { minutes } = readingTime(text);
    readingTimeInSeconds = (minutes) ? minutes * 60 : null;

    // Generate a description out of the text,
    // If the text we got from the full article is bigger then the description we have
    // Then, trim the words and use the new description taken from the "text"
    const maxLength = 200; // Max. 200 characters
    if (text.length > description.length) {
      description = trimTextAtWords(text, maxLength);
    }
  }

  const updatedArticle = await articleRepository.update(article.id, {
    ssml,
    text,
    html,
    description,
    readingTime: readingTimeInSeconds
  });

  return updatedArticle;
};

interface CrawlerResponse {
  message?: string;
  title: string;
  url: string;
  text: string;
  authors: string;
  article_html: string;
  html: string;
  top_image: string;
  publish_date: string;
  meta_lang: String;
  meta_description: string;
  meta_data: string;
  canonical_link: string;
  speech_html: string;
}
