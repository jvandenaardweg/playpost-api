import { IsDate, IsUUID, Length } from 'class-validator';
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
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
  admin?: User;

  // Use cascade: ['insert'] to automatically insert and attach a new Organization to a User
  @OneToOne(type => Customer, { nullable: true, onDelete: 'SET NULL', cascade: ['insert'] })
  @JoinColumn()
  customer?: Customer;

  @OneToMany(type => Publication, publication => publication.organization)
  publications?: Publication[];

  // An Organization can contain multiple Users
  @ManyToMany(type => User, user => user.organizations, { onDelete: 'CASCADE', cascade: ['insert'] })
  @JoinTable()
  users?: User[];

  @CreateDateColumn({ select: false })
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  @IsDate()
  updatedAt: Date;
}
