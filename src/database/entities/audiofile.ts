import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, JoinColumn, ManyToOne, Index, AfterRemove } from 'typeorm';
import { IsUUID } from 'class-validator';
import joi from 'joi';
import { Article } from './article';
import { Voice } from './voice';
import { User } from './user';
import * as storage from '../../storage/google-cloud';

import { ColumnNumericTransformer } from '../utils';

export enum AudiofileEncoding {
  MP3 = 'MP3',
  OGG_OPUS = 'OGG_OPUS',
  LINEAR16 = 'LINEAR16'
}

@Entity()
@Index(['article'])
export class Audiofile {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  bucket: string;

  @Column({ nullable: true })
  filename: string;

  @Column({ type: 'decimal', nullable: true, transformer: new ColumnNumericTransformer() })
  length: number; // Length in seconds

  @Column({ nullable: true })
  languageCode: string;

  @Column({ nullable: true, type: 'enum', enum: AudiofileEncoding })
  encoding: AudiofileEncoding;

  // @Column({ nullable: true })
  // voice: string;

  // @Column({ nullable: true })
  // synthesizer: string;

  @Column({ nullable: false, default: 0 })
  partialPlays: number;

  @Column({ nullable: false, default: 0 })
  completedPlays: number;

  @Column({ nullable: true })
  lastPlayedAt: Date;

  @ManyToOne(type => Article, { onDelete: 'CASCADE' }) // On delete of an Article, delete the Audiofile
  article: Article;

  @ManyToOne(type => Voice, { nullable: true, onDelete: 'SET NULL' }) // On delete of an Voices, set this column to null. So the audiofile stays available.
  voice: Voice;

  @ManyToOne(type => User, user => user.audiofiles, { nullable: true, onDelete: 'SET NULL' }) // On delete of a User, keep the Audiofile in the database, but set its userId to "null"
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // https://github.com/typeorm/typeorm/issues/1137#issuecomment-345653493
  @AfterRemove()
  async afterRemove() {
    console.log(`Audiofile entity: AfterRemove(): Deleting audiofile from storage bucket "${this.bucket}" filename "${this.filename}".`);
    await storage.deleteFile(this.filename);
  }
}
