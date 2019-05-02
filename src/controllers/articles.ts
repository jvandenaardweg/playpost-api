import { Request, Response } from 'express';
import nodeFetch from 'node-fetch';
import { getRepository, UpdateResult, getManager } from 'typeorm';
import joi from 'joi';

import { Article, ArticleStatus } from '../database/entities/article';
import { audiofileInputValidationSchema } from '../database/validators';
import { PlaylistItem } from '../database/entities/playlist-item';

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

  let ssml = null;
  let text = null;
  let html = null;
  let readingTime = null;
  let imageUrl = null;
  let authorName = null;
  let description = null;
  let currentUrl = null;
  let language = null;
  let title = null;
  let siteName = null;

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
    siteName = response.siteName;
  } else {
    siteName = response.hostName;
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

export const updateArticleStatus = async (articleId: string, status: ArticleStatus) => {
  const articleRepository = getRepository(Article);
  const article = await articleRepository.findOne(articleId);

  if (!article) throw new Error('Cannot update article status, because the article is not found.');

  const updatedArticle = await articleRepository.update(article.id, { status });

  return updatedArticle;
};

/**
 * Takes the articleId and crawls the article URL to fetch the full article contents
 * This is a long running process and is done after the creation of a new article
 */
export const updateArticleToFull = async (articleId: string): Promise<UpdateResult> => {
  const articleRepository = getRepository(Article);

  // Get the article details from the database
  const articleToUpdate = await articleRepository.findOne(articleId);

  // Do a request to the crawler, requesting data from the page
  // This might take a few seconds to resolve, as the crawler parses the whole page
  // Takes around 5 seconds for new websites
  // About 2 seconds for already visited websites
  const { ssml, text, html, readingTime, imageUrl, authorName, description, currentUrl, language, title, siteName } = await fetchFullArticleContents(articleToUpdate.url);

  // Set minimum required data for the article to update
  // As without this data, we can do nothing
  if (!ssml || !text || !html || !language || !title || !currentUrl || !description) {
    throw new Error('The information we got from crawling the page was not enough. We cannot update the article.');
  }

  // Below is some business logic to ensure we only have 1 article per canonicalUrl in the database
  if (articleToUpdate.status !== ArticleStatus.FINISHED) {
    const isEnforced = await enforceUniqueArticle(articleToUpdate, currentUrl);
    if (isEnforced) {
      console.log('Update Article To Full: Article already exists. We don\'t update it with data from the crawler.');
      return;
    }
  }

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

  return updatedArticle;
};

/**
 * Business logic to ensure we only have 1 article per canonicalUrl in the database
 *
 */
const enforceUniqueArticle = async (articleToUpdate: Article, currentUrl: string) => {
  const articleRepository = getRepository(Article);
  const playlistItemRepository = getRepository(PlaylistItem);

  // Find any existing article using the currentUrl, which is the "canonicalUrl" we get from the crawler
  const existingArticle = await articleRepository.findOne({
    where: [
      { url: currentUrl },
      { canonicalUrl: currentUrl }
    ]
  });

  // If the article already exists, don't update the newly article, but use the existingArticle.id and replace the current playlist item's with that ID
  if (existingArticle && existingArticle.id !== articleToUpdate.id && existingArticle.status === ArticleStatus.FINISHED) {
    const duplicateArticleId = articleToUpdate.id;
    const existingArticleId = existingArticle.id;

    console.log(`Enforce Unique Article: Found an existing article ID "${existingArticleId}" using the URL we got from the crawler: ${currentUrl}`);
    console.log(`Enforce Unique Article: We replace current playlistItems with the existing article ID and remove this duplicate article ID "${duplicateArticleId}".`);

    // Get all playlist items that use the wrong article ID
    // This is probably just one item, the newly article added to a playlist by a user
    const playlistItems = await playlistItemRepository.find({ relations: ['user', 'playlist'], where: { article: { id: duplicateArticleId } } });

    console.log(`Enforce Unique Article: Found ${playlistItems.length} playlist items with the duplicate article ID "${duplicateArticleId}".`);

    // Remove the duplicate article, so we free up the unique constraints in the playlist
    await articleRepository.remove(articleToUpdate);
    console.log(`Enforce Unique Article: Removed duplicate article ID: ${duplicateArticleId}`);

    // Add a new playlistItem using the existing article ID
    for (const playlistItem of playlistItems) {
      const userId = playlistItem.user.id;
      const playlistId = playlistItem.playlist.id;

      // Check if articleId already exists in playlistId
      const userPlaylistItems = await playlistItemRepository.find({ user: { id: userId }, playlist: { id: playlistId } });
      const userPlaylistItemsArticlesIds = userPlaylistItems.map(playlistItem => playlistItem.article.id);

      if (userPlaylistItemsArticlesIds.includes(existingArticleId)) {
        console.log(`Enforce Unique Article: User already has a playlistItem with the article ID ${existingArticleId}. We don't create a new playlistItem.`);
      } else {
        // Create the new playlist item using the existing article ID
        const playlistItemToCreate = await playlistItemRepository.create({
          playlist: {
            id: playlistId
          },
          user: {
            id: userId
          },
          article: {
            id: existingArticleId
          }
        });

        const createdPlaylistItem = await playlistItemRepository.save(playlistItemToCreate);
        console.log(`Enforce Unique Article: Created playlistItem "${createdPlaylistItem.id}" with article ID "${existingArticleId}".`);
      }
    }
  } else {
    return false;
  }
};
