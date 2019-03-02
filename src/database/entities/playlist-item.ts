import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, PrimaryColumn, JoinColumn, Unique, ManyToOne, Index } from 'typeorm';
import { IsUUID, IsInt } from 'class-validator';
import { Playlist } from './playlist';
import { Article } from './article';
import { User } from './user';

@Entity()
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

  @Column({ nullable: false, default: 1 })
  @IsInt()
  order: number;

  @Column({ nullable: true })
  lastPlayedAt: Date;

  @Column({ nullable: true, default: 0 })
  plays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
