# Playpost API

This repository includes the API for the Playpost App.

## Requirements development:

- TypeScript 3.0.0+
- Node 10.0.0+
- Docker

## Requirements server:

- Large File Upload Limit: `20m`, for documentHtml strings. https://github.com/dokku/dokku/blob/master/docs/configuration/nginx.md

## Setup for development

1. Use the correct node version, run: `nvm use`
2. Install npm modules: `npm install`
3. Create a `.env` file in the root of this project with the following data:

```yaml
NODE_ENV="development"

JWT_SECRET="JustASimpleSecretForDevelopmentDoNotUseThisForProduction"

DATABASE_URL="postgres://playpostapi:playpostapi@localhost:5432/d5sgoa8nt7dnim"

REDIS_URL="redis://localhost:6381"

TYPEORM_CONNECTION="postgres"
TYPEORM_URL="postgres://playpostapi:playpostapi@localhost:5432/d5sgoa8nt7dnim"
TYPEORM_ENTITIES="dist/database/entities/**/*.js"
TYPEORM_MIGRATIONS="dist/database/migrations/**/*.js"
TYPEORM_DRIVER_EXTRA='{ "ssl": false }'

GOOGLE_CLOUD_CREDENTIALS_PROJECT_ID="" # Ask the repository owner, or create your own
GOOGLE_CLOUD_CREDENTIALS_CLIENT_EMAIL="" # Ask the repository owner, or create your own
GOOGLE_CLOUD_CREDENTIALS_PRIVATE_KEY="" # Ask the repository owner, or create your own

AWS_USER=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION= "eu-west-1"

```

4. Run `npm run dev`, this will launch the database and start the Node server.
5. Generate a production database dump
6. Save it in `./dump/database.dump`
7. Remove the created DB: `docker exec -i "playpost-api-postgres" dropdb -U "playpostapi" "d5sgoa8nt7dnim"`
8. Create the db: `docker exec -i "playpost-api-postgres" createdb -U "playpostapi" "d5sgoa8nt7dnim"`
9. Restore the db: `docker exec -i "playpost-api-postgres" pg_restore -C --clean --no-acl --no-owner -U "playpostapi" -d "d5sgoa8nt7dnim" < "dump/database.dump"`
10. The local server should be available at http://localhost:3000

## Seeding an empty database

Some parts of the database are required to be filled in before starting. The `language` and `voice` table need data.

1. Make sure you've done the setup steps above.
1. Run `npm run typeorm:seed`
1. The `language` and `voice` table should be filled now with default data

## Production database changes

Upon each deploy to Heroku, the migrations are run. To adjust this behaviour see `migrationsRun` in `./src/index.ts`.

Make sure these environment variables are set in Heroku:

```yaml
DATABASE_URL="" # When using Heroku Postgres, this will be filled by Heroku
TYPEORM_URL="" # This should be filled with the value of DATABASE_URL
```

## Manually sync database

For whatever reason, you maybe want to manually sync and bypass the migration workflow.

**IMPORTANT**: This action could destroy production data. Always try to use migrations instead.

1. Login into Heroku
2. Go to your Dyno and open the console
3. Run `typeorm schema:sync`

The schema should now be synced.

## Update local database with production

1. Generate a production database dump
2. Save it in `./dump/database.dump`
3. Run `docker exec -i "playpost-api-postgres" pg_restore -C --clean --no-acl --no-owner -U "playpostapi" -d "d5sgoa8nt7dnim" < "dump/database.dump"`

## Heroku Dyno Preparation

Make sure the correct release environment variables are available, run in your own terminal: `heroku labs:enable runtime-dyno-metadata -a playpost-api-production`

## Get all available voices

To get all the available voices from our synthesizing service run `npm run addvoices`. This will do a call to our sythesizer service and puts all the correct voice data in the database. You can run this script once in a while to make sure we always have the correct voices.

# Subscriptions

## How to add a new subscription?

1. Create the subscription in iTunes Connect. Make it available.
2. Remember the `Product ID` and the `Price` in euro's or dollars
3. Add a new row inside the `subscription` table in the database, using the data from iTunes Connect
4. To activate it for users to use, make `isActive` `true`. If you don't want it to be available for your users yet, set `isActive` as `false`
5. Save it

A new subscription is now available. For it to work, you need to implement that inside the app.

## Apple auto-renewable subscriptions

https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/StoreKitGuide/Chapters/Subscriptions.html#//apple_ref/doc/uid/TP40008267-CH7-SW13

The behavior of auto-renewable subscriptions differs between the testing environment and the production environment.

In the testing environment, subscription renewals happen at an accelerated rate, and auto-renewable subscriptions renew a maximum of six times per day. This enables you to test how your app handles a subscription renewal, a subscription lapse, and a subscription history that includes gaps.

Because of the accelerated expiration and renewal rates, a subscription can expire before the system tries to renew the subscription, leaving a small lapse in the subscription period. Such lapses are also possible in production for a variety of reasons—make sure your app handles them correctly.

### General Notes on auto-renewal testing

Subscription length has been significantly shortened for testing purposes. This allows users to quickly test multiple renewals and expirations via TestFlight or with sandbox users.

Actual subscription duration -> Test duration

1 week -> 3 minutes
1 month -> 5 minutes
2 months -> 10 minutes
3 months -> 15 minutes
6 months -> 30 minutes
1 year -> 1 hour

The subscription will automatically renew 6 times per account per 8 hour window, then the subscription will automatically expire at the end of each subscription period. These renewals happen automatically whether the app is open or not, just like renewals on the App Store. Unlike the App Store, there’s no option to cancel, so there’s no way to directly test cancelation. There’s also no way to test subscription management while using TestFlight or sandbox users.

Each automatic renewal sends a transaction to the app. The transaction, or transactions, depending on how much time has passed, is processed the next time the app is opened. Validating these transactions triggers yet another password prompt. When the app is live on the App Store it shouldn’t trigger these additional password prompts.

## Migrations
Updating the database is strictly done using migrations.

1. Do your database changes in the entity files
2. Run `npm run build` to generate a build which the typeorm CLI can use
3. Create a migration, example: `npm run typeorm migration:generate -- --name UserInAppSubscriptionsTableRename -d src/database/migrations`
4. Verify the migration file is correct
5. Add the migration class to `migrations: []` in `src/database/connection-options.ts`. Make sure you use the correct order (oldest first).
6. Restart the service
7. When starting the service migrations are run automatically

## When updating the environment with new data

1. Make sure the migrations were run. We enabled logging for this.
2. Run `npm run database:sync`
3. Run `npm run caches:empty`

## Run schema:sync on production

**Important:** Schema syncing could be destructive. First check what queries it will run...

1. SSH into the server
2. Run: `dokku enter playpost-api-production web`
3. Run: `npm run typeorm schema:sync`
4. Run `npm run database:sync`
4. Schema and database is now synced.
