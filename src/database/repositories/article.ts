import { EntityRepository, FindManyOptions, Repository } from 'typeorm';
import { Article, ArticleStatus } from '../entities/article';
import { Audiofile } from '../entities/audiofile';
import { Language } from '../entities/language';

export interface ArticleSummary {
  id: Article['id'];
  title?: Article['title'];
  url: Article['url'];
  canonicalUrl?: Article['canonicalUrl'];
  readingTime?: Article['readingTime'];
  sourceName?: Article['sourceName'];
  imageUrl?: Article['imageUrl'];
  authorName?: Article['authorName'];
  isCompatible?: Article['isCompatible'];
  compatibilityMessage?: Article['compatibilityMessage'];
  status?: Article['status'];
  createdAt: Article['createdAt'];
  updatedAt: Article['updatedAt'];
  audiofiles?: Audiofile[];
  language?: Language;
}

export interface ArticleSummariesResponse {
  total: number;
  pages: number;
  data: ArticleSummary[]
}

@EntityRepository(Article)
export class ArticleRepository extends Repository<Article> {
  // articlePreviewSelects: Pick<FindOneOptions<Article>, 'select'>['select'];

  constructor() {
    super();
  }

  /**
   * Get's a summary view of the articles, for faster performance for the use in lists.
   *
   * Excludes fields: html, ssml, description, documentHtml
   *
   * @param options
   */
  async findSummaryOrFail(
    options?: FindManyOptions<Article> | undefined,
    pageParam?: any,
    perPageParam?: any
  ): Promise<ArticleSummariesResponse> {
    const pageInteger = parseInt(pageParam, 0);
    const perPageInteger = parseInt(perPageParam, 10);

    const take = perPageInteger ? perPageInteger : 10
    const skip = (pageInteger && perPageInteger) ? (pageInteger - 1) * perPageInteger : 0;

    const select: (keyof ArticleSummary)[] = [
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

    try {
      const articleSummaries = await this.findAndCount({
        // Allow order to be overwritten
        order: {
          createdAt: 'DESC'
        },

        // Set the options
        ...options,

        // These options are not adjustable trough the "options" argument
        skip,
        take,
        select,
        relations: ['audiofiles', 'language'],
      });

      const total = articleSummaries[1];
      const pages = Math.ceil(articleSummaries[1] / take);
      const data = articleSummaries[0];

      return {
        total,
        pages,
        data
      };
    } catch (err) {
      throw err;
    }
  }

  updateStatus(articleId: string, status: ArticleStatus) {
    return this.update(articleId, { status });
  }

  // findPreviews(limit: number, offset: number) {
  //   return this.find({
  //     where: {
  //       publisher: {
  //         id: publisherId
  //       }
  //     },
  //     take: limit ? limit : 10,
  //     skip: offset ? offset : 0,
  //     relations: ['audiofiles'],
  //     select: this.articlePreviewSelects
  //   })
  // }
}
