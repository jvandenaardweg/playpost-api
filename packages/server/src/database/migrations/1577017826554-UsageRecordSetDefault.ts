import {MigrationInterface, QueryRunner} from "typeorm";

export class UsageRecordSetDefault1577017826554 implements MigrationInterface {
    name = 'UsageRecordSetDefault1577017826554'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "usage_record" ALTER COLUMN "stripeUsageRecordId" SET DEFAULT null`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "usage_record" ALTER COLUMN "stripeUsageRecordId" DROP DEFAULT`, undefined);
    }

}
