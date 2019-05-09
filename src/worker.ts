require('dotenv').config();
import { createConnection } from 'typeorm';
import * as Sentry from '@sentry/node';
import * as Integrations from '@sentry/integrations';

import { connectionOptions } from './database/connection-options';
import { redisClientSub } from './cache';
import { addEmailToMailchimpList, removeEmailToMailchimpList } from './mailers/mailchimp';
import * as articlesController from './controllers/articles';
import { ArticleStatus } from './database/entities/article';
import { logger } from './utils';

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

    redisClientSub.on('message', async (channel, message) => {
      if (channel === 'FETCH_FULL_ARTICLE') {
        const articleId = message;
        logger.info('Worker process started: ', channel, articleId);

        try {
          await articlesController.updateArticleStatus(articleId, ArticleStatus.CRAWLING);
          await articlesController.updateArticleToFull(articleId);
          logger.info('Worker process success: ', channel, articleId);
        } catch (err) {
          logger.error('Worker process failed: ', channel, articleId, err);

          if (process.env.NODE_ENV === 'production') {
            Sentry.withScope((scope) => {
              scope.setExtra('articleId', articleId);
              scope.setLevel(Sentry.Severity.Critical);
              Sentry.captureMessage('Failed to fully fetch an article.');
              Sentry.captureException(err);
            });
          }

          await articlesController.updateArticleStatus(articleId, ArticleStatus.FAILED);
          logger.info('Worker process set status to failed: ', channel, articleId);
        } finally {
          logger.info('Worker process ended: ', channel, articleId);
        }
      }

      if (channel === 'ADD_TO_MAILCHIMP_LIST') {
        const userEmail = message;
        logger.info('Worker process started: ', channel, userEmail);

        try {
          await addEmailToMailchimpList(userEmail);
          logger.info('Worker process success: ', channel, userEmail);
        } catch (err) {
          logger.error('Worker process failed: ', channel, userEmail, err);

          if (process.env.NODE_ENV === 'production') {
            Sentry.withScope((scope) => {
              scope.setExtra('email', userEmail);
              scope.setLevel(Sentry.Severity.Critical);
              Sentry.captureMessage('Failed to add an e-mail address to Mailchimp list.');
              Sentry.captureException(err);
            });
          }
        } finally {
          logger.info('Worker process ended: ', channel, userEmail);
        }
      }

      if (channel === 'REMOVE_FROM_MAILCHIMP_LIST') {
        const userEmail = message;
        logger.info('Worker process started: ', channel, userEmail);

        try {
          await removeEmailToMailchimpList(userEmail);
          logger.info('Worker process success: ', channel, userEmail);
        } catch (err) {
          logger.error('Worker process failed: ', channel, userEmail, err);

          if (process.env.NODE_ENV === 'production') {
            Sentry.withScope((scope) => {
              scope.setExtra('email', userEmail);
              scope.setLevel(Sentry.Severity.Critical);
              Sentry.captureMessage('Failed to remove an e-mail address from a Mailchimp list.');
              Sentry.captureException(err);
            });
          }
        } finally {
          logger.info('Worker process ended: ', channel, userEmail);
        }
      }
    });
  } catch (err) {
    logger.error('Worker: Captured an uncaught error', err);

    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(err);
    }
  }
});
