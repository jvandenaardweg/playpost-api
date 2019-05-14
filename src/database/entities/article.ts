import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, AfterInsert, OneToMany } from 'typeorm';
import { IsUUID, IsUrl } from 'class-validator';
import { User } from './user';
import { Audiofile } from './audiofile';
import { PlaylistItem } from './playlist-item';

import { redisClientPub } from '../../cache';

import { ColumnNumericTransformer } from '../utils';
import { logger } from '../../utils';

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

  @Column({ unique: true })
  @IsUrl()
  url: string;

  // The "canonicalUrl" is filled in after we crawl the page. We could get redirects. The URL we end up is the "canonicalUrl", which could be different then "url".
  @Column({ unique: true, nullable: true })
  @IsUrl()
  canonicalUrl: string;

  @Column({ type: 'enum', enum: ArticleStatus, default: ArticleStatus.NEW })
  status: ArticleStatus;

  @Column({ nullable: true })
  languageCode: string;

  @Column({ nullable: true })
  sourceName: string;

  // Not required
  @Column({ nullable: true })
  @IsUrl()
  imageUrl: string;

  @Column({ type: 'decimal', nullable: true, transformer: new ColumnNumericTransformer() })
  readingTime: number; // Time in seconds

  @Column({ nullable: true })
  authorName: string;

  // This column is to indicate wether or not this article is behind a login
  // If it's behind a login, we cannot play the full article
  // When isPublic is "null", we just haven't done that check
  @Column({ nullable: true })
  isPublic: boolean;

  @Column('text', { nullable: true, select: false }) // Be aware: we don't send the HTML to the user. If you need it, use in your find query { select: ['html'] }
  documentHtml: string;

  @Column('text', { nullable: true, select: true }) // Be aware: we don't send the HTML to the user. If you need it, use in your find query { select: ['html'] }
  html: string;

  @Column('text', { nullable: true, select: true }) // Awalys send ssml for now, fixes a big in audiofile creation
  // Be aware: we don't send the SSML to the user. If you need it, use in your find query { select: ['ssml'] }
  ssml: string;

  @Column('text', { nullable: true, select: false })
  text: string;

  @ManyToOne(type => User, user => user.articles, { nullable: true, onDelete: 'SET NULL' }) // On delete of a User, keep the Article in the database, but set its userId to NULL
  user: User;

  @OneToMany(type => Audiofile, audiofile => audiofile.article, { onDelete: 'NO ACTION', eager: true }) // On delete of a Audiofile, don't remove the Article
  audiofiles: Audiofile[];

  @OneToMany(type => PlaylistItem, playlistItem => playlistItem.article, { onDelete: 'NO ACTION' }) // On delete of a PlaylistItem, don't remove the Article
  playlistItems: PlaylistItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterInsert()
  afterInsert() {
    // Should get the full article details, like ssml, text and html
    logger.info('Database Entity (Article):', '@AfterInsert():', 'Should get the full article details, like ssml, text and html...');
    redisClientPub.publish('FETCH_FULL_ARTICLE', this.id);
  }
}
