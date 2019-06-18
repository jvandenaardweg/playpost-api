import { Request, Response } from 'express';
import { getRepository, LessThan } from 'typeorm';
import { subscriptionPurchaseValidationSchema } from '../database/validators';
import joi from 'joi';
import { logger } from '../utils';
import inAppPurchase, { Receipt } from 'in-app-purchase';
import { InAppSubscriptionStatus, UserInAppSubscription, InAppSubscriptionEnvironment } from '../database/entities/user-in-app-subscription';
import { InAppSubscription } from '../database/entities/in-app-subscription';
import { Sentry } from '../error-reporter';

const { NODE_ENV, APPLE_IAP_SHARED_SECRET } = process.env;

inAppPurchase.config({
  applePassword: APPLE_IAP_SHARED_SECRET, // this comes from iTunes Connect (You need this to valiate subscriptions)
  test: (NODE_ENV !== 'production'), // Don't use sandbox validation on production
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
 * Method to sync receipts in our database with Apple.
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
    const userInAppSubscriptionRepository = getRepository(UserInAppSubscription);

    const expiredSubscriptions = await userInAppSubscriptionRepository.find({
      where: {
        expiresAt: LessThan(new Date()),
        status: 'active'
      },
      relations: ['user', 'inAppSubscription']
    });

    if (!expiredSubscriptions.length) return res.status(200).json({ message: 'No active subscriptions found with an expiresAt date greater then the current date. Nothing to update...' });

    for (const expiredSubscription of expiredSubscriptions) {
      const userId = expiredSubscription.user.id;
      const inAppSubscriptionId = expiredSubscription.inAppSubscription.id;

      const userInAppSubscriptionData = await validateReceipt(expiredSubscription.latestReceipt, userId, inAppSubscriptionId);

      logger.info(loggerPrefix, 'Update expired subscription data for');

      await updateOrCreateUserInAppSubscription(userInAppSubscriptionData);
    }

    logger.info(loggerPrefix, 'Updated all expired subscriptions with the latest data from Apple.');

    return res.json({ message: 'Updated!' });
  } catch (err) {
    const errorMessage = (err && err.message) ? err.message : 'An unknown error happened while syncing expired subscriptions.';
    logger.error(loggerPrefix, errorMessage);
    Sentry.captureException(err);
    return res.status(400).json({ message: errorMessage });
  }
};

/**
 * A method to validate the purchase receipt from our users with Apple/Google servers
 */
export const validateInAppSubscriptionReceipt = async (req: Request, res: Response) => {
  interface RequestBody {
    receipt: Receipt;
  }

  interface RequestParams {
    inAppSubscriptionId: string;
  }

  const loggerPrefix = 'Create And Validate In App Subscription: ';
  const { receipt } = req.body as RequestBody;
  const { inAppSubscriptionId } = req.params as RequestParams;
  const { id: userId } = req.user;
  const inAppSubscriptionRepository = getRepository(InAppSubscription);

  const { error } = joi.validate({ receipt, inAppSubscriptionId }, subscriptionPurchaseValidationSchema.requiredKeys('receipt', 'inAppSubscriptionId'));

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message, statusCode: 400 });
  }

  try {
    logger.info(loggerPrefix, `Checking if subscription exists: ${inAppSubscriptionId}`);

    // First, check if the subscription exists
    const subscription = await inAppSubscriptionRepository.findOne(inAppSubscriptionId, { where: { isActive: true } });
    if (!subscription) throw new Error('An active subscription could not be found.');

    logger.info(loggerPrefix, 'Subscription exists! We continue...');

    logger.info(loggerPrefix, `Starting for user: ${userId}`);

    const userInAppSubscriptionData = await validateReceipt(receipt, userId, inAppSubscriptionId);

    logger.info(loggerPrefix, 'Got transaction data from validate receipt!');

    const userInAppSubscriptionResult = await updateOrCreateUserInAppSubscription(userInAppSubscriptionData);

    logger.info(loggerPrefix, 'Finished! Returning database entry...');

    return res.json({ ...userInAppSubscriptionResult });
  } catch (err) {
    const errorMessage = (err && err.message) ? err.message : 'Error happened while getting the purchase data.';
    logger.error(loggerPrefix, errorMessage);
    Sentry.captureException(err);
    return res.status(400).json({ message: errorMessage });
  }
};

