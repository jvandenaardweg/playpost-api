// tslint:disable-next-line
const { version } = require('../package.json');

import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import compression from 'compression';
import express, { NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import ExpressRateLimit from 'express-rate-limit';
import helmet from 'helmet';
// import ExpressBrute from 'express-brute-cloudflare';
import md5 from 'md5';
import passport from 'passport';
import responseTime from 'response-time';
import { createConnection } from 'typeorm';

import * as articlesController from './controllers/articles';
import * as audiofileController from './controllers/audiofiles';
import * as authController from './controllers/auth';
import * as catchAllController from './controllers/catch-all';
import * as healthController from './controllers/health';
import * as inAppSubscriptionsController from './controllers/in-app-subscriptions';
import * as languagesController from './controllers/languages';
import { MeController } from './controllers/me';
import * as playlistController from './controllers/playlist';
import * as synthesizersController from './controllers/synthesizers';
import * as usersController from './controllers/users';
import * as voicesController from './controllers/voices';

import { expressRateLimitRedisStore } from './cache';
import { apiKeySecretPassportStrategy, jwtPassportStrategy } from './config/passport';
import { connectionOptions } from './database/connection-options';
import { logger } from './utils';
import { getRealUserIpAddress } from './utils/ip-address';

const PORT = process.env.PORT || 3000;

const IS_PROTECTED_ENDPOINT = passport.authenticate(['jwt', 'x-api-key-secret'], {
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
  if (!process.env.CRAWLER_BASE_URL) {
    throw new Error('Required environment variable "CRAWLER_BASE_URL" not set.');
  }
  if (!process.env.APPLE_IAP_SHARED_SECRET) {
    throw new Error('Required environment variable "APPLE_IAP_SHARED_SECRET" not set.');
  }
  if (!process.env.TYPEORM_URL) {
    throw new Error('Required environment variable "TYPEORM_URL" not set.');
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

  // const bruteforce = new ExpressBrute(expressBruteRedisStore, {
  //   freeRetries: process.env.NODE_ENV === 'production' ? 5 : 10, // 5 retries, because some auth endpoints depend on each other
  //   minWait: 1000 * 60 * 5, // 5 minutes
  //   failCallback: (req: Request, res: Response, next: NextFunction, nextValidRequestDate: Date) => {
  //     logger.warn('Express Brute: ', 'Prevented after 5 tries.');
  //     return res.status(400).json({
  //       message: `Hold your horses! Too many requests. Please try again later at: ${nextValidRequestDate}`
  //     });
  //   },
  //   handleStoreError: (err: any) => {
  //     logger.error('Express Brute Store error: ', err);
  //   }
  // });

  const rateLimiter = new ExpressRateLimit({
    store: expressRateLimitRedisStore,
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'production' ? 30 : 9999999999, // 30 requests allowed per minute, so at most: 1 per every 2 seconds
    keyGenerator: req => {
      const authorizationHeaders = req.headers.authorization as string;
      const ipAddressOfUser = getRealUserIpAddress(req);

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

  // Send API version information
  app.use((req, res, next) => {
    res.append('X-API-Version', version);
    next();
  });

  // Setup Sentry error tracking
  Sentry.configureScope(scope => {
    scope.setExtra('process', 'web');
  });

  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
  app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

  // Use passport authentication
  app.use(passport.initialize());

  passport.use('jwt', jwtPassportStrategy);
  passport.use('x-api-key-secret', apiKeySecretPassportStrategy);

  // Temporary measure to make sure users update
  app.all('*', (req, res, next) => {
    const appVersionHeader = req.headers['app-version'] as string;
    const deviceManufacturer = req.headers['device-manufacturer'] as string;

    if (appVersionHeader && ['1.2.2', '1.2.0', '1.1.0', '1.0.0'].includes(appVersionHeader)) {
      const storeName = deviceManufacturer === 'Apple' ? 'the App Store' : 'Google Play';

      return res.status(400).json({
        message: `There is a new required Playpost app update available. Please update to the latest version using ${storeName}!`
      })
    }

    return next()
  });

  // Make express allow JSON payload bodies
  // https://medium.com/@nodepractices/were-under-attack-23-node-js-security-best-practices-e33c146cb87d#cb8f
  app.use(bodyParser.json({ limit: '5mb' })); // We upped the limit because an Apple receipt string is a bit large
  app.use(bodyParser.urlencoded({ limit: '5mb', extended: true, parameterLimit: 5000 }));

  // Load controllers
  const meController = new MeController();

  // API Endpoints

  // TODO: Deprecated endpoints, remove later
  app.patch('/v1/me/email', IS_PROTECTED_ENDPOINT, meController.updateEmail); // TODO: remove later, available in iOS app 1.1.3 and below
  app.patch('/v1/me/password', IS_PROTECTED_ENDPOINT, meController.updatePassword); // TODO: remove later, available in iOS app 1.1.3 and below
  app.get('/v1/languages/active', IS_PROTECTED_ENDPOINT, languagesController.findAllActive); // TODO: remove later, available iOS app 1.2.x and below
  app.get('/v1/in-app-subscriptions/active', IS_PROTECTED_ENDPOINT, inAppSubscriptionsController.findAllActive); // TODO: remove later, available iOS app 1.2.x and below

  // Public
  // Use expressBrute to increase the delay between each requests
  app.post('/v1/auth', authController.getAuthenticationToken);
  app.post('/v1/auth/reset-password', authController.getResetPasswordToken);
  app.post('/v1/auth/update-password', authController.updatePasswordUsingToken);
  app.post('/v1/users', usersController.createUser);

  // Protected by login

  // v1/users
  app.get('/v1/users', IS_PROTECTED_ENDPOINT, usersController.findAllUsers); // Admin only
  app.delete('/v1/users/:userId', IS_PROTECTED_ENDPOINT, usersController.deleteUser); // Admin only

  // /v1/me
  app.get('/v1/me', IS_PROTECTED_ENDPOINT, meController.findCurrentUser);
  app.patch('/v1/me', IS_PROTECTED_ENDPOINT, meController.patchMe);
  app.post('/v1/me/voices', IS_PROTECTED_ENDPOINT, meController.createSelectedVoice); // Setting the default voice per language for the user
  app.delete('/v1/me', IS_PROTECTED_ENDPOINT, meController.deleteCurrentUser);

  // /v1/me/api-keys
  app.get('/v1/me/api-keys', IS_PROTECTED_ENDPOINT, meController.findAllApiKeys);
  app.delete('/v1/me/api-keys/:apiKeyId', IS_PROTECTED_ENDPOINT, meController.deleteApiKey);
  app.post('/v1/me/api-keys', IS_PROTECTED_ENDPOINT, meController.createApiKey);

  // /v1/playlist
  app.get('/v1/playlist', IS_PROTECTED_ENDPOINT, playlistController.findAllPlaylistItems);
  app.post('/v1/playlist/articles', IS_PROTECTED_ENDPOINT, playlistController.createPlaylistItemByArticleUrl);
  app.delete('/v1/playlist/articles/:articleId', IS_PROTECTED_ENDPOINT, playlistController.deletePlaylistItem);
  app.patch('/v1/playlist/articles/:articleId/order', IS_PROTECTED_ENDPOINT, playlistController.patchPlaylistItemOrder);
  app.patch('/v1/playlist/articles/:articleId/favoritedat', IS_PROTECTED_ENDPOINT, playlistController.patchPlaylistItemFavoritedAt);
  app.patch('/v1/playlist/articles/:articleId/archivedat', IS_PROTECTED_ENDPOINT, playlistController.patchPlaylistItemArchivedAt);

  // /v1/articles
  app.get('/v1/articles/:articleId', IS_PROTECTED_ENDPOINT, articlesController.findArticleById);
  app.put('/v1/articles/:articleId/sync', IS_PROTECTED_ENDPOINT, articlesController.syncArticleWithSource);
  app.delete('/v1/articles/:articleId', IS_PROTECTED_ENDPOINT, articlesController.deleteById); // Admin only
  app.get('/v1/articles/:articleId/audiofiles', IS_PROTECTED_ENDPOINT, articlesController.findAudiofileByArticleId);
  app.post('/v1/articles/:articleId/audiofiles', IS_PROTECTED_ENDPOINT, audiofileController.createAudiofile);

  // v1/audiofiles
  app.get('/v1/audiofiles', IS_PROTECTED_ENDPOINT, audiofileController.findAllAudiofiles);
  app.delete('/v1/audiofiles/:audiofileId', IS_PROTECTED_ENDPOINT, audiofileController.deleteById); // Admin only
  app.get('/v1/audiofiles/:audiofileId', IS_PROTECTED_ENDPOINT, audiofileController.findById); // Now in use by our iOS App

  // v1/voices
  app.get('/v1/voices', IS_PROTECTED_ENDPOINT, voicesController.findAll);
  app.post('/v1/voices/:voiceId/preview', IS_PROTECTED_ENDPOINT, voicesController.createVoicePreview);
  app.delete('/v1/voices/:voiceId/preview', IS_PROTECTED_ENDPOINT, voicesController.deleteVoicePreview);

  // v1/languages
  app.get('/v1/languages', IS_PROTECTED_ENDPOINT, languagesController.findAll);

  // v1/subscriptions
  // app.get('/v1/subscriptions', IS_PROTECTED_ENDPOINT, subscriptionsController.findAll);
  app.get('/v1/in-app-subscriptions', IS_PROTECTED_ENDPOINT, inAppSubscriptionsController.findAll);
  app.post('/v1/in-app-subscriptions/validate', IS_PROTECTED_ENDPOINT, inAppSubscriptionsController.validateInAppSubscriptionReceipt);

  app.get('/v1/in-app-subscriptions/sync', inAppSubscriptionsController.syncAllExpiredUserSubscriptions); // Endpoint is used on a cron job, so should be available publically

  app.get('/v1/synthesizers/:synthesizerName/voices', synthesizersController.findAllVoices);

  app.get('/health', healthController.getHealthStatus);

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
