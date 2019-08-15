import {MigrationInterface, QueryRunner} from "typeorm";

export class LanguageCountries1565882851553 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "language_countries" ("languageId" uuid NOT NULL, "countryId" uuid NOT NULL, CONSTRAINT "PK_cd719f5411abc4d4b4be94e88f2" PRIMARY KEY ("languageId", "countryId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f2a184d3fbdac6c0453bbed32f" ON "language_countries" ("languageId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3eeed2b8a1b5cdc7c8d03980b5" ON "language_countries" ("countryId") `);
        await queryRunner.query(`ALTER TABLE "language_countries" ADD CONSTRAINT "FK_f2a184d3fbdac6c0453bbed32f4" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "language_countries" ADD CONSTRAINT "FK_3eeed2b8a1b5cdc7c8d03980b50" FOREIGN KEY ("countryId") REFERENCES "country"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "language_countries" DROP CONSTRAINT "FK_3eeed2b8a1b5cdc7c8d03980b50"`);
        await queryRunner.query(`ALTER TABLE "language_countries" DROP CONSTRAINT "FK_f2a184d3fbdac6c0453bbed32f4"`);
        await queryRunner.query(`DROP INDEX "IDX_3eeed2b8a1b5cdc7c8d03980b5"`);
        await queryRunner.query(`DROP INDEX "IDX_f2a184d3fbdac6c0453bbed32f"`);
        await queryRunner.query(`DROP TABLE "language_countries"`);
    }

}
