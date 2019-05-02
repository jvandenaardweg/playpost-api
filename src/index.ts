require('dotenv').config();
import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import helmet from 'helmet';
import compression from 'compression';
import responseTime from 'response-time';
import * as Sentry from '@sentry/node';
import * as Integrations from '@sentry/integrations';
import { createConnection } from 'typeorm';
import ExpressRateLimit from 'express-rate-limit';
import ExpressBrute from 'express-brute';

import * as audiofileController from './controllers/audiofiles';
import * as meController from './controllers/me';
import * as playlistsController from './controllers/playlists';
import * as usersController from './controllers/users';
import * as authController from './controllers/auth';
import * as articlesController from './controllers/articles';
import * as catchAllController from './controllers/catch-all';
import * as voicesController from './controllers/voices';

import { connectionOptions } from './database/connection-options';
import { expressRateLimitRedisStore } from './cache';

/* eslint-disable no-console */

const PORT = process.env.PORT || 3000;
const IS_PROTECTED = passport.authenticate('jwt', { session: false, failWithError: true });

const bruteStore = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(bruteStore, {
  freeRetries: 3,
  failCallback: (req: Request, res: Response, next: NextFunction, nextValidRequestDate: Date) => {
    return res.json({ message: `Hold your horses! Too many login requests. Please try again later at: ${nextValidRequestDate}` });
  },
  handleStoreError: (err) => console.log(err)
});

const rateLimiter = new ExpressRateLimit({
  store: expressRateLimitRedisStore,
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests allowed per minute, 1 per second
  message: 'Ho, ho. Slow down! It seems like you are doing too many requests. Please cooldown and try again later.'
});

const defaultConnection = connectionOptions('default');

console.log('App init:', 'Connecting with database...');

