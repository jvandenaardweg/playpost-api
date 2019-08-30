import {MigrationInterface, QueryRunner} from "typeorm";

export class HadTrial1567145416715 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`ALTER TABLE "user_in_app_subscription" ADD "hadTrial" boolean DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`ALTER TABLE "user_in_app_subscription" DROP COLUMN "hadTrial"`);
    }

}
