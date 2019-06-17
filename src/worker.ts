require('dotenv').config();

import { getGoogleCloudCredentials } from './utils/credentials';

// Attach stackdriver on our Heroku environments
if (
  process.env.HEROKU_SLUG_COMMIT &&
  process.env.NODE_ENV &&
  ['production', 'staging'].includes(process.env.NODE_ENV)
) {
  require('@google-cloud/debug-agent').start({
    ...getGoogleCloudCredentials(),
    serviceContext: {
      service: 'API',
      version: process.env.HEROKU_SLUG_COMMIT
    }
  });
}

import { createConnection } from 'typeorm';
import * as Sentry from '@sentry/node';
import * as Integrations from '@sentry/integrations';
import { PubSub } from '@google-cloud/pubsub';

import { connectionOptions } from './database/connection-options';

import * as articlesController from './controllers/articles';
import { ArticleStatus } from './database/entities/article';
import { logger } from './utils';
import { AppleSubscriptionNotificationRequestBody, GooglePubSubMessage, CrawlFullArticleData } from 'typings';

logger.info('Worker init: Setting up...');

const {
  GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE,
  GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS
} = process.env;

if (!GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE) throw new Error('Required env variable "GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE" not set. Please add it.');
if (!GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS) throw new Error('Required env variable "GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS" not set. Please add it.');

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    release: process.env.HEROKU_SLUG_COMMIT,
    integrations: [
      new Integrations.RewriteFrames({
        root: __dirname,
      })
    ],
  });

  Sentry.configureScope((scope) => {
    scope.setExtra('process', 'worker');
  });

  logger.info('Worker init: Sentry configured.');
}

logger.info('Worker init: Connecting with database...');

// Listen for the message to fetch the full article.
// This happens right after the insert of a new article.
// Since the crawling of the full article details takes longer...
// ...we do it right after insertion in the database of the minimal article details
createConnection(connectionOptions('default')).then(async (connection: any) => {
  try {
    logger.info('Worker init: Connected with database', connection.options.url);
    logger.info('Worker init: Ready to work!');

    listenAppleSubscriptionNotifications();
    listenCrawlFullArticle();

  } catch (err) {
    logger.error('Worker: Captured an uncaught error', err);

    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(err);
    }
  }
});

/**
 * Method to listen for Apple Subscription Notifications.
 * Which are send to our Cloud Function: https://europe-west1-playpost.cloudfunctions.net/appleSubscriptionStatusNotifications
 * That Cloud Function add's it to PubSub (publisher)
 *
 * The method below listens for that PubSub (subscriber)
 * We use Google's PubSub for message queue purposes
 *
 */
function listenAppleSubscriptionNotifications() {
  const loggerPrefix = 'Google PubSub Worker (Apple Subscription Notifications):';

  const pubsub = new PubSub(getGoogleCloudCredentials());

  const subscription = pubsub.subscription(GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS);

  logger.info(loggerPrefix, 'Listening for Google PubSub messages on:', GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS);

  // errors.report('Something broke!');

  const messageHandler = (message: GooglePubSubMessage) => {
    const notification: AppleSubscriptionNotificationRequestBody = JSON.parse(message.data);

    logger.info(loggerPrefix, 'Should save notification to database:', notification.notification_type);

    // Ignore all notifications that don't have a notification type
    // These could be our test messages
    if (!notification.notification_type) {
      logger.warn(loggerPrefix, 'Received a message we cannot process. So we just Ack that message so it is deleted from the queue:', notification);
      return message.ack();
    }

    // Correctly sort the notifications, oldest first
    // const {
    //   latest_receipt_info: latestReceiptInfo,
    //   latest_expired_receipt_info: latestExpiredReceiptInfo
    // } = notification;

    // console.log(latestReceiptInfo, latestExpiredReceiptInfo)


    // "Ack" (acknowledge receipt of) the message
    // Send "Ack" when we have successfully processed the notification in our database
    // message.ack();
  };

  subscription.on('message', messageHandler);
}

function listenCrawlFullArticle() {
  const loggerPrefix = 'Google PubSub Worker (Crawl Full Article):';

  const pubsub = new PubSub(getGoogleCloudCredentials());

  const subscription = pubsub.subscription(GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE);

  logger.info(loggerPrefix, 'Listening for Google PubSub messages on:', GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE);

  // An array where we keep track of the retries
  // So we can remove the article from pubsub when we fail X times
  const tries = [];

  const messageHandler = async (message: GooglePubSubMessage) => {
    const { articleId }: CrawlFullArticleData = JSON.parse(message.data);

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

      if (process.env.NODE_ENV === 'production') {
        Sentry.withScope((scope) => {
          scope.setExtra('articleId', articleId);
          scope.setLevel(Sentry.Severity.Critical);
          Sentry.captureMessage('Failed to fully fetch an article.');
          Sentry.captureException(err);
        });
      }

      await articlesController.updateArticleStatus(articleId, ArticleStatus.FAILED);
      logger.error(loggerPrefix, 'Worker process set status to failed: ', articleId);
    } finally {
      logger.info(loggerPrefix, 'Worker process ended: ', articleId);
    }
  };

  subscription.on('message', messageHandler);
}
