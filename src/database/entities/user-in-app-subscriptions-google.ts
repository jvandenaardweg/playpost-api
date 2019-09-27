import { IsDate, IsUUID } from 'class-validator';
import { AfterUpdate, Column, CreateDateColumn, Entity, getRepository, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { logger } from '../../utils';
import { InAppSubscription } from './in-app-subscription';
import { User } from './user';
import { InAppSubscriptionEnvironment, InAppSubscriptionStatus } from './user-in-app-subscription-apple';
import { UserVoiceSetting } from './user-voice-setting';

@Entity()
export class UserInAppSubscriptionGoogle {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  // purchase date
  @Column({ nullable: true })
  @IsDate()
  startedAt: Date;

  // expires date
  @Index()
  @Column({ nullable: true })
  @IsDate()
  expiresAt: Date;

  @Index()
  @Column({ nullable: false, unique: true })
  transactionId: string;

  @Index()
  @Column({ nullable: false, unique: true })
  orderId: string;

  // The initial transaction the user did to purchase the subscription
  @Index()
  @Column({ nullable: false, unique: true })
  purchaseToken: string;

  @Column({ nullable: false })
  latestReceipt: string;

  // To indicate if the user already used a trial
  // Since Apple does not provide this information for us, we need to track it ourselfs
  @Column({ nullable: true, default: false })
  hadTrial: boolean;

  @Column({ nullable: false, default: false })
  isTrial: boolean;

  @Column({ nullable: false })
  isCanceled: boolean;

  @Column({ nullable: false })
  isExpired: boolean;

  @Index()
  @Column({ type: 'enum', enum: InAppSubscriptionStatus, nullable: false })
  status: InAppSubscriptionStatus;

  @Column({ type: 'enum', enum: InAppSubscriptionEnvironment, nullable: false })
  environment: InAppSubscriptionEnvironment;

  // When we delete a user, we keep their purchase history, so we can keep track of purchases
  // User could also be null if we receive purchase events from Apple, but we didnt register a purchase in our database
  @Index()
  @ManyToOne(type => User, { nullable: true, onDelete: 'SET NULL' })
  user: User;

  // When we try to delete a Subscription, prevent that from happening
  @Index()
  @ManyToOne(type => InAppSubscription, { onDelete: 'RESTRICT', eager: true })
  inAppSubscription: InAppSubscription;

  @Column({ nullable: true })
  @IsDate()
  renewedAt: Date;

  @Column({ nullable: true })
  @IsDate()
  canceledAt: Date;

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;

  @AfterUpdate()
  /**
   * Method to delete the user his voice settings when his subscription expires.
   *
   */
  async deleteExpiredVoiceSettings() {
    const loggerPrefix = 'Delete Expired Voice Settings:';
    const userId = this.user ? this.user.id : null;

    if (userId && ![InAppSubscriptionStatus.ACTIVE, InAppSubscriptionStatus.LAPSED].includes(this.status)) {
      logger.info(loggerPrefix, `Removing voice settings for user ID "${userId}"...`);

      const deleteResult = await getRepository(UserVoiceSetting).delete({
        user: {
          id: this.user.id
        }
      })

      logger.info(loggerPrefix, `Removed ${deleteResult.affected} voice settings for user ID "${userId}"!`);
    } else {
      logger.info(loggerPrefix, `No voice settings to delete for user ID "${userId}"...`);
    }
  }
}
