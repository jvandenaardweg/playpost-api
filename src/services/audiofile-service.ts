import { getRepository, Repository } from 'typeorm';

import { Audiofile } from '../database/entities/audiofile';
import { BaseService } from './index';

export class AudiofileService extends BaseService {
  private readonly audiofileRepository: Repository<Audiofile>;

  constructor () {
    super()

    this.audiofileRepository = getRepository(Audiofile);
  }

  public findOneById = (audiofileId: string): Promise<Audiofile | undefined> => {
    return this.audiofileRepository.findOne(audiofileId);
  }

  public save = async (audiofile: Audiofile): Promise<Audiofile> => {
    const createdAudiofile = await this.audiofileRepository.save(audiofile);
    return this.findOneById(createdAudiofile.id) as Promise<Audiofile>;
  }
}
