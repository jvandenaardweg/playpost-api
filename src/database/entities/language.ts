import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, Unique, Index, OneToMany } from 'typeorm';
import { IsUUID, IsDate } from 'class-validator';
import { Voice } from './voice';
import { Article } from './article';
import { Audiofile } from './audiofile';

@Entity()
@Unique(['name', 'languageCode']) // Only one unique languageCode and name combination
@Index(['languageCode', 'isActive'])
export class Language {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column()
  name: string; // French

  @Column({ nullable: true })
  nativeName: string; // French => Français

  @Column()
  languageCode: string; // fr, en, de, nl...

  @Column({ default: false })
  isActive: boolean; // to allow languages to be displayed or not

  @OneToMany(type => Voice, voice => voice.language, { onDelete: 'NO ACTION' }) // On delete of a Voice, do nothing, so don't delete the language
  voices: Voice[];

  @OneToMany(type => Article, article => article.language, { onDelete: 'NO ACTION' }) // On delete of a Article, do nothing, so don't delete the language
  articles: Article[];

  @OneToMany(type => Audiofile, audiofile => audiofile.language, { onDelete: 'NO ACTION' }) // On delete of a Audiofile, do nothing, so don't delete the language
  audiofiles: Audiofile[];

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;
}
