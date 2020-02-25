import {MigrationInterface, QueryRunner} from "typeorm";

export class AudiofileUniquesUser1582629459375 implements MigrationInterface {
    name = 'AudiofileUniquesUser1582629459375'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "audiofile" ADD CONSTRAINT "UQ_abf02172426e60cf98e47b239e8" UNIQUE ("userId", "articleId", "voiceId")`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "audiofile" DROP CONSTRAINT "UQ_abf02172426e60cf98e47b239e8"`, undefined);
    }

}
