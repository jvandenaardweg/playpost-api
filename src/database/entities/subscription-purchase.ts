import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { IsUUID } from 'class-validator';
import { User } from './user';

export enum PurchaseService {
  APPLE = 'apple',
  GOOGLE = 'google'
}

export enum PurchaseStatus {
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  ACTIVE = 'active'
}

@Entity()
@Index(['user', 'productId', 'transactionId'])
export class SubscriptionPurchase {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ nullable: false }) // "premium"
  productId: string;

  @Column({ nullable: false })
  purchaseDate: string;

  @Column({ nullable: true })
  cancellationDate: string;

  @Column({ nullable: false, default: 1 })
  quantity: number;

  @Column({ nullable: false, unique: true })
  transactionId: string;

  @Column({ nullable: false })
  transactionReceipt: string;

  @Column({ nullable: false, default: false })
  isTrial: boolean;

  @Column({ type: 'enum', enum: PurchaseService, nullable: false })
  service: PurchaseService;

  @Column({ type: 'enum', enum: PurchaseStatus, nullable: false })
  status: PurchaseStatus;

  @ManyToOne(type => User, { nullable: true, onDelete: 'SET NULL', eager: true })
  // When we delete a user, we keep their purchase history, so we can keep track of purchases
  user: User;
}
