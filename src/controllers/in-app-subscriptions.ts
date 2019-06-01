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
export const validateSubscriptionPurchase = async (req: Request, res: Response) => {
  interface RequestBody {
    receipt: Receipt;
  }

  interface RequestParams {
    inAppSubscriptionId: string;
  }

  const loggerPrefix = 'Create And Validate Purchase: ';
  const { receipt } = req.body as RequestBody;
  const { inAppSubscriptionId } = req.params as RequestParams;
  const userId = req.user.id;
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
      return res.status(400).json({ message: 'The given receipt validation response is not valid.' });
    }

    // validatedData contains sandbox: true/false for Apple and Amazon
    purchaseData = await inAppPurchase.getPurchaseData(validationResponse, options);

    if (!purchaseData || !purchaseData.length) {
      return res.status(400).json({ message: 'No purchase data received. Probably because the subscription is expired or canceled.' });
    }

    logger.info(loggerPrefix, 'Got purchase data:', purchaseData);

    const purchase = purchaseData[0];

    logger.info(loggerPrefix, 'Got purchase:', purchase);

    if (purchase.productId !== subscription.productId) {
      return res.status(400).json({ message: 'The productId in the purchase data does not match the productId in the subscription. So this transaction is not valid.' });
    }

    // Returns a boolean true if a canceled receipt is validated.
    // TODO: return to the user the subscription is canceled?
    const isCanceled = await inAppPurchase.isCanceled(purchase);

    // Returns a boolean true if a expired receipt is validated.
    // TODO: return to the user the subscription is expired?
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
      return res.status(400).json({ message: 'The validation response did not return the latest_receipt.' });
    }

    // @ts-ignore
    if (!validationResponse.environment) {
      return res.status(400).json({ message: 'The validation response did not return the environment.' });
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

    const existingUserInAppSubscription = await userInAppSubscriptionRepository.findOne({ where: {
      originalTransactionId: purchase.originalTransactionId,
      user: {
        id: userId
      }
    }});

    let userInAppSubscriptionId = '';

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
    const errorMessage = 'Error happened while getting the purchase data.';
    logger.error(loggerPrefix, errorMessage, err);
    return res.status(500).json({ message: errorMessage });
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
export const processSubscriptionUpdate = async (req: Request, res: Response) => {
  // {
  //   "auto_renew_status": 0, 
  //   "status": 21006,
  //   "cancellation_date": "2018-04-18 06:18:23 Etc/GMT",
  //   "auto_renew_product_id": "com.busuu.app.subs12month_FT_jan_18",
  //   "cancellation_reason": "0",
  //   "latest_expired_receipt_info": {
  //      "original_purchase_date_pst": "2018-04-02 04:46:01 America/Los_Angeles",
  //      "cancellation_date_ms": "1528331233000",
  //      "quantity": "1",
  //      "cancellation_reason": "0",
  //      "unique_vendor_identifier": "***",
  //      "bvrs": "2",
  //      "expires_date_formatted": "2019-04-16 18:46:01 Etc/GMT",
  //      "is_in_intro_offer_period": "false",
  //      "purchase_date_ms": "1523904361000",
  //      "expires_date_formatted_pst": "2019-04-16 11:46:01 America/Los_Angeles",
  //      "is_trial_period": "false",
  //      "item_id": "***",
  //      "unique_identifier": "***",
  //      "original_transaction_id": "***",
  //      "expires_date": "1555440361000",
  //      "app_item_id": "***",
  //      "transaction_id": "***",
  //      "web_order_line_item_id": "***",
  //      "original_purchase_date": "2018-04-09 18:46:01 Etc/GMT",
  //      "cancellation_date": "2018-04-18 06:18:23 Etc/GMT",
  //      "product_id": "com.busuu.app.subs12month_FT_jan_18",
  //      "purchase_date": "2018-04-16 18:46:01 Etc/GMT",
  //      "purchase_date_pst": "2018-04-16 11:46:01 America/Los_Angeles",
  //      "cancellation_date_pst": "2018-04-17 23:18:23 America/Los_Angeles",
  //      "bid": "com.busuu.english.app",
  //      "original_purchase_date_ms": "1523299561000"
  //   }...
  //  }
}