export const updateOrCreateUserInAppSubscription = async (userInAppSubscription: UserInAppSubscription): Promise<UserInAppSubscription> => {
  const loggerPrefix = 'Update Or Create User In-App Subscription: ';
  const userInAppSubscriptionRepository = getRepository(UserInAppSubscription);

  const { originalTransactionId, user: { id: userId } } = userInAppSubscription;

  try {
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

      logger.info(loggerPrefix, 'Created database entry!');

      const userInAppSubscriptionResult = await userInAppSubscriptionRepository.findOne(savedInAppSubscriptionPurchase[0].id);

      if (!userInAppSubscriptionResult) throw new Error('Could not find just added user in app subscription.');

      logger.info(loggerPrefix, 'Finished! Returning created database entry...');

      return userInAppSubscriptionResult;
    }

    // If there's already a transaction, but the user is different
    // For example: when a subscription is purchased from one account. And the same user logs into an other account (on the same device)
    if (existingUserInAppSubscription.user.id !== userId) {
      logger.info(
        loggerPrefix,
        'Transaction already exists in the database, but it is from a different user.',
        `Transaction user: "${existingUserInAppSubscription.user.id}"`,
        `Logged in user: "${userId}"`
      );

      logger.info(loggerPrefix, `We update the user of the transaction to: "${userId}".`);

      existingUserInAppSubscription.user.id = userId;
    }

    // Update
    logger.info(loggerPrefix, 'Transaction already exists. We just update it:', userInAppSubscription);
    await userInAppSubscriptionRepository.update(existingUserInAppSubscription.id, userInAppSubscription);

    const userInAppSubscriptionResult = await userInAppSubscriptionRepository.findOne(existingUserInAppSubscription.id);

    if (!userInAppSubscriptionResult) throw new Error('Could not find just updated user in app subscription.');

    logger.info(loggerPrefix, 'Finished! Returning updated database entry...');

    return userInAppSubscriptionResult;
  } catch (err) {
    const errorMessage = (err && err.message) ? err.message : 'Error happened while getting the purchase data.';
    logger.error(loggerPrefix, errorMessage);
    Sentry.captureException(err);
    throw new Error(errorMessage);
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
export const validateReceipt = async (receipt: Receipt, userId: string, inAppSubscriptionId: string): Promise<UserInAppSubscription> => {
  const sessionId = (typeof receipt === 'string') ? receipt.substring(0, 20) : null;
  const loggerPrefix = `Validate Receipt (${sessionId}): `;
  const userInAppSubscriptionRepository = getRepository(UserInAppSubscription);

  // Allow canceled and expired subscriptions in here, so we can properly use a status history inside our database
  // Both options need to remain "false"
  const getPurchaseDataOptions = {
    ignoreCanceled: false, // Apple ONLY (for now...): purchaseData will NOT contain cancceled items
    ignoreExpired: false // purchaseData will NOT contain exipired subscription items
  };

  let validationResponse: inAppPurchase.ValidationResponse;
  let purchaseData: inAppPurchase.PurchasedItem[] | null;

  try {
    await inAppPurchase.setup();

    logger.info(loggerPrefix, 'Validating receipt...');

    validationResponse = await inAppPurchase.validate(receipt);
  } catch (err) {
    let errorMessage = 'Error unknown happened during validation of the receipt.';

    if (typeof err === 'string') {
      const errorObject = JSON.parse(err);

      if (errorObject && errorObject.message) {
        errorMessage = errorObject.message;
      }
    }

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

    // Returns a boolean true if a canceled receipt is validated.
    const isCanceled = await inAppPurchase.isCanceled(purchase);

    // Returns a boolean true if a expired receipt is validated.
    const isExpired = await inAppPurchase.isExpired(purchase);

    let status = InAppSubscriptionStatus.ACTIVE;

    if (isCanceled) {
      status = InAppSubscriptionStatus.CANCELED;
    }

    if (isExpired) {
      status = InAppSubscriptionStatus.EXPIRED;
    }

    logger.info(loggerPrefix, 'Got status:', status);

    // @ts-ignore
    const latestReceipt = validationResponse.latest_receipt || receipt;

    // @ts-ignore
    const environment = (validationResponse.environment === 'Sandbox') ? InAppSubscriptionEnvironment.SANDBOX : validationResponse.sandbox ? InAppSubscriptionEnvironment.SANDBOX : InAppSubscriptionEnvironment.PROD;

    // "purchaseDateMs" and "cancellationDateMs" are not in the types, but are available in the response
    // So we ignore the TS errors here for now
    // @ts-ignore
    const startedAt = (purchase.originalPurchaseDateMs) ? new Date(parseInt(purchase.originalPurchaseDateMs, 10)).toISOString() : (purchase.originalPurchaseDate) ? new Date(parseInt(purchase.originalPurchaseDate, 10)).toISOString() : undefined;

    // @ts-ignore
    const expiresAt = (purchase.expirationDate) ? new Date(parseInt(purchase.expirationDate, 10)).toISOString() : undefined;

    // @ts-ignore
    const renewedAt = (purchase.purchaseDateMs > purchase.originalPurchaseDateMs) ? new Date(purchase.purchaseDateMs).toISOString() : undefined;

    // @ts-ignore
    const canceledAt = (purchase.cancellationDateMs) ? new Date(parseInt(purchase.cancellationDateMs, 10)).toISOString() : (purchase.cancellationDate) ? purchase.cancellationDate : undefined;

    const userInAppSubscriptionData = await userInAppSubscriptionRepository.create({
      status,
      startedAt,
      expiresAt,
      canceledAt,
      latestReceipt,
      environment,
      renewedAt,
      isExpired,
      isCanceled,
      latestTransactionId: purchase.transactionId,
      originalTransactionId: purchase.originalTransactionId,
      isTrial: purchase.isTrial,
      user: {
        id: userId
      },
      inAppSubscription: {
        id: inAppSubscriptionId
      }
    });

    return userInAppSubscriptionData;
  } catch (err) {
    const errorMessage = (err && err.message) ? err.message : 'Error happened while getting the purchase data.';
    logger.error(loggerPrefix, errorMessage);
    Sentry.captureException(err);
    throw new Error(errorMessage);
  }
};

export const updateOrCreateUsingOriginalTransactionId = async (latestReceipt?: string, originalTransactionId?: string): Promise<UserInAppSubscription> => {
  if (!latestReceipt) {
    throw new Error('latestReceipt not found. Which we need to update our user his subscription status in our database.');
  }

  if (!originalTransactionId) {
    throw new Error('originalTransactionId not found. Which we need to update our user his subscription status in our database.');
  }

  const userInAppSubscriptionRepository = getRepository(UserInAppSubscription);

  // Find the user's subscription
  const foundUserInAppSubscription = await userInAppSubscriptionRepository.findOne({
    where: {
      originalTransactionId,
    },
    relations: ['user', 'inAppSubscription']
  });

  if (!foundUserInAppSubscription) {
    throw new Error(`Could not find a user's in app subscription transaction using originalTransactionId: "${originalTransactionId}".`);
  }

  const {
    user: { id: userId },
    inAppSubscription: { id: inAppSubscriptionId }
  } = foundUserInAppSubscription;

  // Validate the receipt with Apple
  // The result should be that the receipt is active
  const userInAppSubscriptionData = await validateReceipt(latestReceipt, userId, inAppSubscriptionId);

  // Update the subscription for the user
  const result = await updateOrCreateUserInAppSubscription(userInAppSubscriptionData);

  return result;
};
