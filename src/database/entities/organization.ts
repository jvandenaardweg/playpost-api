import { IsDate, IsUUID, Length } from 'class-validator';
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from './customer';
import { Publication } from './publication';
import { User } from './user';

@Entity()
export class Organization {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column('varchar', { length: 50 })
  @Length(1, 50)
  name: string; // Playpost

  // Restrict deletion of an Organization when a User is deleted
  @OneToOne(type => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn()
  admin: User;

  // Restrict deletion of an Organization when a Customer is deleted
  // Use cascade: ['insert'] to automatically insert and attach a new Organization to a User
  @OneToOne(type => Customer, { nullable: false, onDelete: 'RESTRICT', cascade: ['insert'] })
  @JoinColumn()
  customer: Customer;

  @OneToMany(type => Publication, publication => publication.organization)
  publications: Publication[];

  @CreateDateColumn({ select: false })
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  @IsDate()
  updatedAt: Date;
}
