import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';
import inAppPurchase, { Receipt } from 'in-app-purchase';
import joi from 'joi';
import { FindConditions, FindManyOptions, getRepository, LessThan } from 'typeorm';
import { subscriptionPurchaseValidationSchema } from '../database/validators';

import { APP_BUNDLE_ID } from '../constants/bundle-id';
import { CACHE_ONE_DAY } from '../constants/cache';
import { InAppSubscription, InAppSubscriptionService } from '../database/entities/in-app-subscription';
import { InAppSubscriptionEnvironment, InAppSubscriptionStatus, UserInAppSubscriptionApple } from '../database/entities/user-in-app-subscription-apple';
import { UserInAppSubscriptionGoogle } from '../database/entities/user-in-app-subscriptions-google';
import { IGoogleSubscriptionReceipt } from '../typings';
import { logger } from '../utils';

const { NODE_ENV, GOOGLE_IAP_SERVICE_ACCOUNT_PRIVATE_KEY, GOOGLE_IAP_SERVICE_ACCOUNT_CLIENT_EMAIL, APPLE_IAP_SHARED_SECRET } = process.env ;

inAppPurchase.config({
  applePassword: APPLE_IAP_SHARED_SECRET, // this comes from iTunes Connect (You need this to valiate subscriptions)
  googleServiceAccount: {
    clientEmail: GOOGLE_IAP_SERVICE_ACCOUNT_CLIENT_EMAIL as string,
    privateKey: GOOGLE_IAP_SERVICE_ACCOUNT_PRIVATE_KEY as string
  },
  test: NODE_ENV !== 'production', // Don't use sandbox validation on production
  verbose: false // Output debug logs to stdout stream
});

/**
 * Returns all subscriptions
 */
export const findAll = async (req: Request, res: Response) => {
  const inAppSubscriptionRepository = getRepository(InAppSubscription);
  const { isActive }: {isActive: string } = req.query;

  const where: FindConditions<InAppSubscription> = {}

  if (isActive) {
    where.isActive = isActive === 'true' ? true : isActive === 'false' ? false : undefined
  }

  const cacheKey = JSON.stringify(where);

  const subscriptions = await inAppSubscriptionRepository.find({
    where,
    order: {
      price: 'ASC'
    },
    cache: {
      id: `${InAppSubscription.name}:${cacheKey}`,
      milliseconds: CACHE_ONE_DAY
    }
  });

  return res.json(subscriptions);
};

/**
 * Returns all available/active subscriptions
 */
export const findAllActive = async (req: Request, res: Response) => {
  const inAppSubscriptionRepository = getRepository(InAppSubscription);

  const subscriptions = await inAppSubscriptionRepository.find({
    where: {
      isActive: true
    },
    order: {
      price: 'ASC'
    },
    cache: {
      id: `${InAppSubscription.name}:active`,
      milliseconds: CACHE_ONE_DAY
    }
  });

  return res.json(subscriptions);
};

/**
 * Method to sync receipts in our database with Apple and Google.
 * So we always have up-to-date Receipt data in our database.
 *
 * This is a controller method we should use for polling.
 *
 */
export const syncAllExpiredUserSubscriptions = async (req: Request, res: Response) => {
  const { password } = req.query;
  const loggerPrefix = 'Sync All Expired User Subscriptions:';

  if (password !== 'thisappisawesome') {
    return res.status(401).json({ message: 'You have no access. Use our magic password.' });
  }

  try {
    const result = await syncExpiredSubscriptionsWithService();
    return res.json(result);
  } catch (err) {
    const errorMessage = err && err.message ? err.message : 'An unknown error happened while syncing expired subscriptions.';

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      Sentry.captureException(err);
    });

    logger.error(loggerPrefix, errorMessage);

    return res.status(400).json({ message: errorMessage });
  }
};

/**
 * A method to validate the purchase receipt from our users with Apple and Google servers
 */
