const path = require('path');
const express = require('express');
require('express-async-errors');
const bodyParser = require('body-parser');
const Sentry = require('@sentry/node');

const audiofileController = require('./src/controllers/audiofile.js');
const meController = require('./src/controllers/me.js');
const archivesController = require('./src/controllers/archives.js');
const playlistsController = require('./src/controllers/playlists.js');
const favoritesController = require('./src/controllers/favorites.js');
const usersController = require('./src/controllers/users.js');
const authController = require('./src/controllers/auth.js');
const articlesController = require('./src/controllers/articles.js');

const PORT = process.env.PORT || 3000;

const app = express();

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://479dcce7884b457cb001deadf7408c8c@sentry.io/1399178',
    environment: 'production'
  });

  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

global.appRoot = path.resolve(__dirname);

app.get('/audiofile', audiofileController.getAudiofile);

app.get('/v1/me', meController.getMe);
app.put('/v1/me', meController.putMe);
app.delete('/v1/me', meController.deleteMe);

app.get('/v1/archives', archivesController.getArchives);
app.post('/v1/archives', archivesController.postArchives);
app.delete('/v1/archives', archivesController.deleteArchives);

app.get('/v1/playlists', playlistsController.getPlaylists);
app.post('/v1/playlists', playlistsController.postPlaylists);
app.put('/v1/playlists', playlistsController.putPlaylists);
app.delete('/v1/playlists', playlistsController.deletePlaylists);

app.get('/v1/favorites', favoritesController.getFavorites);
app.post('/v1/favorites', favoritesController.postFavorites);
app.delete('/v1/favorites', favoritesController.deleteFavorites);

app.post('/v1/users', usersController.postUsers);
app.delete('/v1/users', usersController.deleteUsers);

app.post('/v1/auth', authController.postAuth);

app.post('/v1/articles', articlesController.postArticles);
app.get('/v1/articles/:articleId', articlesController.getArticlesById);

app.get('/v1/articles/:articleId/audiofile', articlesController.getAudiofileByArticleId);
app.post('/v1/articles/:articleId/audiofile', articlesController.postAudiofileByArticleId);

app.post('/v1/articles/:articleId/favorite', articlesController.postFavoriteByArticleId);
app.delete('/v1/articles/:articleId/favorite', articlesController.deleteFavoriteByArticleId);

app.post('/v1/articles/:articleId/archive', articlesController.postArchiveByArticleId);
app.delete('/v1/articles/:articleId/archive', articlesController.deleteArchiveByArticleId);

app.post('/v1/articles/:articleId/playlist', articlesController.postPlaylistByArticleId);
app.delete('/v1/articles/:articleId/playlist', articlesController.deletePlaylistByArticleId);

app.use((err, req, res, next) => {
  if (err) {
    if (process.env.NODE_ENV === 'production') {
      // Sentry.configureScope((scope) => {
      //   scope.setUser({
      //     id: '13123123',
      //     email: 'john.doe@example.com'
      //   });
      // });

      // Capture the error for us to see in Sentry
      Sentry.captureException(err);
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
