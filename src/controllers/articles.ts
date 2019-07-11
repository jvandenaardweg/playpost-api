import { Request, Response } from 'express';
import nodeFetch from 'node-fetch';
import { getRepository } from 'typeorm';
import joi from 'joi';
import urlParse from 'url-parse';

import * as storage from '../storage/google-cloud';
import { Article, ArticleStatus } from '../database/entities/article';
import { audiofileInputValidationSchema, articleInputValidationSchema } from '../database/validators';
import { PlaylistItem } from '../database/entities/playlist-item';
import { logger } from '../utils';
import { Language } from '../database/entities/language';

export const findArticleById = async (req: Request, res: Response) => {
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

  if (!article) return res.status(400).json({ message: 'Article not found.' });

  await articleRepository.remove(article);

  await storage.deleteAllArticleAudiofiles(articleId);

  return res.json({ message: 'Article is deleted!' });
};

export const fetchFullArticleContents = async (articleUrl: string, documentHtml?: string) => {
  const loggerPrefix = 'Fetch Full Article Contents:';

  if (!articleUrl) {
    const errorMessage = 'articleUrl is required to fetch the full article contents.';
    logger.error(loggerPrefix, errorMessage, articleUrl)
    throw new Error(errorMessage);
  }

  try {
    let response: PostplayCrawler.Response;

    // If we have a html string, we use a different endpoint
    // We don't need to crawl the page, we can just try to extract data from the HTML string we got
    if (documentHtml) {
      const body = {
        documentHtml,
        url: articleUrl
      };

      logger.info(loggerPrefix, 'Get article data using given documentHtml...');

      response = await nodeFetch(`${process.env.CRAWLER_EXTRACTOR_URL}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'post',
        body: JSON.stringify(body)
      }).then(response => response.json());

      logger.info(loggerPrefix, 'Successfully got article data using given documentHtml!', response);
    } else {
      logger.info(loggerPrefix, 'Get article data using given articleUrl...', articleUrl);
      response = await nodeFetch(`${process.env.CRAWLER_URL}?url=${articleUrl}`).then(response => response.json());
      logger.info(loggerPrefix, 'Successfully got article data using given articleUrl!', articleUrl);
    }

    if (!response) {
      throw new Error('Dit not receive a response from the crawler.');
    }

    let ssml: string | undefined = undefined;
    let text: string | undefined = undefined;
    let html: string | undefined = undefined;
    let url: string = '';
    let readingTime: number | undefined = undefined;
    let imageUrl: string | undefined = undefined;
    let authorName: string | undefined = undefined;
    let description: string | undefined = undefined;
    let canonicalUrl: string | undefined = undefined;
    let language: string | undefined = undefined;
    let title: string | undefined = undefined;
    let siteName: string | undefined = undefined;

    if (response.ssml) ssml = response.ssml;
    if (response.articleText) text = response.articleText;
    if (response.articleHTML) html = response.articleHTML;
    if (response.readingTimeInSeconds) {
      readingTime = response.readingTimeInSeconds;
    }
    if (response.metadata && response.metadata.image) {
      imageUrl = response.metadata.image;
    }
    if (response.metadata && response.metadata.author) {
      authorName = response.metadata.author;
    }
    if (response.description) description = response.description;

    if (response.canonicalUrl) {
      canonicalUrl = response.canonicalUrl;
    } else if (response.metadata && response.metadata.url) {
      canonicalUrl = response.metadata.url;
    }

    if (response.language) language = response.language;
    if (response.title) title = response.title;
    if (response.url) url = response.url;

    if (response.siteName) {
      siteName = response.siteName;
    } else if (response.hostName) {
      siteName = response.hostName;
    } else if (response.canonicalUrl) {
      siteName = urlParse(response.canonicalUrl).hostname;
    } else if (response.url) {
      siteName = urlParse(response.url).hostname;
    }

    return {
      ssml,
      text,
      html,
      readingTime,
      imageUrl,
      authorName,
      description,
      url,
      canonicalUrl,
      language,
      title,
      siteName
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

  const articleUrl = article.canonicalUrl ? article.canonicalUrl : article.url;

  if (!articleUrl) {
    const errorMessage = 'Cannot sync article, because it has no URLs.';
    logger.error(loggerPrefix, errorMessage);
    return res.status(400).json({ message: errorMessage });
  }

  const { ssml, text, html, readingTime, imageUrl, authorName, description, canonicalUrl, language, title, siteName, url } = await fetchFullArticleContents(articleUrl);

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
  if (!text) {
    return res.status(400).json({
      message: 'The information we got from crawling the page was not enough. Missing text.'
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
    text,
    html,
    readingTime,
    description,
    imageUrl,
    authorName,
    canonicalUrl: currentUrl,
    status: ArticleStatus.FINISHED,
    language: foundLanguage,
    sourceName: siteName
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
    text,
    html,
    readingTime,
    imageUrl,
    authorName,
    description,
    canonicalUrl,
    language,
    title,
    siteName,
    url
  } = await fetchFullArticleContents(articleToUpdate.url, articleToUpdate.documentHtml);

  logger.info(loggerPrefix, 'Successfully fetched full article contents!');

  const currentUrl = canonicalUrl || url;

  // Set minimum required data for the article to update
  // As without this data, we can do nothing
  // TODO: make re-usable with line 203
  if (!ssml) {
    throw new Error('The information we got from crawling the page was not enough. Missing ssml.');
  }
  if (!text) {
    throw new Error('The information we got from crawling the page was not enough. Missing text.');
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
    text,
    html,
    readingTime,
    description,
    imageUrl,
    authorName,
    canonicalUrl: currentUrl, // We add a canonicalUrl, this one could be different than "url", but should point to the same article
    status: ArticleStatus.FINISHED,
    language: foundLanguage,
    sourceName: siteName,
    documentHtml: undefined // Remove the documentHtml, we don't need it anymore
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
