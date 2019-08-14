// tslint:disable-next-line
const { version } = require('../package.json');

import * as Integrations from '@sentry/integrations';
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://479dcce7884b457cb001deadf7408c8c@sentry.io/1399178',
  enabled: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test', // Do not run on your local machine
  environment: process.env.NODE_ENV,
  integrations: [
    new Integrations.RewriteFrames({
      root: __dirname
    })
  ],
  release: version ? version : undefined,
});

export { Sentry }
