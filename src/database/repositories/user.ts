import { EntityRepository, Repository } from 'typeorm';
import { User } from '../entities/user';

@EntityRepository(User)
export class UserRepository extends Repository<User> {

  /**
   * Method to determine if the user still has an active subscription
   *
   * @param userId
   */
  async findIsSubscribed(userId: string): Promise<boolean> {
    const user = await this.findOne(userId, {
      relations: ['inAppSubscriptions']
    });

    const isSubscribed = !!user && !!user.inAppSubscriptions.find(inAppSubscription => inAppSubscription.status === 'active');

    return isSubscribed;
  }
}
