import { getConnection, getRepository, DeepPartial, Repository, InsertResult } from 'typeorm';
import Stripe from 'stripe';
import { UsageRecord } from '../database/entities/usage-record';
import { CollectionResponse } from '../typings';
import { BaseService } from './index';
import { stripe } from '../billing';
export class UsageRecordService extends BaseService {
  usageRecordRepository: Repository<UsageRecord>;

  constructor () {
    super();

    this.usageRecordRepository = getRepository(UsageRecord);
  }

  async findAll(page: number, perPage: number, skip: number, take: number): Promise<CollectionResponse<UsageRecord[]>> {
    const [usageRecords, total] = await getConnection()
      .getRepository(UsageRecord)
      .createQueryBuilder('usage_record')
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

  async findAllForSubscriptionItemId(stripeSubscriptionItemId: string, page: number, perPage: number, skip: number, take: number): Promise<CollectionResponse<UsageRecord[]>> {
    const [usageRecords, total] = await getConnection()
      .getRepository(UsageRecord)
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
    articleId: string,
    audiofileId: string,
    organizationId: string,
    publicationId: string,
    userId: string,
    quantity: number,
    isMetered: boolean,
    stripeSubscriptionItemId: string
  ): Promise<InsertResult> {
    const timestamp = new Date().getTime();

    const stripePayload: Stripe.usageRecords.IUsageRecordCreationOptions = {
      quantity,
      timestamp,
      action: 'increment'
    }

    let stripeUsageRecordId: string | undefined;

    // We track all usage, but allow to be "unmetered"
    if (isMetered) {
      // TODO: retry on fail
      const createdStripeUsageRecord = await stripe.usageRecords.create(stripeSubscriptionItemId, stripePayload);
      stripeUsageRecordId = createdStripeUsageRecord.id;
    }

    const newUsageRecord = this.usageRecordRepository.create({
      article: {
        id: articleId
      },
      audiofile: {
        id: audiofileId
      },
      organization: {
        id: organizationId
      },
      publication: {
        id: publicationId
      },
      user: {
        id: userId
      },
      quantity,
      isMetered,
      stripeSubscriptionItemId,
      stripeUsageRecordId,
      timestamp
    });

    return this.usageRecordRepository.insert(newUsageRecord);
  }
}
