import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, JoinColumn, ManyToOne, Index, AfterRemove } from 'typeorm';
import { IsUUID } from 'class-validator';
import { Article } from './article';

@Entity()
@Index(['article'])
export class Audiofile {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ nullable: false })
  url: string;

  @Column({ nullable: false })
  bucket: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  length: number;

  @Column({ nullable: false })
  languageCode: string;

  @Column({ nullable: false })
  encoding: string;

  @Column({ nullable: false })
  voice: string;

  @Column({ nullable: false })
  synthesizer: string;

  @Column({ nullable: false, default: 0 })
  partialPlays: number;

  @Column({ nullable: false, default: 0 })
  completedPlays: number;

  @Column({ nullable: true })
  lastPlayedAt: Date;

  @ManyToOne(type => Article, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  article: Article;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // https://github.com/typeorm/typeorm/issues/1137#issuecomment-345653493
  @AfterRemove()
  afterRemove() {
    console.log('Should delete the audiofile from storage:', this.bucket, this.name);
  }

}
