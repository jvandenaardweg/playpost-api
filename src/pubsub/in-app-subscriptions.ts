require('dotenv').config();

import { PubSub, Message } from '@google-cloud/pubsub';
import inAppPurchase from 'in-app-purchase';

import { AppleSubscriptionNotificationRequestBody } from '../typings';
import * as inAppSubscriptionsController from '../controllers/in-app-subscriptions';
import { getGoogleCloudCredentials } from '../utils/credentials';
import { logger } from '../utils';
import { Sentry } from '../error-reporter';

const {
  GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS
} = process.env;

inAppPurchase.config({
  applePassword: process.env.APPLE_IAP_SHARED_SECRET, // this comes from iTunes Connect (You need this to valiate subscriptions)
  test: (process.env.NODE_ENV !== 'production'), // Don't use sandbox validation on production
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

  if (!GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS) throw new Error('Required env variable "GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS" not set. Please add it.');

  const subscription = pubsub.subscription(GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS);

  logger.info(loggerPrefix, 'Listening for Google PubSub messages on:', GOOGLE_PUBSUB_SUBSCRIPTION_APPLE_SUBSCRIPTION_NOTIFICATIONS);

  subscription.on('message', handleMessage);
};

const handleMessage = async (message: Message) => {
  const loggerPrefix = 'Google PubSub Worker (Apple Subscription Notifications) (message):';

  const reDeliverDelayInSeconds = 60;

  try {
    const notification: AppleSubscriptionNotificationRequestBody = JSON.parse(message.data.toString());

    logger.info(loggerPrefix, 'Received notification:', notification.notification_type);

    // Ignore all notifications that don't have a notification type
    // These could be our test messages
    if (!notification || !notification.notification_type) {
      logger.warn(loggerPrefix, notification.notification_type, 'Received a message we cannot process. So we just Ack that message so it is deleted from the queue:', notification);
      return message.ack();
    }

    const originalTransactionId = (notification.latest_receipt_info) ? notification.latest_receipt_info.original_transaction_id : null;

    logger.info(loggerPrefix, notification.notification_type, 'Now handling original transaction ID:', originalTransactionId);

    // More about the types of notifications, here:
    // https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications

    if (notification.notification_type === 'INITIAL_BUY') {
      // Initial purchase of the subscription.'
      // Store the latest_receipt on your server as a token to verify the user’s subscription status at any time, by validating it with the App Store.
      // https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
      return handleInitialBuySubscriptionEvent(notification, message, reDeliverDelayInSeconds, loggerPrefix);
    }

    if (notification.notification_type === 'CANCEL') {
      // Subscription was canceled by Apple customer support.
      // Check Cancellation Date to know the date and time when the subscription was canceled.
      // We can cancel the subscription for the current user right away.
      // https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
      return handleCancelSubscriptionEvent(notification, message, reDeliverDelayInSeconds, loggerPrefix);
    }

    if (notification.notification_type === 'RENEWAL') {
      // Automatic renewal was successful for an expired subscription.
      // Check Subscription Expiration Date to determine the next renewal date and time.
      // https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
      return handleRenewalSubscriptionEvent(notification, message, reDeliverDelayInSeconds, loggerPrefix);
    }

    if (notification.notification_type === 'INTERACTIVE_RENEWAL') {
      // Customer renewed a subscription interactively after it lapsed, either by using your app’s interface or on the App Store in account settings.
      // Service is made available immediately.
      // https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
      return handleInteractiveRenewalSubscriptionEvent(notification, message, reDeliverDelayInSeconds, loggerPrefix);
    }

    if (notification.notification_type === 'DID_CHANGE_RENEWAL_PREF') {
      // Customer changed the plan that takes affect at the next subscription renewal.
      // Current active plan is not affected.
      // https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
      return handleDidChangeRenewalPrefSubscriptionEvent(notification, message, reDeliverDelayInSeconds, loggerPrefix);
    }

    if (notification.notification_type === 'DID_CHANGE_RENEWAL_STATUS') {
      // Indicates a change in the subscription renewal status.
      // Check the auto_renew_status_change_date_ms and the auto_renew_status in the JSON to know the date and time when the status was last updated and the current renewal status.
      return handleDidChangeRenewalStatusSubscriptionEvent(notification, message, reDeliverDelayInSeconds, loggerPrefix);
    }

    throw new Error(`${notification.notification_type} is not handled...`);
  } catch (err) {
    const errorMessage = (err && err.message) ? err.message : 'Unknown error happened while processing this notification.';

    logger.error(loggerPrefix, errorMessage);
    Sentry.captureException(err);

    logger.info(loggerPrefix, 'Retry...');
    message.nack(reDeliverDelayInSeconds); // re-deliver, so we can retry.
    // TODO: Could possibly result in messages being nack'd all the time, to infinity. Find a way to resolve that later.
  }
}

const handleInitialBuySubscriptionEvent = async (notification: AppleSubscriptionNotificationRequestBody, message: Message, reDeliverDelayInSeconds: number, loggerPrefix: string) => {
  logger.info(
    loggerPrefix,
    notification.notification_type,
    'Initial purchase of the subscription.',
    'Store the latest_receipt on your server as a token to verify the user’s subscription status at any time, by validating it with the App Store.'
  );

  // When we receive the initial buy event, we just need to make sure the transaction is in our database
  // Normally, this is done when the user purchases a subscription. But in the event of an error, this event is a backup.
  const latestReceipt = notification.latest_receipt;
  const originalTransactionId = notification.latest_receipt_info && notification.latest_receipt_info.original_transaction_id;

  await inAppSubscriptionsController.updateOrCreateUsingOriginalTransactionId(latestReceipt, originalTransactionId);

  return message.ack(); // Acknowledge the message, removing it from the queue
};

const handleCancelSubscriptionEvent = async (notification: AppleSubscriptionNotificationRequestBody, message: Message, reDeliverDelayInSeconds: number, loggerPrefix: string) => {
  // Subscription was canceled by Apple customer support.
  // Check Cancellation Date to know the date and time when the subscription was canceled.
  // We can cancel the subscription for the current user right away.

  // const userInAppSubscriptionRepository = getRepository(UserInAppSubscription);

  // const originalTransactionId = notification.original_transaction_id;
  // const cancellationDateMs = (notification.cancellation_date_ms) ? parseInt(notification.cancellation_date_ms, 10) : null;

  // const canceledAt = (cancellationDateMs) ? new Date(cancellationDateMs).toISOString() : new Date();
  // const status = InAppSubscriptionStatus.CANCELED;

  // logger.info(
  //   loggerPrefix,
  //   notification.notification_type,
  //   `Setting subscription of "${originalTransactionId}" to canceled.`
  // );

  // const userSubscription = await userInAppSubscriptionRepository.findOne({
  //   originalTransactionId
  // });

  // if (!userSubscription) {
  //   const errorMessage = `We cannot find the subscription using originalTransactionId "${originalTransactionId}". So we cannot cancel it.`;
  //   logger.error(loggerPrefix, errorMessage);
  //   throw new Error(errorMessage);
  // }

  // await userInAppSubscriptionRepository.update(userSubscription.id, {
  //   status,
  //   canceledAt
  // });

  // logger.info(
  //   loggerPrefix,
  //   notification.notification_type,
  //   'Successfully canceled the user his subscription in the database.'
  // );

  const latestReceipt = notification.latest_receipt;
  const originalTransactionId = notification.latest_receipt_info && notification.latest_receipt_info.original_transaction_id;

  await inAppSubscriptionsController.updateOrCreateUsingOriginalTransactionId(latestReceipt, originalTransactionId);

  return message.ack(); // Acknowledge the message, removing it from the queue
};

const handleRenewalSubscriptionEvent = async (notification: AppleSubscriptionNotificationRequestBody, message: Message, reDeliverDelayInSeconds: number, loggerPrefix: string) => {
  logger.info(
    loggerPrefix,
    notification.notification_type,
    'Automatic renewal was successful for an expired subscription.',
    'Check Subscription Expiration Date to determine the next renewal date and time.'
  );

  const latestReceipt = notification.latest_receipt;
  const originalTransactionId = notification.latest_receipt_info && notification.latest_receipt_info.original_transaction_id;

  await inAppSubscriptionsController.updateOrCreateUsingOriginalTransactionId(latestReceipt, originalTransactionId);

  return message.ack(); // Acknowledge the message, removing it from the queue
};

const handleInteractiveRenewalSubscriptionEvent = async (notification: AppleSubscriptionNotificationRequestBody, message: Message, reDeliverDelayInSeconds: number, loggerPrefix: string) => {
  logger.info(
    loggerPrefix,
    notification.notification_type,
    'Customer renewed a subscription interactively after it lapsed, either by using your app’s interface or on the App Store in account settings.',
    'Service is made available immediately.'
  );

  // This events gets triggered when the user "restores" a previous subscription
  // Or purchases a new subscription after the older one expired
  // We can ignore the event for now, as we handle this in the App upon receipt validation

  const latestReceipt = notification.latest_receipt;
  const originalTransactionId = notification.latest_receipt_info && notification.latest_receipt_info.original_transaction_id;

  await inAppSubscriptionsController.updateOrCreateUsingOriginalTransactionId(latestReceipt, originalTransactionId);

  return message.ack(); // Acknowledge the message, removing it from the queue
};

const handleDidChangeRenewalPrefSubscriptionEvent = async (notification: AppleSubscriptionNotificationRequestBody, message: Message, reDeliverDelayInSeconds: number, loggerPrefix: string) => {
  logger.info(
    loggerPrefix,
    notification.notification_type,
    'Customer changed the plan that takes affect at the next subscription renewal.',
    'Current active plan is not affected.'
  );

  const latestReceipt = notification.latest_receipt;
  const originalTransactionId = notification.latest_receipt_info && notification.latest_receipt_info.original_transaction_id;

  await inAppSubscriptionsController.updateOrCreateUsingOriginalTransactionId(latestReceipt, originalTransactionId);

  return message.ack(); // Remove the message from the queue
};

const handleDidChangeRenewalStatusSubscriptionEvent = async (notification: AppleSubscriptionNotificationRequestBody, message: Message, reDeliverDelayInSeconds: number, loggerPrefix: string) => {
  logger.info(
    loggerPrefix,
    notification.notification_type,
    'Indicates a change in the subscription renewal status.',
    'Check the auto_renew_status_change_date_ms and the auto_renew_status in the JSON to know the date and time when the status was last updated and the current renewal status.'
  );

  logger.info(
    loggerPrefix,
    notification.notification_type,
    notification.auto_renew_status_change_date_ms,
    notification.auto_renew_status
  );

  // TODO: Update "renewedAt" date in database
  // TODO: test if this works (Purchase in app, then wait)

  const latestReceipt = notification.latest_receipt;
  const originalTransactionId = notification.latest_receipt_info && notification.latest_receipt_info.original_transaction_id;

  await inAppSubscriptionsController.updateOrCreateUsingOriginalTransactionId(latestReceipt, originalTransactionId);

  return message.ack(); // Remove the message from the queue
};
