import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, OneToOne, JoinColumn, Unique, ManyToOne } from 'typeorm';
import { IsUUID, IsInt } from 'class-validator';
import { Playlist } from './playlist';
import { Article } from './article';

@Entity()
@Unique(['playlist', 'article']) // Don't allow articles that are already in the user's playlist
export class PlaylistItem {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @ManyToOne(type => Playlist, { onDelete: 'CASCADE' }) // When a Playlist is deleted, we delete this PlaylistItem
  @JoinColumn()
  playlist: Playlist;

  @OneToOne(type => Article, { onDelete: 'CASCADE' }) // When an Article is deleted, we delete this PlaylistItem
  @JoinColumn()
  article: Article;

  @Column({ nullable: false })
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
