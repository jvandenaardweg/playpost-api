import { getRepository, Repository } from 'typeorm';

import { BaseService } from './index';
import { ApiKey } from '../database/entities/api-key';

export class ApiKeysService extends BaseService {
  private readonly apiKeyRepository: Repository<ApiKey>;

  constructor() {
    super()

    this.apiKeyRepository = getRepository(ApiKey);
  }

  public findOneByIdWithUserId = async (apiKeyId: string, userId: string): Promise<ApiKey | undefined> => {
    const userKeys = await this.apiKeyRepository.findOne({
      id: apiKeyId,
      user: {
        id: userId
      }
    });

    return userKeys;
  }

  public findAllByUserId = async (userId: string): Promise<ApiKey[]> => {
    const userKeys = await this.apiKeyRepository.find({
      user: {
        id: userId
      }
    });

    return userKeys;
  }

  public deleteOne = async (apiKey: ApiKey): Promise<ApiKey> => {
    const deletedApiKey = await this.apiKeyRepository.remove(apiKey)

    return deletedApiKey;
  }

  public createOne = async (apiKeyToCreate: ApiKey): Promise<ApiKey> => {
    const createdApiKey = await this.apiKeyRepository.save(apiKeyToCreate);
    
    return createdApiKey;
  }
}
