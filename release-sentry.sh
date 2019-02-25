#!/bin/sh
npx sentry-cli releases --org test-mx --project nodejs files $HEROKU_SLUG_COMMIT upload-sourcemaps dist/ --no-rewrite --validate
