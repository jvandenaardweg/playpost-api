import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { subscriptionPurchaseValidationSchema } from '../database/validators';
import joi from 'joi';
import { logger } from '../utils';
import inAppPurchase, { Receipt } from 'in-app-purchase';
import { PurchaseStatus, SubscriptionPurchase, PurchaseService } from '../database/entities/subscription-purchase';

const { NODE_ENV, APPLE_SUBSCRIPTION_KEY_ID } = process.env;

inAppPurchase.config({
  applePassword: APPLE_SUBSCRIPTION_KEY_ID, // this comes from iTunes Connect (You need this to valiate subscriptions)
  test: (NODE_ENV !== 'production'), // Don't use sandbox validation on production
  verbose: true // Output debug logs to stdout stream
});

interface RequestBody {
  receipt: Receipt;
}

/**
 * A method to validate the purchase receipt from our users with Apple/Google servers
 */
export const createAndValidatePurchase = async (req: Request, res: Response) => {
  const loggerPrefix = 'Create And Validate Purchase: ';
  const { receipt } = req.body as RequestBody;
  const userId = req.user.id;
  const subscriptionPurchaseRepository = getRepository(SubscriptionPurchase);

  let validationResponse: inAppPurchase.ValidationResponse;
  let purchaseData: inAppPurchase.PurchasedItem[] | null;

  const { error } = joi.validate({ receipt }, subscriptionPurchaseValidationSchema.requiredKeys('receipt'));

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message, statusCode: 400 });
  }

  logger.info(loggerPrefix, `Starting for user: ${userId}`);

  try {
    logger.info(loggerPrefix, 'Setup...');

    await inAppPurchase.setup();

    logger.info(loggerPrefix, 'Validating receipt...');

    validationResponse = await inAppPurchase.validate(receipt);
  } catch (err) {
    const errorMessage = 'Error happened during validation of the receipt.';
    logger.error(loggerPrefix, errorMessage, err);
    return res.status(500).json({ message: errorMessage });
  }

  try {
    logger.info(loggerPrefix, 'Validated receipt! Now getting purchase data...');

    const options = {
      ignoreCanceled: true, // Apple ONLY (for now...): purchaseData will NOT contain cancceled items
      ignoreExpired: true // purchaseData will NOT contain exipired subscription items
    };

    // Returns a boolean true if the given response of a receipt validation is a valid.
    const isValid = await inAppPurchase.isValidated(validationResponse);

    if (!isValid) {
      return res.status(400).json({ message: 'The given receipt is not valid.' });
    }

    // validatedData contains sandbox: true/false for Apple and Amazon
    purchaseData = await inAppPurchase.getPurchaseData(validationResponse, options);

    if (!purchaseData) {
      return res.status(400).json({ message: 'No purchase data received. We cannot validate any further...' });
    }

    logger.info(loggerPrefix, 'Got purchase data:', purchaseData);

    const purchase = purchaseData[0];

    logger.info(loggerPrefix, 'Got purchase:', purchase);

    // Returns a boolean true if a canceled receipt is validated.
    const isCanceled = await inAppPurchase.isCanceled(purchase);

    // Returns a boolean true if a expired receipt is validated.
    const isExpired = await inAppPurchase.isExpired(purchase);

    let status = PurchaseStatus.ACTIVE;

    if (isCanceled) {
      status = PurchaseStatus.CANCELED;
    }

    if (isExpired) {
      status = PurchaseStatus.EXPIRED;
    }

    logger.info(loggerPrefix, 'Got status:', status);

    /*
      bundleId?: string;  // only Apple
      appItemId?: string;
      orderId?: string; // only Google
      originalTransactionId?: string; // only Apple
      transactionId: string;
      productId: string;
      originalPurchaseDate?: string; // only Apple
      purchaseDate: number | string;
      isTrial?: boolean; // only Apple
      cancellationDate?: number; // only Apple/Google
      // iTunes, windows and amazon subscription only
      // Google subscriptions only with google play store api info
      expirationDate?: number;
      quantity: number;
      // this was created based on the source code of in-app-purchase
      // eventually there are more fields
    */

    const subscriptionPurchase = {
      status,
      productId: purchase.productId,
      purchaseDate: purchase.purchaseDate.toString(),
      cancellationDate: (purchase.cancellationDate) ? purchase.cancellationDate.toString() : undefined,
      quantity: purchase.quantity,
      transactionId: purchase.transactionId,
      transactionReceipt: receipt.toString(),
      service: PurchaseService.APPLE,
      isTrial: purchase.isTrial,
      user: {
        id: userId
      }
    };

    logger.info(loggerPrefix, 'Creating database entry, using:', subscriptionPurchase);

    const subscriptionPurchaseToCreate = await subscriptionPurchaseRepository.create(subscriptionPurchase);
    await subscriptionPurchaseRepository.save(subscriptionPurchaseToCreate);

    logger.info(loggerPrefix, 'Created database entry!');

    const createdSubscriptionPurchase = await subscriptionPurchaseRepository.findOne(subscriptionPurchaseToCreate.id)

    logger.info(loggerPrefix, 'Finished! Returning database entry...');

    return res.json({ ...createdSubscriptionPurchase });
  } catch (err) {
    const errorMessage = 'Error happened while getting the purchase data.';
    logger.error(loggerPrefix, errorMessage, err);
    return res.status(500).json({ message: errorMessage });
  }
};
