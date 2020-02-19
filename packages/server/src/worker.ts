// tslint:disable-next-line
const { version } = require('../package.json');

import { createConnection } from 'typeorm';

import { Sentry } from './sentry';

import { connectionOptions } from './database/connection-options';

import { listenCrawlFullArticle } from './pubsub/articles';
import { listenForAppleSubscriptionNotifications, listenForGoogleSubscriptionNotifications } from './pubsub/in-app-subscriptions';
import { logger } from './utils';

logger.info('Worker init: Setting up...');

logger.info('Worker init:', 'Release version:', version);

logger.info('Worker init:', 'Sentry setup!', Sentry.SDK_VERSION);

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
    listenForGoogleSubscriptionNotifications();
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
