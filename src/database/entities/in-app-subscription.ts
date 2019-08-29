import { IsDate, IsUUID } from 'class-validator';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

import { ColumnNumericTransformer } from '../utils';

export enum InAppSubscriptionService {
  APPLE = 'apple',
  GOOGLE = 'google',
  INTERNAL = 'internal' // internally used by Playpost
}

export enum InAppSubscriptionDuration {
  ONE_WEEK = '1w',
  ONE_MONTH = '1m',
  TWO_MONTHS = '2m',
  THREE_MONTHS = '3m',
  SIX_MONTHS = '6m',
  ONE_YEAR = '1y'
}

export enum InAppSubscriptionCurrency {
  DOLLAR = 'usd',
  EURO = 'eur'
}

@Entity()
@Unique(['productId', 'service'])
export class InAppSubscription {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Index()
  @Column({ nullable: false }) // "premium"
  productId: string;

  @Column({ nullable: false }) // "Premium"
  name: string;

  @Column({ nullable: false }) // "Premium features"
  description: string;

  @Column({ type: 'decimal', nullable: false, transformer: new ColumnNumericTransformer() }) // 4.99
  price: number;

  @Column({ type: 'enum', enum: InAppSubscriptionCurrency, nullable: false })
  currency: InAppSubscriptionCurrency;

  @Column({ type: 'enum', enum: InAppSubscriptionDuration, nullable: false })
  duration: InAppSubscriptionDuration;

  @Column({ type: 'enum', enum: InAppSubscriptionService, nullable: false, default: InAppSubscriptionService.INTERNAL })
  service: InAppSubscriptionService;

  @Column({ nullable: false, default: 0 })
  limitSecondsPerMonth: number;

  @Column({ nullable: false, default: 0 })
  limitSecondsPerArticle: number;

  @Index()
  @Column({ nullable: false, default: false })
  isActive: boolean;

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;
}
