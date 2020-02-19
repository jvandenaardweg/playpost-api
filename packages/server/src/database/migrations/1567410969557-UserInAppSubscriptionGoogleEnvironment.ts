import {MigrationInterface, QueryRunner} from "typeorm";

export class UserInAppSubscriptionGoogleEnvironment1567410969557 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TYPE "user_in_app_subscription_google_environment_enum" AS ENUM('Sandbox', 'PROD')`);
        await queryRunner.query(`ALTER TABLE "user_in_app_subscription_google" ADD "environment" "user_in_app_subscription_google_environment_enum" NOT NULL`);
   }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user_in_app_subscription_google" DROP COLUMN "environment"`);
        await queryRunner.query(`DROP TYPE "user_in_app_subscription_google_environment_enum"`);
    }

}
