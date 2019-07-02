import { emptyAllCaches } from './cache';
import { logger } from './utils/logger';

(async () => {
  const loggerPrefix = 'Empty Cache:';

  try {
    logger.info(loggerPrefix, 'Empty caches...');
    await emptyAllCaches();
    logger.info(loggerPrefix, 'Successfully empty caches!');
  } catch (err) {
    logger.error(loggerPrefix, 'Error while emptying caches');
    logger.error(err);
  } finally {
    process.exit();
  }
})();
