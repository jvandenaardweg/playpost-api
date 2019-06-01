import { InAppSubscriptionCurrency, InAppSubscriptionDuration, InAppSubscriptionService } from '../entities/in-app-subscription';

export default [
  {
    productId: 'com.aardwegmedia.playpost.premium',
    name: 'Premium',
    description: 'Monthly Subscription',
    price: 3.99,
    currency: InAppSubscriptionCurrency.EURO,
    duration: InAppSubscriptionDuration.ONE_MONTH,
    service: InAppSubscriptionService.APPLE,
    isActive: false
  }
]
