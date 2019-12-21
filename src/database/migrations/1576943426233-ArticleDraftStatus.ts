import {MigrationInterface, QueryRunner} from "typeorm";

export class ArticleDraftStatus1576943426233 implements MigrationInterface {
    name = 'ArticleDraftStatus1576943426233'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TYPE "public"."article_status_enum" RENAME TO "article_status_enum_old"`, undefined);
        await queryRunner.query(`CREATE TYPE "article_status_enum" AS ENUM('crawling', 'new', 'finished', 'failed', 'draft')`, undefined);
        await queryRunner.query(`ALTER TABLE "article" ALTER COLUMN "status" DROP DEFAULT`, undefined);
        await queryRunner.query(`ALTER TABLE "article" ALTER COLUMN "status" TYPE "article_status_enum" USING "status"::"text"::"article_status_enum"`, undefined);
        await queryRunner.query(`ALTER TABLE "article" ALTER COLUMN "status" SET DEFAULT 'new'`, undefined);
        await queryRunner.query(`DROP TYPE "article_status_enum_old"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TYPE "article_status_enum_old" AS ENUM('crawling', 'new', 'finished', 'failed')`, undefined);
        await queryRunner.query(`ALTER TABLE "article" ALTER COLUMN "status" DROP DEFAULT`, undefined);
        await queryRunner.query(`ALTER TABLE "article" ALTER COLUMN "status" TYPE "article_status_enum_old" USING "status"::"text"::"article_status_enum_old"`, undefined);
        await queryRunner.query(`ALTER TABLE "article" ALTER COLUMN "status" SET DEFAULT 'new'`, undefined);
        await queryRunner.query(`DROP TYPE "article_status_enum"`, undefined);
        await queryRunner.query(`ALTER TYPE "article_status_enum_old" RENAME TO  "article_status_enum"`, undefined);
    }

}
