import { IsUUID } from 'class-validator';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

import { ColumnNumericTransformer } from '../utils';
import { Audiofile } from './audiofile';
import { Language } from './language';

export enum EVoiceGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NEUTRAL = 'NEUTRAL',
  SSML_VOICE_GENDER_UNSPECIFIED = 'SSML_VOICE_GENDER_UNSPECIFIED'
}

export enum EVoiceSynthesizer {
  GOOGLE = 'Google',
  AWS = 'AWS',
  MICROSOFT = 'Microsoft'
}

export enum EVoiceQuality {
  NORMAL = 'Normal', // AWS Polly, Microsoft Standard
  HIGH = 'High', // Google Standard, AWS Polly (Neural), Microsoft Neural
  VERY_HIGH = 'Very High' // Google WaveNet
}

export enum EVoiceAudioProfile {
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
@Unique(['isLanguageDefault', 'languageCode'])
@Unique(['languageCode', 'label'])
@Index(['languageCode', 'isActive', 'isPremium', 'isHighestQuality', 'quality'])
export class Voice {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ nullable: false }) // en-US
  languageCode: string;

  @Column({ nullable: false }) // US
  countryCode: string;

  @Column({ nullable: false, unique: true }) // en-US-Wavenet-D
  name: string;

  @Column({ nullable: false }) // John
  label: string;

  @Column({ type: 'enum', enum: EVoiceGender, nullable: false }) // MALE or FEMALE
  gender: EVoiceGender;

  @Column({ type: 'enum', enum: EVoiceSynthesizer, nullable: false }) // Google or AWS
  synthesizer: EVoiceSynthesizer;

  @Column({ type: 'enum', enum: EVoiceQuality, nullable: false, default: EVoiceQuality.NORMAL }) // Default is "Normal" (lowest quality)
  quality: EVoiceQuality;

  @Column({ type: 'enum', enum: EVoiceAudioProfile, nullable: false, default: EVoiceAudioProfile.DEFAULT }) // Default
  audioProfile: EVoiceAudioProfile;

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

  @Column({ nullable: false, default: false }) // Google's Wavenet are high quality
  isHighestQuality: boolean;

  @Column({ nullable: true }) // Determine if this voice is the default for the language
  isLanguageDefault: boolean;

  @Column({ nullable: true }) // A URL to an audiofile with an example
  exampleAudioUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(type => Audiofile, audiofile => audiofile.voice, { onDelete: 'NO ACTION' }) // On delete of a Audiofile, don't remove the voice
  audiofiles: Audiofile[];

  @ManyToOne(type => Language, { nullable: true, onDelete: 'RESTRICT', eager: true })
  // On delete of an Language, restrict the deletion if there's a voice using that language.
  // eager: true is needed so our app can determine the correct language for a voice
  language: Language;
}
