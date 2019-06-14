import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { subscriptionPurchaseValidationSchema } from '../database/validators';
import joi from 'joi';
import { logger } from '../utils';
import inAppPurchase, { Receipt } from 'in-app-purchase';
import { InAppSubscriptionStatus, UserInAppSubscription, InAppSubscriptionEnvironment } from '../database/entities/user-in-app-subscription';
import { InAppSubscription } from '../database/entities/in-app-subscription';

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
  const userInAppSubscriptionRepository = getRepository(UserInAppSubscription);
  const inAppSubscriptionRepository = getRepository(InAppSubscription);

  let validationResponse: inAppPurchase.ValidationResponse;
  let purchaseData: inAppPurchase.PurchasedItem[] | null;

  const { error } = joi.validate({ receipt, inAppSubscriptionId }, subscriptionPurchaseValidationSchema.requiredKeys('receipt', 'inAppSubscriptionId'));

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message, statusCode: 400 });
  }

  logger.info(loggerPrefix, `Starting for user: ${userId}`);

  logger.info(loggerPrefix, `Checking if subscription exists: ${inAppSubscriptionId}`);

  // First, check if the subscription exists
  const subscription = await inAppSubscriptionRepository.findOne(inAppSubscriptionId, { where: { isActive: true } });
  if (!subscription) return res.status(400).json({ message: 'An active subscription could not be found.' });

  logger.info(loggerPrefix, 'Subscription exists! We continue...');

  try {
    logger.info(loggerPrefix, 'Setup In App Purchase service...');

    await inAppPurchase.setup();

    logger.info(loggerPrefix, 'Validating receipt...');

    validationResponse = await inAppPurchase.validate(receipt);
  } catch (err) {
    let errorMessage = 'Error unknown happened during validation of the receipt.';
    let status = undefined;

    if (typeof err === 'string') {
      const errorObject = JSON.parse(err);

      if (errorObject && errorObject.message) {
        errorMessage = errorObject.message;
        status = errorObject.status;
      }
    }

    logger.error(loggerPrefix, errorMessage, err);
    return res.status(500).json({ status, message: errorMessage });
  }

  try {
    logger.info(loggerPrefix, 'Validated receipt! Now getting purchase data...');

    // Allow canceled and expired subscriptions in here, so we can properly use a status history inside our database
    // Both options need to remain "false"
    const options = {
      ignoreCanceled: false, // Apple ONLY (for now...): purchaseData will NOT contain cancceled items
      ignoreExpired: false // purchaseData will NOT contain exipired subscription items
    };

    // Returns a boolean true if the given response of a receipt validation is a valid.
    const isValid = await inAppPurchase.isValidated(validationResponse);

    if (!isValid) {
      throw new Error('The given receipt validation response is not valid.');
    }

    // validatedData contains sandbox: true/false for Apple and Amazon
    purchaseData = await inAppPurchase.getPurchaseData(validationResponse, options);

    if (!purchaseData || !purchaseData.length) {
      const message = 'No purchase data received. Probably because the subscription is expired or canceled.';
      logger.error(loggerPrefix, message);
      throw new Error(message);
    }

    logger.info(loggerPrefix, 'Got purchase data:', purchaseData);

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
    if (!validationResponse.latest_receipt) {
      const message = 'The validation response did not return the latest_receipt.';
      logger.error(loggerPrefix, message);
      throw new Error(message);
    }

    // @ts-ignore
    if (!validationResponse.environment) {
      const message = 'The validation response did not return the environment.';
      logger.error(loggerPrefix, message);
      throw new Error(message);
    }

    // @ts-ignore
    const latestReceipt = validationResponse.latest_receipt;

    // @ts-ignore
    const environment = validationResponse.environment === 'Sandbox' ? InAppSubscriptionEnvironment.SANDBOX : InAppSubscriptionEnvironment.PROD;

    // "purchaseDateMs" and "cancellationDateMs" are not in the types, but are available in the response
    // So we ignore the TS errors here for now
    // @ts-ignore
    const startedAt = (purchase.originalPurchaseDateMs) ? new Date(purchase.originalPurchaseDateMs).toISOString() : (purchase.originalPurchaseDate) ? purchase.originalPurchaseDate : undefined;
    const endedAt = (purchase.expirationDate) ? new Date(purchase.expirationDate).toISOString() : undefined;
    // @ts-ignore
    const renewedAt = (purchase.purchaseDateMs > purchase.originalPurchaseDateMs) ? new Date(purchase.purchaseDateMs).toISOString() : undefined;
    // @ts-ignore
    const canceledAt = (purchase.cancellationDateMs) ? new Date(purchase.cancellationDateMs).toISOString() : (purchase.cancellationDate) ? purchase.cancellationDate : undefined;

    const inAppSubscriptionPurchase = {
      status,
      startedAt,
      endedAt,
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
    };

    // Check if there's already a subscription in the database
    // If so, we just update it
    // If not, we create a new one
    // 1 user has 1 row of this in the database
    const existingUserInAppSubscription = await userInAppSubscriptionRepository.findOne({
      where: {
        originalTransactionId: purchase.originalTransactionId
      },
      relations: ['user']
    });

    let userInAppSubscriptionId = '';

    // If there's already a transaction, but the user is different
    // For example: when a subscription is purchased from one account. And the same user logs into an other account (on the same device)
    if (existingUserInAppSubscription && existingUserInAppSubscription.user.id !== userId) {
      logger.info(
        loggerPrefix,
        'Transaction already exists in the database, but it is from a different user.',
        `Transaction user: "${existingUserInAppSubscription.user.id}"`,
        `Logged in user: "${userId}"`
      );

      logger.info(loggerPrefix, `We update the user of the transaction to: "${userId}".`);
    }

    if (existingUserInAppSubscription) {
      // Update
      logger.info(loggerPrefix, 'Transaction already exists. We just update it:', inAppSubscriptionPurchase);
      await userInAppSubscriptionRepository.update(existingUserInAppSubscription.id, inAppSubscriptionPurchase);
      userInAppSubscriptionId = existingUserInAppSubscription.id;
    } else {
      // create
      logger.info(loggerPrefix, 'Creating database entry, using:', inAppSubscriptionPurchase);

      const inAppSubscriptionPurchaseToCreate = await userInAppSubscriptionRepository.create(inAppSubscriptionPurchase);
      await userInAppSubscriptionRepository.save(inAppSubscriptionPurchaseToCreate);

      logger.info(loggerPrefix, 'Created database entry!');

      userInAppSubscriptionId = inAppSubscriptionPurchaseToCreate.id;
    }

    const foundInAppSubscriptionPurchase = await userInAppSubscriptionRepository.findOne(userInAppSubscriptionId);

    logger.info(loggerPrefix, 'Finished! Returning database entry...');

    return res.json({ ...foundInAppSubscriptionPurchase });
  } catch (err) {
    const errorMessage = (err && err.message) ? err.message : 'Error happened while getting the purchase data.';
    logger.error(loggerPrefix, errorMessage);
    return res.status(400).json({ message: errorMessage });
  }
};

