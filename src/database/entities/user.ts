import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, AfterInsert, OneToMany, JoinColumn, AfterRemove, BeforeInsert } from 'typeorm';
import { IsEmail, IsUUID } from 'class-validator';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';

import { Article } from './article';
import { Audiofile } from './audiofile';
import { PlaylistItem } from './playlist-item';

import { redisClientPub } from '../../cache';
import { logger } from '../../utils';
import { UserVoiceSetting } from './user-voice-setting';

const { JWT_SECRET } = process.env;

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

  @OneToMany(type => UserVoiceSetting, userVoiceSetting => userVoiceSetting.user, { eager: true })
  @JoinColumn()
  voiceSettings: UserVoiceSetting[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  lowercaseEmail() {
    this.email =  this.email.toLowerCase();
  }

  @AfterInsert()
  afterInsert() {
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

  /**
   * Takes a plain text password and returns a hash using bcryptjs.
   */
  static hashPassword = (password: string) => {
    return bcryptjs.hash(password, 10);
  }

  /**
   * Creates and reurns a JWT token using a user ID and e-mail address.
   */
  static generateJWTToken = (id: string): string => {
    if (!JWT_SECRET) throw new Error('Please set the JWT_SECRET environment variable.');
    return jsonwebtoken.sign({ id }, JWT_SECRET);
  }

  /**
  * Compares a plain text password with a hashed one. Returns true if they match.
  */
  static comparePassword = (password: string, hashedPassword: string) => {
    return bcryptjs.compare(password, hashedPassword);
  }

  static normalizeEmail = (email: string) => {
    return email.toLowerCase();
  }
}
