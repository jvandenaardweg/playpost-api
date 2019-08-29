import { IsDate, IsInt, IsUUID } from 'class-validator';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Article } from './article';
import { User } from './user';

@Entity({ orderBy: {
  order: 'ASC'
}})
@Unique(['article', 'user']) // Don't allow articles that are already in the user's playlist
export class PlaylistItem {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Index()
  @ManyToOne(type => Article, { onDelete: 'CASCADE', eager: true }) // When an Article is deleted, we delete this PlaylistItem
  article: Article;

  @Index()
  @ManyToOne(type => User, { onDelete: 'CASCADE' }) // When an User is deleted, we delete this PlaylistItem
  user: User;

  @Index()
  @Column({ nullable: false, default: 0 })
  @IsInt()
  order: number;

  @Column({ nullable: true })
  @IsDate()
  lastPlayedAt: Date;

  @Index()
  @Column({ nullable: true })
  @IsDate()
  archivedAt: Date;

  @Index()
  @Column({ nullable: true })
  @IsDate()
  favoritedAt: Date;

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;
}
