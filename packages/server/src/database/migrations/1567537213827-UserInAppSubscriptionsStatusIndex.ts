import {MigrationInterface, QueryRunner} from "typeorm";

export class UserInAppSubscriptionsStatusIndex1567537213827 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE INDEX "IDX_850f4993d8bdf9220e77a46a9d" ON "user_in_app_subscription" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_75f99826347b95e6120368fe51" ON "user_in_app_subscription_google" ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_75f99826347b95e6120368fe51"`);
        await queryRunner.query(`DROP INDEX "IDX_850f4993d8bdf9220e77a46a9d"`);
    }

}
