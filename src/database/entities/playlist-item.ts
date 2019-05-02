import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, Unique, ManyToOne, Index } from 'typeorm';
import { IsUUID, IsInt, IsDate } from 'class-validator';
import { Playlist } from './playlist';
import { Article } from './article';
import { User } from './user';

@Entity({ orderBy: {
  order: 'ASC'
}})
@Unique(['playlist', 'article']) // Don't allow articles that are already in the user's playlist
@Index(['user'])
export class PlaylistItem {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @ManyToOne(type => Playlist, { onDelete: 'CASCADE' }) // When a Playlist is deleted, we delete this PlaylistItem
  playlist: Playlist;

  @ManyToOne(type => Article, { onDelete: 'CASCADE', eager: true }) // When an Article is deleted, we delete this PlaylistItem
  article: Article;

  @ManyToOne(type => User, { onDelete: 'CASCADE' }) // When an User is deleted, we delete this PlaylistItem
  user: User;

  @Column({ nullable: false, default: 0 })
  @IsInt()
  order: number;

  @Column({ nullable: true })
  @IsDate()
  lastPlayedAt: Date;

  @Column({ nullable: true })
  @IsDate()
  archivedAt: Date;

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
