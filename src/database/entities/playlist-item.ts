import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, PrimaryColumn, JoinColumn, Unique, ManyToOne } from 'typeorm';
import { IsUUID, IsInt } from 'class-validator';
import { Playlist } from './playlist';
import { Article } from './article';
import { User } from './user';

@Entity()
@Unique(['playlist', 'article']) // Don't allow articles that are already in the user's playlist
export class PlaylistItem {

  @ManyToOne(type => Playlist, { onDelete: 'CASCADE', primary: true }) // When a Playlist is deleted, we delete this PlaylistItem
  @JoinColumn({ name: 'playlistId' })
  playlist: Playlist;

  @ManyToOne(type => Article, { onDelete: 'CASCADE', primary: true, eager: true }) // When an Article is deleted, we delete this PlaylistItem
  @JoinColumn({ name: 'articleId' })
  article: Article;

  @ManyToOne(type => User, { onDelete: 'CASCADE', primary: true }) // When an User is deleted, we delete this PlaylistItem
  @JoinColumn({ name: 'userId' })
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
