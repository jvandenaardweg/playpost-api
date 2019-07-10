require('dotenv').config();
import expressCluster from 'express-cluster';
import os from 'os';
import * as Sentry from '@sentry/node';
import * as Integrations from '@sentry/integrations';

import { logger } from './utils';
import { setupServer } from './server';

const WORKER_COUNT = process.env.NODE_ENV === 'production' ? os.cpus().length : 2;

logger.info('App init:', `Using ${WORKER_COUNT} workers...`);

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.GIT_REV ? process.env.GIT_REV : undefined,
  integrations: [
    new Integrations.RewriteFrames({
      root: __dirname
    })
  ],
  enabled: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test'
});

logger.info('App init:', 'Sentry setup!', Sentry.SDK_VERSION);

async function bootstrap() {
  await expressCluster(
    async () => {
      try {
        const app = await setupServer();
        throw new Error('Sentry!');
        return app;
      } catch (err) {
        return Sentry.captureException(err);
      }
    },
    { count: WORKER_COUNT }
  );
}

bootstrap();
