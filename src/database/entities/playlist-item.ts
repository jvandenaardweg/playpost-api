import { IsDate, IsInt, IsUUID } from 'class-validator';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Article } from './article';
import { User } from './user';

@Entity({ orderBy: {
  order: 'ASC'
}})
@Unique(['article', 'user']) // Don't allow articles that are already in the user's playlist
@Index(['user', 'article', 'favoritedAt', 'archivedAt', 'order'])
export class PlaylistItem {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  public id: string;

  @ManyToOne(type => Article, { onDelete: 'CASCADE', eager: true }) // When an Article is deleted, we delete this PlaylistItem
  public article: Article;

  @ManyToOne(type => User, { onDelete: 'CASCADE' }) // When an User is deleted, we delete this PlaylistItem
  public user: User;

  @Column({ nullable: false, default: 0 })
  @IsInt()
  public order: number;

  @Column({ nullable: true })
  @IsDate()
  public lastPlayedAt: Date;

  @Column({ nullable: true })
  @IsDate()
  public archivedAt: Date;

  @Column({ nullable: true })
  @IsDate()
  public favoritedAt: Date;

  @CreateDateColumn()
  @IsDate()
  public createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  public updatedAt: Date;
}
