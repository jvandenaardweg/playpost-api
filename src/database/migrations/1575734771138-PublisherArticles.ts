import {MigrationInterface, QueryRunner} from "typeorm";

export class PublisherArticles1575734771138 implements MigrationInterface {
    name = 'PublisherArticles1575734771138'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "article" ADD "publisherId" uuid`, undefined);
        await queryRunner.query(`ALTER TABLE "article" ADD CONSTRAINT "FK_56dfc66267ad7e56902de738b03" FOREIGN KEY ("publisherId") REFERENCES "publisher"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "article" DROP CONSTRAINT "FK_56dfc66267ad7e56902de738b03"`, undefined);
        await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "publisherId"`, undefined);
    }

}
