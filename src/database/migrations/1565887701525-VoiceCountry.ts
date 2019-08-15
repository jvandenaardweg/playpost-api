import {MigrationInterface, QueryRunner} from "typeorm";

export class VoiceCountry1565887701525 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "voice" ADD "countryId" uuid NULL`);
        await queryRunner.query(`ALTER TABLE "voice" ADD CONSTRAINT "FK_8c0dd7723dcd57a01361e4f8681" FOREIGN KEY ("countryId") REFERENCES "country"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "voice" DROP CONSTRAINT "FK_8c0dd7723dcd57a01361e4f8681"`);
        await queryRunner.query(`ALTER TABLE "voice" DROP COLUMN "countryId"`);
    }

}
