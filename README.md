# Playpost API
This repository includes the API for the Playpost App.

## Requirements development:
- TypeScript 3.0.0+
- Node 10.0.0+
- Docker

## Setup for development
1. Use the correct node version, run: `nvm use`
2. Install npm modules: `npm install`
3. Create a `.env` file in the root of this project with the following data:
```yaml
NODE_ENV = "development"

JWT_SECRET = "JustASimpleSecretForDevelopmentDoNotUseThisForProduction"

DATABASE_URL = "postgres://readtoapi:readtoapi@localhost:5432/d5sgoa8nt7dnim"

REDIS_URL = "redis://localhost:6381"

TYPEORM_URL = "postgres://readtoapi:readtoapi@localhost:5432/d5sgoa8nt7dnim"
TYPEORM_ENTITIES = "src/database/entities/**/*.ts"
TYPEORM_MIGRATIONS = "src/database/migrations/**/*.ts"

GOOGLE_CLOUD_CREDENTIALS_PROJECT_ID = "" # Ask the repository owner, or create your own
GOOGLE_CLOUD_CREDENTIALS_CLIENT_EMAIL = "" # Ask the repository owner, or create your own
GOOGLE_CLOUD_CREDENTIALS_PRIVATE_KEY = "" # Ask the repository owner, or create your own

MAILCHIMP_LIST_ID = "" # Ask the repository owner, or create your own
MAILCHIMP_API_KEY = "" # Ask the repository owner, or create your own
```
4. Run `npm run dev`, this will launch the database and start the Node server.
5. Generate a production database dump
6. Save it in `./dump/database.dump`
7. Run `docker exec -i "playpost-api-postgres" pg_restore -C --clean --no-acl --no-owner -U "readtoapi" -d "readtoapi" < "dump/database.dump"`
8. The local server should be available at http://localhost:3000

## Production database changes
Upon each deploy to Heroku, the migrations are run. To adjust this behaviour see `migrationsRun` in `./src/index.ts`.

Make sure these environment variables are set in Heroku:
```yaml
DATABASE_URL = "" # When using Heroku Postgres, this will be filled by Heroku
TYPEORM_URL = "" # This should be filled with the value of DATABASE_URL
TYPEORM_ENTITIES = "dist/database/entities/**/*.js"
TYPEORM_MIGRATIONS = "dist/database/migrations/**/*.js"
```

The above `TYPEORM_ENTITIES` and `TYPEORM_MIGRATIONS` differ from your local dev environment, as it is now using the `./dist` folder.

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
3. Run `docker exec -i "playpost-api-postgres" pg_restore -C --clean --no-acl --no-owner -U "readtoapi" -d "readtoapi" < "dump/database.dump"`

## Heroku Dyno Preparation
Make sure the correct release environment variables are available, run in your own terminal: `heroku labs:enable runtime-dyno-metadata -a playpost-api-production`
