import bcryptjs from 'bcryptjs';
import { IsEmail, IsUUID } from 'class-validator';
import crypto from 'crypto';
import jsonwebtoken from 'jsonwebtoken';
import { AfterInsert, AfterRemove, BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Article } from './article';
import { Audiofile } from './audiofile';
import { PlaylistItem } from './playlist-item';

import { addEmailToMailchimpList, removeEmailToMailchimpList } from '../../mailers/mailchimp';
import { logger } from '../../utils';
import { UserInAppSubscription } from './user-in-app-subscription';
import { UserVoiceSetting } from './user-voice-setting';

const { JWT_SECRET } = process.env;

@Entity()
export class User {

  /**
   * Takes a plain text password and returns a hash using bcryptjs.
   */
  public static hashPassword = (password: string) => {
    return bcryptjs.hash(password, 10);
  }

  /**
   * Creates and reurns a JWT token using a user ID and e-mail address.
   */
  public static generateJWTAccessToken = (id: string, email: string): string => {
    if (!JWT_SECRET) { throw new Error('Please set the JWT_SECRET environment variable.'); }
    return jsonwebtoken.sign({ id, email }, JWT_SECRET);
  }

  public static generateRandomRefreshToken = (): string => {
    return crypto.randomBytes(40).toString('hex');
  }

  public static generateRandomResetPasswordToken = (): string => {
    const length = 6;
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toLocaleUpperCase();
  }

  public static verifyJWTAccessToken = (accessToken: string): object | string => {
    if (!JWT_SECRET) { throw new Error('Please set the JWT_SECRET environment variable.'); }
    return jsonwebtoken.verify(accessToken, JWT_SECRET);
  }

  /**
   * Compares a plain text password with a hashed one. Returns true if they match.
   */
  public static comparePassword = (password: string, hashedPassword: string) => {
    return bcryptjs.compare(password, hashedPassword);
  }

  public static normalizeEmail = (email: string) => {
    return email.toLowerCase();
  }

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  public id: string;

  @Column({ nullable: false, unique: true })
  @IsEmail()
  public email: string;

  @Column({ nullable: false, select: false })
  public password: string;

  @Column('varchar', { length: 6, nullable: true, select: false })
  public resetPasswordToken: string;

  @Column({ nullable: true })
  public authenticatedAt: Date;

  @Column({ nullable: true, select: false })
  public requestResetPasswordAt: Date;

  @Column({ nullable: true, select: false })
  public resetPasswordAt: Date;

  @Column({ nullable: true })
  public activatedAt: Date;

  @OneToMany(type => Article, article => article.user)
  public articles: Article[];

  @OneToMany(type => Audiofile, audiofile => audiofile.user)
  public audiofiles: Audiofile[];

  @OneToMany(type => PlaylistItem, playlistItem => playlistItem.article, { onDelete: 'SET NULL' }) // On delete of a PlaylistItem, don't remove the User
  public playlistItems: PlaylistItem[];

  @OneToMany(type => UserVoiceSetting, userVoiceSetting => userVoiceSetting.user, { eager: true })
  public voiceSettings: UserVoiceSetting[];

  @OneToMany(type => UserInAppSubscription, userInAppSubscription => userInAppSubscription.user)
  public inAppSubscriptions: UserInAppSubscription[];

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @BeforeInsert()
  public lowercaseEmail() {
    this.email = this.email.toLowerCase();
  }

  @AfterInsert()
  public async afterInsert() {
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
  public async afterRemove() {
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
}
