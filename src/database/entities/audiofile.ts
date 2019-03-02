import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, JoinColumn, ManyToOne, Index, AfterRemove, BeforeInsert } from 'typeorm';
import { IsUUID } from 'class-validator';
import { Article } from './article';
import { User } from './user';
import * as storage from '../../storage/google-cloud';

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

  @Column({ type: 'decimal', nullable: true })
  lengthInSeconds: number;

  @Column({ nullable: true })
  languageCode: string;

  @Column({ nullable: true })
  encoding: string;

  @Column({ nullable: true })
  voice: string;

  @Column({ nullable: true })
  synthesizer: string;

  @Column({ nullable: false, default: 0 })
  partialPlays: number;

  @Column({ nullable: false, default: 0 })
  completedPlays: number;

  @Column({ nullable: true })
  lastPlayedAt: Date;

  @ManyToOne(type => Article, { onDelete: 'CASCADE', primary: true }) // On delete of an Article, delete the Audiofile
  @JoinColumn()
  article: Article;

  @ManyToOne(type => User, user => user.audiofiles, { nullable: true, onDelete: 'SET NULL' }) // On delete of a User, keep the Article in the database, but set its value to "null"
  @JoinColumn()
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
