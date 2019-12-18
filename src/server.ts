// tslint:disable-next-line
const { version } = require('../package.json');

import bodyParser from 'body-parser';
import compression from 'compression';
import cors, { CorsOptions } from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import ExpressRateLimit from 'express-rate-limit';
import helmet from 'helmet';
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
import { OembedController } from './controllers/oembed';
import * as playlistController from './controllers/playlist';
import * as synthesizersController from './controllers/synthesizers';
import * as usersController from './controllers/users';
import * as voicesController from './controllers/voices';

import { apiKeySecretPassportStrategy, jwtPassportStrategy } from './config/passport';

import { AnalyticsController } from './controllers/analytics';
import { BillingController } from './controllers/billing';
import { OrganizationsController } from './controllers/organizations';
import { PublicationsController } from './controllers/publications';
import { UserController } from './controllers/user';
import { connectionOptions } from './database/connection-options';
import { Sentry } from './sentry';
import { logger } from './utils';
import { getRealUserIpAddress } from './utils/ip-address';

const PORT = process.env.PORT || 3000;

const IS_PROTECTED_APIKEY = passport.authenticate(['jwt', 'x-api-key-secret'], {
  session: false,
  failWithError: true
});

const IS_PROTECTED_JWT = passport.authenticate(['jwt'], {
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
  if (!process.env.PUBLISHERS_BASE_URL) {
    throw new Error('Required environment variable "PUBLISHERS_BASE_URL" not set.');
  }
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    throw new Error('Required environment variable "STRIPE_PUBLISHABLE_KEY" not set.');
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Required environment variable "STRIPE_SECRET_KEY" not set.');
  }

  const rateLimited = new ExpressRateLimit({
    // We'll use the in-memory cache, not Redis
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'production' ? 60 : 999999, // 60 requests allowed per minute, so at most: 1 per second
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

  // include before other routes
  // This allows pre-flight OPTIONS requests
  const corsWhitelist = [
    'https://playpost.app',
    'https://publisher.playpost.app',
    'https://player.playpost.app',
    'http://localhost:8080'
  ];

  // It seems we cannot differentiate between our extensions as the ID is randomly
  // So just use the start of the origin
  const extensionsWhitelist = [
    'chrome-extension://',
    'moz-extension://',
  ]

  const corsOptions: CorsOptions = {
    origin: (origin: string | undefined, callback: any) => {
      const hasNoOrigin = !origin; // Note: Our React Native app has no origin, we allow it
      const isOnExtensionWhitelist = origin && extensionsWhitelist.some(extensionOriginPart => origin.startsWith(extensionOriginPart));
      const isOnCorsWhitelist = origin && corsWhitelist.some(corsItemUrl => origin === corsItemUrl);

      if (hasNoOrigin || isOnExtensionWhitelist || isOnCorsWhitelist) {
        callback(null, true)
      } else {
        const errorMessage = `"${origin}" is not allowed to do requests.`;

        Sentry.withScope(scope => {
          scope.setLevel(Sentry.Severity.Error);
          scope.setExtra('origin', origin);
          Sentry.captureMessage(errorMessage);
        });

        callback(new Error(errorMessage))
      }
    }
  }

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
  app.all('*', cors(corsOptions), (req, res, next) => {
    const appVersionHeader = req.headers['app-version'] as string;
    const deviceManufacturer = req.headers['device-manufacturer'] as string;

    if (appVersionHeader && ['1.2.2', '1.2.0', '1.1.0', '1.0.0'].includes(appVersionHeader)) {
      const storeName = deviceManufacturer === 'Apple' ? 'the App Store' : 'Google Play';

      return res.status(400).json({
        message: `There is a new required Playpost app update available with new features! Please update to the latest version using ${storeName}!`
      })
    }

    return next()
  });

  // Make express allow JSON payload bodies
  // https://medium.com/@nodepractices/were-under-attack-23-node-js-security-best-practices-e33c146cb87d#cb8f
  app.use(bodyParser.json({ limit: '20mb' })); // We upped the limit because an Apple receipt string is a bit large
  app.use(bodyParser.urlencoded({ limit: '20mb', extended: true, parameterLimit: 5000 }));

  // Load controllers
  const meController = new MeController();
  const oembedController = new OembedController();
  const analyticsController = new AnalyticsController();
  const publicationsController = new PublicationsController();
  const userController = new UserController();
  const organizationsController = new OrganizationsController();
  const billingController = new BillingController();

  // API Endpoints

  // TODO: Deprecated endpoints, remove later
  // app.patch('/v1/me/email', [rateLimited, IS_PROTECTED_JWT], meController.updateEmail); // TODO: remove later, available in iOS app 1.1.3 and below
  // app.patch('/v1/me/password', [rateLimited, IS_PROTECTED_JWT], meController.updatePassword); // TODO: remove later, available in iOS app 1.1.3 and below
  // app.get('/v1/languages/active', [rateLimited, IS_PROTECTED_JWT], languagesController.findAllActive); // TODO: remove later, available iOS app 1.2.x and below
  // app.get('/v1/in-app-subscriptions/active', [rateLimited, IS_PROTECTED_JWT], inAppSubscriptionsController.findAllActive); // TODO: remove later, available iOS app 1.2.x and below

  // Public
  // TODO: Use expressBrute to increase the delay between each requests
  app.post('/v1/auth', authController.getAuthenticationToken);
  app.patch('/v1/auth/activate', authController.patchUserActivate);
  app.post('/v1/auth/reset/password', authController.postUserResetPassword); // Send a reset password token to the given email address
  app.patch('/v1/auth/reset/password', authController.patchUserResetPassword); // Change the password of the user using a password reset token

  // Only used in our mobile app:
  app.post('/v1/auth/reset-password', authController.getResetPasswordToken); // Used only for the mobile app
  app.post('/v1/auth/update-password', authController.updatePasswordUsingToken); // Used only for the mobile app

  app.post('/v1/users', usersController.createUser);

  // Protected by login

  // v1/users
  app.get('/v1/users', [rateLimited, IS_PROTECTED_JWT], usersController.findAllUsers); // Admin only
  app.delete('/v1/users/:userId', [rateLimited, IS_PROTECTED_JWT], usersController.deleteUser); // Admin only

  // /v1/me
  // Used only in our mobile app
  app.get('/v1/me', [rateLimited, IS_PROTECTED_JWT], meController.findCurrentUser);
  app.patch('/v1/me', [rateLimited, IS_PROTECTED_JWT], meController.patchMe);
  app.post('/v1/me/voices', [rateLimited, IS_PROTECTED_JWT], meController.createSelectedVoice); // Setting the default voice per language for the user
  app.delete('/v1/me', [rateLimited, IS_PROTECTED_JWT], meController.deleteCurrentUser);

  // /v1/me/api-keys
  app.get('/v1/me/api-keys', [rateLimited, IS_PROTECTED_JWT], meController.findAllApiKeys);
  app.delete('/v1/me/api-keys/:apiKeyId', [rateLimited, IS_PROTECTED_JWT], meController.deleteApiKey);
  app.post('/v1/me/api-keys', [rateLimited, IS_PROTECTED_JWT], meController.createApiKey);

  // /v1/playlist
  app.get('/v1/playlist', [rateLimited, IS_PROTECTED_JWT], playlistController.findAllPlaylistItems);
  app.post('/v1/playlist/articles', [rateLimited, IS_PROTECTED_JWT], playlistController.createPlaylistItemByArticleUrl);
  app.post('/v1/playlist/articles/:articleId', [rateLimited, IS_PROTECTED_JWT], playlistController.createPlaylistItemByArticleId);
  app.delete('/v1/playlist/articles/:articleId', [rateLimited, IS_PROTECTED_JWT], playlistController.deletePlaylistItem);
  app.patch('/v1/playlist/articles/:articleId/order', [rateLimited, IS_PROTECTED_JWT], playlistController.patchPlaylistItemOrder);
  app.patch('/v1/playlist/articles/:articleId/favoritedat', [rateLimited, IS_PROTECTED_JWT], playlistController.patchPlaylistItemFavoritedAt);
  app.patch('/v1/playlist/articles/:articleId/archivedat', [rateLimited, IS_PROTECTED_JWT], playlistController.patchPlaylistItemArchivedAt);

  // /v1/articles
  app.get('/v1/articles', IS_PROTECTED_APIKEY, articlesController.findAllArticles);
  app.get('/v1/articles/:articleId', IS_PROTECTED_APIKEY, articlesController.findArticleById);
  app.put('/v1/articles/:articleId/sync', [rateLimited, IS_PROTECTED_JWT], articlesController.syncArticleWithSource);
  app.delete('/v1/articles/:articleId', [rateLimited, IS_PROTECTED_JWT], articlesController.deleteById); // Admin only
  app.get('/v1/articles/:articleId/audiofiles', [rateLimited, IS_PROTECTED_JWT], articlesController.findAudiofileByArticleId);
  app.post('/v1/articles/:articleId/audiofiles', [rateLimited, IS_PROTECTED_JWT], audiofileController.createAudiofile);

  // v1/audiofiles
  app.get('/v1/audiofiles', [rateLimited, IS_PROTECTED_JWT], audiofileController.findAllAudiofiles);
  app.delete('/v1/audiofiles/:audiofileId', [rateLimited, IS_PROTECTED_JWT], audiofileController.deleteById); // Admin only
  app.get('/v1/audiofiles/:audiofileId', [rateLimited, IS_PROTECTED_JWT], audiofileController.findById); // Now in use by our iOS App

  // v1/voices
  app.get('/v1/voices', [rateLimited, IS_PROTECTED_JWT], voicesController.findAll);
  app.post('/v1/voices/:voiceId/preview', [rateLimited, IS_PROTECTED_JWT], voicesController.createVoicePreview);
  app.delete('/v1/voices/:voiceId/preview', [rateLimited, IS_PROTECTED_JWT], voicesController.deleteVoicePreview);

  // v1/languages
  app.get('/v1/languages', [rateLimited, IS_PROTECTED_JWT], languagesController.findAll);

  // v1/subscriptions
  app.get('/v1/in-app-subscriptions', [rateLimited, IS_PROTECTED_JWT], inAppSubscriptionsController.findAll);
  app.post('/v1/in-app-subscriptions/validate', [rateLimited, IS_PROTECTED_JWT], inAppSubscriptionsController.validateInAppSubscriptionReceipt);

  app.get('/v1/in-app-subscriptions/sync', rateLimited, inAppSubscriptionsController.syncAllExpiredUserSubscriptions); // Endpoint is used on a cron job, so should be available publically

  app.get('/v1/synthesizers/:synthesizerName/voices', rateLimited, synthesizersController.findAllVoices);

  app.get('/health', rateLimited, healthController.getHealthStatus);

  // Used by embedly
  app.get('/v1/oembed', oembedController.getOembedCode);

  app.post('/v1/analytics/events', IS_PROTECTED_JWT, analyticsController.createEvent);

  // Available for all users to see their publications
  app.get('/v1/publications', IS_PROTECTED_JWT, publicationsController.getAll);

  // Restricted to users who are in a publication
  app.get('/v1/publications/:publicationId', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.getOne);
  app.get('/v1/publications/:publicationId/articles', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.getAllArticles);
  app.post('/v1/publications/:publicationId/articles', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.createArticle);
  app.get('/v1/publications/:publicationId/articles/:articleId', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.getArticle);
  app.delete('/v1/publications/:publicationId/articles/:articleId', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.deleteArticle);

  app.get('/v1/billing/plans', IS_PROTECTED_JWT, billingController.getAllPlans);
  app.get('/v1/billing/plans/:stripePlanId', IS_PROTECTED_JWT, billingController.getOnePlan);
  app.get('/v1/billing/products', IS_PROTECTED_JWT, billingController.getAllProducts);
  app.get('/v1/billing/products/:stripeProductId', IS_PROTECTED_JWT, billingController.getOneProduct);
  app.get('/v1/billing/tax-rates', IS_PROTECTED_JWT, billingController.getAllTaxRates);
  app.get('/v1/billing/tax-rates/:stripeTaxRateId', IS_PROTECTED_JWT, billingController.getOneTaxRate);

  // Available for all users to see their organizations
  app.get('/v1/organizations', IS_PROTECTED_JWT, organizationsController.permissions(['user']), organizationsController.getAll);

  // Organization: Info
  app.get('/v1/organizations/:organizationId', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getOne);

  // Organization: Publications
  app.get('/v1/organizations/:organizationId/publications', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getPublications);
  app.post('/v1/organizations/:organizationId/publications', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.createPublication);
  app.delete('/v1/organizations/:organizationId/publications/:publicationId', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-admin'])], organizationsController.deletePublication);

  // Organization: Customer and Stripe subscriptions
  app.get('/v1/organizations/:organizationId/customer', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getCustomer);
  app.get('/v1/organizations/:organizationId/customer/subscriptions', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getCustomerSubscriptions);
  app.get('/v1/organizations/:organizationId/customer/subscriptions/:stripeSubscriptionId', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getCustomerSubscription);
  app.get('/v1/organizations/:organizationId/customer/subscriptions/:stripeSubscriptionId/subscription-items', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getCustomerSubscriptionItems);
  app.get('/v1/organizations/:organizationId/customer/subscriptions/:stripeSubscriptionId/subscription-items/:stripeSubscriptionItemId/usage-records-summaries', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getCustomerUsageRecordsSummaries);
  app.get('/v1/organizations/:organizationId/customer/subscriptions/:stripeSubscriptionId/subscription-items/:stripeSubscriptionItemId/usage-records', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getCustomerUsageRecords);
  app.get('/v1/organizations/:organizationId/customer/invoices', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getCustomerInvoices);
  app.get('/v1/organizations/:organizationId/customer/invoices/upcoming', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getCustomerInvoices);
  app.patch('/v1/organizations/:organizationId/customer', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-admin'])], organizationsController.patchCustomer);

  // Organization: manage Admins and Users
  app.post('/v1/organizations/:organizationId/users', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user', 'organization-admin'])], organizationsController.createUser);
  app.get('/v1/organizations/:organizationId/users', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getUsers);
  app.get('/v1/organizations/:organizationId/admin', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getAdmin);
  app.put('/v1/organizations/:organizationId/admin', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-admin'])], organizationsController.putAdmin);
  app.delete('/v1/organizations/:organizationId/users/:userId', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-admin'])], organizationsController.deleteUser);

  app.get('/v1/user', [IS_PROTECTED_JWT, userController.restrictResourceToOwner], userController.getUser);

  // Endpoint for uptime monitoring
  app.get('/v1/status', rateLimited, (req, res) => {
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
        return res.status(403).json({
          message: 'You are not logged or your access is expired. Please log in to the app and try again.'
        });
      }

      // Return a specific error message when on dev mode
      if (process.env.NODE_ENV !== 'production') {
        return res.status(500).json({
          message: err && err.message ? err.message : 'An unexpected error occurred. Please try again or contact us when this happens again.'
        });
      }

      // Show a general error message to our users on Production
      // Our users do not need to know what goes wrong in the error message
      return res.status(500).json({
        message: 'An unexpected error occurred. Please try again or contact us when this happens again.'
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
