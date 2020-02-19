import { IsDate, IsUUID, Length } from 'class-validator';
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
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

  // When creating a new customer, a Stripe Customer ID is required.
  @Column('varchar', { length: 255, nullable: false })
  @Length(1, 255)
  stripeCustomerId: string; // cus_GLBNvU7Y4CEL02

  // Restrict deletion of an Organization when a User is deleted
  @OneToOne(type => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn()
  admin?: User;

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