export const validateInAppSubscriptionReceipt = async (req: Request, res: Response) => {
  interface IRequestBody {
    productId: string;
    receipt: Receipt;
    platform: 'ios' | 'android';
  }

  const loggerPrefix = 'Create And Validate In App Subscription: ';
  const { receipt, productId, platform } = req.body as IRequestBody;
  const { id: userId } = req.user;
  const inAppSubscriptionRepository = getRepository(InAppSubscription);

  const { error } = joi.validate({ ...req.body, ...req.params }, subscriptionPurchaseValidationSchema.requiredKeys('receipt', 'productId', 'platform'));

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message, statusCode: 400 });
  }

  try {
    logger.info(loggerPrefix, 'Got request body: ', req.body)

    let receiptToValidate: string | object = receipt;

    const service = platform === 'ios' ? InAppSubscriptionService.APPLE : platform === 'android' ? InAppSubscriptionService.GOOGLE : null;

    if (!service) {
      throw new Error(`The given platform "${platform}" is not supported.`);
    }

    if (service === InAppSubscriptionService.GOOGLE && typeof receipt === 'string') {
      // Manually create the receipt the package needs
      receiptToValidate = {
        ...JSON.parse(receipt),
        packageName: APP_BUNDLE_ID,
        subscription: true
      }
    }

    logger.info(loggerPrefix, receiptToValidate)

    logger.info(loggerPrefix, `Checking if subscription "${productId}" exists for service "${service}".`);

    // First, check if the subscription exists
    const subscription = await inAppSubscriptionRepository.findOne({ productId, service, isActive: true });

    if (!subscription) {
      throw new Error('An active subscription could not be found.');
    }

    logger.info(loggerPrefix, 'Subscription exists! We continue...');

    logger.info(loggerPrefix, `Starting for user: ${userId}`);

    const userInAppSubscriptionData: UserInAppSubscriptionApple | UserInAppSubscriptionGoogle = await syncReceiptWithDatabase(service, receiptToValidate, productId, userId);

    logger.info(loggerPrefix, 'Finished! Returning database entry...');

    return res.json(userInAppSubscriptionData);
  } catch (err) {
    const message = err && err.message ? err.message : 'Error happened while getting the purchase data.';

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      Sentry.captureException(err);
    });

    logger.error(loggerPrefix, message);

    return res.status(400).json({ message });
  }
};

export const updateOrCreateUserInAppSubscriptionApple = async (userInAppSubscription: UserInAppSubscriptionApple): Promise<UserInAppSubscriptionApple> => {
  const loggerPrefix = 'Update Or Create User In-App Subscription (Apple): ';
  const userInAppSubscriptionRepository = getRepository(UserInAppSubscriptionApple);

  const { originalTransactionId } = userInAppSubscription;

  try {
    const existingUserInAppSubscription = await userInAppSubscriptionRepository.findOne({
      where: {
        originalTransactionId
      },
      relations: ['user']
    });

    // If there's already a transaction, but the user is different
    // For example: when a subscription is purchased from one account. And the same user logs into an other account (on the same device)
    if (existingUserInAppSubscription) {
      logger.info(loggerPrefix, 'Transaction already exists in the database. So we update it.');

      userInAppSubscription.id = existingUserInAppSubscription.id
    }

    const toUpdateOrCreate = userInAppSubscriptionRepository.create(userInAppSubscription)

    // Save, or update
    // If ID does not exist, it will create a new entry
    const saveResult = await userInAppSubscriptionRepository.save(toUpdateOrCreate)

    logger.info(loggerPrefix, 'Finished! Returning updated database entry...');

    return saveResult;
  } catch (err) {
    const message = err && err.message ? err.message : 'Error happened while getting the purchase data.';
    logger.error(loggerPrefix, message);

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      Sentry.captureException(err);
    });

    throw err;
  }
};

