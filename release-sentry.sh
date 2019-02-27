#!/bin/sh
# Upload sourcemaps to Sentry
npx sentry-cli releases --org $SENTRY_ORG --project $SENTRY_PROJECT files $HEROKU_SLUG_COMMIT upload-sourcemaps dist/ --no-rewrite --validate
