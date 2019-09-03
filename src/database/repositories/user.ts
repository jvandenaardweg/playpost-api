import { EntityRepository, getConnection, getCustomRepository, getRepository, Not, Repository } from 'typeorm';
import * as cacheKeys from '../../cache/keys';
import { InAppSubscription } from '../entities/in-app-subscription';
import { User } from '../entities/user';
import { AudiofileRepository } from '../repositories/audiofile';
import { UserInAppSubscriptionApple } from 'database/entities/user-in-app-subscription-apple';
import { UserInAppSubscriptionGoogle } from 'database/entities/user-in-app-subscriptions-google';

interface ISubscriptionLimits {
  limitSecondsPerMonth: number;
  limitSecondsPerArticle: number;
}

interface ISubscriptionUsed {
  currentMonthInSeconds: number;
}

interface ISubscriptionAvailable {
  currentMonthInSeconds: number;
}

interface IUserDetails extends Partial<User> {
  isSubscribed: boolean;
  activeUserInAppSubscription: UserInAppSubscriptionApple | UserInAppSubscriptionGoogle | null;
  usedInAppSubscriptionTrial: string[];
  used: {
    audiofiles: ISubscriptionUsed;
  };
  available: {
    audiofiles: ISubscriptionAvailable;
  };
  limits: {
    audiofiles: ISubscriptionLimits;
  };
}

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async removeUserRelatedCaches(userId: string) {
    const user = await this.findOne(userId, { relations: ['apiKeys'] })

    if (!user) {
      throw new Error('User is not found.')
    }

    // Remove the JWT verification cache as the user is not there anymore
    const cache = await getConnection('default').queryResultCache;
    if (cache) {
      await cache.remove([cacheKeys.jwtVerifyUser(userId)]);

      // If the user has API keys, make sure they are also removed from cache
      if (user.apiKeys.length) {
        for (const apiKey of user.apiKeys) {
          await cache.remove([cacheKeys.apiKeyUser(apiKey.key)]);
        }
      }
    }
  }

  async removeById(userId: string) {
    const user = await this.findOne(userId, { relations: ['apiKeys']});

    if (!user) {
      throw new Error('User to be removed could not be found.');
    }

    // First remove the caches
    await this.removeUserRelatedCaches(user.id);

    // Then remove the user
    await this.remove(user);

  }

  async findActiveSubscriptionLimits(userId: string): Promise<ISubscriptionLimits> {
    const user = await this.findOne(userId, {
      relations: ['inAppSubscriptions']
    });

    if (!user) { throw new Error('Could not find user for subscription limits.'); }

    const activeSubscription = user.inAppSubscriptions.find(inAppSubscription => inAppSubscription.status === 'active');

    // Free account
    if (!activeSubscription) {
      const inAppSubscriptionsRepository = getRepository(InAppSubscription);
      const freeSubscription = await inAppSubscriptionsRepository.findOne({ productId: 'free' });

      if (!freeSubscription) { throw new Error('Could not find free subscription.'); }

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

  async findUserDetails(userId: string): Promise<IUserDetails | undefined> {
    const audiofileRepository = getCustomRepository(AudiofileRepository);
    const user = await this.findOne(userId, { relations: ['voiceSettings', 'inAppSubscriptions', 'inAppSubscriptionsGoogle'] });

    if (!user) { return undefined; }

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

    // Find the user's active subscriptions
    const activeSubscriptionApple = user.inAppSubscriptions
    .sort((a, b) => b.startedAt.toISOString().localeCompare(a.startedAt.toISOString())) // Sort by startedAt, so if the user upgrades, we get the correct active subscription
    .find(inAppSubscriptionsApple => inAppSubscriptionsApple.status === 'active');

    const activeSubscriptionGoogle = user.inAppSubscriptionsGoogle
    .sort((a, b) => b.startedAt.toISOString().localeCompare(a.startedAt.toISOString())) // Sort by startedAt, so if the user upgrades, we get the correct active subscription
    .find(inAppSubscriptionsGoogle => inAppSubscriptionsGoogle.status === 'active');

    // Find out if the user already used a trial option in the app
    const trialPurchaseApple = user.inAppSubscriptions.find(inAppSubscriptionsApple => inAppSubscriptionsApple.hadTrial);
    const trialPurchaseGoogle = user.inAppSubscriptionsGoogle.find(inAppSubscriptionsGoogle => inAppSubscriptionsGoogle.hadTrial);

    // Just show one active subscription
    // const activeInAppSubscriptions = activeSubscriptionApple || activeSubscriptionGoogle || null;

    const isSubscribedApple = !!activeSubscriptionApple;
    const isSubscribedGoogle = !!activeSubscriptionGoogle;
    const isSubscribed = isSubscribedApple || isSubscribedGoogle;
    const usedInAppSubscriptionTrial: string[] = [];

    if (trialPurchaseApple) {
      usedInAppSubscriptionTrial.push(trialPurchaseApple.inAppSubscription.productId)
    }

    if (trialPurchaseGoogle) {
      usedInAppSubscriptionTrial.push(trialPurchaseGoogle.inAppSubscription.productId)
    }

    // We offer subscriptions per platform, but the user only needs one active
    // Just return the active subscription product Id
    // const activeInAppSubscriptionProductId = (activeSubscriptionApple) ? activeSubscriptionApple.inAppSubscription.productId : (activeSubscriptionGoogle) ? activeSubscriptionGoogle.inAppSubscription.productId : null;
    const activeUserInAppSubscription = (activeSubscriptionApple) ? activeSubscriptionApple : (activeSubscriptionGoogle) ? activeSubscriptionGoogle : null;

    // We do not need the whole purchase history
    delete user.inAppSubscriptionsGoogle;

    // TODO: Delete this later, iOS App 1.1.3 and below depend on this
    // delete user.inAppSubscriptions;

    return {
      ...user,
      isSubscribed,
      activeUserInAppSubscription,
      usedInAppSubscriptionTrial,
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

    if (!user) { return undefined; }

    // If the user is not subscribed, return the first paid subscription options
    if (!user.isSubscribed) {
      const unsubscribedOtherAvailableSubscriptions = await inAppSubscriptionRepository.find({
        isActive: true,
        productId: Not('free')
      });

      if (!unsubscribedOtherAvailableSubscriptions || !unsubscribedOtherAvailableSubscriptions.length) { return undefined; }

      // Get the cheapest paying subscription
      const unsubscribedSubscriptionUpgradeOption = [...unsubscribedOtherAvailableSubscriptions].sort((a, b) => {
        return a.price - b.price;
      })[0];

      return unsubscribedSubscriptionUpgradeOption;
    }

    const currentPayingSubscription = user.inAppSubscriptions && user.inAppSubscriptions.find(inAppSubscription => inAppSubscription.status === 'active');
    if (!currentPayingSubscription) { return undefined; } // This should not happen

    // If the user is subscribed
    // Find a subscription with higher limits
    const otherAvailableSubscriptions = await inAppSubscriptionRepository.find({
      isActive: true,
      id: Not(currentPayingSubscription.id),
      productId: Not('free')
    });

    if (!otherAvailableSubscriptions || !otherAvailableSubscriptions.length) { return undefined; }

    // Get the subscription with the highest limits per month
    const subscriptionUpgradeOption = [...otherAvailableSubscriptions].sort((a, b) => {
      return b.limitSecondsPerMonth - a.limitSecondsPerMonth;
    })[0];

    return subscriptionUpgradeOption;
  }
}
