require('dotenv').config();
import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import helmet from 'helmet';
import compression from 'compression';
import responseTime from 'response-time';
import { createConnection } from 'typeorm';
import ExpressRateLimit from 'express-rate-limit';
import ExpressBrute from 'express-brute-cloudflare';
import md5 from 'md5';

import { Sentry } from './error-reporter';

import * as audiofileController from './controllers/audiofiles';
import * as meController from './controllers/me';
import * as playlistController from './controllers/playlist';
import * as usersController from './controllers/users';
import * as authController from './controllers/auth';
import * as articlesController from './controllers/articles';
import * as catchAllController from './controllers/catch-all';
import * as voicesController from './controllers/voices';
import * as languagesController from './controllers/languages';
import * as inAppSubscriptionsController from './controllers/in-app-subscriptions';

import { connectionOptions } from './database/connection-options';
import { expressRateLimitRedisStore, expressBruteRedisStore } from './cache';
import { logger } from './utils';

const PORT = process.env.PORT || 3000;

const IS_PROTECTED = passport.authenticate('jwt', {
  session: false,
  failWithError: true
});

export const setupServer = async () => {
  // Check required env vars
  if (!process.env.NODE_ENV) {
    throw new Error('Required environment variable "NODE_ENV" not set.');
  }
  if (!process.env.GOOGLE_CLOUD_CREDENTIALS_PROJECT_ID) {
    throw new Error('Required environment variable "GOOGLE_CLOUD_CREDENTIALS_PROJECT_ID" not set.');
  }
  if (!process.env.GOOGLE_CLOUD_CREDENTIALS_CLIENT_EMAIL) {
    throw new Error('Required environment variable "GOOGLE_CLOUD_CREDENTIALS_CLIENT_EMAIL" not set.');
  }
  if (!process.env.GOOGLE_CLOUD_CREDENTIALS_PRIVATE_KEY) {
    throw new Error('Required environment variable "GOOGLE_CLOUD_CREDENTIALS_PRIVATE_KEY" not set.');
  }
  if (!process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME) {
    throw new Error('Required environment variable "GOOGLE_CLOUD_STORAGE_BUCKET_NAME" not set.');
  }
  if (!process.env.GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE) {
    throw new Error('Required environment variable "GOOGLE_PUBSUB_SUBSCRIPTION_CRAWL_FULL_ARTICLE" not set.');
  }
  if (!process.env.GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE) {
    throw new Error('Required environment variable "GOOGLE_PUBSUB_TOPIC_CRAWL_FULL_ARTICLE" not set.');
  }
  if (!process.env.GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS) {
    throw new Error('Required environment variable "GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS" not set.');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('Required environment variable "JWT_SECRET" not set.');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('Required environment variable "DATABASE_URL" not set.');
  }
  if (!process.env.REDIS_URL) {
    throw new Error('Required environment variable "REDIS_URL" not set.');
  }
  if (!process.env.CRAWLER_URL) {
    throw new Error('Required environment variable "CRAWLER_URL" not set.');
  }
  if (!process.env.SENTRY_DSN) {
    throw new Error('Required environment variable "SENTRY_DSN" not set.');
  }
  if (!process.env.APPLE_IAP_SHARED_SECRET) {
    throw new Error('Required environment variable "APPLE_IAP_SHARED_SECRET" not set.');
  }
  if (!process.env.TYPEORM_URL) {
    throw new Error('Required environment variable "TYPEORM_URL" not set.');
  }
  if (!process.env.TYPEORM_ENTITIES) {
    throw new Error('Required environment variable "TYPEORM_ENTITIES" not set.');
  }
  if (!process.env.TYPEORM_MIGRATIONS) {
    throw new Error('Required environment variable "TYPEORM_MIGRATIONS" not set.');
  }
  if (!process.env.MAILCHIMP_LIST_ID) {
    throw new Error('Required environment variable "MAILCHIMP_LIST_ID" not set.');
  }
  if (!process.env.MAILCHIMP_API_KEY) {
    throw new Error('Required environment variable "MAILCHIMP_API_KEY" not set.');
  }
  if (!process.env.AWS_USER) {
    throw new Error('Required environment variable "AWS_USER" not set.');
  }
  if (!process.env.AWS_ACCESS_KEY_ID) {
    throw new Error('Required environment variable "AWS_ACCESS_KEY_ID" not set.');
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Required environment variable "AWS_SECRET_ACCESS_KEY" not set.');
  }
  if (!process.env.AWS_REGION) {
    throw new Error('Required environment variable "AWS_REGION" not set.');
  }

  const bruteforce = new ExpressBrute(expressBruteRedisStore, {
    freeRetries: process.env.NODE_ENV === 'production' ? 5 : 10, // 5 retries, because some auth endpoints depend on each other
    minWait: 1000 * 60 * 5, // 5 minutes
    failCallback: (req: Request, res: Response, next: NextFunction, nextValidRequestDate: Date) => {
      logger.warn('Express Brute: ', 'Prevented after 5 tries.');
      return res.status(400).json({
        message: `Hold your horses! Too many requests. Please try again later at: ${nextValidRequestDate}`
      });
    },
    handleStoreError: (err: any) => {
      logger.error('Express Brute Store error: ', err);
    }
  });

  const rateLimiter = new ExpressRateLimit({
    store: expressRateLimitRedisStore,
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'production' ? 30 : 9999999999, // 30 requests allowed per minute, so at most: 1 per every 2 seconds
    keyGenerator: req => {
      const authorizationHeaders = req.headers['authorization'] as string;
      const cloudflareIpAddress = req.headers['cf-connecting-ip'] as string;
      const xForwardedForIpAddress = req.headers['x-forwarded-for'] as string;
      const ipAddressOfUser = cloudflareIpAddress || xForwardedForIpAddress || req.ip;

      // Create a key based on the authorization headers and the ip address
      // So we can filter on a per-user basis, so we don't block multiple users behind the same ip address
      const key = md5(`${authorizationHeaders}${ipAddressOfUser}`);

      return key;
    },
    handler: (req, res, next) => {
      // Send JSON so we can read the message
      return res.status(429).json({
        message: 'Ho, ho. Slow down! It seems like you are doing too many requests. Please cooldown and try again later.'
      });
    }
  });

  logger.info('App init:', 'Connecting with database...');

  // Create a connection with the database
  const connection = await createConnection(connectionOptions('default'));

  logger.info('App init:', 'Connected with database', connection.options);

  const app: express.Application = express();

  // Set trust proxy for CloudFlare and nginx on production
  app.set('trust proxy', ['loopback']);

  // Hardening our server using Helmet
  app.use(helmet());
  app.use(
    helmet.contentSecurityPolicy({
      directives: { defaultSrc: ["'self'"], styleSrc: ["'self'"] }
    })
  ); // https://helmetjs.github.io/docs/csp/
  app.use(helmet.noCache()); // https://helmetjs.github.io/docs/nocache/
  app.use(helmet.permittedCrossDomainPolicies()); // https://helmetjs.github.io/docs/crossdomain/
  app.use(helmet.referrerPolicy({ policy: 'same-origin' })); // https://helmetjs.github.io/docs/referrer-policy/

  // Use a rate limiter to limit api calls per second
  app.use(rateLimiter);

  // Return real response time inside the headers, for debugging slow connections
  app.use(responseTime());

  // Compress the output
  app.use(compression());

  // Setup Sentry error tracking
  Sentry.configureScope(scope => {
    scope.setExtra('process', 'web');
  });

  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
  app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

  // Use passport authentication
  app.use(passport.initialize());
  require('./config/passport')(passport);

  // Make express allow JSON payload bodies
  // https://medium.com/@nodepractices/were-under-attack-23-node-js-security-best-practices-e33c146cb87d#cb8f
  app.use(bodyParser.json({ limit: '500kb' })); // We upped the limit because an Apple receipt string is a bit large
  app.use(bodyParser.urlencoded({ extended: true }));

  // API Endpoints

  // Public
  // Use expressBrute to increase the delay between each requests
  app.post('/v1/auth', bruteforce.prevent, authController.getAuthenticationToken);
  app.post('/v1/auth/reset-password', bruteforce.prevent, authController.getResetPasswordToken);
  app.post('/v1/auth/update-password', bruteforce.prevent, authController.updatePasswordUsingToken);
  app.post('/v1/users', bruteforce.prevent, usersController.createUser);

  // Protected

  // v1/users
  app.get('/v1/users', IS_PROTECTED, usersController.findAllUsers); // Admin only
  app.delete('/v1/users/:userId', IS_PROTECTED, usersController.deleteUser); // Admin only

  // /v1/me
  app.get('/v1/me', IS_PROTECTED, meController.findCurrentUser);
  app.patch('/v1/me/email', IS_PROTECTED, meController.updateEmail);
  app.patch('/v1/me/password', IS_PROTECTED, meController.updatePassword);
  app.post('/v1/me/voices', IS_PROTECTED, meController.createSelectedVoice); // Setting the default voice per language for the user
  app.delete('/v1/me', IS_PROTECTED, meController.deleteCurrentUser);

  // Playlists => /v1/playlist
  app.get('/v1/playlist', IS_PROTECTED, playlistController.findAllPlaylistItems);
  app.get('/v1/playlist/favorites', IS_PROTECTED, playlistController.findAllFavoritedItems);
  app.get('/v1/playlist/archived', IS_PROTECTED, playlistController.findAllArchivedItems);
  app.post('/v1/playlist/articles', IS_PROTECTED, playlistController.createPlaylistItemByArticleUrl);
  app.delete('/v1/playlist/articles/:articleId', IS_PROTECTED, playlistController.deletePlaylistItem);
  app.patch('/v1/playlist/articles/:articleId/order', IS_PROTECTED, playlistController.patchPlaylistItemOrder);
  app.patch('/v1/playlist/articles/:articleId/favoritedat', IS_PROTECTED, playlistController.patchPlaylistItemFavoritedAt);
  app.patch('/v1/playlist/articles/:articleId/archivedat', IS_PROTECTED, playlistController.patchPlaylistItemArchivedAt);

  // /v1/articles
  app.get('/v1/articles/:articleId', IS_PROTECTED, articlesController.findArticleById);
  app.put('/v1/articles/:articleId/sync', IS_PROTECTED, articlesController.syncArticleWithSource);
  app.delete('/v1/articles/:articleId', IS_PROTECTED, articlesController.deleteById); // Admin only
  app.get('/v1/articles/:articleId/audiofiles', IS_PROTECTED, articlesController.findAudiofileByArticleId);
  app.post('/v1/articles/:articleId/audiofiles', IS_PROTECTED, audiofileController.createAudiofile);

  // v1/audiofiles
  app.get('/v1/audiofiles', IS_PROTECTED, audiofileController.findAllAudiofiles);
  app.delete('/v1/audiofiles/:audiofileId', IS_PROTECTED, audiofileController.deleteById); // Admin only
  app.get('/v1/audiofiles/:audiofileId', IS_PROTECTED, audiofileController.findById); // Now in use by our iOS App

  // v1/voices
  app.get('/v1/voices', IS_PROTECTED, voicesController.findAll);
  app.post('/v1/voices/:voiceId/preview', IS_PROTECTED, voicesController.createVoicePreview);
  app.delete('/v1/voices/:voiceId/preview', IS_PROTECTED, voicesController.deleteVoicePreview);
  app.get('/v1/voices/active', IS_PROTECTED, voicesController.findAllActive);
  app.get('/v1/voices/active/free', IS_PROTECTED, voicesController.findAllActiveFreeVoices);
  app.get('/v1/voices/active/premium', IS_PROTECTED, voicesController.findAllActivePremiumVoices);

  // v1/languages
  app.get('/v1/languages', IS_PROTECTED, languagesController.findAll);
  app.get('/v1/languages/active', IS_PROTECTED, languagesController.findAllActive);

  // v1/subscriptions
  // app.get('/v1/subscriptions', IS_PROTECTED, subscriptionsController.findAll);
  app.get('/v1/in-app-subscriptions/active', IS_PROTECTED, inAppSubscriptionsController.findAllActive);
  app.post('/v1/in-app-subscriptions/validate', IS_PROTECTED, inAppSubscriptionsController.validateInAppSubscriptionReceipt);
  app.get('/v1/in-app-subscriptions/sync', inAppSubscriptionsController.syncAllExpiredUserSubscriptions); // Endpoint is used on a cron job, so should be available publically

  // Endpoint for uptime monitoring
  app.get('/v1/status', (req, res) => {
    return res.status(200).json({ message: 'OK' });
  });

  // Catch all
  app.all('*', catchAllController.catchAll);

  // Handle error exceptions
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err) {
      if (process.env.NODE_ENV === 'production') {
        // Grab the user so we can give some context to our errors
        if (req.user) {
          const { id, email } = req.user;

          Sentry.configureScope(scope => {
            scope.setUser({ id, email });
          });

          logger.error(`Error for user ID "${id}", email: "${email}"`, err);
        }

        // Capture the error for us to see in Sentry
        // Do not capture Unauthorized errors
        if (err.message !== 'Unauthorized') {
          logger.error('Uncaught error', err);
          Sentry.captureException(err);
        }
      }

      if (process.env.NODE_ENV !== 'test') {
        logger.error(`Error on route: ${req.method} ${req.url} "${err.message}"`);
      }

      if (err.message === 'Unauthorized') {
        return res.status(401).json({
          message: 'You are not logged or your access is expired. Please log in to the app and try again.'
        });
      }

      // Return a general error to the user
      return res.status(500).json({
        message: err && err.message ? err.message : 'An unexpected error occurred. Please try again or contact us when this happens again.'
      });
    }

    return next(err);
  });

  app.listen(PORT, () => {
    logger.info(`App init: Listening on port ${PORT}.`);
    logger.info('App init: Ready!');
  });

  return app;
};
