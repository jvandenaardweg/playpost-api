// tslint:disable-next-line
const { version } = require('../package.json');

import bodyParser from 'body-parser';
import compression from 'compression';
import cors, { CorsOptions } from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import expressRateLimit from 'express-rate-limit';
import helmet from 'helmet';
import md5 from 'md5';
import passport from 'passport';
import responseTime from 'response-time';
import { createConnection } from 'typeorm';
// import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
// import { writeFileSync } from 'fs';
import expressBasicAuth from 'express-basic-auth';
import cookieParser from 'cookie-parser';

import * as articlesController from './controllers/articles';
import * as audiofileController from './controllers/audiofiles';
import * as healthController from './controllers/health';
import * as inAppSubscriptionsController from './controllers/in-app-subscriptions';
import * as languagesController from './controllers/languages/languages-controller';
import { MeController } from './controllers/me';
import { OembedController } from './controllers/oembed/oembed-controller';
import * as playlistController from './controllers/playlist';
import * as synthesizersController from './controllers/synthesizers';
import { UsersController } from './controllers/users/users-controller';

import { apiKeySecretPassportStrategy, jwtPassportStrategy } from './config/passport';

import { AnalyticsController } from './controllers/analytics/analytics-controller';
import { BillingController } from './controllers/billing/billing-controller';
import { NotFoundController } from './controllers/not-found/not-found-controller';
import { OrganizationsController } from './controllers/organizations/organizations-controller';
import { PublicationsController } from './controllers/publications/publications-controller';
import { StatusController } from './controllers/status/status-controller';
import { UserController } from './controllers/user/user-controller';
import { CountriesController } from './controllers/countries/countries-controller';
import { AuthController } from './controllers/auth/auth-controller';
import { VoicesController } from './controllers/voices/voices-controller';

import { connectionOptions } from './database/connection-options';
import { HttpStatus } from './http-error';
import { Sentry } from './sentry';
import { logger } from './utils';
import { getRealUserIpAddress } from './utils/ip-address';
import { createAnonymousUserId, getAnonymousUserId } from './utils/anonymous-user-id';

logger.info('App init:', 'Starting...');

