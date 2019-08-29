import { IsDate, IsUUID } from 'class-validator';
import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Language } from './language';

@Entity()
export class Country {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column()
  name: string; // Netherlands

  @Column({ unique: true })
  code: string; // NL

  @Column()
  nativeName: string; // Nederland

  @Column()
  continent: string; // EU, AS, US

  @Column()
  currency: string; // EUR, USD

  @ManyToMany(type => Language, { onDelete: 'RESTRICT', cascade: true })
  // @JoinTable()
  // On delete of an Language, restrict the deletion if there's a voice using that language.
  // eager: true is needed so our app can determine the correct language for a voice
  languages: Language[]; // A country can have multiple languages

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;
}
