import Stripe from 'stripe';
import { getRepository, InsertResult, Repository } from 'typeorm';

import { stripe } from '../billing';
import { UsageRecord } from '../database/entities/usage-record';
import { CollectionResponse } from '../typings';
import { BaseService } from './index';

export class UsageRecordService extends BaseService {
  usageRecordRepository: Repository<UsageRecord>;

  constructor () {
    super();

    this.usageRecordRepository = getRepository(UsageRecord);
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
  async createUsageRecord(
    options: {
      articleId: string,
      audiofileId: string,
      userId: string,
      quantity: number,
      isMetered: boolean,
      stripeSubscriptionItemId: string,
      organizationId?: string,
      publicationId?: string,
    }
  ): Promise<InsertResult> {
    const timestamp = new Date().getTime();

    const stripePayload: Stripe.usageRecords.IUsageRecordCreationOptions = {
      quantity: options.quantity,
      timestamp,
      action: 'increment'
    }

    let stripeUsageRecordId: string | undefined;

    // We track all usage, but allow to be "unmetered"
    // If no isMetered option is given, fallback to metered
    if (options.isMetered || options.isMetered === undefined) {
      // TODO: retry on fail
      const createdStripeUsageRecord = await stripe.usageRecords.create(options.stripeSubscriptionItemId, stripePayload);
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
      timestamp
    });

    return this.usageRecordRepository.insert(newUsageRecord);
  }
}
