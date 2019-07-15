import { IsUrl, IsUUID } from 'class-validator';
import { AfterInsert, BaseEntity, Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Audiofile } from './audiofile';
import { PlaylistItem } from './playlist-item';
import { User } from './user';

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
@Index(['url', 'canonicalUrl'])
export class Article extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  public id: string;

  @Column({ nullable: true })
  public title: string;

  @Column({ nullable: true })
  public description: string;

  @Column({ unique: true })
  @IsUrl()
  public url: string;

  // The "canonicalUrl" is filled in after we crawl the page. We could get redirects. The URL we end up is the "canonicalUrl", which could be different then "url".
  @Column({ unique: true, nullable: true })
  @IsUrl()
  public canonicalUrl: string;

  @Column({ type: 'enum', enum: ArticleStatus, default: ArticleStatus.NEW })
  public status: ArticleStatus;

  @Column({ nullable: true })
  public sourceName: string;

  // Not required
  @Column({ nullable: true })
  @IsUrl()
  public imageUrl: string;

  @Column({ type: 'decimal', nullable: true, transformer: new ColumnNumericTransformer() })
  public readingTime: number; // Time in seconds

  @Column({ nullable: true })
  public authorName: string;

  @Column('text', { nullable: true })
  public html: string;

  @Column('text', { nullable: true, select: false }) // Be aware: we don't send the ssml to the user. If you need it, use in your find query { select: ['ssml'] }
  public ssml: string;

  @Column('text', { nullable: true, select: false }) // Be aware: we don't send the text to the user. If you need it, use in your find query { select: ['text'] }
  public text: string;

  @Column('text', { nullable: true, select: false }) // Be aware: we don't send the text to the user. If you need it, use in your find query { select: ['documentHtml'] }
  public documentHtml: string; // The complete documentHtml we get from the user (by using our share extensions). We remove the documentHtml if we have crawled the article.

  @ManyToOne(type => User, user => user.articles, { nullable: true, onDelete: 'SET NULL' }) // On delete of a User, keep the Article in the database, but set its userId to NULL
  public user: User;

  @ManyToOne(type => Language, language => language.articles, { nullable: true, onDelete: 'RESTRICT', eager: true }) // On delete of a Language, restrict the deletion when there are articles with the same language
  public language: Language;

  @OneToMany(type => Audiofile, audiofile => audiofile.article, { onDelete: 'NO ACTION', eager: true }) // On delete of a Audiofile, don't remove the Article
  public audiofiles: Audiofile[];

  @OneToMany(type => PlaylistItem, playlistItem => playlistItem.article, { onDelete: 'NO ACTION' }) // On delete of a PlaylistItem, don't remove the Article
  public playlistItems: PlaylistItem[];

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @AfterInsert()
  public async afterInsert() {
    const loggerPrefix = 'Database Entity (Article):';

    try {
      // Should get the full article details, like ssml, text and html
      logger.info(loggerPrefix, '@AfterInsert():', 'Should get the full article details, like ssml, text and html...');

      await ArticlesPubSub.publishCrawlFullArticle(this.id, this.url);
    } catch (err) {
      const errorMessage = err && err.message ? err.message : 'Unknown error happened while publishing message to start crawler for the full article.';
      logger.error(loggerPrefix, errorMessage);
      throw err;
    }
  }
}
