import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';
import inAppPurchase, { Receipt } from 'in-app-purchase';
import joi from 'joi';
import { getRepository, LessThan } from 'typeorm';
import { subscriptionPurchaseValidationSchema } from '../database/validators';

import { APP_BUNDLE_ID } from '../constants/bundle-id';
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

  const subscriptions = await inAppSubscriptionRepository.find();

  return res.json(subscriptions);
};

/**
 * Returns all available/active subscriptions
 */
export const findAllActive = async (req: Request, res: Response) => {
  const inAppSubscriptionRepository = getRepository(InAppSubscription);

  const subscriptions = await inAppSubscriptionRepository.find({
    isActive: true
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
    const userInAppSubscriptionAppleRepository = getRepository(UserInAppSubscriptionApple);
    const userInAppSubscriptionGoogleRepository = getRepository(UserInAppSubscriptionGoogle);

    const expiredSubscriptionsApple = await userInAppSubscriptionAppleRepository.find({
      where: {
        expiresAt: LessThan(new Date()),
        status: 'active'
      },
      relations: ['user', 'inAppSubscription']
    });

    const expiredSubscriptionsGoogle = await userInAppSubscriptionGoogleRepository.find({
      where: {
        expiresAt: LessThan(new Date()),
        status: 'active'
      },
      relations: ['user', 'inAppSubscription']
    });

    // Sync the Apple subscriptions
    for (const expiredSubscriptionApple of expiredSubscriptionsApple) {
      const userId = expiredSubscriptionApple.user ? expiredSubscriptionApple.user.id : null;
      const productId = expiredSubscriptionApple.inAppSubscription.productId;

      await syncReceiptWithDatabase(InAppSubscriptionService.APPLE, expiredSubscriptionApple.latestReceipt, productId, userId);

      logger.info(loggerPrefix, `Update expired subscription data for "${InAppSubscriptionService.APPLE}".`);
    }

    // Sync the Google subscriptions
    for (const expiredSubscriptionGoogle of expiredSubscriptionsGoogle) {
      const userId = expiredSubscriptionGoogle.user ? expiredSubscriptionGoogle.user.id : null;
      const productId = expiredSubscriptionGoogle.inAppSubscription.productId;

      await syncReceiptWithDatabase(InAppSubscriptionService.GOOGLE, expiredSubscriptionGoogle.latestReceipt, productId, userId);

      logger.info(loggerPrefix, `Update expired subscription data for "${InAppSubscriptionService.GOOGLE}".`);
    }

    return res.json({ message: 'Updated!', apple: expiredSubscriptionsApple.length, google: expiredSubscriptionsGoogle.length });
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
  const userId = userInAppSubscription.user ? userInAppSubscription.user.id : null;

  try {
    // If we receive a sandbox subscription on the prod environment, just error
    // This should only happen for beta users
    // We've disabled below check, because appareantly the Apple Reviewe also uses the Sandbox environment
    // if (userInAppSubscription && userInAppSubscription.environment === InAppSubscriptionEnvironment.SANDBOX && process.env.NODE_ENV === 'production') {
    //   throw new Error('The previously purchased subscription is not valid for this environment. You should use your own Apple ID when purchasing.');
    // }

    const existingUserInAppSubscription = await userInAppSubscriptionRepository.findOne({
      where: {
        originalTransactionId
      },
      relations: ['user']
    });

    // let userInAppSubscriptionId = '';

    if (!existingUserInAppSubscription) {
      // create
      logger.info(loggerPrefix, 'Creating database entry, using:', userInAppSubscription);

      const inAppSubscriptionPurchaseToCreate = await userInAppSubscriptionRepository.create(userInAppSubscription);
      const savedInAppSubscriptionPurchase = await userInAppSubscriptionRepository.save(inAppSubscriptionPurchaseToCreate);

      logger.info(loggerPrefix, 'Created database entry!', savedInAppSubscriptionPurchase);

      const existingUserInAppSubscriptionResult = await userInAppSubscriptionRepository.findOne(savedInAppSubscriptionPurchase.id);

      if (!existingUserInAppSubscriptionResult) { throw new Error('Could not find just added user in app subscription.'); }

      logger.info(loggerPrefix, 'Finished! Returning created database entry...');

      return existingUserInAppSubscriptionResult;
    }

    // If there's already a transaction, but the user is different
    // For example: when a subscription is purchased from one account. And the same user logs into an other account (on the same device)
    if (userId && existingUserInAppSubscription.user && existingUserInAppSubscription.user.id !== userId) {
      logger.info(loggerPrefix, 'Transaction already exists in the database, but it is from a different user.', `Transaction user: "${existingUserInAppSubscription.user.id}"`, `Logged in user: "${userId}"`);

      logger.info(loggerPrefix, `We update the user of the transaction to: "${userId}".`);

      existingUserInAppSubscription.user.id = userId;
    }

    // Update
    logger.info(loggerPrefix, 'Transaction already exists. We just update it:', userInAppSubscription);
    await userInAppSubscriptionRepository.update(existingUserInAppSubscription.id, userInAppSubscription);

    const userInAppSubscriptionResult = await userInAppSubscriptionRepository.findOne(existingUserInAppSubscription.id);

    if (!userInAppSubscriptionResult) { throw new Error('Could not find just updated user in app subscription.'); }

    logger.info(loggerPrefix, 'Finished! Returning updated database entry...');

    return userInAppSubscriptionResult;
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
  const userId = userInAppSubscription.user ? userInAppSubscription.user.id : null;

  try {
    const existingUserInAppSubscription = await userInAppSubscriptionGoogleRepository.findOne({
      where: {
        purchaseToken
      },
      relations: ['user']
    });

    if (!existingUserInAppSubscription) {
      // create
      logger.info(loggerPrefix, 'Creating database entry, using:', userInAppSubscription);

      const inAppSubscriptionPurchaseToCreate = await userInAppSubscriptionGoogleRepository.create(userInAppSubscription);
      const savedInAppSubscriptionPurchase = await userInAppSubscriptionGoogleRepository.save(inAppSubscriptionPurchaseToCreate);

      logger.info(loggerPrefix, 'Created database entry!', savedInAppSubscriptionPurchase);

      const existingUserInAppSubscriptionResult = await userInAppSubscriptionGoogleRepository.findOne(savedInAppSubscriptionPurchase.id);

      if (!existingUserInAppSubscriptionResult) { throw new Error('Could not find just added user in app subscription.'); }

      logger.info(loggerPrefix, 'Finished! Returning created database entry...');

      return existingUserInAppSubscriptionResult;
    }

    // If there's already a transaction, but the user is different
    // For example: when a subscription is purchased from one account. And the same user logs into an other account (on the same device)
    if (userId && existingUserInAppSubscription.user && existingUserInAppSubscription.user.id !== userId) {
      logger.info(loggerPrefix, 'Transaction already exists in the database, but it is from a different user.', `Transaction user: "${existingUserInAppSubscription.user.id}"`, `Logged in user: "${userId}"`);

      logger.info(loggerPrefix, `We update the user of the transaction to: "${userId}".`);

      existingUserInAppSubscription.user.id = userId;
    }

    // Update
    logger.info(loggerPrefix, 'Transaction already exists. We just update it:', userInAppSubscription);
    await userInAppSubscriptionGoogleRepository.update(existingUserInAppSubscription.id, userInAppSubscription);

    const userInAppSubscriptionResult = await userInAppSubscriptionGoogleRepository.findOne(existingUserInAppSubscription.id);

    if (!userInAppSubscriptionResult) { throw new Error('Could not find just updated user in app subscription.'); }

    logger.info(loggerPrefix, 'Finished! Returning updated database entry...');

    return userInAppSubscriptionResult;
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
      const message = 'Cannot process this receipt because the productId is not defined.';

      Sentry.withScope(scope => {
        scope.setLevel(Sentry.Severity.Critical);
        if (userId) { scope.setUser({ id: userId }); }
        scope.setExtra('receipt', receipt);
        scope.setExtra('purchaseData', purchaseData);
        scope.setExtra('validationResponse', validationResponse);
        Sentry.captureMessage(message);
      });

      throw new Error(message);
    }

    await inAppPurchase.setup();

    logger.info(loggerPrefix, 'Validating receipt...', receipt);

    validationResponse = await inAppPurchase.validate(receipt);
  } catch (err) {
    let errorMessage = err && err.message ? err.message : 'Error unknown happened during validation of the receipt.';

    if (typeof err === 'string') {
      const errorObject = JSON.parse(err);

      if (errorObject && errorObject.message) {
        errorMessage = errorObject.message;
      }
    }

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      Sentry.captureException(err);
    });

    logger.error(loggerPrefix, errorMessage, err);
    throw new Error(errorMessage);
  }

  try {
    // Returns a boolean true if the given response of a receipt validation is a valid.
    const isValid = await inAppPurchase.isValidated(validationResponse);

    if (!isValid) {
      throw new Error('The given receipt validation response is not valid.');
    }

    // validatedData contains sandbox: true/false for Apple and Amazon
    purchaseData = await inAppPurchase.getPurchaseData(validationResponse, getPurchaseDataOptions);

    if (!purchaseData || !purchaseData.length) {
      const message = 'No purchase data received. Probably because the subscription is expired or canceled.';
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
      const message = 'In-App Subscription ID could not be found.';

      Sentry.withScope(scope => {
        scope.setLevel(Sentry.Severity.Critical);
        if (userId) { scope.setUser({ id: userId }); }
        scope.setExtra('receipt', receipt);
        scope.setExtra('isValid', isValid);
        // scope.setExtra('isCanceled', isCanceled);
        // scope.setExtra('isExpired', isExpired);
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

  const renewedAt = (purchase.purchaseDateMs && purchase.originalPurchaseDateMs && purchase.purchaseDateMs > purchase.originalPurchaseDateMs) ? new Date(purchase.purchaseDateMs.toString()).toISOString() : undefined;

  const canceledAt = purchase.cancellationDateMs ? new Date(parseInt(purchase.cancellationDateMs.toString(), 10)).toISOString() : undefined;

  const createdEntity = await userInAppSubscriptionAppleRepository.create({
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
  // TODO: this is not going correct
  const renewedAt = (isActive && purchase.autoRenewing && purchase.expiryTimeMillis) ? new Date(parseInt(purchase.expiryTimeMillis.toString(), 10)).toISOString() : undefined;

  // Only when the package detects a "isCanceled", use the "cancellationDate"
  const canceledAt = (isCanceled && purchase.cancellationDate) ? new Date(parseInt(purchase.cancellationDate.toString(), 10)).toISOString() : undefined;

  const createdEntity = await userInAppSubscriptionGoogleRepository.create({
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
