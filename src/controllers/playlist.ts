import joi from '@hapi/joi';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';
import { DeepPartial, getManager, getRepository, Not } from 'typeorm';

import { Article, ArticleStatus } from '../database/entities/article';
import { PlaylistItem } from '../database/entities/playlist-item';
import { logger } from '../utils';
import { getNormalizedUrl } from '../utils/string';

const MESSAGE_PLAYLISTS_NO_ACCESS_PLAYLIST = 'You have no access to this playlist because it is not yours.';
const MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND = 'The given article does not exist in your playlist.';
const MESSAGE_PLAYLISTS_ARTICLE_EXISTS_IN_PLAYLIST = 'You already have this article in your playlist!';
const MESSAGE_PLAYLISTS_UPDATE_ORDER_EQUAL = 'The given order is the same. We do not update the order.';
const MESSAGE_PLAYLISTS_UPDATE_ORDER_SUCCESS = 'Successfully updated the order of your playlist!';

export const findAllPlaylistItems = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const playlistItemRepository = getRepository(PlaylistItem);

  const playlistItems = await playlistItemRepository.find({
    where: {
      user: {
        id: userId
      }
    }
  });

  return res.json(playlistItems);
};

export const patchPlaylistItemFavoritedAt = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { articleId } = req.params;
  const { favoritedAt } = req.body;
  const playlistItemRepository = getRepository(PlaylistItem);

  const validationSchema = joi.object().keys({
    articleId: joi.string().uuid().required(),
    favoritedAt: joi.alternatives().try(joi.string().allow(null)).required()
  });

  const { error } = validationSchema.validate({ ...req.params, ...req.body });

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');

    Sentry.configureScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      Sentry.captureMessage(message);
    });

    return res.status(400).json({ message });
  }

  const playlistItem = await playlistItemRepository.findOne({
    relations: ['user'],
    where: {
      article: {
        id: articleId
      },
      user: {
        id: userId
      }
    }
  });

  if (!playlistItem) {
    Sentry.configureScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setExtra('playlistItem', playlistItem);
      Sentry.captureMessage(MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND);
    });

    return res.status(400).json({ message: MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND });
  }

  if (favoritedAt === null) {
    // If it's already removed
    if (playlistItem.favoritedAt === null) {
      return res.json({
        message: 'This playlist item is not in your favorites. We do not update it.'
      });
    }

    await playlistItemRepository.update(playlistItem.id, {
      favoritedAt: undefined
    });
    return res.json({ message: 'Playlist item is removed to your favorites!' });
  }

  await playlistItemRepository.update(playlistItem.id, {
    favoritedAt: new Date()
  });
  return res.json({ message: 'Playlist item is added to your favorites!' });
};

export const patchPlaylistItemArchivedAt = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { articleId } = req.params;
  const { archivedAt } = req.body;
  const playlistItemRepository = getRepository(PlaylistItem);

  const validationSchema = joi.object().keys({
    articleId: joi.string().uuid().required(),
    archivedAt: joi.alternatives().try(joi.string().allow(null)).required()
  });

  const { error } = validationSchema.validate({ ...req.params, ...req.body });

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');

    Sentry.configureScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      Sentry.captureMessage(message);
    });

    return res.status(400).json({ message });
  }

  const playlistItem = await playlistItemRepository.findOne({
    relations: ['user'],
    where: {
      article: {
        id: articleId
      },
      user: {
        id: userId
      }
    }
  });

  if (!playlistItem) {
    Sentry.configureScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setExtra('playlistItem', playlistItem);
      Sentry.captureMessage(MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND);
    });

    return res.status(400).json({ message: MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND });
  }

  if (archivedAt === null) {
    // If it's already removed
    if (playlistItem.archivedAt === null) {
      return res.json({
        message: 'This playlist item is not in your archive. We do not update it.'
      });
    }

    await playlistItemRepository.update(playlistItem.id, {
      archivedAt: undefined
    });
    return res.json({ message: 'Playlist item is removed to your archive!' });
  }

  await playlistItemRepository.update(playlistItem.id, {
    archivedAt: new Date()
  });
  return res.json({ message: 'Playlist item is added to your archive!' });
};

/**
 * Creates a playlist item by using a known article ID.
 *
 * @param req
 * @param res 
 */
