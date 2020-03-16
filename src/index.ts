// tslint:disable-next-line
const { version } = require('../package.json');

if (process.env.API_ENVIRONMENT === 'production') {
  // tslint:disable-next-line
  require('newrelic');
}


import expressCluster from 'express-cluster';
import os from 'os';
import { Sentry } from './sentry';

import { setupServer } from './server';
import { logger } from './utils';

const WORKER_COUNT = process.env.API_ENVIRONMENT === 'test' ? 1 : process.env.API_ENVIRONMENT === 'production' ? os.cpus().length : 2;

logger.info('App init: Setting up...');

logger.info('App init:', 'Release version:', version);

logger.info('App init:', `Using ${WORKER_COUNT} workers...`);

logger.info('App init:', 'Sentry setup!', Sentry.SDK_VERSION);

async function bootstrap() {
  await expressCluster(
    async () => {
      try {
        const app = await setupServer();
        return app;
      } catch (err) {
        logger.error('Error during setup', err.message);
        return Sentry.captureException(err);
      }
    },
    { count: WORKER_COUNT }
  );
}

bootstrap();
