import {MigrationInterface, QueryRunner} from "typeorm";

export class InAppSubscriptionsUpgradeFrom1568799387018 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "in_app_subscription" ADD "upgradeFromId" uuid`, undefined);
        await queryRunner.query(`ALTER TABLE "in_app_subscription" ADD CONSTRAINT "UQ_39f3d0a73fea0b5bb391f6bdf18" UNIQUE ("upgradeFromId", "productId", "service")`, undefined);
        await queryRunner.query(`ALTER TABLE "in_app_subscription" ADD CONSTRAINT "FK_50adf8e7a42ae2f7f3770cb121b" FOREIGN KEY ("upgradeFromId") REFERENCES "in_app_subscription"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "in_app_subscription" DROP CONSTRAINT "FK_50adf8e7a42ae2f7f3770cb121b"`, undefined);
        await queryRunner.query(`ALTER TABLE "in_app_subscription" DROP CONSTRAINT "UQ_39f3d0a73fea0b5bb391f6bdf18"`, undefined);
        await queryRunner.query(`ALTER TABLE "in_app_subscription" DROP COLUMN "upgradeFromId"`, undefined);
    }

}
