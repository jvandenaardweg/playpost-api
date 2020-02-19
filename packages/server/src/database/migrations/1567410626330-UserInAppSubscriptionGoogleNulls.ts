import {MigrationInterface, QueryRunner} from "typeorm";

export class UserInAppSubscriptionGoogleNulls1567410626330 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user_in_app_subscription_google" ALTER COLUMN "transactionId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_in_app_subscription_google" ALTER COLUMN "orderId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_in_app_subscription_google" ALTER COLUMN "purchaseToken" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user_in_app_subscription_google" ALTER COLUMN "purchaseToken" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_in_app_subscription_google" ALTER COLUMN "orderId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_in_app_subscription_google" ALTER COLUMN "transactionId" DROP NOT NULL`);
    }

}
