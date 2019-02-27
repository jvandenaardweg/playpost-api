require('dotenv').config();
import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import helmet from 'helmet';
import compression from 'compression';
import * as Sentry from '@sentry/node';
import path from 'path';
import { createConnection, ConnectionOptions } from 'typeorm';

import * as audiofileController from './controllers/audiofile';
import * as meController from './controllers/me';
import * as archivesController from './controllers/archives';
import * as playlistsController from './controllers/playlists';
import * as favoritesController from './controllers/favorites';
import * as usersController from './controllers/users';
import * as authController from './controllers/auth';
import * as articlesController from './controllers/articles';

import { User } from './entities/User';
import { Article } from './entities/Article';
import { Playlist } from './entities/Playlist';
import { PlaylistItem } from './entities/PlaylistItem';

const PORT = process.env.PORT || 3000;
const IS_PROTECTED = passport.authenticate('jwt', { session: false, failWithError: true });

const connectionOptions: ConnectionOptions = {
  type: 'postgres',
  // cache: {
  //   duration: 3600000 // 60 minutes
  // },
  url: process.env.DATABASE_URL,
  extra: {
    ssl: (process.env.NODE_ENV === 'production') ? true : false // For Heroku
  },
  logging: (process.env.NODE_ENV === 'production') ? false : true, // Loggging in dev
  synchronize: (process.env.NODE_ENV === 'production') ? false : true, // Sync changes directly when in dev
  entities: [path.join(__dirname, 'entities/**/*')],
  migrationsRun: true, // Run migrations on start. So when we deploy to production, migrations run automatically.
  dropSchema: false
};

// Create a connection with the database
createConnection(connectionOptions).then(async (connection: any) => {
  console.log('App init:', 'Connected with database', connection.options.url);

  const app: express.Application = express();
  app.use(helmet());
  app.use(compression());

  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      release: process.env.HEROKU_SLUG_COMMIT,
      integrations: [
        new Sentry.Integrations.RewriteFrames({
          root: __dirname,
        })
      ]
    });

    // The request handler must be the first middleware on the app
    app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
    app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);
  }

  // Use passport authentication
  app.use(passport.initialize());
  require('./config/passport')(passport);

  // Make express allow JSON payload bodies
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // API Endpoints

  // Public
  app.post('/v1/auth', authController.getAuthenticationToken);
  app.post('/v1/users', usersController.createUser); // Creating of users is not protected by a login ofcourse
  app.get('/v1/audiofile', audiofileController.getAudiofile); // Legacy, now in use by our iOS App

  // Protected

  app.get('/v1/users', usersController.findAllUsers);
  app.delete('/v1/users/:userId', usersController.deleteUser);

  // /v1/me
  app.get('/v1/me', IS_PROTECTED, meController.getMe);
  app.get('/v1/me/favorites', IS_PROTECTED, meController.findAllFavoriteArticles);
  app.post('/v1/me/favorites', IS_PROTECTED, meController.createFavoriteArticle);
  app.get('/v1/me/articles', IS_PROTECTED, meController.findAllCreatedArticles);
  app.patch('/v1/me/email', IS_PROTECTED, meController.updateEmail);
  app.patch('/v1/me/password', IS_PROTECTED, meController.updatePassword);
  app.delete('/v1/me', IS_PROTECTED, meController.deleteMe);

  // /v1/archives
  app.get('/v1/archives', IS_PROTECTED, archivesController.getArchives);
  app.post('/v1/archives', IS_PROTECTED, archivesController.postArchives);
  app.delete('/v1/archives', IS_PROTECTED, archivesController.deleteArchives);

  // /v1/playlists
  app.get('/v1/playlists', IS_PROTECTED, playlistsController.getPlaylists);
  app.post('/v1/playlists', IS_PROTECTED, playlistsController.postPlaylists);
  app.put('/v1/playlists', IS_PROTECTED, playlistsController.putPlaylists);
  app.delete('/v1/playlists', IS_PROTECTED, playlistsController.deletePlaylists);

  // /v1/facorites
  app.get('/v1/favorites', IS_PROTECTED, favoritesController.getFavorites);
  app.post('/v1/favorites', IS_PROTECTED, favoritesController.postFavorites);
  app.delete('/v1/favorites', IS_PROTECTED, favoritesController.deleteFavorites);

  app.post('/v1/articles', IS_PROTECTED, articlesController.postArticles);
  app.get('/v1/articles/:articleId', IS_PROTECTED, articlesController.getArticlesById);

  app.get('/v1/articles/:articleId/audiofiles', IS_PROTECTED, articlesController.getAudiofileByArticleId);
  app.post('/v1/articles/:articleId/audiofiles', IS_PROTECTED, articlesController.postAudiofileByArticleId);

  app.post('/v1/articles/:articleId/favorites', IS_PROTECTED, articlesController.postFavoriteByArticleId);
  app.delete('/v1/articles/:articleId/favorites', IS_PROTECTED, articlesController.deleteFavoriteByArticleId);

  app.post('/v1/articles/:articleId/archives', IS_PROTECTED, articlesController.postArchiveByArticleId);
  app.delete('/v1/articles/:articleId/archives', IS_PROTECTED, articlesController.deleteArchiveByArticleId);

  app.post('/v1/articles/:articleId/playlists', IS_PROTECTED, articlesController.postPlaylistByArticleId);
  app.delete('/v1/articles/:articleId/playlists', IS_PROTECTED, articlesController.deletePlaylistByArticleId);

  // Catch all
  app.all('*', async (req: Request, res: Response) => {
    const message = `No route found for ${req.method} ${req.url}`;

    if (process.env.NODE_ENV === 'production') {
      // Capture this error in Sentry, maybe we can fix it when users go to unused routes alot
      Sentry.captureMessage(message);
    }

    return res.status(404).json({ message });
  });

  // Handle error exceptions
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    /* eslint-disable no-console */

    if (err) {
      if (process.env.NODE_ENV === 'production') {
        // Grab the user so we can give some context to our errors
        if (req.user) {
          const { id, email } = req.user;

          Sentry.configureScope((scope) => {
            scope.setUser({ id, email });
          });

          console.log(`Error for user ID "${id}", email: "${email}"`);
        }

        // Capture the error for us to see in Sentry
        Sentry.captureException(err);
      }

      console.log(`Error on route: ${req.method} ${req.url} "${err.message}"`);
      console.error(err);

      if (err.message === 'Unauthorized') {
        return res.status(401).json({
          message: 'Unauthorized. You don\'t have access to this endpoint. If you are not loggedin, try again by logging in.'
        });
      }

      // Return a general error to the user
      return res.status(500).json({
        message: 'An unexpected error occurred. Please try again or contact us when this happens again.'
      });
    }

    return next(err);
  });

  /* eslint-disable no-console */
  app.listen(PORT, () => console.log(`App init: Listening on port ${PORT}!`));
});
