import { redisClientSub } from './cache';
import { addEmailToMailchimpList, removeEmailToMailchimpList } from './mailers/mailchimp';
import * as articlesController from './controllers/articles';

// Listen for the message to fetch the full article.
// This happens right after the insert of a new article.
// Since the crawling of the full article details takes longer...
// ...we do it right after insertion in the database of the minimal article details
redisClientSub.on('message', async (channel, message) => {
  if (channel === 'FETCH_FULL_ARTICLE') {
    const articleId = message;

    try {
      await articlesController.updateArticleToFull(articleId);
    } catch (err) {
      console.log('FETCH_FULL_ARTICLE failed.', err);
    }
  }

  if (channel === 'ADD_TO_MAILCHIMP_LIST') {
    const userEmail = message;

    try {
      await addEmailToMailchimpList(userEmail);
    } catch (err) {
      console.log('ADD_TO_MAILCHIMP_LIST failed.', err);
    }

  }

  if (channel === 'REMOVE_FROM_MAILCHIMP_LIST') {
    const userEmail = message;

    try {
      await removeEmailToMailchimpList(userEmail);
    } catch (err) {
      console.log('REMOVE_FROM_MAILCHIMP_LIST failed.', err);
    }
  }
});