export const setupServer = async () => {
  logger.info('App init:', 'Server setup...');

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
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Required environment variable "STRIPE_SECRET_KEY" not set.');
  }
  if (!process.env.SYNTHESIZER_ACCESS_TOKEN) {
    throw new Error('Required environment variable "SYNTHESIZER_ACCESS_TOKEN" not set.');
  }

  const PORT = process.env.PORT || 3000;

  const IS_PROTECTED_APIKEY = passport.authenticate(['jwt', 'x-api-key-secret'], {
    session: false,
    failWithError: true
  });

  const IS_PROTECTED_JWT = passport.authenticate(['jwt'], {
    session: false,
    failWithError: true
  });

  logger.info('App init:', 'Connecting with database...');

  // Create a connection with the database
  const connection = await createConnection(connectionOptions('default'));

  logger.info('App init:', 'Connected with database', connection.options);

  const app: express.Application = express();

  // include before other routes
  // This allows pre-flight OPTIONS requests
  const corsWhitelist = [
    // production services
    'https://playpost.app',
    'https://publisher.playpost.app',
    'https://player.playpost.app',
    'https://api.playpost.app', // For serving our swagger docs at /docs

    // test/staging services
    'https://playpost-website-test.herokuapp.com',
    'https://playpost-publisher-test.herokuapp.com',
    'https://playpost-publisher.herokuapp.com',
    'https://playpost-player.herokuapp.com',
    'https://playpost-player-test.herokuapp.com',
  ];

  // Only allow these URL's from development
  const corsDevelopmentWhitelist = [
    // development services
    'http://localhost:8080',
    'http://localhost:3000' // Development api, so we can do requests from swagger
  ]

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
      const isAllowedOnDevelopment = origin && process.env.NODE_ENV !== 'production' && corsDevelopmentWhitelist.some(corsItemUrl => origin === corsItemUrl);

      if (hasNoOrigin || isOnExtensionWhitelist || isOnCorsWhitelist || isAllowedOnDevelopment) {
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
  // Do not use blow, keep commented
  // Enabling this will not work with serving our swagger docs
  // app.use(
  //   helmet.contentSecurityPolicy({
  //     directives: { defaultSrc: ["'self'"], styleSrc: ["'self'"] }
  //   })
  // ); // https://helmetjs.github.io/docs/csp/
  app.use(helmet.noCache()); // https://helmetjs.github.io/docs/nocache/
  app.use(helmet.permittedCrossDomainPolicies()); // https://helmetjs.github.io/docs/crossdomain/
  app.use(helmet.referrerPolicy({ policy: 'same-origin' })); // https://helmetjs.github.io/docs/referrer-policy/

  // Return real response time inside the headers, for debugging slow connections
  app.use(responseTime());

  // Compress the output
  app.use(compression());

  // Required for our anonymousId for rate limiting
  app.use(cookieParser());

  // Set the anonymousUserId cookie to track unique users anonymously
  // Set the sessionId cookie to track sessions of users
  // To identify individual users behind a shared ip address
  // Save the cookie for a year
  // Important: use this app.use BEFORE our rate limiter, so our rate limiter can use the same cookie value
  app.use('*', (req: Request, res: Response, next: NextFunction) => {
    const currentAnonymousUserIdCookie = req.cookies.anonymousUserId;

    // If there is no cookie yet, create one
    if (!currentAnonymousUserIdCookie) {
      const anonymousUserId = createAnonymousUserId();

      const expiresInDays = 365;
      const currentDate = new Date();
      const expires = new Date(currentDate.setTime(currentDate.getTime() + (expiresInDays * 24 * 60 * 60 * 1000)))

      const cookieConfig = {
        expires,
        secure: process.env.NODE_ENV === 'production', // Only use secure in production, as we have https there
        httpOnly: true
      }

      // Send the cookie to our user
      res.cookie('anonymousUserId' , anonymousUserId, cookieConfig)
    }

    // Continue with the request
    next();
  });

  const rateLimited = (maxRequestsPerMinute?: number) => expressRateLimit({
    // We'll use the in-memory cache, not Redis
    windowMs: 1 * 60 * 1000, // 1 minute
    // Do not use arrow function here, as "this.keyGenerator" is not available then
    // tslint:disable-next-line: object-literal-shorthand
    onLimitReached: function (req, res) {
      const rateLimitedIp = getRealUserIpAddress(req);
      const rateLimitedKey = this.keyGenerator ? this.keyGenerator(req, res) : getAnonymousUserId(req);
      const tryAfterDate = req.rateLimit.resetTime
      const message = `Rate limit reached on: ${req.method} ${req.path}. Details are logged to Sentry.`;

      // Only log the message when the limit is reached
      // So we do not flood our error logging
      Sentry.configureScope(scope => {
        Sentry.captureMessage(message)
        scope.setExtra('rateLimitedKey', rateLimitedKey)
        scope.setExtra('rateLimitedIp', rateLimitedIp)
        scope.setExtra('tryAfterDate', tryAfterDate)
        scope.setExtra('req', req)
      })
    },
    max: maxRequestsPerMinute ? maxRequestsPerMinute : 60, // Max 60 request per minute
    keyGenerator: (req) => getAnonymousUserId(req),
    // Do not use arrow function here, as "this.keyGenerator" is not available then
    // tslint:disable-next-line: object-literal-shorthand
    handler: function (req, res) {
      const rateLimitedIp = getRealUserIpAddress(req);
      const rateLimitedKey = this.keyGenerator ? this.keyGenerator(req, res) : getAnonymousUserId(req);
      const tryAfterDate = req.rateLimit.resetTime;
      const loggerPrefix = `Rate limit reached on: ${req.method} ${req.path}`;
  
      logger.warn(loggerPrefix, `anonymousUserId: ${rateLimitedKey}`, `- IP address: ${rateLimitedIp}`);
      
      const message = `Ho, ho. Slow down! It seems like you are doing too many requests. Please cooldown and try again after: ${tryAfterDate}`;
      
      return res.status(429).json({ message });
    }
  });

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
  
  // Initialize swagger-jsdoc -> returns validated swagger spec in json format
  // const swaggerSpec = swaggerJSDoc(require(path.join(__dirname, '../swagger.js')));

  // Write the Swagger spec to a JSON file
  // So the json file always reflects the last API version, so we can easily track changes in git
  const swaggerDocFilePath = path.join(__dirname, '../public/docs/') + 'api-docs.json';
  // writeFileSync(swaggerDocFilePath, JSON.stringify(swaggerSpec, null, 2))

  // Temporary measure to make sure users update
  app.all('*', cors(corsOptions), (req, res, next) => {
    const appVersionHeader = req.headers['app-version'] as string;
    const deviceManufacturer = req.headers['device-manufacturer'] as string;

    if (appVersionHeader && ['1.7.0', '1.6.0', '1.5.0', '1.4.0', '1.3.1', '1.3.0', '1.2.2', '1.2.0', '1.1.0', '1.0.0'].includes(appVersionHeader)) {
      const storeName = deviceManufacturer === 'Apple' ? 'the App Store' : 'Google Play';

      return res.status(400).json({
        message: `There is a new required Playpost app update available! Please update to the latest version using ${storeName}!`
      })
    }

    return next()
  });

  // Make express allow JSON payload bodies
  // https://medium.com/@nodepractices/were-under-attack-23-node-js-security-best-practices-e33c146cb87d#cb8f
  app.use(bodyParser.json({ limit: '20mb' })); // We upped the limit because an Apple receipt string is a bit large
  app.use(bodyParser.urlencoded({ limit: '20mb', extended: true, parameterLimit: 5000 }));

  // Serve the docs
  app.use('/docs', 
    // Add some basic protection, we do not want the world to see this docs
    // It will only be used for our internal development purposes for now
    expressBasicAuth({
      users: { 'admin': 'demodemo!' },
      challenge: true
    }), 
    swaggerUi.serve, 
    swaggerUi.setup(require(swaggerDocFilePath))
  );

  // Load controllers
  const meController = new MeController();
  const oembedController = new OembedController();
  const analyticsController = new AnalyticsController();
  const publicationsController = new PublicationsController();
  const userController = new UserController();
  const organizationsController = new OrganizationsController();
  const billingController = new BillingController();
  const usersController = new UsersController();
  const statusController = new StatusController();
  const notFoundController = new NotFoundController();
  const countriesController = new CountriesController();
  const authController = new AuthController();
  const voicesController = new VoicesController()


  // API Endpoints

  // Public (rate limited)
  // TODO: Use expressBrute to increase the delay between each requests
  app.post('/v1/auth', rateLimited(10), authController.postAuth);
  app.patch('/v1/auth/activate', rateLimited(10), authController.patchAuthActivate);
  app.post('/v1/auth/reset/password', rateLimited(10), authController.postAuthResetPassword); // Send a reset password token to the given email address
  app.patch('/v1/auth/reset/password', rateLimited(10), authController.patchAuthResetPassword); // Change the password of the user using a password reset token

  // Only used in our mobile app:
  app.post('/v1/auth/reset-password', rateLimited(10), authController.postAuthResetPasswordMobile); // Used only for the mobile app
  app.post('/v1/auth/update-password', rateLimited(10), authController.postAuthUpdatePasswordMobile); // Used only for the mobile app

  app.post('/v1/users', rateLimited(10), usersController.postUsers); // To create user accounts

  // So we can show the correct available countries in a dropdown in public forms
  app.get('/v1/countries', rateLimited, countriesController.getAllCountries);

  app.get('/v1/status', rateLimited, statusController.getAll);
  app.get('/health', rateLimited, healthController.getHealthStatus);

  app.get('/v1/oembed', oembedController.getAll); // Used by embedly, not rate limited

  // Private routes

  // /v1/me
  // Used only in our mobile app
  app.get('/v1/me', [IS_PROTECTED_JWT], meController.findCurrentUser);
  app.patch('/v1/me', [IS_PROTECTED_JWT], meController.patchMe);
  app.post('/v1/me/voices', [IS_PROTECTED_JWT], meController.createSelectedVoice); // Setting the default voice per language for the user
  app.delete('/v1/me', [IS_PROTECTED_JWT], meController.deleteCurrentUser);

  // /v1/me/api-keys
  app.get('/v1/me/api-keys', [IS_PROTECTED_JWT], meController.findAllApiKeys);
  app.delete('/v1/me/api-keys/:apiKeyId', [IS_PROTECTED_JWT], meController.deleteApiKey);
  app.post('/v1/me/api-keys', [IS_PROTECTED_JWT], meController.createApiKey);

  // /v1/playlist
  app.get('/v1/playlist', [IS_PROTECTED_JWT], playlistController.findAllPlaylistItems);
  app.post('/v1/playlist/articles', [IS_PROTECTED_JWT], playlistController.createPlaylistItemByArticleUrl);
  app.post('/v1/playlist/articles/:articleId', [IS_PROTECTED_JWT], playlistController.createPlaylistItemByArticleId);
  app.delete('/v1/playlist/articles/:articleId', [IS_PROTECTED_JWT], playlistController.deletePlaylistItem);
  app.patch('/v1/playlist/articles/:articleId/order', [IS_PROTECTED_JWT], playlistController.patchPlaylistItemOrder);
  app.patch('/v1/playlist/articles/:articleId/favoritedat', [IS_PROTECTED_JWT], playlistController.patchPlaylistItemFavoritedAt);
  app.patch('/v1/playlist/articles/:articleId/archivedat', [IS_PROTECTED_JWT], playlistController.patchPlaylistItemArchivedAt);

  // /v1/articles
  app.get('/v1/articles', IS_PROTECTED_APIKEY, articlesController.findAllArticles);
  app.get('/v1/articles/:articleId', IS_PROTECTED_APIKEY, articlesController.findArticleById);
  app.put('/v1/articles/:articleId/sync', [IS_PROTECTED_JWT], articlesController.syncArticleWithSource);
  app.delete('/v1/articles/:articleId', [IS_PROTECTED_JWT], articlesController.deleteById); // Admin only
  app.get('/v1/articles/:articleId/audiofiles', [IS_PROTECTED_JWT], articlesController.findAudiofileByArticleId);
  app.post('/v1/articles/:articleId/audiofiles', [IS_PROTECTED_JWT], audiofileController.postOneAudiofile);

  // v1/audiofiles
  app.get('/v1/audiofiles', [IS_PROTECTED_JWT], audiofileController.findAllAudiofiles);
  app.delete('/v1/audiofiles/:audiofileId', [IS_PROTECTED_JWT], audiofileController.deleteById); // Admin only
  app.get('/v1/audiofiles/:audiofileId', [IS_PROTECTED_JWT], audiofileController.findById); // Now in use by our iOS App

  // v1/voices
  app.get('/v1/voices', [IS_PROTECTED_JWT], voicesController.getAllVoices);
  app.post('/v1/voices/:voiceId/preview', [IS_PROTECTED_JWT], voicesController.postOneVoicePreview);
  app.delete('/v1/voices/:voiceId/preview', [IS_PROTECTED_JWT], voicesController.deleteOneVoicePreview);

  // v1/languages
  app.get('/v1/languages', [IS_PROTECTED_JWT], languagesController.getAllLanguages);

  // v1/subscriptions
  app.get('/v1/in-app-subscriptions', [IS_PROTECTED_JWT], inAppSubscriptionsController.findAll);
  app.post('/v1/in-app-subscriptions/validate', [IS_PROTECTED_JWT], inAppSubscriptionsController.validateInAppSubscriptionReceipt);

  app.get('/v1/in-app-subscriptions/sync', inAppSubscriptionsController.syncAllExpiredUserSubscriptions); // Endpoint is used on a cron job, so should be available publically

  app.get('/v1/synthesizers/:synthesizerName/voices', synthesizersController.findAllVoices);

  app.post('/v1/analytics/events', IS_PROTECTED_JWT, analyticsController.createEvent);

  // Available for all users to see their publications
  app.get('/v1/publications', [IS_PROTECTED_JWT], publicationsController.getAllPublications);

  // Restricted to users who are in a publication
  app.get('/v1/publications/:publicationId', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.getOnePublication);
  app.get('/v1/publications/:publicationId/articles', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.getAllPublicationArticleSummaries);
  app.post('/v1/publications/:publicationId/articles', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.postOnePublicationArticle);
  app.post('/v1/publications/:publicationId/import/article', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.postOnePublicationImportArticle);
  app.get('/v1/publications/:publicationId/articles/:articleId', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.getOnePublicationArticle);
  app.patch('/v1/publications/:publicationId/articles/:articleId', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.patchOnePublicationArticle);
  app.post('/v1/publications/:publicationId/articles/:articleId/preview-ssml', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.postOnePublicationPreviewSSML);
  app.post('/v1/publications/:publicationId/articles/:articleId/audiofiles', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.postOnePublicationAudiofile);
  app.delete('/v1/publications/:publicationId/articles/:articleId', [IS_PROTECTED_JWT, publicationsController.restrictResourceToOwner], publicationsController.deleteOnePublicationArticle);

  app.get('/v1/billing', [IS_PROTECTED_JWT], billingController.getBillingIndex);
  app.get('/v1/billing/plans', [IS_PROTECTED_JWT], billingController.getAllBillingPlans);
  app.get('/v1/billing/plans/:stripePlanId', [IS_PROTECTED_JWT], billingController.getOneBillingPlan);
  app.get('/v1/billing/products', [IS_PROTECTED_JWT], billingController.getAllBillingProducts);
  app.get('/v1/billing/products/:stripeProductId', [IS_PROTECTED_JWT], billingController.getOneBillingProduct);
  app.get('/v1/billing/tax-rates', [IS_PROTECTED_JWT], billingController.getAllBillingTaxRates);
  app.get('/v1/billing/tax-rates/:stripeTaxRateId', [IS_PROTECTED_JWT], billingController.getOneBillingTaxRate);

  // Not Stripe related
  app.post('/v1/billing/tax-number/validate', [IS_PROTECTED_JWT], billingController.postOneBillingTaxNumberValidation);
  app.get('/v1/billing/sales-tax/:countryCode', [IS_PROTECTED_JWT], billingController.getOneBillingSalesTax);

  // Available for all users to see their organizations
  app.get('/v1/organizations', [IS_PROTECTED_JWT], organizationsController.permissions(['user']), organizationsController.getAll);

  // Organization: Info
  app.get('/v1/organizations/:organizationId', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getOne);

  // Organization: Publications
  app.get('/v1/organizations/:organizationId/publications', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getPublications);
  app.post('/v1/organizations/:organizationId/publications', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.createOnePublication);
  app.delete('/v1/organizations/:organizationId/publications/:publicationId', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-admin'])], organizationsController.deleteOnePublication);

  // Customer
  app.get('/v1/organizations/:organizationId/customer', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getOneCustomer);
  app.patch('/v1/organizations/:organizationId/customer', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-admin'])], organizationsController.patchOneCustomer);

  // Subscriptions
  app.get('/v1/organizations/:organizationId/customer/subscriptions', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getAllCustomerSubscriptions);
  app.post('/v1/organizations/:organizationId/customer/subscriptions', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.buyNewSubscriptionPlan);
  app.get('/v1/organizations/:organizationId/customer/subscriptions/:stripeSubscriptionId', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getOneCustomerSubscription);
  app.delete('/v1/organizations/:organizationId/customer/subscriptions/:stripeSubscriptionId', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-admin'])], organizationsController.deleteOneSubscription);
  app.get('/v1/organizations/:organizationId/customer/subscriptions/:stripeSubscriptionId/subscription-items', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getAllCustomerSubscriptionItems);
  app.get('/v1/organizations/:organizationId/customer/subscriptions/:stripeSubscriptionId/subscription-items/:stripeSubscriptionItemId/usage-records-summaries', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getAllCustomerUsageRecordsSummaries);
  app.get('/v1/organizations/:organizationId/customer/subscriptions/:stripeSubscriptionId/subscription-items/:stripeSubscriptionItemId/usage-records', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getAllCustomerUsageRecords);

  // Payment Methods
  app.get('/v1/organizations/:organizationId/customer/payment-methods', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getAllCustomerPaymentMethods);
  app.post('/v1/organizations/:organizationId/customer/payment-methods', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.postOneCustomerPaymentMethod);
  app.patch('/v1/organizations/:organizationId/customer/payment-methods/:stripePaymentMethodId', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.patchOneCustomerPaymentMethod);

  app.get('/v1/organizations/:organizationId/customer/setup-intent', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getOneCustomerSetupIntent);

  // Tax Id's
  app.get('/v1/organizations/:organizationId/customer/tax-ids', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getAllCustomerTaxIds);
  app.post('/v1/organizations/:organizationId/customer/tax-ids', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.postOneCustomerTaxId);
  app.delete('/v1/organizations/:organizationId/customer/tax-ids/:stripeTaxId', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.deleteOneCustomerTaxId);

  // Invoices
  app.get('/v1/organizations/:organizationId/customer/invoices', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getAllCustomerInvoices);
  app.get('/v1/organizations/:organizationId/customer/invoices/upcoming', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getOneCustomerInvoiceUpcoming);
  
  // Organization: manage Admins and Users
  app.post('/v1/organizations/:organizationId/users', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user', 'organization-admin'])], organizationsController.createOneUser);
  app.get('/v1/organizations/:organizationId/users', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getAllUsers);
  app.get('/v1/organizations/:organizationId/admin', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-user'])], organizationsController.getOneAdmin);
  app.put('/v1/organizations/:organizationId/admin', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-admin'])], organizationsController.putOneAdmin);
  app.delete('/v1/organizations/:organizationId/users/:userId', [IS_PROTECTED_JWT, organizationsController.permissions(['organization-admin'])], organizationsController.deleteOneUser);

  // User
  app.get('/v1/user', [IS_PROTECTED_JWT, userController.restrictResourceToOwner], userController.getOneUser);
  app.patch('/v1/user', [IS_PROTECTED_JWT, userController.restrictResourceToOwner], userController.patchOneUser);

  // Catch all
  // Should be the last route
  app.all('*', rateLimited, notFoundController.getAllNotFound);

  // Handle error exceptions
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err) {
      const statusCode = err.status ? err.status : err.statusCode ? err.statusCode : HttpStatus.InternalServerError;

      // We do not want to track al error types
      // General Bad Request status codes is not something we want to see
      if ([HttpStatus.BadRequest, HttpStatus.NotFound].includes(statusCode)) {
        // Sentry error tracking is only enabled in NODE_ENV production
        Sentry.configureScope(scope => {
          if (req.user!) {
            scope.setUser({
              id: req.user!.id,
              email: req.user!.email
            });
          }

          if (statusCode === HttpStatus.InternalServerError || statusCode === HttpStatus.PaymentRequired) {
            scope.setLevel(Sentry.Severity.Critical);
          }

          Sentry.captureException(err);
        });
      }

      // If we have a status code, use our custom error response
      if (statusCode) {
        return res.status(statusCode).json({
          status: statusCode ? statusCode : undefined,
          message: err.message ? err.message : 'An unexpected error occurred. Please try again or contact us when this happens again.',
          details: err.details ? err.details : undefined
        });
      }
    }

    return next(err);
  });

  app.listen(PORT, () => {
    logger.info(`App init: Listening on port ${PORT}.`);
    logger.info('App init: Ready!');
  });

  return app;
};
