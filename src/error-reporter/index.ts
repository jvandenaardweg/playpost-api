import * as Sentry from '@sentry/node';
import * as Integrations from '@sentry/integrations';

Sentry.init({
  dsn: (process.env.NODE_ENV !== 'development') ? process.env.SENTRY_DSN : undefined,
  environment: process.env.NODE_ENV,
  release: (process.env.NODE_ENV !== 'development') ? process.env.HEROKU_SLUG_COMMIT : undefined,
  integrations: [
    new Integrations.RewriteFrames({
      root: __dirname,
    })
  ],
  enabled: process.env.NODE_ENV !== 'test' // Disabled when running tests
});

export { Sentry };
