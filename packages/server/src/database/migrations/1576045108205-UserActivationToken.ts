import {MigrationInterface, QueryRunner} from "typeorm";

export class UserActivationToken1576045108205 implements MigrationInterface {
    name = 'UserActivationToken1576045108205'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" ADD "activationToken" character varying(32)`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "activationToken"`, undefined);
    }

}
