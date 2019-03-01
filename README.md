# Readto API
This repository includes the API for the Readto App.

## Requirements development:
- Docker
- ffmpeg: https://evermeet.cx/ffmpeg/

## Requirements production (Heroku)
- ffmpeg: https://elements.heroku.com/buildpacks/jonathanong/heroku-buildpack-ffmpeg-latest

## Setup for development
1. Use the correct node version, run: `nvm use`
2. Install ffmpeg: `brew install ffmpeg`
3. Install npm modules: `npm install`
4. Create a `.env` file in the root of this project with the following data:
```
NODE_ENV = "development"

GOOGLE_CLOUD_CREDENTIALS_PROJECT_ID = "" # Ask the repository owner for the contents of this environment variable.
GOOGLE_CLOUD_CREDENTIALS_CLIENT_EMAIL = "" # Ask the repository owner for the contents of this environment variable.
GOOGLE_CLOUD_CREDENTIALS_PRIVATE_KEY = "" # Ask the repository owner for the contents of this environment variable.

JWT_SECRET = "JustASimpleSecretForDevelopmentDoNotUseThisForProduction"

DATABASE_URL = "postgres://readtoapi:readtoapi@localhost:5432/readtoapi"

REDIS_URL = "redis://localhost:6381"

TYPEORM_URL = "postgres://readtoapi:readtoapi@localhost:5432/readtoapi"
TYPEORM_ENTITIES = "src/database/entities/**/*.ts"
TYPEORM_MIGRATIONS = "src/database/migrations/**/*.ts"
```
5. Run `npm run dev`, this will launch the database and start the Node server.
6. The local server should be available at http://localhost:3000

## Production database changes
Upon each deploy to Heroku, the migrations are run. To adjust this behaviour see `migrationsRun` in `./src/index.ts`.

Make sure these environment variables are set in Heroku:
```
DATABASE_URL = "" # Filled by Heroku Postgres
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
