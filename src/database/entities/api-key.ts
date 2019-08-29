import { IsDate, IsIP, IsUUID } from 'class-validator';
import crypto from 'crypto';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user';

/**
 * Entity for API keys.
 *
 * API keys are used to allow users to interact with the API
 */
@Entity()
export class ApiKey {

  /**
   * Generates an API key for the user with a fixed length.
   */
  static generateApiKey = (): string => {
    const length = 64;
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  static generateApiSecret = (): string => {
    const length = 64;
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  static generateApiKeySignature = (apiKey: string, apiSecret: string): string => {
    return crypto.createHmac('sha256', apiSecret).update(apiKey).digest('hex')
  }

  static isValidSignature = (apiKey: string, apiSecret: string, storedSignature: string): boolean => {
    const generateApiKeySignature = ApiKey.generateApiKeySignature(apiKey, apiSecret);
    return generateApiKeySignature === storedSignature;
  }

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  // Optional label the user can choose to keep his keys organized
  @Column({ nullable: true })
  label: string;

  @Index()
  @Column({ nullable: false, unique: true })
  key: string;

  // A hash generated with the API Key and API Secret
  // Both API Key and API Secret is needed to compare the signature
  @Index()
  @Column({ nullable: false, unique: true, select: false })
  signature: string;

  // A key belongs to a user
  // A user can have multiple keys
  // When a user is deleted, delete his keys
  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  user: User;

  // The last date the key was used
  // For security purposes
  @Column({ nullable: true })
  @IsDate()
  lastUsedAt: Date;

  // The IP address where the usage from the API key originates from
  // For security purposes
  @Column({ nullable: true })
  @IsIP()
  lastUsedIpAddress: string;

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;

}
