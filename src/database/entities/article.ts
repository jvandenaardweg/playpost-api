import { IsUrl, IsUUID } from 'class-validator';
import { AfterInsert, BaseEntity, BeforeRemove, BeforeUpdate, Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Audiofile } from './audiofile';
import { PlaylistItem } from './playlist-item';
import { User } from './user';

import * as cache from '../../cache';
import * as ArticlesPubSub from '../../pubsub/articles';
import { logger } from '../../utils';
import { ColumnNumericTransformer } from '../utils';
import { Language } from './language';

export enum ArticleStatus {
  CRAWLING = 'crawling',
  NEW = 'new',
  FINISHED = 'finished',
  FAILED = 'failed'
}

@Entity()
export class Article extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Index()
  @Column({ unique: true })
  @IsUrl()
  url: string;

  @Index()
  @Column({ unique: true, nullable: true })
  @IsUrl()
  // The "canonicalUrl" is filled in after we crawl the page. We could get redirects. The URL we end up is the "canonicalUrl", which could be different then "url".
  canonicalUrl: string;

  @Column({ type: 'enum', enum: ArticleStatus, default: ArticleStatus.NEW })
  status: ArticleStatus;

  @Column({ nullable: true })
  sourceName: string;

  @Column({ nullable: true })
  @IsUrl()
  imageUrl: string;

  @Column({ type: 'decimal', nullable: true, transformer: new ColumnNumericTransformer() })
  // Time in seconds
  readingTime: number;

  @Column({ nullable: true })
  authorName: string;

  @Column({ nullable: false, default: true })
  // A property to determine if the article at the url is really an article by our definition
  // Our crawler does a few checks to determine if we have extracted an article
  // If an article is not compatible, we should show a warning to the user
  isCompatible: boolean;

  @Column({ nullable: true })
  // A message from our article crawler on why it is not compatible
  // Can be used for debugging or for giving the user more information on what he needs to do to make the article compatible
  compatibilityMessage: string;

  @Column('text', { nullable: true })
  // The article's HTML we can display to the user
  html: string;

  @Column('text', { nullable: true, select: false }) // Be aware: we don't send the ssml to the user. If you need it, use in your find query { select: ['ssml'] }
  // The SSML needed for Text-to-Speech services
  ssml: string;

  @Column('text', { nullable: true, select: false }) // Be aware: we don't send the text to the user. If you need it, use in your find query { select: ['documentHtml'] }
  // The complete documentHtml we get from the user (by using our share extensions). We remove the documentHtml if we have crawled the article.
  documentHtml: string;

  @ManyToOne(() => User, user => user.articles, { nullable: true, onDelete: 'SET NULL' }) // On delete of a User, keep the Article in the database, but set its userId to NULL
  user: User;

  @ManyToOne(() => Language, language => language.articles, { nullable: true, onDelete: 'RESTRICT', eager: true }) // On delete of a Language, restrict the deletion when there are articles with the same language
  language: Language;

  @OneToMany(() => Audiofile, audiofile => audiofile.article, { onDelete: 'NO ACTION', eager: true }) // On delete of a Audiofile, don't remove the Article
  audiofiles: Audiofile[];

  @OneToMany(() => PlaylistItem, playlistItem => playlistItem.article, { onDelete: 'NO ACTION' }) // On delete of a PlaylistItem, don't remove the Article
  playlistItems: PlaylistItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterInsert()
  async afterInsert() {
    const loggerPrefix = 'Database Entity (Article):';

    try {
      // Should get the full article details, like ssml, text and html
      logger.info(loggerPrefix, '@AfterInsert():', 'Should get the full article details, like ssml, text and html...');

      // Important: do not await this, we do not want the user to wait for this publish to happen, as that delays it with 1 second
      ArticlesPubSub.publishCrawlFullArticle(this.id, this.url);
    } catch (err) {
      const errorMessage = err && err.message ? err.message : 'Unknown error happened while publishing message to start crawler for the full article.';
      logger.error(loggerPrefix, errorMessage);
      throw err;
    }
  }

  /**
   * When removing or updating an article in the database, make sure the caches are deleted
   */
  @BeforeUpdate()
  @BeforeRemove()
  async beforeRemove() {
    const loggerPrefix = 'Database Entity (Article) beforeUpdate/beforeRemove:';

    const articleId = this.id;
    const audiofileIds = this.audiofiles.map(audiofile => audiofile.id);
    const audiofileCacheKeys = audiofileIds.map(audiofileId => cache.getCacheKey('Audiofile', audiofileId))

    const cacheKeys = [
      ...audiofileCacheKeys,
      cache.getCacheKey('Article', articleId),
      cache.getCacheKey('Article', this.url),
      cache.getCacheKey('Article', this.canonicalUrl)
    ]

    logger.info(loggerPrefix, 'Should delete caches:', cacheKeys.join(', '))

    if (cacheKeys) {
      await cache.removeCacheByKeys(cacheKeys)
      logger.info(loggerPrefix, 'Deleted caches:', cacheKeys.join(', '))
    }

    return this
  }

}
