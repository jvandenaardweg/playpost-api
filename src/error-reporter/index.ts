import * as Sentry from '@sentry/node';
import * as Integrations from '@sentry/integrations';

Sentry.init({
  dsn: process.env.NODE_ENV !== 'development' ? process.env.SENTRY_DSN : undefined,
  environment: process.env.NODE_ENV,
  release: process.env.GIT_REV ? process.env.GIT_REV : undefined,
  integrations: [
    new Integrations.RewriteFrames({
      root: __dirname
    })
  ],
  enabled: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test'
});

export { Sentry };
