require('dotenv').config();
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import express from 'express';
import 'express-async-errors';
import bodyParser from 'body-parser';
import * as Sentry from '@sentry/node';
import passport from 'passport';
import helmet from 'helmet';
import compression from 'compression';

import * as audiofileController from './controllers/audiofile';
import * as meController from './controllers/me';
import * as archivesController from './controllers/archives';
import * as playlistsController from './controllers/playlists';
import * as favoritesController from './controllers/favorites';
import * as usersController from './controllers/users';
import * as authController from './controllers/auth';
import * as articlesController from './controllers/articles';

declare global {
  namespace NodeJS {
    interface Global {
      __rootdir__: string;
    }
  }
}

global.__rootdir__ = path.resolve(__dirname + '/../') || path.resolve(process.cwd() + '/../');

const PORT = process.env.PORT || 3000;
const IS_PROTECTED = passport.authenticate('jwt', { session: false, failWithError: true });

const app = express();
app.use(helmet());
app.use(compression());

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://479dcce7884b457cb001deadf7408c8c@sentry.io/1399178',
    environment: 'production',
    integrations: [
      new Sentry.Integrations.RewriteFrames({
        root: global.__rootdir__
      })
    ]
  });

  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}

// Use passport authentication
app.use(passport.initialize());
require('./config/passport')(passport);

// Make express allow JSON payload bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Endpoints
app.get('/audiofile', audiofileController.getAudiofile); // Legacy, now in use by our iOS App

app.get('/v1/audiofile', audiofileController.getAudiofile); // Legacy, now in use by our iOS App


app.post('/v1/users', usersController.postUsers); // Creating of users is not protected by a login ofcourse
app.get('/v1/users/:userId', IS_PROTECTED, meController.getMe);
app.delete('/v1/users/:userId', IS_PROTECTED, usersController.deleteUsers);
// app.patch('/v1/users/:userId/email', IS_PROTECTED, usersController.deleteUsers);
// app.patch('/v1/users/:userId/password', IS_PROTECTED, usersController.deleteUsers);
// app.get('/v1/users/:userId/playlists', IS_PROTECTED, meController.getMe);
// app.get('/v1/users/:userId/favorites', IS_PROTECTED, meController.getMe);
// app.get('/v1/users/:userId/archives', IS_PROTECTED, meController.getMe);

app.get('/v1/me', IS_PROTECTED, meController.getMe);
app.get('/v1/me/favorites', IS_PROTECTED, meController.findAllFavoriteArticles);
app.post('/v1/me/favorites', IS_PROTECTED, meController.createFavoriteArticle);
app.get('/v1/me/articles', IS_PROTECTED, meController.findAllCreatedArticles);

// app.get('/v1/me/playlist', IS_PROTECTED, meController.findAllPlaylist);
// app.post('/v1/me/playlist', IS_PROTECTED, meController.createPlaylist);
// app.get('/v1/me/archive', IS_PROTECTED, meController.findAllArchive);
// app.get('/v1/me/favorites', IS_PROTECTED, meController.findAllFavorites);
// app.post('/v1/me/favorites', IS_PROTECTED, meController.createFavorite);
app.patch('/v1/me/email', IS_PROTECTED, meController.patchMeEmail);
app.patch('/v1/me/password', IS_PROTECTED, meController.patchMePassword);
app.delete('/v1/me', IS_PROTECTED, meController.deleteMe);

app.get('/v1/archives', IS_PROTECTED, archivesController.getArchives);
app.post('/v1/archives', IS_PROTECTED, archivesController.postArchives);
app.delete('/v1/archives', IS_PROTECTED, archivesController.deleteArchives);

app.get('/v1/playlists', IS_PROTECTED, playlistsController.getPlaylists);
app.post('/v1/playlists', IS_PROTECTED, playlistsController.postPlaylists);
app.put('/v1/playlists', IS_PROTECTED, playlistsController.putPlaylists);
app.delete('/v1/playlists', IS_PROTECTED, playlistsController.deletePlaylists);

app.get('/v1/favorites', IS_PROTECTED, favoritesController.getFavorites);
app.post('/v1/favorites', IS_PROTECTED, favoritesController.postFavorites);
app.delete('/v1/favorites', IS_PROTECTED, favoritesController.deleteFavorites);

app.post('/v1/auth', authController.postAuth);

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

app.all('*', async (req: Request, res: Response) => res.status(404).json({ message: `No route found for ${req.method} ${req.url}` }));

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
app.listen(PORT, () => console.log(`App listening on port ${PORT}!`));
