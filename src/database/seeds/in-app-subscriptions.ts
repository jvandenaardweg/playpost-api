import { InAppSubscription, InAppSubscriptionCurrency, InAppSubscriptionDuration, InAppSubscriptionService } from '../entities/in-app-subscription';

export default [
  {
    productId: 'com.aardwegmedia.playpost.premium',
    name: 'Premium',
    description: 'Monthly Premium Subscription',
    price: 4.99,
    currency: InAppSubscriptionCurrency.EURO,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.APPLE,
    limitSecondsPerMonth: 120 * 60, // 120 minutes
    limitSecondsPerArticle: 30 * 60, // 30 minutes
    isActive: true
  },
  {
    productId: 'com.aardwegmedia.playpost.subscription.plus',
    name: 'Plus',
    description: 'Monthly Plus Subscription',
    price: 9.99,
    currency: InAppSubscriptionCurrency.EURO,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.APPLE,
    limitSecondsPerMonth: 300 * 60, // 300 minutes
    limitSecondsPerArticle: 30 * 60, // 25 minutes
    isActive: true
  },
  {
    productId: 'com.aardwegmedia.playpost.premium',
    name: 'Premium',
    description: 'Monthly Premium Subscription',
    price: 4.99,
    currency: InAppSubscriptionCurrency.EURO,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.GOOGLE,
    limitSecondsPerMonth: 120 * 60, // 120 minutes
    limitSecondsPerArticle: 30 * 60, // 30 minutes
    isActive: true
  },
  {
    productId: 'com.aardwegmedia.playpost.subscription.plus',
    name: 'Plus',
    description: 'Monthly Plus Subscription',
    price: 9.99,
    currency: InAppSubscriptionCurrency.EURO,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.GOOGLE,
    limitSecondsPerMonth: 300 * 60, // 300 minutes
    limitSecondsPerArticle: 30 * 60, // 25 minutes
    isActive: true
  },
  {
    productId: 'free',
    name: 'Free',
    description: 'Free default subscription for all users',
    price: 0,
    currency: InAppSubscriptionCurrency.EURO,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.INTERNAL,
    limitSecondsPerMonth: 30 * 60, // 30 minutes
    limitSecondsPerArticle: 30 * 60, // 5 minutes
    isActive: true
  }
] as InAppSubscription[];
