require('dotenv').config();
import { createConnection } from 'typeorm';
import * as Sentry from '@sentry/node';
import * as Integrations from '@sentry/integrations';

import { connectionOptions } from './database/connection-options';
import { redisClientSub } from './cache';
import { addEmailToMailchimpList, removeEmailToMailchimpList } from './mailers/mailchimp';
import * as articlesController from './controllers/articles';
import { ArticleStatus } from './database/entities/article';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    release: process.env.HEROKU_SLUG_COMMIT,
    integrations: [
      new Integrations.RewriteFrames({
        root: __dirname,
      })
    ]
  });
}

// Listen for the message to fetch the full article.
// This happens right after the insert of a new article.
// Since the crawling of the full article details takes longer...
// ...we do it right after insertion in the database of the minimal article details
createConnection(connectionOptions('default')).then(async (connection: any) => {
  console.log('Worker init:', 'Connected with database', connection.options.url);

  redisClientSub.on('message', async (channel, message) => {
    if (channel === 'FETCH_FULL_ARTICLE') {
      const articleId = message;
      console.log('Worker process started: ', channel, articleId);

      try {
        await articlesController.updateArticleStatus(articleId, ArticleStatus.CRAWLING);
        await articlesController.updateArticleToFull(articleId);
      } catch (err) {
        console.log('FETCH_FULL_ARTICLE failed.', err);

        Sentry.withScope((scope) => {
          scope.setExtra('articleId', articleId);
          scope.setExtra('Error', err);
          Sentry.captureMessage('Failed to fully fetch an article.', Sentry.Severity.Critical);
        });

        await articlesController.updateArticleStatus(articleId, ArticleStatus.FAILED);
      } finally {
        console.log('Worker process ended: ', channel, articleId);
      }
    }

    if (channel === 'ADD_TO_MAILCHIMP_LIST') {
      const userEmail = message;
      console.log('Worker process started: ', channel, userEmail);

      try {
        await addEmailToMailchimpList(userEmail);
      } catch (err) {
        console.log('ADD_TO_MAILCHIMP_LIST failed.', err);

        Sentry.withScope((scope) => {
          scope.setExtra('email', userEmail);
          scope.setExtra('Error', err);
          Sentry.captureMessage('Failed to add an e-mail address to Mailchimp list.', Sentry.Severity.Error);
        });
      } finally {
        console.log('Worker process ended: ', channel, userEmail);
      }
    }

    if (channel === 'REMOVE_FROM_MAILCHIMP_LIST') {
      const userEmail = message;
      console.log('Worker process started: ', channel, userEmail);

      try {
        await removeEmailToMailchimpList(userEmail);
      } catch (err) {
        console.log('REMOVE_FROM_MAILCHIMP_LIST failed.', err);

        Sentry.withScope((scope) => {
          scope.setExtra('email', userEmail);
          scope.setExtra('Error', err);
          Sentry.captureMessage('Failed to remove an e-mail address from a Mailchimp list.', Sentry.Severity.Error);
        });
      } finally {
        console.log('Worker process ended: ', channel, userEmail);
      }
    }
  });
});
