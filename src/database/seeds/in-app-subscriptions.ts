import { InAppSubscription, InAppSubscriptionCurrency, InAppSubscriptionDuration, InAppSubscriptionService } from '../entities/in-app-subscription';

const hardLimitSecondsPerArticle = 30 * 60 // 30 minutes

export default [
  {
    productId: 'com.aardwegmedia.playpost.premium',
    name: 'Premium',
    description: 'Monthly Premium Subscription',
    price: 4.99,
    currency: InAppSubscriptionCurrency.DOLLAR,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.APPLE,
    limitSecondsPerMonth: 120 * 60, // 120 minutes
    limitSecondsPerArticle: hardLimitSecondsPerArticle, // 30 minutes
    isActive: true
  },
  {
    productId: 'com.aardwegmedia.playpost.android.premium',
    name: 'Premium',
    description: 'Monthly Premium Subscription',
    price: 4.99,
    currency: InAppSubscriptionCurrency.DOLLAR,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.GOOGLE,
    limitSecondsPerMonth: 120 * 60, // 120 minutes
    limitSecondsPerArticle: hardLimitSecondsPerArticle, // 30 minutes
    isActive: true
  },
  {
    productId: 'com.aardwegmedia.playpost.subscription.plus',
    name: 'Plus',
    description: 'Monthly Plus Subscription',
    price: 9.99,
    currency: InAppSubscriptionCurrency.DOLLAR,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.APPLE,
    limitSecondsPerMonth: 300 * 60, // 300 minutes
    limitSecondsPerArticle: hardLimitSecondsPerArticle, // 30 minutes
    isActive: true
  },
  {
    productId: 'com.aardwegmedia.playpost.android.plus',
    name: 'Plus',
    description: 'Monthly Plus Subscription',
    price: 9.99,
    currency: InAppSubscriptionCurrency.DOLLAR,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.GOOGLE,
    limitSecondsPerMonth: 300 * 60, // 300 minutes
    limitSecondsPerArticle: hardLimitSecondsPerArticle, // 30 minutes
    isActive: true
  },
  {
    productId: 'com.aardwegmedia.playpost.subscription.unlimited',
    name: 'Unlimited',
    description: 'Monthly Unlimited Subscription',
    price: 13.99,
    currency: InAppSubscriptionCurrency.DOLLAR,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.APPLE,
    limitSecondsPerMonth: 0, // 0 minutes = no limit
    limitSecondsPerArticle: hardLimitSecondsPerArticle, // 30 minutes
    isActive: true
  },
  {
    productId: 'com.aardwegmedia.playpost.android.unlimited',
    name: 'Unlimited',
    description: 'Monthly Unlimited Subscription',
    price: 13.99,
    currency: InAppSubscriptionCurrency.DOLLAR,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.GOOGLE,
    limitSecondsPerMonth: 0, // 0 minutes = no limit
    limitSecondsPerArticle: hardLimitSecondsPerArticle, // 30 minutes
    isActive: true
  },
  {
    productId: 'free',
    name: 'Free',
    description: 'Free default subscription for all users',
    price: 0,
    currency: InAppSubscriptionCurrency.DOLLAR,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.INTERNAL,
    limitSecondsPerMonth: 30 * 60, // 30 minutes
    limitSecondsPerArticle: hardLimitSecondsPerArticle, // 30 minutes
    isActive: true
  }
] as InAppSubscription[];
