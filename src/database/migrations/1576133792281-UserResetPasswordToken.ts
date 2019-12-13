import {MigrationInterface, QueryRunner} from "typeorm";

export class UserResetPasswordToken1576133792281 implements MigrationInterface {
    name = 'UserResetPasswordToken1576133792281'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetPasswordToken"`, undefined);
        await queryRunner.query(`ALTER TABLE "user" ADD "resetPasswordToken" character varying(32)`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetPasswordToken"`, undefined);
        await queryRunner.query(`ALTER TABLE "user" ADD "resetPasswordToken" character varying(6)`, undefined);
    }

}
