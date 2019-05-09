import { Request, Response } from 'express';
import { playlistInputValidationSchema } from '../database/validators';
import { getRepository, getManager, MoreThan, Not } from 'typeorm';
import joi from 'joi';
import { PlaylistItem } from '../database/entities/playlist-item';
import { Article, ArticleStatus } from '../database/entities/article';

import { getNormalizedUrl } from '../utils/string';
import { logger } from '../utils';

const MESSAGE_PLAYLISTS_NO_ACCESS_PLAYLIST = 'You have no access to this playlist because it is not yours.';
const MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND = 'The given article does not exist in your playlist.';
const MESSAGE_PLAYLISTS_ARTICLE_EXISTS_IN_PLAYLIST = 'You already have this article in your playlist!';
const MESSAGE_PLAYLISTS_UPDATE_ORDER_EQUAL = 'The given order is the same. We do not update the order.';
const MESSAGE_PLAYLISTS_UPDATE_ORDER_SUCCESS = 'Successfully updated the order of your playlist!';

export const findAllPlaylistItems = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const playlistItemRepository = getRepository(PlaylistItem);

  const playlistItems = await playlistItemRepository.find({
    relations: ['user'],
    where: {
      user: {
        id: userId
      }
    }
  });

  return res.json(playlistItems);
};

export const findAllFavoritedItems = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const playlistItemRepository = getRepository(PlaylistItem);

  const favoritedPlaylistItems = await playlistItemRepository.find({
    relations: ['user'],
    where: {
      user: {
        id: userId
      },
      favoritedAt: MoreThan(new Date(2000, 12, 31, 23, 59, 59, 0)) // Some past date
    },
    order: {
      favoritedAt: 'ASC'
    }
  });

  return res.json(favoritedPlaylistItems);
};

export const patchPlaylistItemFavoritedAt = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { articleId } = req.params;
  const { favoritedAt } = req.body;
  const playlistItemRepository = getRepository(PlaylistItem);

  const { error } = joi.validate({ articleId }, playlistInputValidationSchema.requiredKeys('articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
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

  if (!playlistItem) return res.status(400).json({ message: MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND });

  if (favoritedAt === null) {
    // If it's already removed
    if (playlistItem.favoritedAt === null) return res.json({ message: 'This playlist item is not in your favorites. We do not update it.' });

    await playlistItemRepository.update(playlistItem.id, { favoritedAt: '' });
    return res.json({ message: 'Playlist item is removed to your favorites!' });
  }

  await playlistItemRepository.update(playlistItem.id, { favoritedAt: new Date() });
  return res.json({ message: 'Playlist item is added to your favorites!' });

};

export const patchPlaylistItemArchivedAt = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { articleId } = req.params;
  const { archivedAt } = req.body;
  const playlistItemRepository = getRepository(PlaylistItem);

  const { error } = joi.validate({ articleId }, playlistInputValidationSchema.requiredKeys('articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
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
    },
  });

  if (!playlistItem) return res.status(400).json({ message: MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND });

  if (archivedAt === null) {
    // If it's already removed
    if (playlistItem.favoritedAt === null) return res.json({ message: 'This playlist item is not in your archive. We do not update it.' });

    await playlistItemRepository.update(playlistItem.id, { archivedAt: '' });
    return res.json({ message: 'Playlist item is removed to your archive!' });
  }

  await playlistItemRepository.update(playlistItem.id, { archivedAt: new Date() });
  return res.json({ message: 'Playlist item is added to your archive!' });
};

export const findAllArchivedItems = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const playlistItemRepository = getRepository(PlaylistItem);

  const archivedPlaylistItems = await playlistItemRepository.find({
    relations: ['user'],
    where: {
      user: {
        id: userId
      },
      archivedAt: MoreThan(new Date(2000, 12, 31, 23, 59, 59, 0)) // Some past date
    },
    order: {
      archivedAt: 'ASC'
    }
  });

  return res.json(archivedPlaylistItems);
};

