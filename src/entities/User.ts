import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, AfterInsert } from 'typeorm';
import { IsEmail, IsDate, IsUUID } from 'class-validator';

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
  @IsDate()
  onboardedAt: Date;

  @Column({ nullable: true })
  @IsDate()
  authenticatedAt: Date;

  @Column({ nullable: true })
  @IsDate()
  activatedAt: Date;

  @CreateDateColumn({ nullable: false })
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;

  @AfterInsert()
  sendWelcomeEmail() {
    console.log('Should send an welcome email to:', this.email);
  }

}
