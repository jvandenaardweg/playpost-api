import { SubscriptionCurrency, SubscriptionDuration, SubscriptionService } from '../entities/subscription';

export default [
  {
    productId: 'premium',
    name: 'Premium',
    description: 'Monthly Subscription',
    price: 3.99,
    currency: SubscriptionCurrency.EURO,
    duration: SubscriptionDuration.ONE_MONTH,
    service: SubscriptionService.APPLE,
    isActive: false
  }
]
