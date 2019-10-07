import { IsUrl, IsUUID } from 'class-validator';
import { BeforeRemove, BeforeUpdate, Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { logger } from '../../utils';
import { Article } from './article';
import { User } from './user';
import { Voice } from './voice';

import * as cache from '../../cache';
import { ColumnNumericTransformer } from '../utils';

// encoding formats supported by Google and AWS Polly
export enum AudiofileMimeType {
  MP3 = 'audio/mpeg',
  WAV = 'audio/wav',
  PCM = 'audio/pcm',
  OGG_OPUS = 'audio/opus',
  OGG_VORBIS = 'audio/ogg'
}

@Entity()
export class Audiofile {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ nullable: true })
  @IsUrl()
  url: string;

  @Column({ nullable: true })
  bucket: string;

  @Column({ nullable: true })
  filename: string;

  @Column({ type: 'decimal', nullable: true, transformer: new ColumnNumericTransformer() })
  length: number; // Length in seconds

  @Column({ nullable: false, type: 'enum', enum: AudiofileMimeType, default: AudiofileMimeType.MP3 })
  mimeType: AudiofileMimeType;

  @Index()
  @ManyToOne(() => Article, { onDelete: 'CASCADE' }) // On delete of an Article, delete the Audiofile
  article: Article;

  @ManyToOne(() => Voice, { nullable: true, onDelete: 'SET NULL', eager: true }) // On delete of an Voices, set this column to null. So the audiofile stays available.
  voice: Voice;

  @Index()
  @ManyToOne(() => User, user => user.audiofiles, { nullable: true, onDelete: 'SET NULL' }) // On delete of a User, keep the Audiofile in the database, but set its userId to "null"
  user: User;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * When removing or updating an audiofile in the database, make sure the caches are deleted
   */
  @BeforeUpdate()
  @BeforeRemove()
  async beforeRemove() {
    const loggerPrefix = 'Database Entity (Audiofile) beforeUpdate/beforeRemove:';

    const audiofileId = this.id;
    const articleId = this.article.id;

    const cacheKeys = [
      cache.getCacheKey('Audiofile', audiofileId),
      cache.getCacheKey('Article', articleId)
    ]

    logger.info(loggerPrefix, 'Should delete caches:', cacheKeys.join(', '))

    if (cacheKeys) {
      await cache.removeCacheByKeys(cacheKeys)
      logger.info(loggerPrefix, 'Deleted caches:', cacheKeys.join(', '))
    }

    return this
  }
}
