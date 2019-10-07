import { Request, Response } from 'express';
import joi from 'joi';
import nodeFetch from 'node-fetch';
import { getRepository } from 'typeorm';
import urlParse from 'url-parse';

import * as cache from '../cache';
import { CACHE_FOREVER } from '../constants/cache';
import { Article, ArticleStatus } from '../database/entities/article';
import { Language } from '../database/entities/language';
import { PlaylistItem } from '../database/entities/playlist-item';
import { articleInputValidationSchema, audiofileInputValidationSchema } from '../database/validators';
import * as storage from '../storage/google-cloud';
import { logger } from '../utils';

export const findArticleById = async (req: Request, res: Response) => {
  const { articleId } = req.params;
  const articleRepository = getRepository(Article);

  const { error } = joi.validate(req.params, audiofileInputValidationSchema.requiredKeys('articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const article = await articleRepository.findOne(articleId, {
    relations: ['audiofiles'],
    cache: {
      id: cache.getCacheKey('Article', articleId),
      milliseconds: CACHE_FOREVER // Delete cache when we update an article or when
    }
  });

  if (!article) {
    return res.status(400).json({
      message: `Could not get the article, bacause article with ID ${articleId} is not found.`
    });
  }

  return res.json(article);
};

export const findAudiofileByArticleId = async (req: Request, res: Response) => {
  const { articleId } = req.params;
  const articleRepository = getRepository(Article);

  const { error } = joi.validate(req.params, audiofileInputValidationSchema.requiredKeys('articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const article = await articleRepository.findOne(articleId, {
    relations: ['audiofiles']
  });

  if (!article) {
    return res.status(400).json({
      message: `Could not get the article, bacause article with ID ${articleId} is not found.`
    });
  }

  return res.json(article.audiofiles);
};