export const updateOrCreateUserInAppSubscriptionGoogle = async (userInAppSubscription: UserInAppSubscriptionGoogle): Promise<UserInAppSubscriptionGoogle> => {
  const loggerPrefix = 'Update Or Create User In-App Subscription (Google): ';
  const userInAppSubscriptionGoogleRepository = getRepository(UserInAppSubscriptionGoogle);

  const { purchaseToken } = userInAppSubscription;

  try {
    const existingUserInAppSubscription = await userInAppSubscriptionGoogleRepository.findOne({
      where: {
        purchaseToken
      },
      relations: ['user']
    });

    // If there's already a transaction, but the user is different
    // For example: when a subscription is purchased from one account. And the same user logs into an other account (on the same device)
    if (existingUserInAppSubscription) {
      logger.info(loggerPrefix, 'Transaction already exists in the database. So we update it.', existingUserInAppSubscription);

      userInAppSubscription.id = existingUserInAppSubscription.id
    }

    const toUpdateOrCreate = userInAppSubscriptionGoogleRepository.create(userInAppSubscription)

    // Save, or update
    // If ID does not exist, it will create a new entry
    const saveResult = await userInAppSubscriptionGoogleRepository.save(toUpdateOrCreate)

    logger.info(loggerPrefix, 'Finished! Returning updated database entry...');

    return saveResult;
  } catch (err) {
    const message = err && err.message ? err.message : 'Error happened while getting the purchase data.';
    logger.error(loggerPrefix, message);

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      Sentry.captureException(err);
    });

    throw err;
  }
};

/**
 * Validates the receipt with the Apple servers.
 *
 * The result from this method is formatted to be easily used with our database.
 * So the properties are tightly coupled.
 *
 * @param receipt
 */
export const syncReceiptWithDatabase = async (
  service: InAppSubscriptionService,
  receipt: Receipt,
  productId?: string | null | undefined,
  userId?: string | null,

): Promise<UserInAppSubscriptionApple | UserInAppSubscriptionGoogle> => {
  const sessionId = typeof receipt === 'string' ? receipt.substring(0, 20) : null;
  const loggerPrefix = `Validate Receipt (${sessionId}): `;
  const inAppSubscriptionRepository = getRepository(InAppSubscription);

  // Allow canceled and expired subscriptions in here, so we can properly use a status history inside our database
  // Both options need to remain "false"
  const getPurchaseDataOptions = {
    ignoreCanceled: false, // Apple ONLY (for now...): purchaseData will NOT contain cancceled items
    ignoreExpired: false // purchaseData will NOT contain exipired subscription items
  };

  let validationResponse: inAppPurchase.ValidationResponse;
  let purchaseData: inAppPurchase.AppleSubscriptionPurchase[] | inAppPurchase.GoogleSubscriptionPurchase[] | null;

  try {

    // If we have no productId, we cannot determine for which subscription this is
    // We error...
    if (!productId) {
      const errorMessage = 'Could not process your purchase because there is not product ID defined. Please contact our support when this happens.';

      Sentry.withScope(scope => {
        scope.setLevel(Sentry.Severity.Critical);
        if (userId) { scope.setUser({ id: userId }); }
        scope.setExtra('receipt', receipt);
        scope.setExtra('purchaseData', purchaseData);
        scope.setExtra('validationResponse', validationResponse);
        Sentry.captureMessage(errorMessage);
      });

      throw new Error(errorMessage);
    }

    await inAppPurchase.setup();

    logger.info(loggerPrefix, 'Validating receipt...', receipt);

    validationResponse = await inAppPurchase.validate(receipt);
  } catch (err) {
    const errorMessage = 'Failed to validate your purchase. Please contact our support when this happens.';

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      scope.setExtra('receipt', receipt);
      scope.setExtra('purchaseData', purchaseData);
      scope.setExtra('validationResponse', validationResponse);
      Sentry.captureException(err);
      Sentry.captureMessage(errorMessage);
    });

    logger.error(loggerPrefix, errorMessage, err);
    throw new Error(errorMessage);
  }

  try {
    // Returns a boolean true if the given response of a receipt validation is a valid.
    const isValid = await inAppPurchase.isValidated(validationResponse);

    if (!isValid) {
      throw new Error('Failed to validate your purchase because the validation response is not valid. Please contact our support when this happens.');
    }

    // validatedData contains sandbox: true/false for Apple and Amazon
    purchaseData = await inAppPurchase.getPurchaseData(validationResponse, getPurchaseDataOptions);

    if (!purchaseData || !purchaseData.length) {
      const message = 'Failed to get the correct purchase data out of your purchase for validation. Probably because the subscription is expired or canceled.';
      logger.error(loggerPrefix, message);
      throw new Error(message);
    }

    const purchase = purchaseData[0];

    logger.info(loggerPrefix, 'Got purchase:', purchase);

    // Find the subscription based on the productId
    const inAppSubscription = await inAppSubscriptionRepository.findOne({
      productId,
      service
    });

    const inAppSubscriptionId = inAppSubscription ? inAppSubscription.id : undefined;

    if (!inAppSubscription || !inAppSubscriptionId) {
      const message = 'Failed to get the In-App Subscription ID from the purchase. Please contact our support when this happens.';

      Sentry.withScope(scope => {
        scope.setLevel(Sentry.Severity.Critical);
        if (userId) { scope.setUser({ id: userId }); }
        scope.setExtra('receipt', receipt);
        scope.setExtra('isValid', isValid);
        scope.setExtra('purchaseData', purchaseData);
        scope.setExtra('purchase', purchase);
        scope.setExtra('validationResponse', validationResponse);
        Sentry.captureMessage(message);
      });

      throw new Error(message);
    }

    // Only connect to a user if we have one
    // This could be empty if we receive events from Apple, but did not created a transaction in our database yet
    const user = userId
      ? {
        user: {
          id: userId
        }
      }
      : undefined;

    if (inAppSubscription.service === InAppSubscriptionService.APPLE) {
      logger.info(loggerPrefix, 'Extract Apple subscription data from purchase...');
      const userInAppSubscriptionAppleData = await getAppleUserInAppSubscriptionData(validationResponse, purchase, user, inAppSubscriptionId);
      const result = await updateOrCreateUserInAppSubscriptionApple(userInAppSubscriptionAppleData);
      return result;
    } else if (inAppSubscription.service === InAppSubscriptionService.GOOGLE) {
      logger.info(loggerPrefix, 'Extract Google subscription data from purchase...');
      const userInAppSubscriptionGoogleData = await getGoogleUserInAppSubscriptionData(purchase, user, inAppSubscriptionId, receipt);
      const result = await updateOrCreateUserInAppSubscriptionGoogle(userInAppSubscriptionGoogleData);
      return result;
    } else {
      throw new Error(`Service "${inAppSubscription.service}" is not supported.`);
    }
  } catch (err) {
    const errorMessage = err && err.message ? err.message : 'Error happened while getting the purchase data.';
    logger.error(loggerPrefix, errorMessage);
    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      Sentry.captureException(err);
    });
    throw new Error(errorMessage);
  }
};

