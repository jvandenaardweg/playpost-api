import {MigrationInterface, QueryRunner} from "typeorm";

export class UserInAppSubscriptionsExpiresIndex1567537078927 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE INDEX "IDX_e188392593252c6c2ddc465977" ON "user_in_app_subscription" ("expiresAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_d5380bc44d911d1df2a674f020" ON "user_in_app_subscription_google" ("expiresAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_d5380bc44d911d1df2a674f020"`);
        await queryRunner.query(`DROP INDEX "IDX_e188392593252c6c2ddc465977"`);
    }

}
