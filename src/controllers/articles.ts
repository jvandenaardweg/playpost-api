import { Request, Response } from 'express';
import nodeFetch from 'node-fetch';
import { getRepository } from 'typeorm';
import joi from 'joi';
import urlParse from 'url-parse';

import { Article, ArticleStatus } from '../database/entities/article';
import { audiofileInputValidationSchema, articleInputValidationSchema } from '../database/validators';
import { PlaylistItem } from '../database/entities/playlist-item';
import { logger } from '../utils';

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

export const fetchFullArticleContents = async (articleUrl: string) => {
  const response: PostplayCrawler.Response = await nodeFetch(`https://crawler.playpost.app/v1/crawler?url=${articleUrl}`).then(response => response.json());

  let ssml: string | null = null;
  let text: string | null = null;
  let html: string | null = null;
  let readingTime: number | null = null;
  let imageUrl: string | null = null;
  let authorName: string | null = null;
  let description: string | null = null;
  let currentUrl: string | null = null;
  let language: string | null = null;
  let title: string | null = null;
  let siteName: string | null = null;

  if (response.ssml) ssml = response.ssml;
  if (response.cleanText) text = response.cleanText;
  if (response.html) html = response.html;
  if (response.readingTimeInSeconds) readingTime = response.readingTimeInSeconds;
  if (response.metadata && response.metadata.image) imageUrl = response.metadata.image;
  if (response.metadata && response.metadata.author) authorName = response.metadata.author;
  if (response.description) description = response.description;
  if (response.currentUrl) currentUrl = response.currentUrl;
  if (response.language) language = response.language;
  if (response.title) title = response.title;
  if (response.siteName) {
    if (currentUrl) {
      siteName = urlParse(currentUrl).hostname;
    } else {
      siteName = response.siteName || response.hostName;
    }
  }

  return  {
    ssml,
    text,
    html,
    readingTime,
    imageUrl,
    authorName,
    description,
    currentUrl,
    language,
    title,
    siteName
  };
};

/**
 * Syncs the article in our database with the data found at the source URL
 */
