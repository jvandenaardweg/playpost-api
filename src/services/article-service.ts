import nodeFetch from 'node-fetch';
import { FindOneOptions, getRepository, Repository, UpdateResult, FindManyOptions } from 'typeorm';
import urlParse from 'url-parse';

import { Article } from '../database/entities/article';
import { ArticleSummary } from '../database/repositories/article';
import { HttpError, HttpStatus } from '../http-error';
import { CollectionResponse } from '../typings';
import { BaseService } from './index';
import { LanguageService } from './language-service';

export class ArticleService extends BaseService {
  private readonly articleRepository: Repository<Article>;
  private readonly defaultRelations: string[];
  private readonly selectSummary: (keyof ArticleSummary)[];
  private readonly selectFull: (keyof Article)[];

  constructor() {
    super()

    this.defaultRelations = ['audiofiles', 'publication'];
    this.articleRepository = getRepository(Article);

    this.selectSummary = [
      'id',
      'title',
      'url',
      'canonicalUrl',
      'description',
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

    this.selectFull = [
      ...this.selectSummary,
      'ssml', 
      'html'
    ]
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

  public findOneByIdFull = (articleId: string, options: FindOneOptions<Article> | undefined) => {
    return this.articleRepository.findOne(articleId, {
      ...options,
      select: this.selectFull,
      relations: this.defaultRelations
    });
  }

  public findAllSummaries = async (options: FindManyOptions<Article> | undefined): Promise<[ArticleSummary[], number]> => {
    const [articles, total] = await this.articleRepository.findAndCount({
      ...options,
      order: {
        createdAt: 'DESC'
      },
      select: this.selectSummary,
      relations: ['audiofiles', 'language']
    })

    const articleSummaries: ArticleSummary[] = articles;

    return [
      articleSummaries,
      total
    ]
  }

  public findAllSummariesCollection = async (options: FindManyOptions<Article>, page: number, perPage: number, skip: number, take: number): Promise<CollectionResponse<ArticleSummary[]>> => {
    const [articleSummaries, total] = await this.findAllSummaries({
      ...options,
      skip,
      take
    })

    const totalPages = this.getTotalPages(total, perPage);

    const response: CollectionResponse<ArticleSummary[]> = {
      total,
      page,
      perPage,
      totalPages,
      data: articleSummaries
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

  public update = async (articleId: string, article: Article): Promise<UpdateResult> => {
    const savedArticle = await this.articleRepository.update(articleId, article);
    return savedArticle;
  }
  /**
   * Get's the article from a URL and returns an Article entity which we can use to insert in the database.
   */
  public fetchArticleByUrl = async (articleUrl: string): Promise<Article> => {
    const result: PostplayCrawler.IResponse = await nodeFetch(`${process.env.CRAWLER_BASE_URL}/browser?url=${articleUrl}`).then(response => response.json());

    if (!result) {
      throw new HttpError(HttpStatus.InternalServerError, 'We did not receive an article from our crawler.');
    }

    const fetchedArticle = new Article();

    // ssml
    if (result.ssml) {
      fetchedArticle.ssml = result.ssml;
    }

    // html
    if (result.articleHTML) {
      fetchedArticle.html = result.articleHTML;
    }

    // readingTime
    if (result.readingTimeInSeconds) {
      fetchedArticle.readingTime = result.readingTimeInSeconds;
    }

    // imageUrl
    if (result.metadata && result.metadata.image) {
      fetchedArticle.imageUrl = result.metadata.image;
    }

    // authorName
    if (result.metadata && result.metadata.author) {
      fetchedArticle.authorName = result.metadata.author;
    }

    // description
    if (result.description) {
      fetchedArticle.description = result.description;
    }

    // canonicalUrl
    if (result.canonicalUrl) {
      fetchedArticle.canonicalUrl = result.canonicalUrl;
    } else if (result.metadata && result.metadata.url) {
      fetchedArticle.canonicalUrl = result.metadata.url;
    }

    // If the crawler returns a languageCode
    // Find that language code in the database and return that language
    if (result.language) {
      const languageService = new LanguageService();
      const foundLanguage = await languageService.findOneByCode(result.language);
      fetchedArticle.language = foundLanguage;
    }

    // title
    if (result.title) {
      fetchedArticle.title = result.title;
    }

    // url
    if (result.url) {
      fetchedArticle.url = result.url;
    }

    // siteName
    if (result.siteName) {
      fetchedArticle.sourceName = result.siteName;
    } else if (result.hostName) {
      fetchedArticle.sourceName = result.hostName;
    } else if (result.canonicalUrl) {
      fetchedArticle.sourceName = urlParse(result.canonicalUrl).hostname;
    } else if (result.url) {
      fetchedArticle.sourceName = urlParse(result.url).hostname;
    }

    // isCompatible
    // compatibilityMessage
    if (result.validationResult) {
      fetchedArticle.isCompatible = result.validationResult.isValid;

      // Only add the compatibility message to our database if it is not compatible
      if (!result.validationResult.isValid) {
        fetchedArticle.compatibilityMessage = result.validationResult.message;
      }
    }

    return fetchedArticle;
  }
}
