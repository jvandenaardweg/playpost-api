import {MigrationInterface, QueryRunner} from "typeorm";

export class UsageRecordNulls1580885123964 implements MigrationInterface {
    name = 'UsageRecordNulls1580885123964'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "usage_record" ALTER COLUMN "stripeUsageRecordId" SET DEFAULT null`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`ALTER TABLE "usage_record" ALTER COLUMN "stripeUsageRecordId" DROP DEFAULT`, undefined);
    }

}
