import { FindOneOptions, getConnection, getRepository, Repository } from 'typeorm';

import { Article } from '../database/entities/article';
import { ArticleSummary } from '../database/repositories/article';
import { CollectionResponse } from '../typings';
import { BaseService } from './index';

export class ArticleService extends BaseService {
  articleRepository: Repository<Article>;

  constructor() {
    super()

    this.articleRepository = getRepository(Article);
  }

  public findOneById = (articleId: string, options?: FindOneOptions<Article> | undefined) => {
    return this.articleRepository.findOne(articleId, {
      ...options,
      relations: ['audiofiles']
    });
  }

  public async findAllSummaries(where: string, parameters: object, page: number, perPage: number, skip: number, take: number): Promise<CollectionResponse<ArticleSummary[]>> {
    const select: Array<keyof ArticleSummary> = [
      'id',
      'title',
      'url',
      'canonicalUrl',
      'readingTime',
      'sourceName',
      'imageUrl',
      'authorName',
      'isCompatible',
      'compatibilityMessage',
      'status',
      'createdAt',
      'updatedAt'
    ];

    const [articles, total] = await getConnection()
      .getRepository(Article)
      .createQueryBuilder('article')
      .where(where, parameters)
      .select(select)
      .skip(skip)
      .take(take)
      .orderBy('createdAt', 'DESC')
      .getManyAndCount()

    const totalPages = this.getTotalPages(total, perPage);

    const response: CollectionResponse<ArticleSummary[]> = {
      total,
      page,
      perPage,
      totalPages,
      data: articles
    }

    return response
  }

  public remove = async (article: Article): Promise<Article> => {
    return this.articleRepository.remove(article);
  }
}
