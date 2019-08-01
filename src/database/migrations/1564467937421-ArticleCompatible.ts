import {MigrationInterface, QueryRunner} from "typeorm";

export class ArticleCompatible1564467937421 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "article" ADD "isCompatible" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "article" ADD "compatibilityMessage" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "compatibilityMessage"`);
        await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "isCompatible"`);
    }

}
