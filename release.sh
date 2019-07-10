#!/bin/sh
# Upload sourcemaps to Sentry
npx sentry-cli releases --org $SENTRY_ORG --project $SENTRY_PROJECT files $SEMAPHORE_GIT_SHA upload-sourcemaps dist/ --no-rewrite --validate

# Makes sure subscription, language and voice data is the same between all environments
npm run database:sync

# Clear the Redis cache upon each new release
npm run caches:empty
