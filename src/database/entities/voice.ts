import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, Index, OneToMany } from 'typeorm';
import { IsUUID } from 'class-validator';

import { Audiofile } from './audiofile';
import { ColumnNumericTransformer } from '../utils';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NEUTRAL = 'NEUTRAL',
  SSML_VOICE_GENDER_UNSPECIFIED = 'SSML_VOICE_GENDER_UNSPECIFIED'
}

export enum Synthesizer {
  GOOGLE = 'Google',
  AWS = 'AWS'
}

export enum AudioProfile {
  DEFAULT = 'default',
  HEADPHONE = 'headphone-class-device',
  SMARTPHONE = 'handset-class-device',
  SMART_WATCH = 'wearable-class-device',
  SMALL_HOME_SPEAKER = 'small-bluetooth-speaker-class-device',
  SMART_HOME_SPEAKER = 'medium-bluetooth-speaker-class-device',
  LARGE_HOME_ENTERTAINMENT_SYSTEM = 'large-home-entertainment-class-device',
  CAR_SPEAKER = 'large-automotive-class-device',
  INTERACTIVE_VOICE_RESPONSE_SYSTEM = 'telephony-class-application'
}

@Entity()
@Index(['languageCode', 'isActive', 'isPremium'])
export class Voice {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ nullable: false }) // en-US
  languageCode: string;

  @Column({ nullable: false }) // US
  countryCode: string;

  @Column({ nullable: false }) // English
  languageName: string;

  @Column({ nullable: false, unique: true }) // en-US-Wavenet-D
  name: string;

  @Column({ nullable: true }) // John
  label: string;

  @Column({ type: 'enum', enum: Gender, nullable: false }) // MALE or FEMALE
  gender: Gender;

  @Column({ type: 'enum', enum: Synthesizer, nullable: false }) // Google or AWS
  synthesizer: Synthesizer;

  @Column({ type: 'enum', enum: AudioProfile, nullable: false, default: AudioProfile.DEFAULT }) // Default
  audioProfile: AudioProfile;

  @Column({ type: 'decimal', nullable: false, transformer: new ColumnNumericTransformer(), default: 1 })
  speakingRate: number;

  @Column({ type: 'decimal', nullable: false, transformer: new ColumnNumericTransformer(), default: 0 })
  pitch: number;

  @Column({ nullable: true })
  naturalSampleRateHertz: number;

  @Column({ nullable: false, default: false }) // true means it is available for our users, false is unavailable for our users
  isActive: boolean;

  @Column({ nullable: false, default: true }) // Determine if this voice requires a subscription within the app
  isPremium: boolean;

  @Column({ nullable: true }) // A URL to an audiofile with an example
  exampleAudioUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(type => Audiofile, audiofile => audiofile.article, { onDelete: 'NO ACTION', eager: true }) // On delete of a Audiofile, don't remove the voice
  audiofiles: Audiofile[];
}
