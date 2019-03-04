import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, AfterInsert, OneToMany, JoinColumn, AfterRemove, getRepository } from 'typeorm';
import { IsEmail, IsUUID } from 'class-validator';
import { Article } from './article';
import { Audiofile } from './audiofile';
import { Playlist } from './playlist';
import { PlaylistItem } from './playlist-item';
import { addEmailToMailchimpList, removeEmailToMailchimpList } from '../../mailers/mailchimp';

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
    console.log('User @AfterInsert()', `Adding "${this.email}" to Mailchimp list.`);
    await addEmailToMailchimpList(this.email);
  }

  @AfterRemove()
  async afterRemove() {
    console.log('User @AfterRemove()', `Remove "${this.email}" from Mailchimp list.`);
    await removeEmailToMailchimpList(this.email);
  }
}
