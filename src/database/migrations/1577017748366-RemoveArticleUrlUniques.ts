import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveArticleUrlUniques1577017748366 implements MigrationInterface {
    name = 'RemoveArticleUrlUniques1577017748366'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "article" DROP CONSTRAINT "UQ_b99fa71c07cc9a8421bd36bb1db"`, undefined);
        await queryRunner.query(`ALTER TABLE "article" DROP CONSTRAINT "UQ_0e4eaae669e0f23d736a0a7a758"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "article" ADD CONSTRAINT "UQ_0e4eaae669e0f23d736a0a7a758" UNIQUE ("canonicalUrl")`, undefined);
        await queryRunner.query(`ALTER TABLE "article" ADD CONSTRAINT "UQ_b99fa71c07cc9a8421bd36bb1db" UNIQUE ("url")`, undefined);
    }

}