export const updateOrCreateUsingPurchaseToken = async (receipt: IGoogleSubscriptionReceipt): Promise<UserInAppSubscriptionApple | UserInAppSubscriptionGoogle> => {
  const { purchaseToken, productId } = receipt;

  if (!purchaseToken) {
    throw new Error('purchaseToken not found. Which we need to update our user his subscription status in our database.');
  }

  const userInAppSubscriptionGoogleRepository = getRepository(UserInAppSubscriptionGoogle);

  // Find the user's subscription based on the purchaseToken, which is unique
  const foundUserInAppSubscription = await userInAppSubscriptionGoogleRepository.findOne({
    where: {
      purchaseToken
    },
    relations: ['user', 'inAppSubscription']
  });

  // If the transaction does not exist, the user probably does not exist either
  const userId = foundUserInAppSubscription && foundUserInAppSubscription.user ? foundUserInAppSubscription.user.id : null;

  // Validate the receipt with Google
  // The result should be that the receipt is active
  const userInAppSubscriptionData = await syncReceiptWithDatabase(InAppSubscriptionService.GOOGLE, receipt, productId, userId);

  return userInAppSubscriptionData;
};

export const updateOrCreateUsingOriginalTransactionId = async (latestReceipt?: string | object, originalTransactionId?: string, productId?: string | null): Promise<UserInAppSubscriptionApple | UserInAppSubscriptionGoogle> => {
  if (!latestReceipt) {
    throw new Error('latestReceipt not found. Which we need to update our user his subscription status in our database.');
  }

  if (!originalTransactionId) {
    throw new Error('originalTransactionId not found. Which we need to update our user his subscription status in our database.');
  }

  const userInAppSubscriptionRepository = getRepository(UserInAppSubscriptionApple);

  // Find the user's subscription using the "originalTransactionId", which is unique
  const foundUserInAppSubscription = await userInAppSubscriptionRepository.findOne({
    where: {
      originalTransactionId
    },
    relations: ['user', 'inAppSubscription']
  });

  // User could be empty if we receive notifications from apple
  const userId = foundUserInAppSubscription && foundUserInAppSubscription.user ? foundUserInAppSubscription.user.id : null;

  // Validate the receipt with Apple
  // The result should be that the receipt is active
  const userInAppSubscriptionData = await syncReceiptWithDatabase(InAppSubscriptionService.APPLE, latestReceipt, productId, userId);

  return userInAppSubscriptionData;
};

