import { redisClientSub } from './cache';
import { addEmailToMailchimpList, removeEmailToMailchimpList } from './mailers/mailchimp';
import * as articlesController from './controllers/articles';
import { ArticleStatus } from 'database/entities/article';

// Listen for the message to fetch the full article.
// This happens right after the insert of a new article.
// Since the crawling of the full article details takes longer...
// ...we do it right after insertion in the database of the minimal article details
redisClientSub.on('message', async (channel, message) => {
  if (channel === 'FETCH_FULL_ARTICLE') {
    const articleId = message;
    console.log('Worker process started: ', channel, articleId);

    try {
      await articlesController.updateArticleStatus(articleId, ArticleStatus.CRAWLING);
      await articlesController.updateArticleToFull(articleId);
    } catch (err) {
      console.log('FETCH_FULL_ARTICLE failed.', err);
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
    } finally {
      console.log('Worker process ended: ', channel, userEmail);
    }
  }
});
