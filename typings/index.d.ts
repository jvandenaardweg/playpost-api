
// Make sure express/passport used the correct user interface
// https://stackoverflow.com/a/54030446/3194288
declare global {
  namespace Express {
    export interface Request {
      user?: {
        email: string;
        id: string;
      };
    }
  }
}

export interface ICrawlFullArticleData {
  articleId: string;
  articleUrl: string;
}

// https://developer.android.com/google/play/billing/realtime_developer_notifications#json_specification
export interface IGoogleSubscriptionNotificationRequestBody {
  version: string;
  packageName: string;
  eventTimeMillis: long;
  subscriptionNotification?: IGoogleSubscriptionNotification;
  testNotification?: IGoogleTestNotification;
}

export interface IGoogleSubscriptionNotification {
  version: string;
  notificationType: int; // https://developer.android.com/google/play/billing/realtime_developer_notifications
  purchaseToken: string;
  subscriptionId: string;
}

export interface IGoogleTestNotification {
  version: string;
}

export interface IGoogleSubscriptionReceipt {
  packageName: string;
  productId: string;
  purchaseToken: string;
  subscription: boolean; // We only offer in app subscriptions, so set to true
}

// https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
//
export interface IAppleSubscriptionNotificationRequestBody {
  environment: 'Sandbox' | 'PROD'; // Specifies whether the notification is for a sandbox or a production environment
  notification_type: 'INITIAL_BUY' | 'CANCEL' | 'RENEWAL' | 'INTERACTIVE_RENEWAL' | 'DID_CHANGE_RENEWAL_PREF' | 'DID_CHANGE_RENEWAL_STATUS'; // Describes the kind of event that triggered the notification. // https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/StoreKitGuide/Chapters/Subscriptions.html#//apple_ref/doc/uid/TP40008267-CH7-SW16
  password: string; // This value is the same as the shared secret you POST when validating receipts.
  cancellation_date?: string; // The time and date that a transaction was cancelled by Apple customer support. Posted only if the notification_type is CANCEL
  cancellation_date_pst?: string; // Specifies the date and time the App Store processed the refund for a subscription either because the customer requested a cancelation through Apple customer support or upgraded their subscription, in the Pacific Time zone.
  cancellation_date_ms?: string; // Specifies the date and time the App Store processed the refund for a subscription either because the customer requested a cancelation through Apple customer support or upgraded their subscription, in Unix epoch time format, in milliseconds. Use this time format for processing dates.
  web_order_line_item_id?: string; // The primary key for identifying a subscription purchase. Posted only if the notification_type is CANCEL.
  latest_receipt?: string; // The base-64 encoded transaction receipt for the most recent renewal transaction. Posted only if the notification_type is RENEWAL or INTERACTIVE_RENEWAL, and only if the renewal is successful.
  latest_receipt_info?: IAppleSubscriptionNotificationReceiptDetails; // The JSON representation of the receipt for the most recent renewal. Posted only if renewal is successful. Not posted for notification_type CANCEL.
  latest_expired_receipt?: string; // The base-64 encoded transaction receipt for the most recent renewal transaction. Posted only if the subscription expired.
  latest_expired_receipt_info?: IAppleSubscriptionNotificationReceiptDetails; // The JSON representation of the receipt for the most recent renewal transaction. Posted only if the notification_type is RENEWAL or CANCEL or if renewal failed and subscription expired.
  auto_renew_status_change_date?: string;
  auto_renew_status_change_date_pst?: string;
  auto_renew_status_change_date_ms?: string;
  auto_renew_status: string; // A Boolean value indicated by strings “true” or “false”. This is the same as the auto renew status in the receipt.
  auto_renew_adam_id: string; // The current renewal preference for the auto-renewable subscription. This is the Apple ID of the product.
  auto_renew_product_id: string; // This is the same as the Subscription Auto Renew Preference in the receipt.
  expiration_intent?: string; // This is the same as the Subscription Expiration Intent in the receipt. Posted only if notification_type is RENEWAL or INTERACTIVE_RENEWAL.
}

export interface IAppleSubscriptionNotificationReceiptDetails {
  original_purchase_date_pst: string;
  cancellation_date_ms: string;
  quantity: string;
  cancellation_reason: string;
  unique_vendor_identifier: string;
  bvrs: string;
  expires_date_formatted: string;
  is_in_intro_offer_period: string;
  purchase_date_ms: string;
  expires_date_formatted_pst: string;
  is_trial_period: string;
  item_id: string;
  unique_identifier: string;
  original_transaction_id: string;
  expires_date: string;
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
  original_purchase_date_ms: string;
  version_external_identifier: string;
}

export interface CollectionResponse<T> {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  data: T;
}

export interface CollectionRequestQuery {
  page: string;
  perPage: string;
}

export type PermissionRole = 'user' | 'organization-user' | 'organization-admin';
export type PermissionRoles = PermissionRole[];