export const createPlaylistItemByArticleId = async (req: Request, res: Response) => {
  const loggerPrefix = 'Create Playlist Item By Article ID:';
  const userId = req.user.id;
  const { articleId } = req.params;

  const playlistItemRepository = getRepository(PlaylistItem);
  const articleRepository = getRepository(Article);

  const validationSchema = joi.object().keys({
    articleId: joi.string().uuid().required()
  });

  const { error } = validationSchema.validate(req.params);

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // Get the article, but only the ID. We only need the ID
  const article: DeepPartial<Article> | undefined = await articleRepository.findOne(articleId, { select: ['id'] });

  if (!article) {
    return res.status(404).json({ message: 'The article to add to your playlist could not be found.' })
  }

  // Find if the playlist item already exists
  const playlistItem = await playlistItemRepository.findOne({
    relations: ['user'],
    where: {
      user: {
        id: userId
      },
      article: {
        id: article.id
      }
    }
  });

  if (playlistItem) {
    return res.status(400).json({ message: MESSAGE_PLAYLISTS_ARTICLE_EXISTS_IN_PLAYLIST });
  }

  // Create the playlist item
  const playlistItemToCreate = playlistItemRepository.create({
    article: {
      id: articleId
    },
    user: {
      id: userId
    },
    order: -1
  });

  const createdPlaylistItem = await playlistItemRepository.save(playlistItemToCreate);

  // Move the newly created playlistItem to the first position and re-order all the other playlist items
  // await reOrderPlaylistItem(createdPlaylistItem.id, 0, -1, userId);
  await reOrderPlaylistItems(userId);

  return res.json(createdPlaylistItem);
}

export const createPlaylistItemByArticleUrl = async (req: Request, res: Response) => {
  const loggerPrefix = 'Create Playlist Item By Article URL:';
  const userId = req.user.id;
  const { articleUrl, documentHtml }: { articleUrl: string, documentHtml?: string } = req.body; // articleUrl is required, documentHtml is optional

  let articleId = '';

  const playlistItemRepository = getRepository(PlaylistItem);
  const articleRepository = getRepository(Article);

  const validationSchema = joi.object().keys({
    articleUrl: joi.string().uri().required(),
    documentHtml: joi.string().allow(undefined).optional()
  });

  const { error } = validationSchema.validate(req.body);

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setUser(req.user);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // Normalize the URL
  // IMPORTANT: the normalized URL could still be different than the canonicalUrl in the database
  // For this we'll do an extra check later in the updateArticleToFull() method, to ensure we don't get duplicates
  // By doing it this way, we keep this method very quick and responsive for our user
  const normalizedUrl = getNormalizedUrl(articleUrl);

  // Correctly escape the string
  const { stringifiedDocumentHtml } = JSON.parse(JSON.stringify({ stringifiedDocumentHtml: documentHtml }));

  // Find the article by "url" OR "canonicalUrl"
  const article: DeepPartial<Article> | undefined = await articleRepository.findOne({
    select: ['id', 'url', 'canonicalUrl'],
    where: [{ url: normalizedUrl }, { canonicalUrl: normalizedUrl }]
  });

  // If there's an article, check if that one already exists in the user's playlist
  if (article && article.id) {
    articleId = article.id;

    const playlistItem = await playlistItemRepository.findOne({
      relations: ['user'],
      where: {
        user: {
          id: userId
        },
        article: {
          id: article.id
        }
      }
    });

    if (playlistItem) {
      return res.status(400).json({ message: MESSAGE_PLAYLISTS_ARTICLE_EXISTS_IN_PLAYLIST });
    }
  } else {
    // If we do not have an article yet, create one in the database...
    // ...so our crawler tries to fetch the article in the background
    const articleToCreate = articleRepository.create({
      documentHtml: stringifiedDocumentHtml, // Add the html string if we have it
      url: normalizedUrl,
      user: {
        id: userId
      }
    });

    const createdArticle = await articleRepository.save(articleToCreate);

    articleId = createdArticle.id;
  }

  // TODO: put article creation and playlist item creation in transaction

  const playlistItemToCreate = playlistItemRepository.create({
    article: {
      id: articleId
    },
    user: {
      id: userId
    },
    order: -1
  });

  const createdPlaylistItem = await playlistItemRepository.save(playlistItemToCreate);

  // Move the newly created playlistItem to the first position and re-order all the other playlist items
  // await reOrderPlaylistItem(createdPlaylistItem.id, 0, -1, userId);
  await reOrderPlaylistItems(userId);

  return res.json(createdPlaylistItem);
};

/**
 * Allows the user to give a custom order to the playlist items
 *
 */
