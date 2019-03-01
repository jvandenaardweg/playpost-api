import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, AfterInsert, OneToMany, JoinColumn } from 'typeorm';
import { IsEmail, IsDate, IsUUID, IsString } from 'class-validator';
import { Article } from './article';

@Entity()
export class User {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ nullable: false, unique: true })
  @IsEmail()
  email: string;

  @Column({ nullable: false, select: false })
  password: string;

  @Column({ nullable: true })
  onboardedAt: Date;

  @Column({ nullable: true })
  authenticatedAt: Date;

  @Column({ nullable: true })
  activatedAt: Date;

  @OneToMany(type => Article, article => article.user)
  @JoinColumn()
  articles: Article[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterInsert()
  sendWelcomeEmail() {
    console.log('Should send an welcome email to:', this.email);
  }

}