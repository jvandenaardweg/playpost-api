import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, AfterInsert, OneToMany, AfterRemove, BeforeInsert } from 'typeorm';
import { IsEmail, IsUUID } from 'class-validator';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import crypto from 'crypto';

import { Article } from './article';
import { Audiofile } from './audiofile';
import { PlaylistItem } from './playlist-item';

import { logger } from '../../utils';
import { UserVoiceSetting } from './user-voice-setting';
import { removeEmailToMailchimpList, addEmailToMailchimpList } from '../../mailers/mailchimp';
import { UserInAppSubscription } from './user-in-app-subscription';

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

  @Column('varchar', { length: 6, nullable: true, select: false })
  resetPasswordToken: string;

  @Column({ nullable: true })
  authenticatedAt: Date;

  @Column({ nullable: true, select: false })
  requestResetPasswordAt: Date;

  @Column({ nullable: true, select: false })
  resetPasswordAt: Date;

  @Column({ nullable: true })
  activatedAt: Date;

  @OneToMany(type => Article, article => article.user)
  articles: Article[];

  @OneToMany(type => Audiofile, audiofile => audiofile.user)
  audiofiles: Audiofile[];

  @OneToMany(type => PlaylistItem, playlistItem => playlistItem.article, { onDelete: 'SET NULL' }) // On delete of a PlaylistItem, don't remove the User
  playlistItems: PlaylistItem[];

  @OneToMany(type => UserVoiceSetting, userVoiceSetting => userVoiceSetting.user, { eager: true })
  voiceSettings: UserVoiceSetting[];

  @OneToMany(type => UserInAppSubscription, userInAppSubscription => userInAppSubscription.user)
  inAppSubscriptions: UserInAppSubscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  lowercaseEmail() {
    this.email = this.email.toLowerCase();
  }

  @AfterInsert()
  async afterInsert() {
    const loggerPrefix = 'Database Entity (User): @AfterInsert():';

    // Don't add our integration test account to Mailchimp
    if (!this.email.includes('integrationtest-1337')) {
      try {
        logger.info(loggerPrefix, `Adding "${this.email}" to Mailchimp list.`);
        await addEmailToMailchimpList(this.email);
      } catch (err) {
        logger.error(loggerPrefix, `Failed to add ${this.email} to Mailchimp list.`, err);
        throw err;
      }
    }
  }

  @AfterRemove()
  async afterRemove() {
    const loggerPrefix = 'Database Entity (User): @AfterRemove():';

    // Do not run for our integration test user
    if (!this.email.includes('integrationtest-1337')) {
      try {
        logger.info(loggerPrefix, `Removing "${this.email}" from Mailchimp list.`);
        await removeEmailToMailchimpList(this.email);
      } catch (err) {
        logger.error(loggerPrefix, `Failed to remove ${this.email} from Mailchimp list.`, err);
        throw err;
      }
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
  static generateJWTAccessToken = (id: string, email: string): string => {
    if (!JWT_SECRET) throw new Error('Please set the JWT_SECRET environment variable.');
    return jsonwebtoken.sign({ id, email }, JWT_SECRET);
  }

  static generateRandomRefreshToken = (): string => {
    return crypto.randomBytes(40).toString('hex');
  }

  static generateRandomResetPasswordToken = (): string => {
    const length = 6;
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toLocaleUpperCase();
  }

  static verifyJWTAccessToken = (accessToken: string): object | string => {
    if (!JWT_SECRET) throw new Error('Please set the JWT_SECRET environment variable.');
    return jsonwebtoken.verify(accessToken, JWT_SECRET);
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