/**
 * Method to extract data from the Apple subscription purchase to be inserted in our database.
 *
 * @param validationResponse
 * @param purchase 
 */
const getAppleUserInAppSubscriptionData = async (
  validationResponse: inAppPurchase.AppleValidationResponse,
  purchase: inAppPurchase.AppleSubscriptionPurchase,
  user: object | undefined,
  inAppSubscriptionId: string
): Promise<UserInAppSubscriptionApple> => {
  const userInAppSubscriptionAppleRepository = getRepository(UserInAppSubscriptionApple);
  const isCanceled = await inAppPurchase.isCanceled(purchase);
  const isExpired = await inAppPurchase.isExpired(purchase);
  // const isActive = !isCanceled && !isExpired;
  const isTrial = !!purchase.isTrial;
  const hadTrial = (isTrial === true) ? isTrial : undefined;

  let status = InAppSubscriptionStatus.ACTIVE;

  if (isCanceled) {
    status = InAppSubscriptionStatus.CANCELED;
  }

  if (isExpired) {
    status = InAppSubscriptionStatus.EXPIRED;
  }

  const latestReceipt = validationResponse.latest_receipt;
  const latestTransactionId = purchase.transactionId;
  const originalTransactionId = purchase.originalTransactionId;

  if (!originalTransactionId) {
    throw new Error('originalTransactionId not found in purchase.');
  }

  const environment = validationResponse.environment === 'Sandbox' ? InAppSubscriptionEnvironment.SANDBOX : validationResponse.sandbox ? InAppSubscriptionEnvironment.SANDBOX : InAppSubscriptionEnvironment.PROD;

  // "purchaseDateMs" and "cancellationDateMs" are not in the types, but are available in the response
  // So we ignore the TS errors here for now
  const startedAt = purchase.originalPurchaseDateMs ? new Date(parseInt(purchase.originalPurchaseDateMs.toString(), 10)).toISOString() : purchase.originalPurchaseDate ? new Date(parseInt(purchase.originalPurchaseDate.toString(), 10)).toISOString() : undefined;

  const expiresAt = purchase.expirationDate ? new Date(parseInt(purchase.expirationDate.toString(), 10)).toISOString() : undefined;

  const renewedAt = (purchase.purchaseDateMs && purchase.originalPurchaseDateMs && purchase.purchaseDateMs > purchase.originalPurchaseDateMs) ? new Date(parseInt(purchase.purchaseDateMs.toString(), 10)).toISOString() : undefined;

  const canceledAt = purchase.cancellationDateMs ? new Date(parseInt(purchase.cancellationDateMs.toString(), 10)).toISOString() : undefined;

  const createdEntity = userInAppSubscriptionAppleRepository.create({
    latestReceipt,
    latestTransactionId,
    originalTransactionId,
    environment,
    startedAt,
    expiresAt,
    renewedAt,
    canceledAt,
    isCanceled,
    isExpired,
    isTrial,
    status,
    hadTrial,
    ...user,
    inAppSubscription: {
      id: inAppSubscriptionId
    }
  });

  return createdEntity;
}

/**
 * Method to extract data from the Google subscription purchase to be inserted in our database.
 *
 * @param validationResponse
 * @param purchase
 */
