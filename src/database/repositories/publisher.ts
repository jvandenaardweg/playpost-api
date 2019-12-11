import cacheManager from 'cache-manager';
import redisStore from 'cache-manager-redis';
import { EntityRepository, Repository } from 'typeorm';
import { Publisher } from '../entities/publisher';

const redisCache = cacheManager.caching({
  store: redisStore,
  url: process.env.REDIS_URL,
	db: 0,
	ttl: 6000
});

@EntityRepository(Publisher)
export class PublisherRepository extends Repository<Publisher> {

  async cachedFindOne(publisherId: string) {
    return redisCache.wrap(`publisher:${publisherId}`, () => {
      return this.findOne(publisherId);
    });
  }

  /**
   * This method is used to completely delete all the publishers data.
   *
   * This includes: article's in the database and generated audiofiles.
   *
   * @param publisherId
   */
  async deletePublisher(publisherId: string) {
    // TODO: delete all articles
    // TODO: delete all audiofiles
  }
}
