import { IsDate, IsUUID } from 'class-validator';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn, Unique } from 'typeorm';

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
@Index(['productId', 'isActive'])
export class InAppSubscription {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  public id: string;

  @Column({ nullable: false }) // "premium"
  public productId: string;

  @Column({ nullable: false }) // "Premium"
  public name: string;

  @Column({ nullable: false }) // "Premium features"
  public description: string;

  @Column({ type: 'decimal', nullable: false, transformer: new ColumnNumericTransformer() }) // 4.99
  public price: number;

  @Column({ type: 'enum', enum: InAppSubscriptionCurrency, nullable: false })
  public currency: InAppSubscriptionCurrency;

  @Column({ type: 'enum', enum: InAppSubscriptionDuration, nullable: false })
  public duration: InAppSubscriptionDuration;

  @Column({ type: 'enum', enum: InAppSubscriptionService, nullable: false, default: InAppSubscriptionService.INTERNAL })
  public service: InAppSubscriptionService;

  @Column({ nullable: false, default: 0 })
  public limitSecondsPerMonth: number;

  @Column({ nullable: false, default: 0 })
  public limitSecondsPerArticle: number;

  @Column({ nullable: false, default: false })
  public isActive: boolean;

  @CreateDateColumn()
  @IsDate()
  public createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  public updatedAt: Date;
}
