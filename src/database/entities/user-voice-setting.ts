import { IsDate, IsUUID } from 'class-validator';
import { CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Language } from './language';
import { User } from './user';
import { Voice } from './voice';

@Entity()
@Unique(['user', 'language']) // Only one setting per language
@Index(['user', 'language', 'voice'])
export class UserVoiceSetting {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  public id: string;

  @ManyToOne(type => User, { onDelete: 'CASCADE' }) // When an User is deleted, we delete this user voice setting
  public user: User;

  @ManyToOne(type => Voice, { onDelete: 'CASCADE', eager: true }) // When an Voice is deleted, we delete this user voice setting
  public voice: Voice;

  @ManyToOne(type => Language, { onDelete: 'CASCADE', eager: true }) // When an Language is deleted, we delete this voice setting
  public language: Language;

  @CreateDateColumn()
  @IsDate()
  public createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  public updatedAt: Date;
}