// Create a connection with the database
createConnection(defaultConnection).then(async (connection: any) => {
  console.log('App init:', 'Connected with database', connection.options.url);

  const app: express.Application = express();

  // Hardening our server using Helmet
  app.use(helmet());
  app.use(helmet.contentSecurityPolicy({ directives: { defaultSrc: ["'self'"], styleSrc: ["'self'"] } })); // https://helmetjs.github.io/docs/csp/
  app.use(helmet.noCache());  // https://helmetjs.github.io/docs/nocache/
  app.use(helmet.permittedCrossDomainPolicies()); // https://helmetjs.github.io/docs/crossdomain/
  app.use(helmet.referrerPolicy({ policy: 'same-origin' })); // https://helmetjs.github.io/docs/referrer-policy/

  app.use(rateLimiter);

  app.use(responseTime());
  app.use(compression());

  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      release: process.env.HEROKU_SLUG_COMMIT,
      integrations: [
        new Integrations.RewriteFrames({
          root: __dirname,
        })
      ]
    });

    Sentry.configureScope((scope) => {
      scope.setExtra('process', 'web');
    });

    // The request handler must be the first middleware on the app
    app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
    app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);
  }

  // app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
  // app.use('/v1/', apiLimiter);

  // Use passport authentication
  app.use(passport.initialize());
  require('./config/passport')(passport);

  // Make express allow JSON payload bodies
  app.use(bodyParser.json({
    limit: '10kb' // https://medium.com/@nodepractices/were-under-attack-23-node-js-security-best-practices-e33c146cb87d#cb8f
  }));
  app.use(bodyParser.urlencoded({ extended: true }));

  // API Endpoints

  // Public
  // Use expressBrute to increase the delay between each requests
  app.post('/v1/auth', bruteforce.prevent, authController.getAuthenticationToken);
  app.post('/v1/auth', authController.getAuthenticationToken);
  app.post('/v1/users', usersController.createUser);

  // Protected

  // v1/users
  app.get('/v1/users', usersController.findAllUsers);
  app.delete('/v1/users/:userId', usersController.deleteUser);

  // /v1/me
  app.get('/v1/me', IS_PROTECTED, meController.findCurrentUser);
  // app.get('/v1/me/logout', IS_PROTECTED, meController.logout);
  app.get('/v1/me/playlists', IS_PROTECTED, meController.findAllPlaylists);
  app.get('/v1/me/articles', IS_PROTECTED, meController.findAllArticles);
  app.get('/v1/me/audiofiles', IS_PROTECTED, meController.findAllAudiofiles);
  app.patch('/v1/me/email', IS_PROTECTED, meController.updateEmail);
  app.patch('/v1/me/password', IS_PROTECTED, meController.updatePassword);
  app.delete('/v1/me', IS_PROTECTED, meController.deleteCurrentUser);

  // Playlists => /v1/playlists
  app.get('/v1/playlists', IS_PROTECTED, playlistsController.findAllPlaylists);
  app.post('/v1/playlists', IS_PROTECTED, playlistsController.createPlaylist);
  app.get('/v1/playlists/:playlistId', IS_PROTECTED, playlistsController.findPlaylistById);
  // app.post('/v1/playlists/:playlistId/articles/:articleId', IS_PROTECTED, playlistsController.createPlaylistItemByArticleId);
  app.post('/v1/playlists/:playlistId/articles', IS_PROTECTED, playlistsController.createPlaylistItemByArticleUrl);
  app.delete('/v1/playlists/:playlistId/articles/:articleId', IS_PROTECTED, playlistsController.deletePlaylistItem);

  // Playlist Items => /v1/playlist/:playlistId/playlistitems
  app.patch('/v1/playlists/:playlistId/playlistitems/:playlistItemId/order', IS_PROTECTED, playlistsController.patchPlaylistItemOrder);

  // /v1/articles
  // app.post('/v1/articles', IS_PROTECTED, articlesController.createArticle);
  app.get('/v1/articles/:articleId', IS_PROTECTED, articlesController.findArticleById);
  app.delete('/v1/articles/:articleId', IS_PROTECTED, articlesController.deleteById);
  app.get('/v1/articles/:articleId/audiofiles', IS_PROTECTED, articlesController.findAudiofileByArticleId);
  app.post('/v1/articles/:articleId/audiofiles', IS_PROTECTED, audiofileController.createAudiofile);

  // v1/audiofiles
  app.get('/v1/audiofiles', IS_PROTECTED, audiofileController.getAll);
  app.delete('/v1/audiofiles/:audiofileId', IS_PROTECTED, audiofileController.deleteById);
  app.get('/v1/audiofiles/:audiofileId', IS_PROTECTED, audiofileController.findById); // Now in use by our iOS App

  // v1/voices
  app.get('/v1/voices', IS_PROTECTED, voicesController.findAll);
  app.post('/v1/voices/:voiceId/preview', IS_PROTECTED, voicesController.createVoicePreview);
  app.get('/v1/voices/active', IS_PROTECTED, voicesController.findAllActive);
  app.get('/v1/voices/active/free', IS_PROTECTED, voicesController.findAllActiveFreeVoices);
  app.get('/v1/voices/active/premium', IS_PROTECTED, voicesController.findAllActivePremiumVoices);

  // Catch all
  app.all('*', catchAllController.catchAll);

  // Handle error exceptions
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
        // Do not capture Unauthorized errors
        if (err.message !== 'Unauthorized') {
          Sentry.captureException(err);
        }

      }

      if (process.env.NODE_ENV !== 'test') {
        console.log(`Error on route: ${req.method} ${req.url} "${err.message}"`);
        console.error(err);
      }

      if (err.message === 'Unauthorized') {
        return res.status(401).json({
          message: 'You are not logged in. Please log in to the app and try again.'
        });
      }

      // Return a general error to the user
      return res.status(500).json({
        message: 'An unexpected error occurred. Please try again or contact us when this happens again.'
      });
    }

    return next(err);
  });

  app.listen(PORT, () => console.log(`App init: Listening on port ${PORT}!`));
});
