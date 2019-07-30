import {MigrationInterface, QueryRunner} from "typeorm";

export class ArticleCompatible1564467937421 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "article" ADD "isCompatible" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "article" ADD "compatibilityMessage" character varying`);
        await queryRunner.query(`ALTER TABLE "voice" DROP CONSTRAINT "UQ_b3499b205011554e0a5bce07dae"`);
        await queryRunner.query(`ALTER TABLE "voice" ALTER COLUMN "isLanguageDefault" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "voice" ADD CONSTRAINT "UQ_b3499b205011554e0a5bce07dae" UNIQUE ("isLanguageDefault", "languageCode")`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "voice" DROP CONSTRAINT "UQ_b3499b205011554e0a5bce07dae"`);
        await queryRunner.query(`ALTER TABLE "voice" ALTER COLUMN "isLanguageDefault" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "voice" ADD CONSTRAINT "UQ_b3499b205011554e0a5bce07dae" UNIQUE ("languageCode", "isLanguageDefault")`);
        await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "compatibilityMessage"`);
        await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "isCompatible"`);
    }

}
