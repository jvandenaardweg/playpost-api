import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Article } from '../database/entities/article';
import { Audiofile } from '../database/entities/audiofile';
import { prisma } from '../generated/prisma-client';
import { crawl } from '../extractors/mercury';
import { detectLanguage } from '../utils/detect-language';
import { SynthesizerOptions } from '../synthesizers';
import nodeFetch from 'node-fetch';

const MESSAGE_ARTICLE_URL_REQUIRED = 'URL payload is required.';
const MESSAGE_ARTICLE_EXISTS = 'Article already exists.';

export const createArticle = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { url } = req.body;
  const articleRepository = getRepository(Article);

  if (!url) return res.status(400).json({ message: MESSAGE_ARTICLE_URL_REQUIRED });

  // TODO: sanitize url

  const article = await articleRepository.findOne({ url });

  if (article) return res.status(400).json({ message: MESSAGE_ARTICLE_EXISTS });

  // TODO: use better crawler, for dev purposes this is now fine

  // Crawl the URL to extract the article data
  const { text, title, meta_description, html } = await nodeFetch(`https://europe-west1-medium-audio.cloudfunctions.net/parse_article?url=${url}`).then(response => response.json());

  // Convert to proper paragraphs
  const ssml = `<p>${text.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
  // const {
  //   title,
  //   excerpt,
  //   author,
  //   domain,
  //   content,
  //   text
  // } = await crawl(url);

  // return console.log(speech);

  const language = detectLanguage(text);

  if (language !== 'eng') {
    return res.status(400).json({
      message: `The language of the Article '${language}' is currently not supported. Please only add English articles.`,
    });
  }

  const sourceName = new URL(url).hostname;

  const articleToCreate = await articleRepository.create({
    url,
    title,
    sourceName,
    ssml,
    text,
    html,
    description: meta_description,
    authorName: null,
    languageCode: 'en',
    user: {
      id: userId
    }
  });

  const createdArticle = await articleRepository.save(articleToCreate);

  // Create an article with preview data: url, title, description, language and sourceName
  return res.json(createdArticle);
};

// TODO: remove prisma
export const getArticlesById = async (req: Request, res: Response) => {
  const { articleId } = req.params;

  const article = await prisma.article({ id: articleId });

  if (!article) {
    return res.status(404).json({
      message: `Could not get the article, bacause article with ID ${articleId} is not found.`,
    });
  }

  // TODO: get auth user id

  // Get the FULL article content, generate an audiofile when it's the first request
  return res.json({
    ...article,
  });
};

// TODO: remove prisma
export const getAudiofileByArticleId = async (req: Request, res: Response) => {
  const { articleId } = req.params;

  const article = await prisma.article({ id: articleId });

  if (!article) {
    return res.status(404).json({
      message: `Could not get an audiofile, because article with ID ${articleId} is not found.`,
    });
  }

  // TODO: get auth user id
  return res.json({ message: `get (default) audiofile for article ID: ${articleId}` });
};

// TODO: remove prisma
export const postAudiofileByArticleId = async (req: Request, res: Response) => {
  const {
    articleId,
  } = req.params;
  const {
    options,
  } = req.body;

  const article = await prisma.article({
    id: articleId,
  });

  if (!article) {
    return res.status(404).json({
      message: `Could not create an audiofile, because article with ID ${articleId} is not found.`,
    });
  }

  // TODO: get auth user id
  return res.json({
    message: `create a new audiofile for article ID: ${articleId}, using options: ${options}`,
  });
};

// TODO: remove prisma
export const postFavoriteByArticleId = async (req: Request, res: Response) => {
  const {
    articleId,
  } = req.params;
  // TODO: get auth user id
  return res.json({
    message: `favorite article ID: ${articleId}, for user: X`,
  });
};

// TODO: remove prisma
export const deleteFavoriteByArticleId = async (req: Request, res: Response) => {
  const {
    articleId,
  } = req.params;
  // TODO: get auth user id
  return res.json({
    message: `delete article ID: ${articleId} from favorites, for user: X`,
  });
};

// TODO: remove prisma
export const postArchiveByArticleId = async (req: Request, res: Response) => {
  const {
    articleId,
  } = req.params;
  // TODO: get auth user id
  return res.json({
    message: `archive article ID: ${articleId}, for user: X`,
  });
};

// TODO: remove prisma
export const deleteArchiveByArticleId = async (req: Request, res: Response) => {
  const {
    articleId,
  } = req.params;
  // TODO: get auth user id
  return res.json({
    message: `delete article ID: ${articleId} from archive, for user: X`,
  });
};

// TODO: remove prisma
export const postPlaylistByArticleId = async (req: Request, res: Response) => {
  const {
    articleId,
  } = req.params;
  // TODO: get auth user id
  return res.json({
    message: `add article ID: ${articleId} to playlist, for user: X`,
  });
};

// TODO: remove prisma
export const deletePlaylistByArticleId = async (req: Request, res: Response) => {
  const {
    articleId,
  } = req.params;
  // TODO: get auth user id
  return res.json({
    message: `delete article ID: ${articleId} from playlist, for user: X`,
  });
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

  const article = await articleRepository.findOne({ id: articleId });

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
  const newlyCreatedAudiofile = await audiofileRepository.findOne({ id: createdAudiofile.id });

  return res.json(newlyCreatedAudiofile);
};
