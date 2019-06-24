require('dotenv').config();

import { getGoogleCloudCredentials } from '../utils/credentials';

import { PubSub, Message } from '@google-cloud/pubsub';

import { Sentry } from '../error-reporter';

import { CrawlFullArticleData } from '../typings';

import * as articlesController from '../controllers/articles';
import { ArticleStatus } from '../database/entities/article';
import { logger } from '../utils';

const {
  GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE,
  GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE
} = process.env;

export const listenCrawlFullArticle = () => {
  const loggerPrefix = 'Google PubSub Worker (Crawl Full Article):';
  const reDeliverDelayInSeconds = 10;
  const pubsub = new PubSub(getGoogleCloudCredentials());

  if (!GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE) throw new Error('Required env variable "GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE" not set. Please add it.');

  const subscription = pubsub.subscription(GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE);

  logger.info(loggerPrefix, 'Listening for Google PubSub messages on:', GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE);

  // An array where we keep track of the retries
  // So we can remove the article from pubsub when we fail X times
  const tries = [];

  const messageHandler = async (message: Message) => {
    const { articleId }: CrawlFullArticleData = JSON.parse(message.data.toString());

    try {
      // Just try 3 times
      // If we still fail, just ack the message, as this might turn into an infinite loop
      // When we end up here, we can't seem to crawl the page
      if (tries[articleId] && tries[articleId] >= 3) {
        logger.warn(loggerPrefix, `Already tried ${tries[articleId]}. We cannot seem to crawl the page. We just fail.`);

        // Set as failed
        await articlesController.updateArticleStatus(articleId, ArticleStatus.FAILED);

        // Remove the message from pubsub
        // So the article is permanently failed
        message.ack();

        delete tries[articleId];
      }

      // Set the tries to plus 1
      tries[articleId] = (tries[articleId]) ? tries[articleId] + 1 : tries[articleId] = 1;

      logger.info(loggerPrefix, 'tries:', tries[articleId]);

      if (!articleId) throw new Error('Did not receive an articleId from pubsub.');

      logger.info(loggerPrefix, 'Worker process started: ', articleId);

      await articlesController.updateArticleStatus(articleId, ArticleStatus.CRAWLING);

      const updatedArticle = await articlesController.updateArticleToFull(articleId);

      // If there's no updated article, we probably "enforced" unique articles
      if (!updatedArticle) {
        message.ack(); // Remove the message from pubsub
        delete tries[articleId];
        return logger.info(loggerPrefix, 'Worker process ended without update: ', articleId);
      }

      // Article is updated, we can remove the message from pubsub
      message.ack();

      delete tries[articleId];

      logger.info(loggerPrefix, 'Worker process success: ', articleId);
    } catch (err) {
      logger.error(loggerPrefix, 'Worker process failed: ', articleId, err);

      Sentry.withScope((scope) => {
        scope.setExtra('articleId', articleId);
        scope.setLevel(Sentry.Severity.Critical);
        Sentry.captureMessage('Failed to fully fetch an article.');
        Sentry.captureException(err);
      });

      await articlesController.updateArticleStatus(articleId, ArticleStatus.FAILED);
      logger.error(loggerPrefix, 'Worker process set status to failed: ', articleId);

      message.nack(reDeliverDelayInSeconds); // re-deliver, so we can retry
      logger.error(loggerPrefix, 'Re-deliver message in seconds:', reDeliverDelayInSeconds);

    } finally {
      logger.info(loggerPrefix, 'Worker process ended: ', articleId);
    }
  };

  subscription.on('message', messageHandler);
}

/**
 * Publishes the articleId and articleUrl to our PubSub events so we can fetch the article details
 * when this event gets fired.
 *
 * @param articleId
 * @param articleUrl
 */
export async function publishCrawlFullArticle(articleId: string, articleUrl: string) {
  try {
    const pubsub = new PubSub(getGoogleCloudCredentials());

    if (!GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE) throw new Error('Required env variable "GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE" not set. Please add it.');

    const buffer = Buffer.from(JSON.stringify({
      articleId,
      articleUrl
    }));

    const result = await pubsub.topic(GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE).publish(buffer);

    return result;
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}
