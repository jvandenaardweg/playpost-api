## Requirements:
- Docker
- ffmpeg: https://evermeet.cx/ffmpeg/
- When using Heroku, use this buildpack: https://elements.heroku.com/buildpacks/jonathanong/heroku-buildpack-ffmpeg-latest

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
TYPEORM_ENTITIES = "dist/entities/**/*.js"
TYPEORM_MIGRATIONS = "dist/migrations/**/*.js"
```
5. Run `npm run dev`, this will launch the database and start the Node server.
6. The local server should be available at http://localhost:3000

## Access to Medium
Medium does not offer an API to retrieve the bookmarks. So we use a Webview to read the bookmarks for the user. The user is asked to login into the Medium.com website. When loggedin, we can read retrieve the Medium post URL's from that user. Completely safe and secure.

## Getting the Medium post info
Medium has a JSON endpoint for posts: `https://medium.freecodecamp.org/learn-typescript-in-5-minutes-13eda868daeb?format=json`. We just need to append `?format=json` to the URL.

## Refreshing the bookmarks
Upon refresh, we check if the user is still logged in into the WebView.
If so, we can just refresh the bookmarks page and find the new bookmarks.
If the user is logged out, the user receives an alert to log back in.

## Data structure
| Column | Value |
| - | - |
| id | 1 |
| mediumId | 13eda868daeb |
| title | Learn TypeScript in 5 minutes |
| subtitle | A quick intro tutorial on how to write static JavaScript |
| url | https://medium.freecodecamp.org/learn-typescript-in-5-minutes-13eda868daeb |
| imageUrl | https://medium.freecodecamp.org/learn-typescript-in-5-minutes-13eda868daeb |
| readingTime | 4.392452830188679 |
| listenTime | 3 |
| detectedLanguage | en |
| author | Per Harald Borgen |
| authorUrl | https://medium.com/perborgen |
| publication | freeCodeCamp.org |
| publicationUrl | https://medium.com/free-code-camp |
| listensTotal | 12 |
| listensUnique | 5 |
| listensComplete | 1 |
