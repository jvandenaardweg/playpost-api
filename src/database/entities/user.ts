import bcryptjs from 'bcryptjs';
import { IsDate, IsEmail, IsUUID, Length } from 'class-validator';
import crypto from 'crypto';
import jsonwebtoken from 'jsonwebtoken';
import { AfterRemove, BeforeInsert, Column, CreateDateColumn, Entity, Index, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Article } from './article';
import { Audiofile } from './audiofile';
import { PlaylistItem } from './playlist-item';

import * as AWSSes from '../../mailers/aws-ses';
import { removeEmailToMailchimpList } from '../../mailers/mailchimp';
import { logger } from '../../utils';
import { ApiKey } from './api-key';
import { Organization } from './organization';
import { Publication } from './publication';
import { UserInAppSubscriptionApple } from './user-in-app-subscription-apple';
import { UserInAppSubscriptionGoogle } from './user-in-app-subscriptions-google';
import { UserVoiceSetting } from './user-voice-setting';

const { JWT_SECRET } = process.env;

@Entity()
export class User {

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
    if (!JWT_SECRET) { throw new Error('Please set the JWT_SECRET environment variable.'); }
    return jsonwebtoken.sign({ id, email }, JWT_SECRET);
  }

  static generateRandomRefreshToken = (): string => {
    return crypto.randomBytes(40).toString('hex');
  }

  static generateRandomActivationToken = (): string => {
    const length = 32;
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  static generateRandomResetPasswordToken = (): string => {
    const length = 32;
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  static generateRandomResetPasswordTokenMobileApp = (): string => {
    const length = 6;
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toLocaleUpperCase();
  }

  static verifyJWTAccessToken = (accessToken: string): object | string => {
    if (!JWT_SECRET) { throw new Error('Please set the JWT_SECRET environment variable.'); }
    return jsonwebtoken.verify(accessToken, JWT_SECRET);
  }

  static sendActivationEmail = (activationToken: string, email: string) => {
    const htmlBody = `
      <h1>Activate your account</h1>
      <p>You are one step away from an activated Playpost account. Just follow the link below to activate your account.</p>
      <a href="${process.env.PUBLISHERS_BASE_URL}/auth/activate/${activationToken}">Activate account</a>
      <p>Need more help? E-mail us at info@playpost.app or reply to this e-mail. We are happy to help you!</p>
    `;

    // Send e-mail using AWS SES
    return AWSSes.sendTransactionalEmail(email, 'Activate your Playpost account', htmlBody);
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

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Index()
  @Column({ nullable: false, unique: true })
  @IsEmail()
  email: string;

  @Column({ nullable: false, select: false })
  password: string;

  @Column('varchar', { length: 32, nullable: true, select: false })
  @Length(6, 32) // To have resetPasswordToken backwards compatible, make sure we also allow 6 characters for in our mobile app
  resetPasswordToken: string;

  @Column('varchar', { length: 32, nullable: true, select: false })
  @Length(32)
  activationToken: string;

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

  @OneToMany(type => ApiKey, apiKey => apiKey.user)
  apiKeys: ApiKey[];

  @OneToMany(type => PlaylistItem, playlistItem => playlistItem.article, { onDelete: 'SET NULL' }) // On delete of a PlaylistItem, don't remove the User
  playlistItems: PlaylistItem[];

  @OneToMany(type => UserVoiceSetting, userVoiceSetting => userVoiceSetting.user)
  voiceSettings: UserVoiceSetting[];

  @OneToMany(type => UserInAppSubscriptionApple, userInAppSubscription => userInAppSubscription.user)
  inAppSubscriptions: UserInAppSubscriptionApple[];

  @OneToMany(type => UserInAppSubscriptionGoogle, inAppSubscriptionsGoogle => inAppSubscriptionsGoogle.user)
  inAppSubscriptionsGoogle: UserInAppSubscriptionGoogle[];

  // A User can be part of one Organization
  // A User can exist without an Organization (nullable: true)
  // On delete of an Organization, do not delete the User, but set it to SET NULL
  // Use cascade: ['insert'] to automatically insert and attach a new Organization to a new User
  @ManyToMany(type => Organization, { onDelete: 'CASCADE', cascade: ['insert'] })
  organizations: Organization[];

  // A User can have access to multiple Publications
  // When a Publication is deleted, also Delete it's User in the join table (CASCADE)
  @ManyToMany(type => Publication, { onDelete: 'CASCADE' })
  publications: Publication[];

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;

  @BeforeInsert()
  beforeInsert() {
    this.email = User.normalizeEmail(this.email);
    this.activationToken = User.generateRandomActivationToken();
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
}
