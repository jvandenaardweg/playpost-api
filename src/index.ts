// tslint:disable-next-line
const { version } = require('../package.json');

import * as Integrations from '@sentry/integrations';
import * as Sentry from '@sentry/node';
import expressCluster from 'express-cluster';
import os from 'os';

import { setupServer } from './server';
import { logger } from './utils';

const WORKER_COUNT = process.env.NODE_ENV === 'production' ? os.cpus().length : 2;

logger.info('App init:', 'Release version:', version);

logger.info('App init:', `Using ${WORKER_COUNT} workers...`);

Sentry.init({
  dsn: 'https://479dcce7884b457cb001deadf7408c8c@sentry.io/1399178',
  enabled: process.env.NODE_ENV === 'production', // Do not run on your local machine
  environment: process.env.NODE_ENV,
  integrations: [
    new Integrations.RewriteFrames({
      root: __dirname
    })
  ],
  release: version ? version : undefined,
});

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
