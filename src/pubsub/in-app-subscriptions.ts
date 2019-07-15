import { Message, PubSub } from '@google-cloud/pubsub';
import * as Sentry from '@sentry/node';
import inAppPurchase from 'in-app-purchase';

import * as inAppSubscriptionsController from '../controllers/in-app-subscriptions';
import { IAppleSubscriptionNotificationRequestBody } from '../typings';
import { logger } from '../utils';
import { getGoogleCloudCredentials } from '../utils/credentials';

const { GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS } = process.env;

inAppPurchase.config({
  applePassword: process.env.APPLE_IAP_SHARED_SECRET, // this comes from iTunes Connect (You need this to valiate subscriptions)
  test: process.env.NODE_ENV !== 'production', // Don't use sandbox validation on production
  verbose: false // Output debug logs to stdout stream
});

/**
 * Method to listen for Apple Subscription Notifications.
 * Which are send to our Cloud Function: https://europe-west1-playpost.cloudfunctions.net/appleSubscriptionStatusNotifications
 * That Cloud Function add's it to PubSub (publisher)
 *
 * The method below listens for that PubSub (subscriber)
 * We use Google's PubSub for message queue purposes
 *
 */
export const listenForAppleSubscriptionNotifications = () => {
  const loggerPrefix = 'Google PubSub Worker (Apple Subscription Notifications):';

  const pubsub = new PubSub(getGoogleCloudCredentials());

  if (!GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS) { throw new Error('Required env variable "GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS" not set. Please add it.'); }

  const subscription = pubsub.subscription(GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS);

  logger.info(loggerPrefix, 'Listening for Google PubSub messages on:', GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS);

  subscription.on('message', handleMessage);
};

const handleMessage = async (message: Message) => {
  const loggerPrefix = 'Google PubSub Worker (Apple Subscription Notifications) (message):';

  const reDeliverDelayInSeconds = 60;

  let notification = {} as any as IAppleSubscriptionNotificationRequestBody;

  try {
    notification = JSON.parse(message.data.toString());

    logger.info(loggerPrefix, 'Received notification:', notification.notification_type);

    // Ignore all notifications that don't have a notification type
    // These could be our test messages
    if (!notification || !notification.notification_type) {
      logger.warn(loggerPrefix, notification.notification_type, 'Received a message we cannot process. So we just Ack that message so it is deleted from the queue:', notification);
      return message.ack();
    }

    await handleSubscriptionStatusEvent(notification, message, reDeliverDelayInSeconds, loggerPrefix);
  } catch (err) {
    const errorMessage = err && err.message ? err.message : 'Unknown error happened while processing this notification.';

    Sentry.withScope(scope => {
      scope.setExtra('message', JSON.parse(message.data.toString()));
      scope.setExtra('notification', notification);
      Sentry.captureException(err);
    });

    logger.error(loggerPrefix, errorMessage);

    logger.info(loggerPrefix, 'Retry...');
    message.nack(reDeliverDelayInSeconds); // re-deliver, so we can retry.
    // TODO: Could possibly result in messages being nack'd all the time, to infinity. Find a way to resolve that later.
  }
};

/**
 * More about the types of notifications, here:
 * https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
 *
 * @param notification
 * @param message
 * @param reDeliverDelayInSeconds
 * @param loggerPrefix
 */
