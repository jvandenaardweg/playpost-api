import { Message, PubSub } from '@google-cloud/pubsub';
import * as Sentry from '@sentry/node';

import { APP_BUNDLE_ID } from '../constants/bundle-id';
import * as inAppSubscriptionsController from '../controllers/in-app-subscriptions';
import { InAppSubscriptionService } from '../database/entities/in-app-subscription';
import { IAppleSubscriptionNotificationRequestBody, IGoogleSubscriptionNotification, IGoogleSubscriptionNotificationRequestBody } from '../typings';
import { logger } from '../utils';
import { getGoogleCloudCredentials } from '../utils/credentials';

const { GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS, GOOGLE_PUBSUB_SUBSCRIPTION_GOOGLE_SUBSCRIPTION_NOTIFICATIONS } = process.env;

if (!GOOGLE_PUBSUB_SUBSCRIPTION_GOOGLE_SUBSCRIPTION_NOTIFICATIONS) {
  const errorMessage = 'Required env variable "GOOGLE_PUBSUB_SUBSCRIPTION_GOOGLE_SUBSCRIPTION_NOTIFICATIONS" not set. Please add it.';
  logger.error(errorMessage);
  throw new Error(errorMessage);
}

/**
 * Method to listen for Apple Subscription Notifications.
 * Which are send to our Cloud Function: https://europe-west1-playpost.cloudfunctions.net/appleSubscriptionStatusNotifications
 * That Cloud Function add's it to PubSub (publisher)
 *
 * The method below listens for that PubSub (subscriber)
 * We use Google's PubSub for message queue purposes
 *
 */
export const listenForGoogleSubscriptionNotifications = async () => {
  const loggerPrefix = 'Google PubSub Worker (Google Subscription Notifications):';

  logger.info(loggerPrefix, 'Setup...');

  const pubsub = new PubSub(getGoogleCloudCredentials());

  // Verify if we are connected to pubsub by just checking if we can find the subscription
  const subscriptions = await pubsub.getSubscriptions();
  const hasSubscription = !!subscriptions[0].filter(subscription => subscription.name === GOOGLE_PUBSUB_SUBSCRIPTION_GOOGLE_SUBSCRIPTION_NOTIFICATIONS);

  if (!hasSubscription) {
    const errorMessage = `Subscription "${GOOGLE_PUBSUB_SUBSCRIPTION_GOOGLE_SUBSCRIPTION_NOTIFICATIONS}" could not be found in the PubSub client.`;
    logger.error(loggerPrefix, errorMessage);
    throw new Error(errorMessage);
  }

  logger.info(loggerPrefix, 'Connected!');

  const appleSubscriptionNotificationsSubscription = pubsub.subscription(GOOGLE_PUBSUB_SUBSCRIPTION_GOOGLE_SUBSCRIPTION_NOTIFICATIONS);

  logger.info(loggerPrefix, 'Now listening for Google PubSub messages on:', GOOGLE_PUBSUB_SUBSCRIPTION_GOOGLE_SUBSCRIPTION_NOTIFICATIONS);

  appleSubscriptionNotificationsSubscription.on('message', handleMessageGoogleMessage);
};

const handleMessageGoogleMessage = async (message: Message) => {
  const loggerPrefix = 'Google PubSub Worker (Google Subscription Notifications) (message):';

  let notification: IGoogleSubscriptionNotificationRequestBody;

  try {
    notification = JSON.parse(message.data.toString());

    logger.info(loggerPrefix, 'Received notification:', notification);

    // Ignore all notifications that don't have a notification type
    // These could be our test messages
    if (!notification) {
      logger.warn(loggerPrefix, 'Received a message we cannot process. So we just Ack that message so it is deleted from the queue:', notification);
      return message.ack();
    }

    if (notification.packageName !== APP_BUNDLE_ID) {
      logger.warn(loggerPrefix, `Received a message we cannot process. The received message is from a different package: ${notification.packageName}. So we just Ack that message so it is deleted from the queue:`, notification);
      return message.ack();
    }

    if (!notification.subscriptionNotification) {
      logger.warn(loggerPrefix, `Did not receive a subscriptionNotification, we received a test notification from the Google Play Console. So we just Ack that message so it is deleted from the queue:`, notification);
      return message.ack();
    }

    logger.info(loggerPrefix, 'Should handle: ', notification);

    await handleGoogleSubscriptionStatusEvent(notification.subscriptionNotification, message, loggerPrefix);
  } catch (err) {
    const errorMessage = err && err.message ? err.message : 'Unknown error happened while processing this notification.';

    Sentry.withScope(scope => {
      scope.setExtra('message', JSON.parse(message.data.toString()));
      scope.setExtra('notification', notification);
      Sentry.captureException(err);
    });

    logger.error(loggerPrefix, errorMessage);

    message.nack(); // re-deliver, so we can retry.
    logger.info(loggerPrefix, 'Sending nack(), so we can retry...');

    // TODO: Could possibly result in messages being nack'd all the time, to infinity. Find a way to resolve that later.
  }
};

