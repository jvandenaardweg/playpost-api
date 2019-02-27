import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, OneToOne, JoinColumn, Unique, ManyToOne } from 'typeorm';
import { IsUUID, IsInt } from 'class-validator';
import { Playlist } from './Playlist';
import { Article } from './Article';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}
/*

type Playlist {
  user: User! @relation(name: "UserToPlaylist")
  article: Article! @relation(name: "ArticleToPlaylist")
  order: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

*/
