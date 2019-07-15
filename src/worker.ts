import * as Sentry from '@sentry/node';
import { createConnection } from 'typeorm';

import { connectionOptions } from './database/connection-options';

import { listenCrawlFullArticle } from './pubsub/articles';
import { listenForAppleSubscriptionNotifications } from './pubsub/in-app-subscriptions';
import { logger } from './utils';

logger.info('Worker init: Setting up...');

Sentry.configureScope(scope => {
  scope.setExtra('process', 'worker');
});

logger.info('Worker init: Sentry configured.');

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

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      scope.setExtra('connection', connection);
      Sentry.captureException(err);
    });
  }
});