export const syncArticleWithSource = async (req: Request, res: Response) => {
  const articleRepository = getRepository(Article);
  const { articleId } = req.params;

  const { error } = joi.validate({ articleId }, articleInputValidationSchema.requiredKeys('articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const article = await articleRepository.findOne(articleId);

  if (!article) return res.status(400).json({ message: 'Cannot sync article, because the article is not found.' });

  const articleUrl = (article.canonicalUrl) ? article.canonicalUrl : article.url;

  const { ssml, text, html, readingTime, imageUrl, authorName, description, currentUrl, language, title, siteName } = await fetchFullArticleContents(articleUrl);

  // Set minimum required data for the article to update
  // As without this data, we can do nothing
  // TODO: make re-usable with line 203
  if (!ssml || !text || !html || !language || !title || !currentUrl || !description) {
    return res.status(400).json({ message: 'The information we got from crawling the page was not enough. We cannot update the article.' });
  }

  await articleRepository.update(article.id, {
    title,
    ssml,
    text,
    html,
    readingTime,
    description,
    imageUrl,
    authorName,
    canonicalUrl: currentUrl,
    status: ArticleStatus.FINISHED,
    languageCode: language,
    sourceName: siteName
  });

  const updatedArticle = await articleRepository.findOne(articleId);

  return res.json(updatedArticle);

};

export const updateArticleStatus = async (articleId: string, status: ArticleStatus) => {
  const articleRepository = getRepository(Article);
  const article = await articleRepository.findOne(articleId);

  if (!article) {
    logger.warn(`Cannot update article status of article ID "${articleId}", because the article is not found.`);
    return;
  }

  const updatedArticle = await articleRepository.update(article.id, { status });

  return updatedArticle;
};

/**
 * Takes the articleId and crawls the article URL to fetch the full article contents
 * This is a long running process and is done after the creation of a new article
 */
export const updateArticleToFull = async (articleId: string) => {
  const loggerPrefix = 'Update Article To Full: ';
  const articleRepository = getRepository(Article);

  // Get the article details from the database
  const articleToUpdate = await articleRepository.findOne(articleId);

  if (!articleToUpdate) throw new Error('Could not find article.');

  // Do a request to the crawler, requesting data from the page
  // This might take a few seconds to resolve, as the crawler parses the whole page
  // Takes around 5 seconds for new websites
  // About 2 seconds for already visited websites
  const { ssml, text, html, readingTime, imageUrl, authorName, description, currentUrl, language, title, siteName } = await fetchFullArticleContents(articleToUpdate.url);

  // Set minimum required data for the article to update
  // As without this data, we can do nothing
  // TODO: make re-usable with line 148
  if (!ssml || !text || !html || !language || !title || !currentUrl || !description) {
    throw new Error('The information we got from crawling the page was not enough. We cannot update the article.');
  }

  // Below is some business logic to ensure we only have 1 article per canonicalUrl in the database
  if (articleToUpdate.status !== ArticleStatus.FINISHED) {
    const shouldNotUpdate = await enforceUniqueArticle(articleToUpdate, currentUrl);
    if (shouldNotUpdate) {
      logger.info(loggerPrefix, 'Article already exists. We don\'t update it with data from the crawler.');
      return;
    }
  }

  logger.info(loggerPrefix, 'Updating article with crawler data...');

  const updatedArticle = await articleRepository.update(articleToUpdate.id, {
    title,
    ssml,
    text,
    html,
    readingTime,
    description,
    imageUrl,
    authorName,
    canonicalUrl: currentUrl, // We add a canonicalUrl, this one could be different than "url", but should point to the same article
    status: ArticleStatus.FINISHED,
    languageCode: language,
    sourceName: siteName
  });

  logger.info(loggerPrefix, 'Updated article with crawler data!');

  return updatedArticle;
};

/**
 * Business logic to ensure we only have 1 article per canonicalUrl in the database
 *
 */
const enforceUniqueArticle = async (articleToUpdate: Article, currentUrl: string) => {
  const articleRepository = getRepository(Article);
  const playlistItemRepository = getRepository(PlaylistItem);
  const loggerPrefix = 'Enforce Unique Article: ';

  logger.info(loggerPrefix, 'Starting...');

  // Find any existing article using the currentUrl, which is the "canonicalUrl" we get from the crawler
  const existingArticle = await articleRepository.findOne({
    where: [
      { url: currentUrl },
      { canonicalUrl: currentUrl }
    ]
  });

  // If there's no existing article, don't enforce.
  // The script can just update the "articleToUpdate" to full
  if (!existingArticle) {
    logger.info(loggerPrefix, 'Did not find an existing article. So we don\'t have to enforce anything. Article can be added as new.');
    return false;
  }

  const duplicateArticleId = articleToUpdate.id;
  const existingArticleId = existingArticle.id;

  logger.info(loggerPrefix, `Found an existing article ID "${existingArticleId}" using the URL we got from the crawler: ${currentUrl}`);

  // Don't continue when the existing article and article to update is the same article
  if (existingArticle.id === articleToUpdate.id) {
    logger.info(loggerPrefix, 'The existing article ID is the same as the article to update. Article can be updated.');
    return false;
  }

  logger.info(loggerPrefix, `(enforcing) We replace current playlistItems with the existing article ID and remove this duplicate article ID "${duplicateArticleId}".`);

  // Get all playlist items that use the wrong article ID
  // This is probably just one item, the newly article added to a playlist by a user
  const playlistItems = await playlistItemRepository.find({
    relations: ['user'],
    where: {
      article: {
        id: duplicateArticleId
      }
    }
  });

  logger.info(loggerPrefix, `(enforcing) Found ${playlistItems.length} playlist items with the duplicate article ID "${duplicateArticleId}".`);

  // Remove the duplicate article, so we free up the unique constraints in the playlist
  await articleRepository.remove(articleToUpdate);
  logger.info(loggerPrefix, `(enforcing) Removed duplicate article ID: ${duplicateArticleId}`);

  // Add a new playlistItem using the existing article ID
  for (const playlistItem of playlistItems) {
    const userId = playlistItem.user.id;

    // Check if articleId already exists in playlistId
    const userPlaylistItems = await playlistItemRepository.find({
      relations: ['user'],
      where: {
        user: {
          id: userId
        }
      }
    });

    const userPlaylistItemsArticlesIds = userPlaylistItems.map(playlistItem => playlistItem.article.id);

    if (userPlaylistItemsArticlesIds.includes(existingArticleId)) {
      logger.info(loggerPrefix, `(enforcing) User already has a playlistItem with the article ID ${existingArticleId}. We don't create a new playlistItem.`);
    } else {
      // Create the new playlist item using the existing article ID
      const playlistItemToCreate = await playlistItemRepository.create({
        user: {
          id: userId
        },
        article: {
          id: existingArticleId
        }
      });

      const createdPlaylistItem = await playlistItemRepository.save(playlistItemToCreate);
      logger.info(loggerPrefix, `(enforcing) Created playlistItem "${createdPlaylistItem.id}" with article ID "${existingArticleId}".`);
    }
  }

  return true;
};
