import { IsUrl, IsUUID } from 'class-validator';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Article } from './article';
import { User } from './user';
import { Voice } from './voice';

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
  @ManyToOne(type => Article, { onDelete: 'CASCADE' }) // On delete of an Article, delete the Audiofile
  article: Article;

  @ManyToOne(type => Voice, { nullable: true, onDelete: 'SET NULL', eager: true }) // On delete of an Voices, set this column to null. So the audiofile stays available.
  voice: Voice;

  @Index()
  @ManyToOne(type => User, user => user.audiofiles, { nullable: true, onDelete: 'SET NULL' }) // On delete of a User, keep the Audiofile in the database, but set its userId to "null"
  user: User;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
