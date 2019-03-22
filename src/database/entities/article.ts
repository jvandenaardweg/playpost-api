import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, AfterInsert, OneToMany, getRepository } from 'typeorm';
import { IsUUID, IsUrl } from 'class-validator';
import joi from 'joi';
import { User } from './user';
import { Audiofile } from './audiofile';
import { PlaylistItem } from './playlist-item';

import { redisClientPub } from '../../cache';

import { ColumnNumericTransformer } from '../utils';

export const articleInputValidationSchema = joi.object().keys({
  articleUrl: joi.string().uri()
});

@Entity()
export class Article extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ unique: true })
  @IsUrl()
  url: string;

  @Column()
  languageCode: string;

  @Column()
  sourceName: string;

  // Not required
  @Column({ nullable: true })
  @IsUrl()
  imageUrl: string;

  @Column({ type: 'decimal', nullable: true, transformer: new ColumnNumericTransformer() })
  readingTime: number; // Time in seconds

  @Column({ nullable: true })
  authorName: string;

  @Column({ nullable: true })
  categoryName: string;

  @Column('text', { nullable: true, select: false }) // Be aware: we don't send the HTML to the user. If you need it, use in your find query { select: ['html'] }
  html: string;

  @Column('text', { nullable: true })
  ssml: string;

  @Column('text', { nullable: true })
  text: string;

  @ManyToOne(type => User, user => user.articles, { nullable: true, onDelete: 'SET NULL' }) // On delete of a User, keep the Article in the database, but set its userId to NULL
  user: User;

  @OneToMany(type => Audiofile, audiofile => audiofile.article, { onDelete: 'CASCADE', eager: true }) // On delete of a Audiofile, remove the Article
  audiofiles: Audiofile[];

  @OneToMany(type => PlaylistItem, playlistItem => playlistItem.article, { onDelete: 'SET NULL' }) // On delete of a PlaylistItem, don't remove the Article
  playlistItems: PlaylistItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterInsert()
  afterInsert() {
    // Should get the full article details, like ssml, text and html
    console.log('Should get the full article details, like ssml, text and html');
    redisClientPub.publish('FETCH_FULL_ARTICLE', this.id);
  }
}
