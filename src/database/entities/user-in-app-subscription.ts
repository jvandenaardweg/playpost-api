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
export class UserInAppSubscription {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ nullable: true })
  @IsDate()
  startedAt: Date; // purchase date

  @Column({ nullable: true })
  @IsDate()
  expiresAt: Date; // expires date

  @Index()
  @Column({ nullable: true, unique: true })
  latestTransactionId: string; // Subsequent transactions after the user purchased the subscription (auto-renewal transactions)

  @Index()
  @Column({ nullable: true, unique: true })
  originalTransactionId: string; // The initial transaction the user did to purchase the subscription

  @Column({ nullable: false })
  latestReceipt: string;

  @Column({ nullable: false, default: false })
  isTrial: boolean;

  @Column({ nullable: false })
  isCanceled: boolean;

  @Column({ nullable: false })
  isExpired: boolean;

  @Column({ type: 'enum', enum: InAppSubscriptionStatus, nullable: false })
  status: InAppSubscriptionStatus;

  @Column({ type: 'enum', enum: InAppSubscriptionEnvironment, nullable: false })
  environment: InAppSubscriptionEnvironment;

  @Index()
  @ManyToOne(type => User, { nullable: true, onDelete: 'SET NULL' })
  // When we delete a user, we keep their purchase history, so we can keep track of purchases
  // User could also be null if we receive purchase events from Apple, but we didnt register a purchase in our database
  user: User;

  @Index()
  @ManyToOne(type => InAppSubscription, { onDelete: 'RESTRICT', eager: true })
  // When we try to delete a Subscription, prevent that from happening
  inAppSubscription: InAppSubscription;

  @Column({ nullable: true })
  @IsDate()
  renewedAt: Date; // purchase date

  @Column({ nullable: true })
  @IsDate()
  canceledAt: Date;

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;
}
