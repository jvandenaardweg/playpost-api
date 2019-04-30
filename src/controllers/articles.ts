import { Request, Response } from 'express';
import nodeFetch from 'node-fetch';
import { getRepository, UpdateResult } from 'typeorm';
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

  const updatedArticle = await articleRepository.update(article.id, { status });

  return updatedArticle;
};
/**
 * Takes the articleId and crawls the article URL to fetch the full article contents
 * This is a long running process and is done after the creation of a new article
 */
export const updateArticleToFull = async (articleId: string): Promise<UpdateResult> => {
  const articleRepository = getRepository(Article);
  const playlistItemRepository = getRepository(PlaylistItem);

  const article = await articleRepository.findOne(articleId);

  const { ssml, text, html, readingTime, imageUrl, authorName, description, currentUrl, language, title, siteName } = await fetchFullArticleContents(article.url);

  // Set minimum required data for the article to update
  // As without this data, we can do nothing
  if (!ssml || !text || !html || !language || !title) {
    throw new Error('The information we got from crawling the page was not enough. We cannot update the article.');
  }

  // Below is some business logic to ensure we only have 1 article per canonicalUrl in the database
  // We replace playlistItem's with the (wrong) article
  // We remove the duplicate article
  const existingArticle = await articleRepository.findOne({
    where: [
      { url: currentUrl },
      { canonicalUrl: currentUrl }
    ]
  });

  // If the article already exists, don't update the newly article, but use the existingArticle.id and replace the current playlist item's with that ID
  if (existingArticle) {
    console.log(`Found an existing article ID "${existingArticle.id}" using the URL we got from the crawler: ${currentUrl}`);
    console.log(`We replace current playlistItems with the existing article ID and remove this duplicate article ID "${article.id}".`);

    // Get all playlist items that use the wrong article ID
    const playlistItems = await playlistItemRepository.find({ article: { id: article.id } });

    // Update each playlist item with the correct article ID
    for (const playlistItem of playlistItems) {
      console.log(`Replace playlistItem "${playlistItem.id}" with article ID "${existingArticle.id}".`);
      await playlistItemRepository.update(playlistItem.id, {
        article: {
          id: existingArticle.id
        }
      });
    }

    // Remove the duplicate article
    await articleRepository.remove(article);

    // We are done
    return;
  }

  const updatedArticle = await articleRepository.update(article.id, {
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
