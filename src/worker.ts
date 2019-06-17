require('dotenv').config();
import { createConnection } from 'typeorm';
import * as Sentry from '@sentry/node';
import * as Integrations from '@sentry/integrations';

import { connectionOptions } from './database/connection-options';

import { logger } from './utils';
import { listenForAppleSubscriptionNotifications } from './pubsub/in-app-subscriptions';
import { listenCrawlFullArticle } from './pubsub/articles';

logger.info('Worker init: Setting up...');

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

    listenForAppleSubscriptionNotifications();
    listenCrawlFullArticle();

  } catch (err) {
    logger.error('Worker: Captured an uncaught error', err);

    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(err);
    }
  }
});
