import { IsUUID } from 'class-validator';
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
@Index(['article', 'user', 'createdAt'])
export class Audiofile {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  public id: string;

  @Column({ nullable: true })
  public url: string;

  @Column({ nullable: true })
  public bucket: string;

  @Column({ nullable: true })
  public filename: string;

  @Column({ type: 'decimal', nullable: true, transformer: new ColumnNumericTransformer() })
  public length: number; // Length in seconds

  @Column({ nullable: false, type: 'enum', enum: AudiofileMimeType, default: AudiofileMimeType.MP3 })
  public mimeType: AudiofileMimeType;

  @ManyToOne(type => Article, { onDelete: 'CASCADE' }) // On delete of an Article, delete the Audiofile
  public article: Article;

  @ManyToOne(type => Voice, { nullable: true, onDelete: 'SET NULL', eager: true }) // On delete of an Voices, set this column to null. So the audiofile stays available.
  public voice: Voice;

  @ManyToOne(type => User, user => user.audiofiles, { nullable: true, onDelete: 'SET NULL' }) // On delete of a User, keep the Audiofile in the database, but set its userId to "null"
  public user: User;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
