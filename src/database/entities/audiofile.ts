import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, JoinColumn, ManyToOne, Index, AfterRemove, BeforeInsert } from 'typeorm';
import { IsUUID } from 'class-validator';
import { Article } from './article';

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
  name: string;

  @Column({ nullable: true })
  length: number;

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

  @BeforeInsert()
  async beforeInsert() {
    console.log(`Should generate an audiofile using audiofileId "${this.id}", articleId "${this.article.id}", synthesizer "${this.synthesizer}" and voice "${this.voice}."`);
    console.log(`Should upload the audiofile to storage using audiofileId "${this.id}", articleId "${this.article.id}" and the metadata of the article.`);

    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(this), 50000); // wait 5 seconds to simulate an upload
    });
  }

}

/*

[articleId]/[audiofileId].mp3

23123-123123-21312/12323-23543-7685.mp3
*/
