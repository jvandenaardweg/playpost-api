import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsUUID, IsDate } from 'class-validator';
import { User } from './user';
import { Subscription } from './subscription';

export enum PurchaseStatus {
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  ACTIVE = 'active'
}

@Entity()
@Index(['user', 'productId', 'transactionId'])
export class UserSubscription {

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

  @Column({ type: 'enum', enum: PurchaseStatus, nullable: false })
  status: PurchaseStatus;

  @ManyToOne(type => User, { nullable: true, onDelete: 'SET NULL', eager: true })
  // When we delete a user, we keep their purchase history, so we can keep track of purchases
  user: User;

  @ManyToOne(type => Subscription, { onDelete: 'RESTRICT', eager: true })
  // When we try to delete a Subscription, prevent that from happening
  subscription: Subscription;

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;
}
