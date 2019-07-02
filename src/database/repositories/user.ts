import { EntityRepository, Repository, getCustomRepository, getRepository, Not } from 'typeorm';
import { User } from '../entities/user';
import { AudiofileRepository } from '../repositories/audiofile';
import { InAppSubscription } from '../entities/in-app-subscription';

type SubscriptionLimits = {
  limitSecondsPerMonth: number;
  limitSecondsPerArticle: number;
};

type SubscriptionUsed = {
  currentMonthInSeconds: number;
};

type SubscriptionAvailable = {
  currentMonthInSeconds: number;
};

interface UserDetails extends Partial<User> {
  isSubscribed: boolean;
  used: {
    audiofiles: SubscriptionUsed;
  };
  available: {
    audiofiles: SubscriptionAvailable;
  };
  limits: {
    audiofiles: SubscriptionLimits;
  };
}

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async findActiveSubscriptionLimits(userId: string): Promise<SubscriptionLimits> {
    const user = await this.findOne(userId, {
      relations: ['inAppSubscriptions']
    });

    if (!user) throw new Error('Could not find user for subscription limits.');

    const activeSubscription = user.inAppSubscriptions.find(inAppSubscription => inAppSubscription.status === 'active');

    // Free account
    if (!activeSubscription) {
      const inAppSubscriptionsRepository = getRepository(InAppSubscription);
      const freeSubscription = await inAppSubscriptionsRepository.findOne({ productId: 'free' });

      if (!freeSubscription) throw new Error('Could not find free subscription.');

      return {
        limitSecondsPerMonth: freeSubscription.limitSecondsPerMonth,
        limitSecondsPerArticle: freeSubscription.limitSecondsPerArticle
      };
    }

    // Paid account
    const paidAccountLimits = {
      limitSecondsPerMonth: activeSubscription.inAppSubscription.limitSecondsPerMonth,
      limitSecondsPerArticle: activeSubscription.inAppSubscription.limitSecondsPerArticle
    };

    return paidAccountLimits;
  }

  async findUserDetails(userId: string): Promise<UserDetails | undefined> {
    const audiofileRepository = getCustomRepository(AudiofileRepository);
    const user = await this.findOne(userId, { relations: ['voiceSettings', 'inAppSubscriptions'] });

    if (!user) return undefined;

    const subscriptionLimits = await this.findActiveSubscriptionLimits(userId);
    const currentMonthAudiofileUsageInSeconds = await audiofileRepository.findAudiofileUsageInCurrentMonth(userId);

    const used = {
      audiofiles: {
        currentMonthInSeconds: currentMonthAudiofileUsageInSeconds
      }
    };

    const available = {
      audiofiles: {
        currentMonthInSeconds: subscriptionLimits.limitSecondsPerMonth - currentMonthAudiofileUsageInSeconds
      }
    };

    const limits = {
      audiofiles: subscriptionLimits
    };

    const isSubscribed = !!user.inAppSubscriptions.find(inAppSubscription => inAppSubscription.status === 'active');

    return {
      ...user,
      isSubscribed,
      used,
      available,
      limits
    };
  }

  /**
   * Method to find the closest subscription upgrade options for the user.
   *
   * Returns a in app subscription we could use to propose to the user.
   *
   * @param userId
   */
  async findSubscriptionUpgradeOption(userId: string): Promise<InAppSubscription | undefined> {
    const inAppSubscriptionRepository = getRepository(InAppSubscription);
    const user = await this.findUserDetails(userId);

    if (!user) return undefined;

    // If the user is not subscribed, return the first paid subscription options
    if (!user.isSubscribed) {
      const otherAvailableSubscriptions = await inAppSubscriptionRepository.find({
        isActive: true,
        productId: Not('free')
      });

      if (!otherAvailableSubscriptions || !otherAvailableSubscriptions.length) return undefined;

      // Get the cheapest paying subscription
      const subscriptionUpgradeOption = [...otherAvailableSubscriptions].sort((a, b) => {
        return a.price - b.price;
      })[0];

      return subscriptionUpgradeOption;
    }

    const currentPayingSubscription = user.inAppSubscriptions && user.inAppSubscriptions.find(inAppSubscription => inAppSubscription.status === 'active');
    if (!currentPayingSubscription) return undefined; // This should not happen

    // If the user is subscribed
    // Find a subscription with higher limits
    const otherAvailableSubscriptions = await inAppSubscriptionRepository.find({
      isActive: true,
      id: Not(currentPayingSubscription.id),
      productId: Not('free')
    });

    if (!otherAvailableSubscriptions || !otherAvailableSubscriptions.length) return undefined;

    // Get the subscription with the highest limits per month
    const subscriptionUpgradeOption = [...otherAvailableSubscriptions].sort((a, b) => {
      return b.limitSecondsPerMonth - a.limitSecondsPerMonth;
    })[0];

    return subscriptionUpgradeOption;
  }
}
