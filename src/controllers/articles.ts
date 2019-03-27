import { Request, Response } from 'express';
import nodeFetch from 'node-fetch';
import { getRepository, UpdateResult } from 'typeorm';
import { Translate } from '@google-cloud/translate';
import got from 'got';
import joi from 'joi';
import { URL } from 'url';

import { getGoogleCloudCredentials } from '../utils/credentials';

import { Article, ArticleStatus } from '../database/entities/article';
import { Audiofile } from '../database/entities/audiofile';
import { audiofileInputValidationSchema } from '../database/validators';

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

  const { error } = joi.validate({ articleId }, audiofileInputValidationSchema.requiredKeys('articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

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

  const { error } = joi.validate({ articleId }, audiofileInputValidationSchema.requiredKeys('articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

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
  const { error } = joi.validate({ articleId }, audiofileInputValidationSchema.requiredKeys('articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  // TODO: use options body to overwrite default options
  const defaultSynthesizerOptions = {
    synthesizer: 'Google',
    languageCode: 'en-US', // TODO: get from article
    name: 'en-US-Wavenet-D',
    encoding: 'mp3'
  };

  const audiofileRepository = getRepository(Audiofile);
  const articleRepository = getRepository(Article);

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

  const { error } = joi.validate({ articleId }, audiofileInputValidationSchema.requiredKeys('articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  if (userEmail !== 'jordyvandenaardweg@gmail.com') return res.status(403).json({ message: 'You dont have access to this endpoint.' });

  const article = await articleRepository.findOne(articleId);

  if (!article) return res.status(400).json({ message: 'Article not found.' });

  await articleRepository.remove(article);

  return res.json({ message: 'Article is deleted!' });
};

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
  const response: ReadtoCrawler.Response = await nodeFetch(`https://readto-crawler.herokuapp.com/v1/crawler?url=${articleUrl}`).then(response => response.json());

  let ssml = null;
  let text = null;
  let html = null;
  let readingTime = null;
  let imageUrl = null;
  let authorName = null;
  let description = null;
  let currentUrl = null;
  let language = null;

  if (response.ssml) ssml = response.ssml;
  if (response.cleanText) text = response.cleanText;
  if (response.html) html = response.html;
  if (response.readingTimeInSeconds) readingTime = response.readingTimeInSeconds;
  if (response.metadata && response.metadata.image) imageUrl = response.metadata.image;
  if (response.metadata && response.metadata.author) authorName = response.metadata.author;
  if (response.description) description = response.description;
  if (response.currentUrl) currentUrl = response.currentUrl;
  if (response.language) language = response.language;

  return  {
    ssml,
    text,
    html,
    readingTime,
    imageUrl,
    authorName,
    description,
    currentUrl,
    language
  };
};

export const updateArticleStatus = async (articleId: string, status: ArticleStatus) => {
  const articleRepository = getRepository(Article);
  const article = await articleRepository.findOne(articleId);

  const updatedArticle = await articleRepository.update(article.id, { status });

  return updatedArticle;
}
/**
 * Takes the articleId and crawls the article URL to fetch the full article contents
 * This is a long running process and is done after the creation of a new article
 */
export const updateArticleToFull = async (articleId: string): Promise<UpdateResult> => {
  const articleRepository = getRepository(Article);
  const article = await articleRepository.findOne(articleId);

  const { ssml, text, html, readingTime, imageUrl, authorName, description, currentUrl, language } = await fetchFullArticleContents(article.url);

  const updatedArticle = await articleRepository.update(article.id, {
    ssml,
    text,
    html,
    readingTime,
    description,
    imageUrl,
    authorName,
    canonicalUrl: currentUrl, // We add a canonicalUrl, this one could be different than "url", but should point to the same article
    status: ArticleStatus.FINISHED,
    languageCode: language
  });

  return updatedArticle;
};
