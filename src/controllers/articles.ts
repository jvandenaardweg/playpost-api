import { Request, Response } from 'express';
import nodeFetch from 'node-fetch';
import { getRepository } from 'typeorm';
import { Article } from '../database/entities/article';
import { Audiofile } from '../database/entities/audiofile';
import { detectLanguage } from '../utils/detect-language';

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
  const ssml = `<speak><p>${text.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p></speak>`;
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
