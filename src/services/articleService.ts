import { getRepository, Repository } from 'typeorm';

import { Article } from '../database/entities/article';
import { BaseService } from './index';

export class ArticleService extends BaseService {
  articleRepository: Repository<Article>;

  constructor() {
    super()

    this.articleRepository = getRepository(Article);
  }

  findOne(articleId: string) {
    return this.articleRepository.findOne(articleId, { relations: ['audiofiles'] });
  }
}
