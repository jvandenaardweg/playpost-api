import { IsDate, IsUUID } from 'class-validator';
import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Article } from './article';
import { User } from './user';

@Entity()
export class Publisher {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ length: 50 })
  name: string; // Playpost

  // A Publisher is owner of multiple Article's
  @OneToMany(type => Article, article => article.publisher)
  articles: Article[];

  // A Publisher is owned by a User
  // A Publisher can only have one User
  // A User can only have on Publisher
  @OneToOne(type => User, user => user.publisher)
  user: User;

  @CreateDateColumn({ select: false })
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  @IsDate()
  updatedAt: Date;
}
