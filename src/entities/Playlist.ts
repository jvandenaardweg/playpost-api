import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { IsUUID } from 'class-validator';
import { User } from './User';
import { PlaylistItem } from './Playlist-item';

@Entity()
export class Playlist {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @OneToOne(type => User)
  @JoinColumn()
  user: User;

  @Column({ nullable: false, default: 'main' })
  name: string;

  @OneToMany(type => PlaylistItem, playlistItem => playlistItem.article)
  @JoinColumn()
  articles: PlaylistItem[];

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
