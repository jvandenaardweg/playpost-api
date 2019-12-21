import { FindOneOptions, getConnection, getRepository, Repository } from 'typeorm';

import { Article } from '../database/entities/article';
import { ArticleSummary } from '../database/repositories/article';
import { CollectionResponse } from '../typings';
import { BaseService } from './index';

export class ArticleService extends BaseService {
  private readonly articleRepository: Repository<Article>;
  private readonly defaultRelations: string[];

  constructor() {
    super()

    this.defaultRelations = ['audiofiles', 'publication'];
    this.articleRepository = getRepository(Article);
  }

  public findOneById = (articleId: string, options?: FindOneOptions<Article> | undefined) => {
    return this.articleRepository.findOne(articleId, {
      ...options,
      relations: this.defaultRelations
    });
  }

  public findOne = (options: FindOneOptions<Article> | undefined) => {
    return this.articleRepository.findOne({
      ...options,
      relations: this.defaultRelations
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
      .select(select.map(item => `article.${item}`))
      .where(where, parameters)
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

  public save = async (article: Article): Promise<{ id: string }> => {
    const savedArticle = await this.articleRepository.save(article);

    return {
      id: savedArticle.id
    };
  }
}