const getGoogleUserInAppSubscriptionData = async (
  purchase: inAppPurchase.GoogleSubscriptionPurchase,
  user: object | undefined,
  inAppSubscriptionId: string,
  purchaseReceipt: Receipt
): Promise<UserInAppSubscriptionGoogle> => {
  const userInAppSubscriptionGoogleRepository = getRepository(UserInAppSubscriptionGoogle);
  const isCanceled = await inAppPurchase.isCanceled(purchase);
  const isExpired = await inAppPurchase.isExpired(purchase);
  const isActive = !isCanceled && !isExpired;
  const isTrial = purchase.paymentState === 2;
  const hadTrial = (isTrial === true) ? isTrial : undefined;

  /*
    {"service":"google",
    "status":0,
    "packageName":"com.aardwegmedia.playpost",
    "productId":"com.aardwegmedia.playpost.android.premium",
    "purchaseToken":"pidfahlmgkeoggdkdmhcfidp.AO-J1OwO9af3Q67nqsvJ4pT0LcXVuf1xkP1Rc0jfT8SF54ySlPJbhs6EPBKRbZCr9XdwxcjTmyWSa1-pIBSql8tshD4wphks95tFabVjYggyINbRiwh0_xgv57DBa8ecD4zHgeZGymLvO2nHKxhmZ8Dcjh9Z6vP7kU1Z_UXinCTllB0QLwUFSvA","kind":"androidpublisher#subscriptionPurchase",
    "startTimeMillis":1567360160183,
    "expiryTimeMillis":1567362305999,
    "autoRenewing":false,
    "priceCurrencyCode":"EUR",
    "priceAmountMicros":4990000,
    "countryCode":"NL",
    "developerPayload":null,
    "cancelReason":1,
    "orderId":"GPA.3373-3758-4797-38496..5",
    "purchaseType":0,
    "acknowledgementState":1,
    "transactionId": "pidfahlmgkeoggdkdmhcfidp.AO-J1OwO9af3Q67nqsvJ4pT0LcXVuf1xkP1Rc0jfT8SF54ySlPJbhs6EPBKRbZCr9XdwxcjTmyWSa1-pIBSql8tshD4wphks95tFabVjYggyINbRiwh0_xgv57DBa8ecD4zHgeZGymLvO2nHKxhmZ8Dcjh9Z6vP7kU1Z_UXinCTllB0QLwUFSvA",
    "quantity":1,
    "expirationDate":"1567362305999",
    "cancellationDate":"1567362305999"
  }
  */

  let status = InAppSubscriptionStatus.ACTIVE;

  if (isCanceled) {
    status = InAppSubscriptionStatus.CANCELED;
  }

  if (isExpired) {
    status = InAppSubscriptionStatus.EXPIRED;
  }

  // The receipt from Google is an object, or a JSON stringified object
  // If it's an object, we just stringify it so we can store it in our database as a string
  const latestReceipt = (typeof purchaseReceipt === 'object') ? JSON.stringify(purchaseReceipt) : purchaseReceipt;

  const orderId = purchase.orderId; // Or "orderId" in Google terms (transactionId is orderId)
  const purchaseToken = purchase.purchaseToken; // The purchaseToken is unique per user per subscription (Google)
  const transactionId = purchase.transactionId;

  // About "purchaseType":
  // The type of purchase of the subscription. This field is only set if this purchase was not made using the standard in-app billing flow. Possible values are: Test (i.e. purchased from a license testing account)
  // More info: https://developers.google.com/android-publisher/api-ref/purchases/subscriptions
  const environment = purchase.purchaseType === 0 ? InAppSubscriptionEnvironment.SANDBOX : InAppSubscriptionEnvironment.PROD;

  // About "startTimeMillis":
  // Time at which the subscription was granted, in milliseconds since the Epoch.
  const startedAt = purchase.startTimeMillis ? new Date(parseInt(purchase.startTimeMillis.toString(), 10)).toISOString() : undefined;

  const expiresAt = purchase.expirationDate ? new Date(parseInt(purchase.expirationDate.toString(), 10)).toISOString() : undefined;

  // Only set the renewedAt date to the expire data when we auto renew and the subscription is still active
  // Set the current date as the renewed date
  const renewedAt = (isActive && purchase.autoRenewing && purchase.expiryTimeMillis) ? new Date().toISOString() : undefined;

  // Only when the package detects a "isCanceled", use the "cancellationDate"
  const canceledAt = (isCanceled && purchase.cancellationDate) ? new Date(parseInt(purchase.cancellationDate.toString(), 10)).toISOString() : undefined;

  const createdEntity = userInAppSubscriptionGoogleRepository.create({
    latestReceipt,
    orderId,
    purchaseToken,
    transactionId,
    environment,
    startedAt,
    expiresAt,
    renewedAt,
    canceledAt,
    isCanceled,
    isExpired,
    isTrial,
    status,
    hadTrial,
    ...user,
    inAppSubscription: {
      id: inAppSubscriptionId
    }
  });

  return createdEntity;

}

