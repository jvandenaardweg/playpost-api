import { EntityRepository, Repository } from 'typeorm';
import { Article, ArticleStatus } from '../entities/article';

@EntityRepository(Article)
export class ArticleRepository extends Repository<Article> {

  public updateStatus(articleId: string, status: ArticleStatus) {
    return this.update(articleId, { status });
  }
}
