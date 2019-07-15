import { IsDate, IsUUID } from 'class-validator';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { InAppSubscription } from './in-app-subscription';
import { User } from './user';

export enum InAppSubscriptionStatus {
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  ACTIVE = 'active',
  LAPSED = 'lapsed'
}

// https://developer.apple.com/documentation/storekit/in-app_purchase/enabling_status_update_notifications
export enum InAppSubscriptionEnvironment {
  SANDBOX = 'Sandbox',
  PROD = 'PROD'
}

@Entity()
@Index(['user', 'inAppSubscription', 'latestTransactionId', 'originalTransactionId'])
export class UserInAppSubscription {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  public id: string;

  @Column({ nullable: true })
  @IsDate()
  public startedAt: Date; // purchase date

  @Column({ nullable: true })
  @IsDate()
  public expiresAt: Date; // expires date

  @Column({ nullable: true, unique: true })
  public latestTransactionId: string; // Subsequent transactions after the user purchased the subscription (auto-renewal transactions)

  @Column({ nullable: true, unique: true })
  public originalTransactionId: string; // The initial transaction the user did to purchase the subscription

  @Column({ nullable: false })
  public latestReceipt: string;

  @Column({ nullable: false, default: false })
  public isTrial: boolean;

  @Column({ nullable: false })
  public isCanceled: boolean;

  @Column({ nullable: false })
  public isExpired: boolean;

  @Column({ type: 'enum', enum: InAppSubscriptionStatus, nullable: false })
  public status: InAppSubscriptionStatus;

  @Column({ type: 'enum', enum: InAppSubscriptionEnvironment, nullable: false })
  public environment: InAppSubscriptionEnvironment;

  @ManyToOne(type => User, { nullable: true, onDelete: 'SET NULL' })
  // When we delete a user, we keep their purchase history, so we can keep track of purchases
  // User could also be null if we receive purchase events from Apple, but we didnt register a purchase in our database
  public user: User;

  @ManyToOne(type => InAppSubscription, { onDelete: 'RESTRICT', eager: true })
  // When we try to delete a Subscription, prevent that from happening
  public inAppSubscription: InAppSubscription;

  @Column({ nullable: true })
  @IsDate()
  public renewedAt: Date; // purchase date

  @Column({ nullable: true })
  @IsDate()
  public canceledAt: Date;

  @CreateDateColumn()
  @IsDate()
  public createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  public updatedAt: Date;
}