export const deleteById = async (req: Request, res: Response) => {
  const userEmail = req.user.email;
  const { articleId } = req.params;
  const articleRepository = getRepository(Article);

  const { error } = joi.validate(req.params, audiofileInputValidationSchema.requiredKeys('articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  if (userEmail !== 'jordyvandenaardweg@gmail.com') {
    return res.status(403).json({ message: 'You dont have access to this endpoint.' });
  }

  const article = await articleRepository.findOne(articleId);

  if (!article) { return res.status(400).json({ message: 'Article not found.' }); }

  await articleRepository.remove(article);

  await storage.deleteAllArticleAudiofiles(articleId);

  return res.json({ message: 'Article is deleted!' });
};

export const fetchFullArticleContents = async (articleUrl: string, documentHtml?: string) => {
  const loggerPrefix = 'Fetch Full Article Contents:';

  if (!articleUrl) {
    const errorMessage = 'articleUrl is required to fetch the full article contents.';
    logger.error(loggerPrefix, errorMessage, articleUrl);
    throw new Error(errorMessage);
  }

  try {
    let result: PostplayCrawler.IResponse;

    // If we have a html string, we use a different endpoint
    // We don't need to crawl the page, we can just try to extract data from the HTML string we got
    if (documentHtml) {
      const body = {
        documentHtml,
        url: articleUrl
      };

      logger.info(loggerPrefix, 'Get article data using given documentHtml...');

      result = await nodeFetch(`${process.env.CRAWLER_BASE_URL}/extractor`, {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'post',
        body: JSON.stringify(body)
      }).then(response => response.json());

      logger.info(loggerPrefix, 'Successfully got article data using given documentHtml!', result);
    } else {
      logger.info(loggerPrefix, 'Get article data using given articleUrl...', articleUrl);
      result = await nodeFetch(`${process.env.CRAWLER_BASE_URL}/browser?url=${articleUrl}`).then(response => response.json());
      logger.info(loggerPrefix, 'Successfully got article data using given articleUrl!', articleUrl);
    }

    if (!result) {
      throw new Error('Dit not receive a result from the crawler.');
    }

    let ssml: string | undefined;
    let html: string | undefined;
    let url: string = '';
    let readingTime: number | undefined;
    let imageUrl: string | undefined;
    let authorName: string | undefined;
    let description: string | undefined;
    let canonicalUrl: string | undefined;
    let language: string | undefined;
    let title: string | undefined;
    let siteName: string | undefined;
    let isCompatible: boolean | undefined;
    let compatibilityMessage: string | undefined;

    if (result.ssml) { ssml = result.ssml; }
    if (result.articleHTML) { html = result.articleHTML; }
    if (result.readingTimeInSeconds) {
      readingTime = result.readingTimeInSeconds;
    }
    if (result.metadata && result.metadata.image) {
      imageUrl = result.metadata.image;
    }
    if (result.metadata && result.metadata.author) {
      authorName = result.metadata.author;
    }
    if (result.description) { description = result.description; }

    if (result.canonicalUrl) {
      canonicalUrl = result.canonicalUrl;
    } else if (result.metadata && result.metadata.url) {
      canonicalUrl = result.metadata.url;
    }

    if (result.language) { language = result.language; }
    if (result.title) { title = result.title; }
    if (result.url) { url = result.url; }

    if (result.siteName) {
      siteName = result.siteName;
    } else if (result.hostName) {
      siteName = result.hostName;
    } else if (result.canonicalUrl) {
      siteName = urlParse(result.canonicalUrl).hostname;
    } else if (result.url) {
      siteName = urlParse(result.url).hostname;
    }

    if (result.validationResult) {
      isCompatible = result.validationResult.isValid;

      // Only add the compatibility message to our database if it is not compatible
      if (!isCompatible) {
        compatibilityMessage = result.validationResult.message;
      }

    }

    return {
      ssml,
      html,
      readingTime,
      imageUrl,
      authorName,
      description,
      url,
      canonicalUrl,
      language,
      title,
      siteName,
      isCompatible,
      compatibilityMessage
    };
  } catch (err) {
    const message = err && err.message ? err.message : 'Unknown error';
    logger.error(loggerPrefix, message);
    throw err;
  }
};

/**
 * Syncs the article in our database with the data found at the source URL
 */
export const syncArticleWithSource = async (req: Request, res: Response) => {
  const loggerPrefix = 'Sync Article With Source:';

  const articleRepository = getRepository(Article);
  const languageRepository = getRepository(Language);
  const { articleId } = req.params;

  const { error } = joi.validate(req.params, articleInputValidationSchema.requiredKeys('articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const article = await articleRepository.findOne(articleId);

  if (!article || !article.id) {
    const errorMessage = 'Cannot sync article, because the article is not found.';
    logger.error(loggerPrefix, errorMessage);
    return res.status(400).json({ message: errorMessage });
  }

  if (!article.url) {
    const errorMessage = 'Cannot sync article, because it has no URLs.';
    logger.error(loggerPrefix, errorMessage);
    return res.status(400).json({ message: errorMessage });
  }

  const { ssml, html, readingTime, imageUrl, authorName, description, canonicalUrl, language, title, siteName, url, isCompatible, compatibilityMessage } = await fetchFullArticleContents(article.url);

  logger.info(loggerPrefix, 'Got data from crawler.');

  const currentUrl = canonicalUrl || url;

  // Set minimum required data for the article to update
  // As without this data, we can do nothing
  // TODO: make re-usable with line 203
  if (!ssml) {
    return res.status(400).json({
      message: 'The information we got from crawling the page was not enough. Missing ssml.'
    });
  }
  if (!html) {
    return res.status(400).json({
      message: 'The information we got from crawling the page was not enough. Missing html.'
    });
  }
  if (!language) {
    return res.status(400).json({
      message: 'The information we got from crawling the page was not enough. Missing language.'
    });
  }
  if (!title) {
    return res.status(400).json({
      message: 'The information we got from crawling the page was not enough. Missing title.'
    });
  }
  if (!description) {
    return res.status(400).json({
      message: 'The information we got from crawling the page was not enough. Missing description.'
    });
  }

  logger.info(loggerPrefix, 'Getting the language from our database...');

  // Find the language in our database, so can can connect it to the article
  const foundLanguage = await languageRepository.findOne({
    code: language
  });

  if (!foundLanguage) {
    logger.warn(loggerPrefix, 'No language found for this article using language from crawler:', language);
  } else {
    logger.info(loggerPrefix, 'Language found:', foundLanguage.code);
  }

  logger.info(loggerPrefix, 'Updating article ID:', article.id);

  await articleRepository.update(article.id, {
    title,
    ssml,
    html,
    readingTime,
    description,
    imageUrl,
    authorName,
    canonicalUrl: currentUrl,
    status: ArticleStatus.FINISHED,
    language: foundLanguage,
    sourceName: siteName,
    isCompatible,
    compatibilityMessage
  });

  const updatedArticle = await articleRepository.findOne(articleId);

  return res.json(updatedArticle);
};

export const updateArticleStatus = async (articleId: string, status: ArticleStatus) => {
  const articleRepository = getRepository(Article);
  const article = await articleRepository.findOne(articleId);

  if (!article || !article.id) {
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
  const languageRepository = getRepository(Language);

  // Get the article details from the database
  const articleToUpdate = await articleRepository.findOne(articleId, { select: ['id', 'url', 'status', 'documentHtml'] });

  if (!articleToUpdate) {
    const errorMessage = 'Could not find article.';
    logger.error(loggerPrefix, errorMessage);
    throw new Error(errorMessage);
  }

  logger.info(loggerPrefix, 'Fetching full article contents...');

  // Do a request to the crawler, requesting data from the page
  // This might take a few seconds to resolve, as the crawler parses the whole page
  // Takes around 5 seconds for new websites
  // About 2 seconds for already visited websites
  const {
    ssml,
    html,
    readingTime,
    imageUrl,
    authorName,
    description,
    canonicalUrl,
    language,
    title,
    siteName,
    url,
    isCompatible,
    compatibilityMessage
  } = await fetchFullArticleContents(articleToUpdate.url, articleToUpdate.documentHtml);

  logger.info(loggerPrefix, 'Successfully fetched full article contents!');

  const currentUrl = canonicalUrl || url;

  // Set minimum required data for the article to update
  // As without this data, we can do nothing
  // TODO: make re-usable with line 203
  if (!ssml) {
    throw new Error('The information we got from crawling the page was not enough. Missing ssml.');
  }
  if (!html) {
    throw new Error('The information we got from crawling the page was not enough. Missing html.');
  }
  if (!language) {
    throw new Error('The information we got from crawling the page was not enough. Missing language.');
  }
  if (!title) {
    throw new Error('The information we got from crawling the page was not enough. Missing title.');
  }
  if (!description) {
    throw new Error('The information we got from crawling the page was not enough. Missing description.');
  }

  // Below is some business logic to ensure we only have 1 article per canonicalUrl in the database
  if (articleToUpdate.status !== ArticleStatus.FINISHED) {
    const shouldNotUpdate = await enforceUniqueArticle(articleToUpdate, currentUrl);
    if (shouldNotUpdate) {
      logger.info(loggerPrefix, "Article already exists. We don't update it with data from the crawler.");
      return;
    }
  }

  logger.info(loggerPrefix, 'Updating article with crawler data...');

  // Find the language in our database, so can can connect it to the article
  const foundLanguage = await languageRepository.findOne({
    code: language
  });

  if (!foundLanguage) {
    logger.warn(loggerPrefix, 'No language found for this article using language from crawler:', language);
  } else {
    logger.info(loggerPrefix, 'Language found:', foundLanguage.code);
  }

  logger.info(loggerPrefix, 'Updating article ID:', articleToUpdate.id);

  const updatedArticle = await articleRepository.update(articleToUpdate.id, {
    title,
    ssml,
    html,
    readingTime,
    description,
    imageUrl,
    authorName,
    canonicalUrl: currentUrl, // We add a canonicalUrl, this one could be different than "url", but should point to the same article
    status: ArticleStatus.FINISHED,
    language: foundLanguage,
    sourceName: siteName,
    documentHtml: undefined, // Remove the documentHtml, we don't need it anymore
    isCompatible,
    compatibilityMessage
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
    where: [{ url: currentUrl }, { canonicalUrl: currentUrl }]
  });

  // If there's no existing article, don't enforce.
  // The script can just update the "articleToUpdate" to full
  if (!existingArticle) {
    logger.info(loggerPrefix, "Did not find an existing article. So we don't have to enforce anything. Article can be added as new.");
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

    const userPlaylistItemsArticlesIds = userPlaylistItems.map(userPlaylistItem => userPlaylistItem.article.id);

    if (userPlaylistItemsArticlesIds.includes(existingArticleId)) {
      logger.info(loggerPrefix, `(enforcing) User already has a playlistItem with the article ID ${existingArticleId}. We don't create a new playlistItem.`);
    } else {
      // Create the new playlist item using the existing article ID
      const playlistItemToCreate = playlistItemRepository.create({
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