export const listenForAppleSubscriptionNotifications = async () => {
  const loggerPrefix = 'Google PubSub Worker (Apple Subscription Notifications):';

  logger.info(loggerPrefix, 'Setup...');

  const pubsub = new PubSub(getGoogleCloudCredentials());

  if (!GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS) {
    const errorMessage = 'Required env variable "GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS" not set. Please add it.';
    logger.error(loggerPrefix, errorMessage);
    throw new Error(errorMessage);
  }

  // Verify if we are connected to pubsub by just checking if we can find the subscription
  const subscriptions = await pubsub.getSubscriptions();
  const hasSubscription = !!subscriptions[0].filter(subscription => subscription.name === GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS);

  if (!hasSubscription) {
    const errorMessage = `Subscription "${GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS}" could not be found in the PubSub client.`;
    logger.error(loggerPrefix, errorMessage);
    throw new Error(errorMessage);
  }

  logger.info(loggerPrefix, 'Connected!');

  const appleSubscriptionNotificationsSubscription = pubsub.subscription(GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS);

  logger.info(loggerPrefix, 'Now listening for Google PubSub messages on:', GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS);

  appleSubscriptionNotificationsSubscription.on('message', handleMessageAppleMessage);
};

const handleMessageAppleMessage = async (message: Message) => {
  const loggerPrefix = 'Google PubSub Worker (Apple Subscription Notifications) (message):';

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

    await handleAppleSubscriptionStatusEvent(notification, message, loggerPrefix);
  } catch (err) {
    const errorMessage = err && err.message ? err.message : 'Unknown error happened while processing this notification.';

    Sentry.withScope(scope => {
      scope.setExtra('message', JSON.parse(message.data.toString()));
      scope.setExtra('notification', notification);
      Sentry.captureException(err);
    });

    logger.error(loggerPrefix, errorMessage);

    message.nack(); // re-deliver, so we can retry.
    logger.info(loggerPrefix, 'Sending nack(), so we can retry...');

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
const handleAppleSubscriptionStatusEvent = async (notification: IAppleSubscriptionNotificationRequestBody, message: Message, loggerPrefix: string) => {
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
    await inAppSubscriptionsController.updateOrCreateUsingOriginalTransactionId(latestReceipt, originalTransactionId, productId, InAppSubscriptionService.APPLE);
    return message.ack(); // Remove the message from the queue
  } catch (err) {
    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      scope.setExtra('notification', notification);
      scope.setExtra('latestReceipt', latestReceipt);
      scope.setExtra('originalTransactionId', originalTransactionId);
      Sentry.captureException(err);
    });

    message.nack(); // re-deliver, so we can retry.

    throw err;
  }
};

const handleGoogleSubscriptionStatusEvent = async (subscriptionNotification: IGoogleSubscriptionNotification, message: Message, loggerPrefix: string) => {
  // https://developer.android.com/google/play/billing/realtime_developer_notifications
  const availableNotificationTypes = {
    '0': 'SUBSCRIPTION_RECOVERED', // A subscription was recovered from account hold.
    '2': 'SUBSCRIPTION_RENEWED', // An active subscription was renewed.
    '3': 'SUBSCRIPTION_CANCELED', // A subscription was either voluntarily or involuntarily cancelled. For voluntary cancellation, sent when the user cancels.
    '4': 'SUBSCRIP￼￼TION_PURCHASED', // A new subscription was purchased.
    '5': 'SUBSCRIPTION_ON_HOLD', // A subscription has entered account hold (if enabled).
    '6': 'SUBSCRIPTION_IN_GRACE_PERIOD', // A subscription has entered grace period (if enabled).
    '7': 'SUBSCRIPTION_RESTARTED', // User has reactivated their subscription from Play > Account > Subscriptions (requires opt-in for subscription restoration)
    '8': 'SUBSCRIPTION_PRICE_CHANGE_CONFIRMED', // A subscription price change has successfully been confirmed by the user.
    '9': 'SUBSCRIPTION_DEFERRED', // A subscription's recurrence time has been extended.
    '12': 'SUBSCRIPTION_REVOKED', // A subscription has been revoked from the user before the expiration time.
    '13': 'SUBSCRIPTION_EXPIRED' // A subscription has expired.
  }

  logger.info(loggerPrefix, subscriptionNotification);

  // If its not an event from our availableNotificationTypes, we ignore the message
  if (!availableNotificationTypes[subscriptionNotification.notificationType]) {
    logger.warn(loggerPrefix, 'Received an event not in our notificationTypes list: ', subscriptionNotification.notificationType);
    logger.warn(loggerPrefix, 'Removing the event from the queue...');
    return message.ack();
  }

  logger.info(loggerPrefix, `Processing "${availableNotificationTypes[subscriptionNotification.notificationType]}" notification...`);

  const latestReceipt = null; // Google does not give a receipt in the notification
  const originalTransactionId = subscriptionNotification.purchaseToken; // We normalize Google's "purchaseToken" to "originalTransactionId"
  // const productId = subscriptionNotification.subscriptionId; // We normalize Google's "subscriptionId" to "productId"

  try {
    // await inAppSubscriptionsController.updateOrCreateUsingOriginalTransactionId(latestReceipt, originalTransactionId, productId, InAppSubscriptionService.GOOGLE);
    // return message.ack(); // Remove the message from the queue
  } catch (err) {
    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      scope.setExtra('subscriptionNotification', subscriptionNotification);
      scope.setExtra('latestReceipt', latestReceipt);
      scope.setExtra('originalTransactionId', originalTransactionId);
      Sentry.captureException(err);
    });

    message.nack(); // re-deliver, so we can retry.

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
