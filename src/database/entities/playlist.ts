import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Unique } from 'typeorm';
import { IsUUID } from 'class-validator';
import joi from 'joi';
import { User } from './user';
import { PlaylistItem } from './playlist-item';

export const playlistInputValidationSchema = joi.object().keys({
  userId: joi.string().uuid(),
  playlistId: joi.string().uuid(),
  articleId: joi.string().uuid(),
  name: joi.string(),
  articleUrl: joi.string().uri()
});

@Entity()
@Unique(['name', 'user']) // Don't allow playlist with the same name for the same user
export class Playlist extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @ManyToOne(type => User, { nullable: false, onDelete: 'CASCADE' }) // When a User is deleted, we delete their Playlist
  @JoinColumn()
  user: User;

  @Column({ nullable: false, default: 'Default' })
  name: string;

  @OneToMany(type => PlaylistItem, playlistItem => playlistItem.playlist, { eager: true })
  // @JoinTable()
  playlistItems: PlaylistItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // static async updatePlaylistItemPlays(id: string): Promise<PlaylistItem> {
  //   const currentPlaylistItem = await this.findOne(id, { relations: ['playlist_items'] } )

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
