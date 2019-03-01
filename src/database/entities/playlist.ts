import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { IsUUID } from 'class-validator';
import { User } from './user';
import { PlaylistItem } from './playlist-item';

@Entity()
export class Playlist extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @ManyToOne(type => User, { nullable: false, onDelete: 'CASCADE' }) // When a User is deleted, we delete their Playlist
  @JoinColumn()
  user: User;

  @Column({ nullable: false, default: 'Main' })
  name: string;

  @OneToMany(type => PlaylistItem, playlistItem => playlistItem.article)
  @JoinColumn()
  articles: PlaylistItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // static async updatePlaylistItemPlays(id: string): Promise<PlaylistItem> {
  //   const currentPlaylistItem = await this.findOne({ id }, { relations: ['playlist_items'] } )

  //   PlaylistItem.findOne({ id }, re);

  //   const updatedPlays = currentPlaylistItem.plays + 1;

  //   return this.update(currentPlaylistItem.id, {
  //     plays: currentPlaylistItem.plays + 1,
  //     lastPlayedAt: new Date()
  //   })
  // }

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
