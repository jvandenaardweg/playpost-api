import { IsUUID } from 'class-validator';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Article } from './article';
import { Audiofile } from './audiofile';
import { Organization } from './organization';
import { Publication } from './publication';
import { User } from './user';

@Entity()
export class UsageRecord {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Index()
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user?: User;

  @Index()
  @ManyToOne(() => Article, { nullable: true, onDelete: 'SET NULL' })
  article?: Article;

  @Index()
  @ManyToOne(() => Audiofile, { nullable: true, onDelete: 'SET NULL' })
  audiofile?: Audiofile;

  @Index()
  @ManyToOne(() => Organization, { nullable: true, onDelete: 'SET NULL' })
  organization?: Organization;

  @Index()
  @ManyToOne(() => Publication, { nullable: true, onDelete: 'SET NULL' })
  publication?: Publication;

  @Column({ nullable: false, default: 0 })
  quantity: number; // Characters

  @Column({ nullable: false, default: true })
  isMetered: boolean; // true if it need it requires payment, false if it's free (for example, short snippet previews)

  @Column('timestamp', { nullable: false })
  timestamp: number; // Characters

  @Index()
  @Column({ nullable: true })
  stripeSubscriptionItemId?: string;

  @Index()
  @Column({ nullable: true }) // Could be empty if the usage record we insert is not metered
  stripeUsageRecordId?: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
