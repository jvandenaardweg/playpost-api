import { IsDate, IsUUID } from 'class-validator';
import { Column, CreateDateColumn, Entity, Index, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Article } from './article';
import { Country } from './country';
import { Voice } from './voice';

@Entity()
@Unique(['name', 'code']) // Only one unique code and name combination
export class Language {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column()
  name: string; // French

  @Column({ nullable: true })
  nativeName?: string; // French => Français

  @Index()
  @Column()
  code: string; // fr, en, de, nl...

  @Column({ default: false })
  rightToLeft: boolean; // like Arabic reads from "right to left"

  @Index()
  @Column({ default: false })
  isActive: boolean; // to allow languages to be displayed or not

  @OneToMany(type => Voice, voice => voice.language, { onDelete: 'NO ACTION' }) // On delete of a Voice, do nothing, so don't delete the language
  voices: Voice[];

  @OneToMany(type => Article, article => article.language, { onDelete: 'NO ACTION' }) // On delete of a Article, do nothing, so don't delete the language
  articles: Article[];

  @ManyToMany(type => Country, country => country.languages, { onDelete: 'RESTRICT' }) // On delete of a Article, do nothing, so don't delete the language
  @JoinTable({ name: 'language_countries' })
  countries: Country[];

  @CreateDateColumn({ select: false })
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  @IsDate()
  updatedAt: Date;
}