export const syncExpiredSubscriptionsWithService = async (userId?: string) => {
  const loggerPrefix = '(Sync Expired In App Subscriptions With Service): ';

  // If a userId is given, use that to search the user's subscriptions
  const user = userId ? { user: { id: userId } } : undefined;

  const findOptions: FindManyOptions<UserInAppSubscriptionApple> | FindManyOptions<UserInAppSubscriptionGoogle> = {
    where: {
      expiresAt: LessThan(new Date()),
      status: InAppSubscriptionStatus.ACTIVE,
      ...user
    },
    relations: ['user', 'inAppSubscription']
  }

  try {
    const userInAppSubscriptionAppleRepository = getRepository(UserInAppSubscriptionApple);
    const userInAppSubscriptionGoogleRepository = getRepository(UserInAppSubscriptionGoogle);

    // Use a promise.all to get both the results quicker
    const [expiredSubscriptionsApple, expiredSubscriptionsGoogle] = await Promise.all([
      await userInAppSubscriptionAppleRepository.find(findOptions as FindManyOptions<UserInAppSubscriptionApple>),
      await userInAppSubscriptionGoogleRepository.find(findOptions as FindManyOptions<UserInAppSubscriptionGoogle>)
    ])

    // Sync the Apple subscriptions
    for (const expiredSubscriptionApple of expiredSubscriptionsApple) {
      logger.info(loggerPrefix, `Trying to sync expired Apple Subscription:`, expiredSubscriptionApple);
      const subscriptionUserId = (expiredSubscriptionApple.user) ? expiredSubscriptionApple.user.id : null;
      const productId = expiredSubscriptionApple.inAppSubscription.productId;
      const receipt = expiredSubscriptionApple.latestReceipt;

      await syncReceiptWithDatabase(InAppSubscriptionService.APPLE, receipt, productId, subscriptionUserId);

      logger.info(loggerPrefix, `Update expired subscription data for "${InAppSubscriptionService.APPLE}".`);
    }

    // Sync the Google subscriptions
    for (const expiredSubscriptionGoogle of expiredSubscriptionsGoogle) {
      logger.info(loggerPrefix, `Trying to sync expired Google Subscription:`, expiredSubscriptionGoogle);
      const subscriptionUserId = (expiredSubscriptionGoogle.user) ? expiredSubscriptionGoogle.user.id : null;
      const productId = expiredSubscriptionGoogle.inAppSubscription.productId;

      // Make sure we pass in a JSON object
      const receipt = (typeof expiredSubscriptionGoogle.latestReceipt === 'string') ? JSON.parse(expiredSubscriptionGoogle.latestReceipt) : expiredSubscriptionGoogle.latestReceipt;

      await syncReceiptWithDatabase(InAppSubscriptionService.GOOGLE, receipt, productId, subscriptionUserId);

      logger.info(loggerPrefix, `Update expired subscription data for "${InAppSubscriptionService.GOOGLE}".`);
    }

    return { message: 'Updated!', apple: expiredSubscriptionsApple.length, google: expiredSubscriptionsGoogle.length };
  } catch (err) {
    throw err;
  }
}
