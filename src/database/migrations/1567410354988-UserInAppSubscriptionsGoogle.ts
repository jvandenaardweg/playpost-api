import {MigrationInterface, QueryRunner} from "typeorm";

export class UserInAppSubscriptionsGoogle1567410354988 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TYPE "user_in_app_subscription_google_status_enum" AS ENUM('canceled', 'expired', 'active', 'lapsed')`);
        await queryRunner.query(`CREATE TABLE "user_in_app_subscription_google" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "startedAt" TIMESTAMP, "expiresAt" TIMESTAMP, "transactionId" character varying, "orderId" character varying, "purchaseToken" character varying, "receipt" character varying NOT NULL, "hadTrial" boolean DEFAULT false, "isTrial" boolean NOT NULL DEFAULT false, "isCanceled" boolean NOT NULL, "isExpired" boolean NOT NULL, "status" "user_in_app_subscription_google_status_enum" NOT NULL, "renewedAt" TIMESTAMP, "canceledAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "inAppSubscriptionId" uuid, CONSTRAINT "UQ_8f7cafa02aaf3284f64f55762a4" UNIQUE ("transactionId"), CONSTRAINT "UQ_27b8f86cd00fc574ec5c0b785c7" UNIQUE ("orderId"), CONSTRAINT "UQ_b649ec92959830d34ab1ea28639" UNIQUE ("purchaseToken"), CONSTRAINT "PK_c54704b50fffd2d54c855b6b1e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8f7cafa02aaf3284f64f55762a" ON "user_in_app_subscription_google" ("transactionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_27b8f86cd00fc574ec5c0b785c" ON "user_in_app_subscription_google" ("orderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b649ec92959830d34ab1ea2863" ON "user_in_app_subscription_google" ("purchaseToken") `);
        await queryRunner.query(`CREATE INDEX "IDX_f8e8b1af53a49ecde7d1a1c634" ON "user_in_app_subscription_google" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e72f266e6098b905780dc42792" ON "user_in_app_subscription_google" ("inAppSubscriptionId") `);
        await queryRunner.query(`ALTER TABLE "user_in_app_subscription_google" ADD CONSTRAINT "FK_f8e8b1af53a49ecde7d1a1c6349" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_in_app_subscription_google" ADD CONSTRAINT "FK_e72f266e6098b905780dc427928" FOREIGN KEY ("inAppSubscriptionId") REFERENCES "in_app_subscription"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user_in_app_subscription_google" DROP CONSTRAINT "FK_e72f266e6098b905780dc427928"`);
        await queryRunner.query(`ALTER TABLE "user_in_app_subscription_google" DROP CONSTRAINT "FK_f8e8b1af53a49ecde7d1a1c6349"`);
        await queryRunner.query(`DROP INDEX "IDX_e72f266e6098b905780dc42792"`);
        await queryRunner.query(`DROP INDEX "IDX_f8e8b1af53a49ecde7d1a1c634"`);
        await queryRunner.query(`DROP INDEX "IDX_b649ec92959830d34ab1ea2863"`);
        await queryRunner.query(`DROP INDEX "IDX_27b8f86cd00fc574ec5c0b785c"`);
        await queryRunner.query(`DROP INDEX "IDX_8f7cafa02aaf3284f64f55762a"`);
        await queryRunner.query(`DROP TABLE "user_in_app_subscription_google"`);
        await queryRunner.query(`DROP TYPE "user_in_app_subscription_google_status_enum"`);
    }

}
