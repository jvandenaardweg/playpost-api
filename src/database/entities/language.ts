import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, Unique, Index, OneToMany } from 'typeorm';
import { IsUUID, IsDate } from 'class-validator';
import { Voice } from './voice';
import { Article } from './article';

@Entity()
@Unique(['name', 'code']) // Only one unique code and name combination
@Index(['code', 'isActive'])
export class Language {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column()
  name: string; // French

  @Column({ nullable: true })
  nativeName: string; // French => Français

  @Column()
  code: string; // fr, en, de, nl...

  @Column({ default: false })
  isActive: boolean; // to allow languages to be displayed or not

  @OneToMany(type => Voice, voice => voice.language, { onDelete: 'NO ACTION' }) // On delete of a Voice, do nothing, so don't delete the language
  voices: Voice[];

  @OneToMany(type => Article, article => article.language, { onDelete: 'NO ACTION' }) // On delete of a Article, do nothing, so don't delete the language
  articles: Article[];

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;
}
