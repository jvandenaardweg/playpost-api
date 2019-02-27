import { Request, Response } from 'express';
import { prisma } from '../generated/prisma-client';
import { crawl } from '../extractors/mercury';
import { detectLanguage } from '../utils/detect-language';

const MESSAGE_ARTICLE_URL_REQUIRED = 'URL payload is required.';
const MESSAGE_ARTICLE_USER_NOT_FOUND = 'User not found. You are not logged in, or your account is deleted.';
const MESSAGE_ARTICLE_EXISTS = 'Article already exists.';

// TODO: remove prisma
export const postArticles = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { url } = req.body;

  if (!url) return res.status(400).json({ message: MESSAGE_ARTICLE_URL_REQUIRED });

  const user = await prisma.user({ id: userId });

  if (!user) return res.status(400).json({ message: MESSAGE_ARTICLE_USER_NOT_FOUND });

  const article = await prisma.article({ url });

  if (article) return res.status(400).json({ message: MESSAGE_ARTICLE_EXISTS, article });

  const {
    title,
    excerpt,
    author,
    domain
  } = await crawl(url);

  const language = detectLanguage(excerpt);

  if (language !== 'eng') {
    return res.status(400).json({
      message: `The language of the Article '${language}' is currently not supported. Please only add English articles.`,
    });
  }

  // TODO: Crawl the URL, and get these basic data:
  /*
  const title = null
  const description = null
  const language = null
  const sourceName = null
  const url = null
*/

  /* eslint-disable no-console */
  // console.log('user', user);

  const createdArticle = await prisma.createArticle({
    title,
    description: excerpt,
    authorName: author,
    sourceName: domain,
    url,
    language: 'EN',
    user: {
      connect: {
        id: userId,
      },
    }
  });

  // Create an article with preview data: url, title, description, language and sourceName
  return res.json({ ...createdArticle });
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
