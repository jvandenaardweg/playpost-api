import { InAppSubscriptionCurrency, InAppSubscriptionDuration, InAppSubscriptionService, InAppSubscription } from '../entities/in-app-subscription';

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
    limitSecondsPerArticle: 15 * 60, // 15 minutes
    isActive: true
  },
  {
    productId: 'com.aardwegmedia.playpost.plus',
    name: 'Plus',
    description: 'Monthly Plus Subscription',
    price: 9.99,
    currency: InAppSubscriptionCurrency.EURO,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.APPLE,
    limitSecondsPerMonth: 300 * 60, // 300 minutes
    limitSecondsPerArticle: 25 * 60, // 25 minutes
    isActive: false
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
    limitSecondsPerArticle: 5 * 60, // 5 minutes
    isActive: true
  }
] as InAppSubscription[];
