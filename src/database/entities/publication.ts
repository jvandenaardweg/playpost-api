import { IsDate, IsUrl, IsUUID, Length } from 'class-validator';
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Article } from './article';
import { Organization } from './organization';
import { User } from './user';

@Entity()
export class Publication {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column('varchar', { length: 50 })
  @Length(1, 50)
  name: string; // Playpost's Blog

  @Column('varchar', { length: 100, nullable: true })
  @Length(1, 100)
  @IsUrl()
  url?: string; // https://blog.playpost.app

  // A Publication belongs to an Organization
  // Multiple Publications can belong to an Organization
  // On delete of an Organization, delete it's Publication's (CASCADE)
  // A Publication MUST be part of an Organization (nullable: false)
  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  organization?: Organization;

  // A Publication is owner of multiple Article's
  // On delete of an Article, do nothing
  @OneToMany(type => Article, article => article.publication, { onDelete: 'NO ACTION' })
  articles?: Article[];

  // On delete of a User, remove his right to view this Publication (CASCADE)
  @ManyToMany(type => User, user => user.publications, { onDelete: 'CASCADE', cascade: ['insert'] })
  @JoinTable()
  users?: User[];

  @CreateDateColumn({ select: false })
  @IsDate()
  createdAt?: Date;

  @UpdateDateColumn({ select: false })
  @IsDate()
  updatedAt?: Date;
}
