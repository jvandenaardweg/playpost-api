import {MigrationInterface, QueryRunner} from "typeorm";

export class MicrosoftVoices1565167596757 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TYPE "public"."voice_synthesizer_enum" RENAME TO "voice_synthesizer_enum_old"`);
        await queryRunner.query(`CREATE TYPE "voice_synthesizer_enum" AS ENUM('Google', 'AWS', 'Microsoft')`);
        await queryRunner.query(`ALTER TABLE "voice" ALTER COLUMN "synthesizer" TYPE "voice_synthesizer_enum" USING "synthesizer"::"text"::"voice_synthesizer_enum"`);
        await queryRunner.query(`DROP TYPE "voice_synthesizer_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TYPE "voice_synthesizer_enum_old" AS ENUM('Google', 'AWS')`);
        await queryRunner.query(`ALTER TABLE "voice" ALTER COLUMN "synthesizer" TYPE "voice_synthesizer_enum_old" USING "synthesizer"::"text"::"voice_synthesizer_enum_old"`);
        await queryRunner.query(`DROP TYPE "voice_synthesizer_enum"`);
        await queryRunner.query(`ALTER TYPE "voice_synthesizer_enum_old" RENAME TO  "voice_synthesizer_enum"`);
    }

}
