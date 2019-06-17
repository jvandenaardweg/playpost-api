import { PubSub } from '@google-cloud/pubsub';
import { getGoogleCloudCredentials } from '../utils/credentials';

const { GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE } = process.env;

/**
 * Publishes the articleId and articleUrl to our PubSub events so we can fetch the article details
 * when this event gets fired.
 *
 * @param articleId
 * @param articleUrl
 */
export async function publishCrawlFullArticle(articleId: string, articleUrl: string) {
  const pubsub = new PubSub(getGoogleCloudCredentials());

  const buffer = Buffer.from(JSON.stringify({
    articleId,
    articleUrl
  }));

  const result = await pubsub.topic(GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE).publish(buffer);

  return result;
}