export const patchPlaylistItemOrder = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { articleId } = req.params;
  const { order } = req.body;

  const patchValidationSchema = joi.object().keys({
    articleId: joi.string().uuid().required(),
    order: joi
      .number()
      .integer()
      .min(0)
      .required()
  });

  const { error } = patchValidationSchema.validate({ ...req.params, ...req.body })

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setUser(req.user);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      Sentry.captureMessage(message);
    });

    return res.status(400).json({ message });
  }

  const newOrderNumber = parseInt(order, 10); // Convert string to integer, so we can compare

  const playlistItemRepository = getRepository(PlaylistItem);

  // Find the playlistItem of the current user to verify he can do this action
  const playlistItem = await playlistItemRepository.findOne({
    relations: ['user'],
    where: {
      article: {
        id: articleId
      },
      user: {
        id: userId
      }
    }
  });

  if (!playlistItem) {
    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setUser(req.user);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setExtra('playlistItem', playlistItem);
      scope.setExtra('newOrderNumber', newOrderNumber);
      Sentry.captureMessage(MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND);
    });

    return res.status(400).json({ message: MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND });
  }

  if (playlistItem.user.id !== userId) {
    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setUser(req.user);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setExtra('playlistItem', playlistItem);
      scope.setExtra('newOrderNumber', newOrderNumber);
      Sentry.captureMessage(MESSAGE_PLAYLISTS_NO_ACCESS_PLAYLIST);
    });

    return res.status(400).json({ message: MESSAGE_PLAYLISTS_NO_ACCESS_PLAYLIST });
  }

  const currentOrderNumber = playlistItem.order;

  // The order is the same, just return success, no need to update the database for this
  if (currentOrderNumber === newOrderNumber) {
    return res.status(200).json({ message: MESSAGE_PLAYLISTS_UPDATE_ORDER_EQUAL });
  }

  // Get all the playlistItems, so we can determine the maximum order number
  const allPlaylistPlaylistItems = await playlistItemRepository.find({
    relations: ['user'],
    where: {
      user: {
        id: userId
      }
    },
    order: {
      order: 'ASC'
    }
  });

  const lastPlaylistItem = allPlaylistPlaylistItems[allPlaylistPlaylistItems.length - 1];

  // Restrict ordering when the newOrderNumber is greater than the last
  if (newOrderNumber > lastPlaylistItem.order) {
    const message = "You cannot use this order number, as it is beyond the last playlist item's order number.";

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setUser(req.user);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setExtra('playlistItem', playlistItem);
      scope.setExtra('newOrderNumber', newOrderNumber);
      Sentry.captureMessage(message);
    });

    return res.status(400).json({ message });
  }

  // Re-order all the playlist items in the playlistId of the logged in user
  await reOrderPlaylistItem(playlistItem.id, newOrderNumber, currentOrderNumber, userId);

  return res.json({ message: MESSAGE_PLAYLISTS_UPDATE_ORDER_SUCCESS });
};

export const deletePlaylistItem = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { articleId } = req.params;
  const playlistItemRepository = getRepository(PlaylistItem);
  const articleRepository = getRepository(Article);

  const validationSchema = joi.object().keys({
    articleId: joi.string().uuid().required()
  });

  const { error } = validationSchema.validate(req.params);

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setUser(req.user);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      Sentry.captureMessage(message);
    });

    logger.error('Delete Playlist Item', message);
    return res.status(400).json({ message });
  }

  const playlistItem = await playlistItemRepository.findOne({
    relations: ['user'],
    where: {
      article: {
        id: articleId
      },
      user: {
        id: userId
      }
    }
  });

  if (!playlistItem) {
    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setUser(req.user);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      Sentry.captureMessage(MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND);
    });

    logger.error('Delete Playlist Item', MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND);
    return res.status(400).json({ message: MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND });
  }

  try {
    logger.info('Delete Playlist Item', `Deleting playlist item ID "${playlistItem.id}"...`);
    await playlistItemRepository.remove(playlistItem);
    logger.info('Delete Playlist Item', 'Successfully deleted playlist item!');
  } catch (err) {
    const message = `Failed to delete playlist item ID "${playlistItem}"`;

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setUser(req.user);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      scope.setExtra('playlistItem', playlistItem);
      Sentry.captureException(err);
    });

    logger.error('Delete Playlist Item', message);

    return res.status(400).json({ message });
  }

  // Check if the playlistItem has a failed or processing article
  // If so, we delete it
  const failedArticle = await articleRepository.findOne(articleId, {
    where: {
      status: Not(ArticleStatus.FINISHED)
    }
  });

  if (failedArticle) {
    try {
      logger.info('Delete Playlist Item', `Playlist Item has an unfinished article. Deleting that article ID "${failedArticle.id}"...`);
      await articleRepository.remove(failedArticle);
      logger.info('Delete Playlist Item', 'Successfully deleted article ID!');
    } catch (err) {
      const message = 'Failed to delete the article attached to the deleted playlist item.';

      Sentry.withScope(scope => {
        scope.setLevel(Sentry.Severity.Error);
        scope.setUser(req.user);
        scope.setExtra('body', req.body);
        scope.setExtra('params', req.params);
        scope.setExtra('failedArticle', failedArticle);
        scope.setExtra('playlistItem', playlistItem);
        Sentry.captureException(err);
      });

      logger.error('Delete Playlist Item', message);

      return res.status(400).json({ message });
    }
  }

  await reOrderPlaylistItems(userId);

  return res.json({ message: 'Playlist item is removed!' });
};