const handleSubscriptionStatusEvent = async (notification: IAppleSubscriptionNotificationRequestBody, message: Message, reDeliverDelayInSeconds: number, loggerPrefix: string) => {
  const availableEvents = ['INITIAL_BUY', 'CANCEL', 'RENEWAL', 'INTERACTIVE_RENEWAL', 'DID_CHANGE_RENEWAL_PREF', 'DID_CHANGE_RENEWAL_STATUS'];

  logger.info(loggerPrefix, notification);

  // If its not an event from our availableEvents, we ignore the message
  if (!availableEvents.includes(notification.notification_type)) {
    logger.warn(loggerPrefix, 'Received an event not in our availableEvents list: ', notification.notification_type);
    logger.warn(loggerPrefix, 'Removing the event from the queue...');
    return message.ack();
  }

  if (notification.notification_type === 'INITIAL_BUY') {
    // Initial purchase of the subscription.'
    // Store the latest_receipt on your server as a token to verify the user’s subscription status at any time, by validating it with the App Store.
    // https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
    logger.info(loggerPrefix, notification.notification_type, 'Initial purchase of the subscription.', 'Store the latest_receipt on your server as a token to verify the user’s subscription status at any time, by validating it with the App Store.');
  }

  if (notification.notification_type === 'CANCEL') {
    // Subscription was canceled by Apple customer support.
    // Check Cancellation Date to know the date and time when the subscription was canceled.
    // We can cancel the subscription for the current user right away.
    // https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
    logger.info(loggerPrefix, notification.notification_type, 'Subscription was canceled by Apple customer support.', 'Check Cancellation Date to know the date and time when the subscription was canceled.', 'We can cancel the subscription for the current user right away.');
  }

  if (notification.notification_type === 'RENEWAL') {
    // Automatic renewal was successful for an expired subscription.
    // Check Subscription Expiration Date to determine the next renewal date and time.
    // https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
    logger.info(loggerPrefix, notification.notification_type, 'Automatic renewal was successful for an expired subscription.', 'Check Subscription Expiration Date to determine the next renewal date and time.');
  }

  if (notification.notification_type === 'INTERACTIVE_RENEWAL') {
    // Customer renewed a subscription interactively after it lapsed, either by using your app’s interface or on the App Store in account settings.
    // Service is made available immediately.
    // https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
    logger.info(loggerPrefix, notification.notification_type, 'Customer renewed a subscription interactively after it lapsed, either by using your app’s interface or on the App Store in account settings.', 'Service is made available immediately.');
  }

  if (notification.notification_type === 'DID_CHANGE_RENEWAL_PREF') {
    // Customer changed the plan that takes affect at the next subscription renewal.
    // Current active plan is not affected.
    // https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
    logger.info(loggerPrefix, notification.notification_type, 'Customer changed the plan that takes affect at the next subscription renewal.', 'Current active plan is not affected.');
  }

  if (notification.notification_type === 'DID_CHANGE_RENEWAL_STATUS') {
    // Indicates a change in the subscription renewal status.
    // Check the auto_renew_status_change_date_ms and the auto_renew_status in the JSON to know the date and time when the status was last updated and the current renewal status.
    logger.info(loggerPrefix, notification.notification_type, 'Indicates a change in the subscription renewal status.', 'Check the auto_renew_status_change_date_ms and the auto_renew_status in the JSON to know the date and time when the status was last updated and the current renewal status.');
  }

  const latestReceipt = getLatestReceipt(notification);
  const originalTransactionId = getOriginalTransactionId(notification);
  const productId = getProductId(notification);

  try {
    await inAppSubscriptionsController.updateOrCreateUsingOriginalTransactionId(latestReceipt, originalTransactionId, productId);
    return message.ack(); // Remove the message from the queue
  } catch (err) {
    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      scope.setExtra('notification', notification);
      scope.setExtra('latestReceipt', latestReceipt);
      scope.setExtra('originalTransactionId', originalTransactionId);
      Sentry.captureException(err);
    });

    throw err;
  }
};

const getOriginalTransactionId = (notification: IAppleSubscriptionNotificationRequestBody): string | undefined => {
  // expired
  const expiredOriginalTransactionId = notification.latest_expired_receipt_info && notification.latest_expired_receipt_info.original_transaction_id;

  // latest
  const latestOriginalTransactionId = notification.latest_receipt_info && notification.latest_receipt_info.original_transaction_id;

  // determine which one exists
  const originalTransactionId = expiredOriginalTransactionId || latestOriginalTransactionId;

  return originalTransactionId;
};

const getLatestReceipt = (notification: IAppleSubscriptionNotificationRequestBody): string | undefined => {
  return notification.latest_receipt || notification.latest_expired_receipt;
};

const getProductId = (notification: IAppleSubscriptionNotificationRequestBody): string | undefined => {
  const expiredReceiptProductId = notification.latest_expired_receipt_info ? notification.latest_expired_receipt_info.product_id : undefined;
  const latestReceiptProductId = notification.latest_receipt_info ? notification.latest_receipt_info.product_id : undefined;
  const autoRenewProductId = notification.auto_renew_product_id ? notification.auto_renew_product_id : undefined;

  const productId = latestReceiptProductId || expiredReceiptProductId || autoRenewProductId;

  return productId;
};
