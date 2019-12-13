import { IsDate, IsUUID, Length } from 'class-validator';
import { AfterRemove, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { logger } from '../../utils';

@Entity()
export class Customer {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column('varchar', { length: 255 })
  @Length(1, 255)
  stripeCustomerId: string; // cus_GLBNvU7Y4CEL02

  @CreateDateColumn({ select: false })
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  @IsDate()
  updatedAt: Date;

  @AfterRemove()
  afterRemove() {
    const loggerPrefix = 'Database Entity (Customer): @AfterRemove():';

    logger.info(loggerPrefix, 'Should remove customer from Stripe?', this.stripeCustomerId)
  }
}
