import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsUUID, IsDate } from 'class-validator';

import { ColumnNumericTransformer } from '../utils';

export enum SubscriptionService {
  APPLE = 'apple',
  GOOGLE = 'google'
}

export enum SubscriptionDuration {
  ONE_WEEK = '1w',
  ONE_MONTH = '1m',
  TWO_MONTHS = '2m',
  THREE_MONTHS = '3m',
  SIX_MONTHS = '6m',
  ONE_YEAR = '1y',
}

export enum SubscriptionCurrency {
  DOLLAR = 'usd',
  EURO = 'eur'
}

@Entity()
@Index(['productId', 'isActive'])
export class Subscription {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ nullable: false, unique: true }) // "premium"
  productId: string;

  @Column({ nullable: false }) // "Premium"
  name: string;

  @Column({ nullable: false }) // "Premium features"
  description: string;

  @Column({ type: 'decimal', nullable: false, transformer: new ColumnNumericTransformer() }) // 3.99
  price: number;

  @Column({ type: 'enum', enum: SubscriptionCurrency, nullable: false })
  currency: SubscriptionCurrency;

  @Column({ type: 'enum', enum: SubscriptionDuration, nullable: false })
  duration: SubscriptionDuration;

  @Column({ type: 'enum', enum: SubscriptionService, nullable: false })
  service: SubscriptionService;

  @Column({ nullable: false, default: false })
  isActive: boolean;

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;

}
