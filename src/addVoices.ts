import { createConnection } from 'typeorm';

import { connectionOptions } from './database/connection-options';
import { addAllGoogleVoices } from './synthesizers/google';
import { addAllAWSVoices } from './synthesizers/aws';
import { logger } from './utils/logger';

createConnection(connectionOptions('default')).then(async () => {
  try {
    logger.info('Add Voices: Checking for new voices at Google and AWS...');
    await addAllGoogleVoices();
    await addAllAWSVoices();
    logger.info('Add Voices: Done! We close.');
  } catch (err) {
    logger.error('Add Voices: An error happened.', err);
  } finally {
    logger.info('Add Voices: We close.');
    process.exit();
  }
});
