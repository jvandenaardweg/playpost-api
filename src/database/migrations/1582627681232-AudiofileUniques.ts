import {MigrationInterface, QueryRunner} from "typeorm";

export class AudiofileUniques1582627681232 implements MigrationInterface {
    name = 'AudiofileUniques1582627681232'

    public async up(queryRunner: QueryRunner): Promise<any> {
        // await queryRunner.query(`ALTER TABLE "audiofile" ADD CONSTRAINT "UQ_abf02172426e60cf98e47b239e8" UNIQUE ("userId", "articleId", "voiceId")`, undefined);
        await queryRunner.query(`ALTER TABLE "audiofile" ADD CONSTRAINT "UQ_20b7b64aefc508b33a442d0df55" UNIQUE ("publicationId", "articleId")`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "audiofile" DROP CONSTRAINT "UQ_20b7b64aefc508b33a442d0df55"`, undefined);
        // await queryRunner.query(`ALTER TABLE "audiofile" DROP CONSTRAINT "UQ_abf02172426e60cf98e47b239e8"`, undefined);
    }

}
