import * as Sentry from '@sentry/node';
import * as Integrations from '@sentry/integrations';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.HEROKU_SLUG_COMMIT,
  integrations: [
    new Integrations.RewriteFrames({
      root: __dirname,
    })
  ],
  enabled: process.env.NODE_ENV !== 'development'
});

Sentry.configureScope((scope) => {
  scope.setExtra('process', 'worker');
});

export { Sentry };
