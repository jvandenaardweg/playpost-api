require('dotenv').config();
import expressCluster from 'express-cluster';
import os from 'os';

import { logger } from './utils';
import { setupServer } from './server';

const WORKER_COUNT = process.env.NODE_ENV === 'production' ? os.cpus().length : 2;

logger.info('App init:', `Using ${WORKER_COUNT} workers...`);

async function bootstrap() {
  await expressCluster(
    async () => {
      const app = await setupServer();
      return app;
    },
    { count: WORKER_COUNT }
  );
}

bootstrap();