export const createPlaylistItemByArticleUrl = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { articleUrl } = req.body;

  let articleId = '';

  const playlistItemRepository = getRepository(PlaylistItem);
  const articleRepository = getRepository(Article);

  const { error } = joi.validate({ articleUrl }, playlistInputValidationSchema.requiredKeys('articleUrl'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  // Normalize the URL
  // IMPORTANT: the normalized URL could still be different than the canonicalUrl in the database
  // For this we'll do an extra check later in the updateArticleToFull() method, to ensure we don't get duplicates
  // By doing it this way, we keep this method very quick and responsive for our user
  const normalizedUrl = getNormalizedUrl(articleUrl);

  // Find the article by "url" OR "canonicalUrl"
  const article = await articleRepository.findOne({
    where: [
      { url: normalizedUrl },
      { canonicalUrl: normalizedUrl }
    ]
  });

  // If there's an article, check if that one already exists in the user's playlist
  if (article) {
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

    if (playlistItem) return res.status(400).json({ message: MESSAGE_PLAYLISTS_ARTICLE_EXISTS_IN_PLAYLIST });
  } else {

    // If we do not have an article yet, create one in the database...
    // ...so our crawler tries to fetch the article in the background
    const articleToCreate = await articleRepository.create({
      url: normalizedUrl,
      user: {
        id: userId
      }
    });

    const createdArticle = await articleRepository.save(articleToCreate);

    if (!createdArticle) return res.status(400).json({ message: 'test' });

    articleId = createdArticle.id;
  }

  const playlistItemToCreate = await playlistItemRepository.create({
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
  await reOrderPlaylistItem(createdPlaylistItem.id, 0, -1, userId);

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

  const { error } = joi.validate({ articleId, order }, playlistInputValidationSchema.requiredKeys('articleId', 'order'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
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

  if (!playlistItem) return res.status(400).json({ message:MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND });

  if (playlistItem.user.id !== userId) return res.status(400).json({ message: MESSAGE_PLAYLISTS_NO_ACCESS_PLAYLIST });

  const currentOrderNumber = playlistItem.order;

  // The order is the same, just return success, no need to update the database for this
  if (currentOrderNumber === newOrderNumber) return res.status(200).json({ message: MESSAGE_PLAYLISTS_UPDATE_ORDER_EQUAL });

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
    return res.status(400).json({ message: 'You cannot use this order number, as it is beyond the last playlist item\'s order number.' });
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

  const { error } = joi.validate({ articleId }, playlistInputValidationSchema.requiredKeys('articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    logger.error('Delete Playlist Item', messageDetails);
    return res.status(400).json({ message: messageDetails });
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
    logger.error('Delete Playlist Item', MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND);
    return res.status(400).json({ message: MESSAGE_PLAYLISTS_PLAYLIST_ITEM_NOT_FOUND });
  }

  try {
    logger.info('Delete Playlist Item', `Deleting playlist item ID "${playlistItem.id}"...`);
    await playlistItemRepository.remove(playlistItem);
    logger.info('Delete Playlist Item', 'Successfully deleted playlist item!');
  } catch (err) {
    const errorMessage = `Failed to delete playlist item ID "${playlistItem}"`;
    logger.error('Delete Playlist Item', errorMessage);
    return res.status(400).json({ message: errorMessage });
  }

  // Check if the playlistItem has a failed or processing article
  // If so, we delete it
  const failedArticle = await articleRepository.findOne({
    where: {
      id: playlistItem.article.id,
      status: Not(ArticleStatus.FINISHED)
    }
  });

  if (failedArticle) {
    try {
      logger.info('Delete Playlist Item', `Playlist Item has an unfinished article. Deleting that article ID "${failedArticle.id}"...`);
      await articleRepository.remove(failedArticle);
      logger.info('Delete Playlist Item', 'Successfully deleted article ID!');
    } catch (err) {
      const errorMessage = 'Failed to delete the article attached to the deleted playlist item.';
      logger.error('Delete Playlist Item', errorMessage);
      return res.status(400).json({ message: errorMessage });
    }
  }

  // TODO: re-order items to fill in the gap?

  return res.json({ message: 'Playlist item is removed!' });
};

export const reOrderPlaylistItem = async (
  playlistItemId: string,
  newOrderNumber: number,
  currentOrderNumber: number,
  userId: string
) => {
  return getManager().transaction(async (transactionalEntityManager) => {
    const move = (newOrderNumber > currentOrderNumber) ? 'down' : 'up';

    // Helpful: https://blogs.wayne.edu/web/2017/03/13/updating-a-database-display-order-with-drag-and-drop-in-sql/

    // Move the playlistItem out of the normal ordering temporary, this creates a gap
    await transactionalEntityManager.createQueryBuilder()
    .update(PlaylistItem)
    .set({ order: -1 })
    .where('"id" = :id', { id: playlistItemId })
    .andWhere('"userId" = :userId', { userId })
    .execute();

    // Move all other playlistItem's to their new position...
    if (move === 'up') {
      // If we move the item up, we need to increment the order of all the items above the newOrderNumber,
      // but below or equal to the currentOrderNumber
      await transactionalEntityManager.createQueryBuilder()
      .update(PlaylistItem)
      .set({ order: () => '"order" + 1' })
      .where('"order" >= :newOrderNumber', { newOrderNumber })
      .andWhere('"order" < :currentOrderNumber', { currentOrderNumber })
      .andWhere('"userId" = :userId', { userId })
      .execute();
    } else {
      // If we move the item down, we need to decrement the order of all the items below the newOrderNumber,
      // but below or equal to the newOrderNumber
      await transactionalEntityManager.createQueryBuilder()
      .update(PlaylistItem)
      .set({ order: () => '"order" - 1' })
      .where('"order" > :currentOrderNumber', { currentOrderNumber })
      .andWhere('"order" <= :newOrderNumber', { newOrderNumber })
      .andWhere('"userId" = :userId', { userId })
      .execute();
    }

    // Fill the gap!
    // Set newOrder to the given playlistItem
    await transactionalEntityManager.createQueryBuilder()
    .update(PlaylistItem)
    .set({ order: newOrderNumber })
    .where('id = :id', { id: playlistItemId })
    .andWhere('"userId" = :userId', { userId })
    .execute();
  });
};
