import { IsUrl, IsUUID } from 'class-validator';
import { BeforeRemove, BeforeUpdate, Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Unique } from 'typeorm';
import { logger } from '../../utils';
import { Article } from './article';
import { User } from './user';
import { Voice } from './voice';

import * as cache from '../../cache';
import { ColumnNumericTransformer } from '../utils';
import { Publication } from './publication';

// encoding formats supported by Google and AWS Polly
export enum AudiofileMimeType {
  MP3 = 'audio/mpeg',
  WAV = 'audio/wav',
  PCM = 'audio/pcm',
  OGG_OPUS = 'audio/opus',
  OGG_VORBIS = 'audio/ogg'
}

@Entity()

// Don't allow multiple Audiofiles for the same Article for a Publication
// A Publication can only have 1 Audiofile per Article. Updates to an Audiofile need to be overwritten.
@Unique(['publication', 'article']) 

// Don't allow multiple Audiofiles with the same Voice for an Article for a User
// A User can have multiple Audiofiles for an Article, but only with a different Voice
@Unique(['user', 'article', 'voice']) 
export class Audiofile {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ nullable: true })
  @IsUrl()
  url?: string;

  @Column({ nullable: true })
  bucket?: string;

  @Column({ nullable: true })
  filename?: string;

  @Column({ type: 'decimal', nullable: true, transformer: new ColumnNumericTransformer() })
  length?: number; // Length in seconds

  @Column({ nullable: false, type: 'enum', enum: AudiofileMimeType, default: AudiofileMimeType.MP3 })
  mimeType: AudiofileMimeType;

  @Index()
  @ManyToOne(() => Article, { onDelete: 'CASCADE' }) // On delete of an Article, delete the Audiofile
  article: Article;

  @ManyToOne(() => Voice, { nullable: true, onDelete: 'SET NULL', eager: true }) // On delete of an Voices, set this column to null. So the audiofile stays available.
  voice: Voice;

  // An audiofile belonging to a publication means that publication can manage (edit) this audiofile
  // On delete of a Publication, also delete it's audiofiles
  @ManyToOne(() => Publication, { nullable: true, onDelete: 'CASCADE', eager: true }) 
  publication?: Publication;

  // Make the Audiofile object contain only the publicationId
  // @Column({ nullable: true })
  // publicationId?: string;

  // On delete of a User, keep the Audiofile in the database, but set its userId to "null"
  @Index()
  @ManyToOne(() => User, user => user.audiofiles, { nullable: true, onDelete: 'SET NULL' }) 
  user?: User;

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
