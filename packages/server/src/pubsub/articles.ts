import { Message, PubSub } from '@google-cloud/pubsub';
import * as Sentry from '@sentry/node';
import { getGoogleCloudCredentials } from '../utils/credentials';

import { ICrawlFullArticleData } from '../typings';

import * as articlesController from '../controllers/articles';
import { ArticleStatus } from '../database/entities/article';
import { logger } from '../utils';

const { GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE, GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE } = process.env;

export const listenCrawlFullArticle = async () => {
  const loggerPrefix = 'Google PubSub Worker (Listen: Crawl Full Article):';

  logger.info(loggerPrefix, 'Setup...');

  const pubsub = new PubSub(getGoogleCloudCredentials());

  if (!GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE) {
    const errorMessage = 'Required env variable "GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE" not set. Please add it.';
    logger.error(loggerPrefix, errorMessage);
    throw new Error(errorMessage);
  }

  // Verify if we are connected to pubsub by just checking if we can find the subscription
  const subscriptions = await pubsub.getSubscriptions();
  const hasSubscription = !!subscriptions[0].filter(subscription => subscription.name === GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE);

  if (!hasSubscription) {
    const errorMessage = `Subscription "${GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE}" could not be found in the PubSub client.`;
    logger.error(loggerPrefix, errorMessage);
    throw new Error(errorMessage);
  }

  logger.info(loggerPrefix, 'Connected!');

  const crawlFullArticleSubscription = pubsub.subscription(GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE);

  // An array where we keep track of the retries
  // So we can remove the article from pubsub when we fail X times
  const tries = [];

  const messageHandler = async (message: Message) => {
    const { articleId }: ICrawlFullArticleData = JSON.parse(message.data.toString());

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
      tries[articleId] = tries[articleId] ? tries[articleId] + 1 : (tries[articleId] = 1);

      logger.info(loggerPrefix, 'tries:', tries[articleId]);

      if (!articleId) { throw new Error('Did not receive an articleId from pubsub.'); }

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
      logger.error(loggerPrefix, 'Worker process failed: ', articleId);
      logger.error(err);

      Sentry.withScope(scope => {
        scope.setExtra('articleId', articleId);
        scope.setExtra('message', JSON.parse(message.data.toString()));
        scope.setLevel(Sentry.Severity.Critical);
        Sentry.captureMessage('Failed to fully fetch an article on the worker.');
        Sentry.captureException(err);
      });

      await articlesController.updateArticleStatus(articleId, ArticleStatus.FAILED);
      logger.error(loggerPrefix, 'Worker process set status to failed: ', articleId);

      message.nack(); // re-deliver, so we can retry
      logger.error(loggerPrefix, 'Sending nack(). Re-deliver message...');
    }
  };

  logger.info(loggerPrefix, 'Now listening for Google PubSub messages on:', GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE);

  crawlFullArticleSubscription.on('message', messageHandler);
};

/**
 * Publishes the articleId and articleUrl to our PubSub events so we can fetch the article details
 * when this event gets fired.
 *
 * @param articleId
 * @param articleUrl
 */
export async function publishCrawlFullArticle(articleId: string, articleUrl: string) {
  const loggerPrefix = 'Google PubSub Worker (Publish: Crawl Full Article):';

  try {
    const pubsub = new PubSub(getGoogleCloudCredentials());

    if (!GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE) {
      const errorMessage = 'Required env variable "GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE" not set. Please add it.';
      logger.error(loggerPrefix, errorMessage);
      throw new Error(errorMessage);
    }

    // Verify if we are connected to pubsub by just checking if we can find the topics
    const topics = await pubsub.getTopics();
    const hasTopic = !!topics[0].filter(topic => topic.name === GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE);

    if (!hasTopic) {
      const errorMessage = `Topic "${GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE}" could not be found in the PubSub client.`;
      logger.error(loggerPrefix, errorMessage);
      throw new Error(errorMessage);
    }

    const data = {
      articleId,
      articleUrl
    }

    const buffer = Buffer.from(
      JSON.stringify(data)
    );

    logger.info(loggerPrefix, 'Publishing...', data);

    const result = await pubsub.topic(GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE).publish(buffer);

    logger.info(loggerPrefix, 'Published to:', GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE);

    return result;
  } catch (err) {
    Sentry.withScope(scope => {
      scope.setExtra('articleId', articleId);
      scope.setExtra('articleUrl', articleUrl);
      scope.setLevel(Sentry.Severity.Critical);
      Sentry.captureException(err);
    });
    throw err;
  }
}