/**
 * Method to re-order existing playlist items.
 * This is a simple, not optimized version. As we run a UPDATE command for every playlist item
 * TODO: try to find a way to update using one SQL command
 *
 * @param userId
 */
export const reOrderPlaylistItems = async (userId: string) => {
  logger.info('Re-order Playlist Items', `Re-ordering playlist for user ID: "${userId}".`);

  const playlistItemRepository = getRepository(PlaylistItem);

  const userPlaylistItems = await playlistItemRepository.find({
    relations: ['user'],
    where: {
      user: {
        id: userId
      }
    },
    order: {
      order: 'ASC'
    }
  });

  if (!userPlaylistItems.length) {
    logger.info('Re-order Playlist Items', `No playlist items to re-order for user ID: "${userId}".`);
    return userPlaylistItems;
  }

  const playlistItemIds = userPlaylistItems.map(playlistItem => playlistItem.id);

  return getManager().transaction(async transactionalEntityManager => {
    playlistItemIds.forEach(async (playlistItemId, index) => {
      await transactionalEntityManager.update(PlaylistItem, playlistItemId, {
        order: index
      });
    });

    logger.info('Re-order Playlist Items', 'Successfully re-ordered!');
  });
};

export const reOrderPlaylistItem = async (playlistItemId: string, newOrderNumber: number, currentOrderNumber: number, userId: string) => {
  return getManager().transaction(async transactionalEntityManager => {
    const move = currentOrderNumber > newOrderNumber ? 'up' : 'down';

    // Helpful: https://blogs.wayne.edu/web/2017/03/13/updating-a-database-display-order-with-drag-and-drop-in-sql/

    // Move the playlistItem out of the normal ordering temporary, this creates a gap
    await transactionalEntityManager
      .createQueryBuilder()
      .update(PlaylistItem)
      .set({ order: -1 })
      .where('"id" = :playlistItemId', { playlistItemId })
      .andWhere('"userId" = :userId', { userId })
      .execute();

    // Move all other playlistItem's to their new position...
    if (move === 'up') {
      // If we move the item up, we need to increment the order of all the items above the newOrderNumber,
      // but below or equal to the currentOrderNumber
      await transactionalEntityManager
        .createQueryBuilder()
        .update(PlaylistItem)
        .set({ order: () => '"order" + 1' })
        .where('"order" >= :newOrderNumber', { newOrderNumber })
        .andWhere('"order" < :currentOrderNumber', { currentOrderNumber })
        .andWhere('"userId" = :userId', { userId })
        .execute();
    } else {
      // If we move the item down, we need to decrement the order of all the items below the newOrderNumber,
      // but below or equal to the newOrderNumber
      await transactionalEntityManager
        .createQueryBuilder()
        .update(PlaylistItem)
        .set({ order: () => '"order" - 1' })
        .where('"order" > :currentOrderNumber', { currentOrderNumber })
        .andWhere('"order" <= :newOrderNumber', { newOrderNumber })
        .andWhere('"userId" = :userId', { userId })
        .execute();
    }

    // Fill the gap!
    // Set newOrder to the given playlistItem
    await transactionalEntityManager
      .createQueryBuilder()
      .update(PlaylistItem)
      .set({ order: newOrderNumber })
      .where('id = :id', { id: playlistItemId })
      .andWhere('"userId" = :userId', { userId })
      .execute();
  });
};
