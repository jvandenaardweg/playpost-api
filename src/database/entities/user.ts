import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, AfterInsert, OneToMany, JoinColumn, BeforeInsert, BeforeUpdate, getRepository } from 'typeorm';
import { IsEmail, IsDate, IsUUID, IsString } from 'class-validator';
import { Article } from './article';
import bcryptjs from 'bcryptjs';
import { Audiofile } from './audiofile';
import { Playlist } from './playlist';
import { PlaylistItem } from './playlist-item';

@Entity()
export class User {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ nullable: false, unique: true })
  @IsEmail()
  email: string;

  @Column({ nullable: false, select: false })
  password: string;

  @Column({ nullable: true })
  onboardedAt: Date;

  @Column({ nullable: true })
  authenticatedAt: Date;

  @Column({ nullable: true })
  activatedAt: Date;

  @OneToMany(type => Article, article => article.user)
  @JoinColumn()
  articles: Article[];

  @OneToMany(type => Audiofile, audiofile => audiofile.user)
  @JoinColumn()
  audiofiles: Audiofile[];

  @OneToMany(type => PlaylistItem, playlistItem => playlistItem.article, { onDelete: 'SET NULL' }) // On delete of a PlaylistItem, don't remove the User
  @JoinColumn()
  playlistItems: PlaylistItem[];

  @OneToMany(type => Playlist, playlist => playlist.user)
  @JoinColumn()
  playlists: Playlist[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterInsert()
  async afterInsert() {
    console.log('Should send an welcome email to:', this.email);

    // console.log(`Should create an empty playlist for user ID "${this.id}".`);
    // const playlistToCreate = await getRepository(Playlist).create({
    //   user: {
    //     id: this.id
    //   }
    // });

    // const createdPlaylist = await getRepository(Playlist).save(playlistToCreate);

    // return createdPlaylist;
  }
}
