#!/bin/sh

# Version key/value should be on his own line
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",\t ]//g')

echo $PACKAGE_VERSION

# Upload sourcemaps to Sentry
npx sentry-cli releases --org "playpost" --project "playpost-api" files "$PACKAGE_VERSION" upload-sourcemaps dist/ --rewrite --validate

# Makes sure subscription, language and voice data is the same between all environments
npm run database:sync

# Clear the Redis cache upon each new release
npm run caches:empty