/**
 * Process the subscription status updates we receive from Apple
 * The URL is given at the "Subscription Status URL" inside App Store Connect
 * Here: https://appstoreconnect.apple.com/WebObjects/iTunesConnect.woa/ra/ng/app/1460663960
 *
 * About Subscription Status URL:
 * A server URL to receive update notifications (JSON object posts) for key subscription events.
 * This is applicable only for apps containing auto-renewable subscriptions.
 * It is recommended to use these notifications in conjunction with Receipt Validation to validate users' current subscription status and provide them with service.
 *
 * More info: https://help.apple.com/app-store-connect/#/dev0067a330b
 * More info: https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
 *
 *
 */
export const processSubscriptionStatusUpdate = async (req: Request, res: Response) => {
  /* tslint:disable max-line-length */
  // https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/StoreKitGuide/Chapters/Subscriptions.html#//apple_ref/doc/uid/TP40008267-CH7-SW13
  const statusUpdateRequest: StatusUpdateRequest = req.body;

  console.log('Should process this:', statusUpdateRequest);
  console.log('Should update subscription originalTransactionId: ', statusUpdateRequest.original_transaction_id);

  // TODO: only send OK when we have processed the status update
  // TODO: alarm maintainer when processing error happens
  return res.status(400).json({ message: 'Not ok, send again!' });
  // return res.status(200).json({ message: 'OK!' });

  interface StatusUpdateRequest {
    environment: 'Sandbox' | 'PROD'; // Specifies whether the notification is for a sandbox or a production environment
    notification_type: 'INITIAL_BUY' | 'CANCEL' | 'RENEWAL' | 'INTERACTIVE_RENEWAL' | 'DID_CHANGE_RENEWAL_PREF'; // Describes the kind of event that triggered the notification. // https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/StoreKitGuide/Chapters/Subscriptions.html#//apple_ref/doc/uid/TP40008267-CH7-SW16
    password: string; // This value is the same as the shared secret you POST when validating receipts.
    original_transaction_id: string; // This value is the same as the Original Transaction Identifier in the receipt. You can use this value to relate multiple iOS 6-style transaction receipts for an individual customer’s subscription.
    cancellation_date?: string; // The time and date that a transaction was cancelled by Apple customer support. Posted only if the notification_type is CANCEL
    web_order_line_item_id?: string; // The primary key for identifying a subscription purchase. Posted only if the notification_type is CANCEL.
    latest_receipt?: string; // The base-64 encoded transaction receipt for the most recent renewal transaction. Posted only if the notification_type is RENEWAL or INTERACTIVE_RENEWAL, and only if the renewal is successful.
    latest_receipt_info?: ReceiptDetails; // The JSON representation of the receipt for the most recent renewal. Posted only if renewal is successful. Not posted for notification_type CANCEL.
    latest_expired_receipt?: string; // The base-64 encoded transaction receipt for the most recent renewal transaction. Posted only if the subscription expired.
    latest_expired_receipt_info?: ReceiptDetails; // The JSON representation of the receipt for the most recent renewal transaction. Posted only if the notification_type is RENEWAL or CANCEL or if renewal failed and subscription expired.
    auto_renew_status: boolean; // A Boolean value indicated by strings “true” or “false”. This is the same as the auto renew status in the receipt.
    auto_renew_adam_id: string; // The current renewal preference for the auto-renewable subscription. This is the Apple ID of the product.
    auto_renew_product_id: string; // This is the same as the Subscription Auto Renew Preference in the receipt.
    expiration_intent?: number; // This is the same as the Subscription Expiration Intent in the receipt. Posted only if notification_type is RENEWAL or INTERACTIVE_RENEWAL.
  }

  interface ReceiptDetails {
    original_purchase_date_pst: string;
    cancellation_date_ms: string | number;
    quantity: string | number;
    cancellation_reason: string | number;
    unique_vendor_identifier: string;
    bvrs: string | number;
    expires_date_formatted: string;
    is_in_intro_offer_period: boolean;
    purchase_date_ms: string | number;
    expires_date_formatted_pst: string;
    is_trial_period: boolean;
    item_id: string;
    unique_identifier: string;
    original_transaction_id: string;
    expires_date: string | number;
    app_item_id: string;
    transaction_id: string;
    web_order_line_item_id: string;
    original_purchase_date: string;
    cancellation_date: string;
    product_id: string;
    purchase_date: string;
    purchase_date_pst: string;
    cancellation_date_pst: string;
    bid: string;
    original_purchase_date_ms: string | number;
  }
}
