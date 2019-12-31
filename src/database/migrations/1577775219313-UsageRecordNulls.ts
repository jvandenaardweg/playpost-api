import {MigrationInterface, QueryRunner} from "typeorm";

export class UsageRecordNulls1577775219313 implements MigrationInterface {
    name = 'UsageRecordNulls1577775219313'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "usage_record" ALTER COLUMN "stripeUsageRecordId" SET DEFAULT null`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "usage_record" ALTER COLUMN "stripeUsageRecordId" DROP DEFAULT`, undefined);
    }

}
