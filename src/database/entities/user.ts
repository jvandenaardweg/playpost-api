import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, AfterInsert, OneToMany, JoinColumn, AfterRemove } from 'typeorm';
import { IsEmail, IsUUID } from 'class-validator';

import { Article } from './article';
import { Audiofile } from './audiofile';
import { PlaylistItem } from './playlist-item';

import { redisClientPub } from '../../cache';
import { logger } from '../../utils';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterInsert()
  async afterInsert() {
    // Don't add our integration test account to Mailchimp
    if (!this.email.includes('integrationtest-1337')) {
      logger.info('Database Entity (User):', '@AfterInsert():', `Adding "${this.email}" to Mailchimp list.`);
      redisClientPub.publish('ADD_TO_MAILCHIMP_LIST', this.email);
    }
  }

  @AfterRemove()
  async afterRemove() {
    // Do not run for our integration test user
    if (!this.email.includes('integrationtest-1337')) {
      logger.info('Database Entity (User):', '@AfterRemove():', `Remove "${this.email}" from Mailchimp list.`);
      redisClientPub.publish('REMOVE_FROM_MAILCHIMP_LIST', this.email);
    }
  }
}
