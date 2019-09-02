declare module 'in-app-purchase' {
// Type definitions for in-app-purchase 1.11.4
// Project: https://github.com/voltrue2/in-app-purchase#readme
// Definitions by: Jonas Lochmann <https://github.com/l-jonas>, Dennis Kugelmann <https://github.com/IchordeDionysos>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.5.3

// Updated definitions by: Jordy van den Aardweg <https://github.com/jvandenaardweg>

export const UNITY = 'unity';
export const APPLE = 'apple';
export const GOOGLE = 'google';
export const WINDOWS = 'windows';
export const AMAZON = 'amazon';
export const ROKU = 'roku';

export function config(params: Config): void;
export function setup(): Promise<void>;
export function setup(callback: (err: any) => void): void;
export function getService(receipt: Receipt): Service;

export function validate(receipt: Receipt): Promise<ValidationResponse>;
export function validate(receipt: Receipt, callback: (err: any, res: ValidationResponse) => void): void;
export function validate(service: Service, receipt: Receipt, callback: (err: any, res: ValidationResponse) => void): void;

export function validateOnce(receipt: Receipt, secretOrPubKey: any): Promise<ValidationResponse>;
export function validateOnce(receipt: Receipt, secretOrPubKey: any, callback: (err: any, res: ValidationResponse) => void): void;
export function validateOnce(service: Service, secretOrPubKey: any, receipt: Receipt, callback: (err: any, res: ValidationResponse) => void): void;

export function isValidated(response: ValidationResponse): boolean;
export function isExpired(item: GoogleSubscriptionPurchase | AppleSubscriptionPurchase): boolean;
export function isCanceled(item: GoogleSubscriptionPurchase | AppleSubscriptionPurchase): boolean;
export function getPurchaseData(purchaseData?: ValidationResponse, options?: {
  ignoreCanceled: boolean;
  ignoreExpired: boolean;
}): GoogleSubscriptionPurchase[] | AppleSubscriptionPurchase[] | null;

export function refreshGoogleToken(): Promise<void>;
export function refreshGoogleToken(callback: (err: any) => void): void;

// for test use only, resets the google setup
export function reset(): void;

export interface Config {
  /* Configurations for Amazon Store */
  amazonAPIVersion?: number;
  secret?: string;

  /* Configurations for Apple */

  // this comes from iTunes Connect (You need this to valiate subscriptions)
  applePassword?: string;

  /* Configurations for Google Play */
  // this is the path to the directory containing iap-sanbox/iap-live files
  googlePublicKeyPath?: string;

  googleServiceAccount: {
    clientEmail: string;
    privateKey: string;
  };

  // optional, for Google Play subscriptions
  googlePublicKeyStrSandBox?: string;
  googlePublicKeyStrLive?: string;
  // optional, for Google Play subscriptions
  googlePublicKeyStrSandbox?: string;
  // optional, for Google Play subscriptions
  googleAccToken?: string;
  // optional, for Google Play subscritions
  googleRefToken?: string;
  // optional, for Google Play subscriptions
  googleClientID?: string;
  // optional, for Google Play subscriptions
  googleClientSecret?: string;
  // optional, for Google Play subscriptions
  refreshToken?: string;

  /* Configurations for Roku */
  // this comes from Roku Developer Dashboard
  rokuApiKey?: string;

  /* Configurations all platforms */
  // For Apple and Googl Play to force Sandbox validation only
  test?: boolean;
  // Output debug logs to stdout stream
  verbose?: boolean;
}

export type Service = typeof UNITY | typeof APPLE | typeof GOOGLE | typeof WINDOWS | typeof AMAZON | typeof ROKU;

export type UnityReceipt = object | string;
export type AppleReceipt = string;
export type GoogleReceipt = {
  date: string;
  signature: string;
} | string;
export type WindowsReceipt = string;
export type AmazonReceipt = object | string;
export type RokuReceipt = string;

export type Receipt = UnityReceipt | AppleReceipt | GoogleReceipt | WindowsReceipt | AmazonReceipt | RokuReceipt;

export interface ValidationResponse {
  service: Service;
  status: number;
}

export interface AppleValidationResponse extends ValidationResponse {
  latest_receipt?: string;
  environment?: string;
  sandbox?: string;
}

// Android: https://developers.google.com/android-publisher/api-ref/purchases/subscriptions
// Google Types from: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/gapi.client.androidpublisher/index.d.ts#L396
export interface PurchasedItem {
  transactionId: string;
  productId: string;
  purchaseDate: number | string;

  expirationDate?: number;
  quantity?: number;
}

export interface WindowsSubscriptionPurchase extends PurchasedItem {

}

export interface AmazonSubscriptionPurchase extends PurchasedItem {

}

export interface AppleSubscriptionPurchase extends PurchasedItem {
  bundleId?: string;
  originalPurchaseDateMs?: number | string; // TODO: check if number OR string
  originalPurchaseDate?: number | string; // TODO: check if number OR string
  originalTransactionId?: string;
  purchaseDateMs?: number | string; // TODO: check if number OR string
  cancellationDateMs?: number | string; // TODO: check if number OR string
  isTrial?: boolean;
  cancellationDate?: number;
}

export interface GoogleSubscriptionPurchase extends PurchasedItem {
  cancellationDate?: number;
  purchaseToken?: string;

  /**
   * The type of purchase of the subscription.
   * This field is only set if this purchase was not made using the standard in-app billing flow. Possible values are:
   * Test (i.e. purchased from a license testing account)
   * */
  purchaseType?: number;

  /** Whether the subscription will automatically be renewed when it reaches its current expiry time. */
  autoRenewing?: boolean;
  /**
   * The reason why a subscription was cancelled or is not auto-renewing. Possible values are:
   * - User cancelled the subscription
   * - Subscription was cancelled by the system, for example because of a billing problem
   * - Subscription was replaced with a new subscription
   */
  cancelReason?: number;
  /** ISO 3166-1 alpha-2 billing country/region code of the user at the time the subscription was granted. */
  countryCode?: string;
  /** A developer-specified string that contains supplemental information about an order. */
  developerPayload?: string;
  /** Time at which the subscription will expire, in milliseconds since the Epoch. */
  expiryTimeMillis?: string;
  /** This kind represents a subscriptionPurchase object in the androidpublisher service. */
  kind?: string;
  /** The order id of the latest recurring order associated with the purchase of the subscription. */
  orderId?: string;
  /**
   * The payment state of the subscription. Possible values are:
   * - Payment pending
   * - Payment received
   * - Free trial
   */
  paymentState?: number;
  /**
   * Price of the subscription, not including tax. Price is expressed in micro-units, where 1,000,000 micro-units represents one unit of the currency. For
   * example, if the subscription price is €1.99, price_amount_micros is 1990000.
   */
  priceAmountMicros?: string;
  /** ISO 4217 currency code for the subscription price. For example, if the price is specified in British pounds sterling, price_currency_code is "GBP". */
  priceCurrencyCode?: string;
  /** Time at which the subscription was granted, in milliseconds since the Epoch. */
  startTimeMillis?: string;
  /** The time at which the subscription was canceled by the user, in milliseconds since the epoch. Only present if cancelReason is 0. */
  userCancellationTimeMillis?: string;
}

};
