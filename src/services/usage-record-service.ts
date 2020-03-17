import { getRepository, InsertResult, Repository } from 'typeorm';

import { UsageRecord } from '../database/entities/usage-record';
import { CollectionResponse } from '../typings';
import { BaseService } from './index';
import { BillingService } from './billing-service';

interface CreateUsageRecordOptions {
  articleId: string;
  audiofileId: string;
  userId: string;
  quantity: number;
  isMetered: boolean;
  stripeSubscriptionItemId: string;
  organizationId?: string;
  publicationId?: string;
}

export class UsageRecordService extends BaseService {
  readonly usageRecordRepository: Repository<UsageRecord>;
  readonly billingService: BillingService;

  constructor () {
    super();

    this.usageRecordRepository = getRepository(UsageRecord);
    this.billingService = new BillingService();
  }

  async findAllBySubscriptionItemId(stripeSubscriptionItemId: string, page: number, perPage: number, skip: number, take: number): Promise<CollectionResponse<UsageRecord[]>> {
    const [usageRecords, total] = await this.usageRecordRepository
      .createQueryBuilder('usage_record')
      .where('usage_record.stripeSubscriptionItemId = :stripeSubscriptionItemId', { stripeSubscriptionItemId })
      .skip(skip)
      .take(take)
      .getManyAndCount()

    const totalPages = this.getTotalPages(total, perPage);

    const response: CollectionResponse<UsageRecord[]> = {
      total,
      page,
      perPage,
      totalPages,
      data: usageRecords
    }

    return response
  }

  /**
   * Creates a usage record on Stripe and in the database.
   *
   * @param articleId
   * @param audiofileId 
   * @param organizationId 
   * @param publicationId 
   * @param userId 
   * @param quantity 
   * @param isMetered 
   * @param stripeSubscriptionItemId 
   */
  async createUsageRecord(options: CreateUsageRecordOptions): Promise<InsertResult> {
    const currentDate = new Date();
    const timestampStripe = Math.floor(currentDate.getTime() / 1000);

    let stripeUsageRecordId: string | undefined;

    // We track all usage, but allow to be "unmetered"
    // If no isMetered option is given, fallback to metered
    if (options.isMetered || options.isMetered === undefined) {
      const createdStripeUsageRecord = await this.billingService.createUsageRecord(options.stripeSubscriptionItemId, {
        quantity: options.quantity,
        timestamp: timestampStripe,
        action: 'increment'
      })

      stripeUsageRecordId = createdStripeUsageRecord.id;
    }

    const newUsageRecord = this.usageRecordRepository.create({
      article: {
        id: options.articleId
      },
      audiofile: {
        id: options.audiofileId
      },
      organization: {
        id: options.organizationId
      },
      publication: {
        id: options.publicationId
      },
      user: {
        id: options.userId
      },
      quantity: options.quantity,
      isMetered: options.isMetered,
      stripeSubscriptionItemId: options.stripeSubscriptionItemId,
      stripeUsageRecordId,
      timestamp: currentDate
    });

    return this.usageRecordRepository.insert(newUsageRecord);
  }
}
