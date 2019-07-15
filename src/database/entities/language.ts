import { IsDate, IsUUID } from 'class-validator';
import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Article } from './article';
import { Voice } from './voice';

@Entity()
@Unique(['name', 'code']) // Only one unique code and name combination
@Index(['code', 'isActive'])
export class Language {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  public id: string;

  @Column()
  public name: string; // French

  @Column({ nullable: true })
  public nativeName: string; // French => Français

  @Column()
  public code: string; // fr, en, de, nl...

  @Column({ default: false })
  public isActive: boolean; // to allow languages to be displayed or not

  @OneToMany(type => Voice, voice => voice.language, { onDelete: 'NO ACTION' }) // On delete of a Voice, do nothing, so don't delete the language
  public voices: Voice[];

  @OneToMany(type => Article, article => article.language, { onDelete: 'NO ACTION' }) // On delete of a Article, do nothing, so don't delete the language
  public articles: Article[];

  @CreateDateColumn()
  @IsDate()
  public createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  public updatedAt: Date;
}
