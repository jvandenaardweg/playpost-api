import { EntityRepository, Repository, getCustomRepository, getRepository } from 'typeorm';
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
}
