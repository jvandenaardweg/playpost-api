import {MigrationInterface, QueryRunner} from "typeorm";

export class ApiKeyAllowedDomain1567661196464 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "api_key" ADD "allowedDomain" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "api_key" DROP COLUMN "allowedDomain"`);
    }

}
