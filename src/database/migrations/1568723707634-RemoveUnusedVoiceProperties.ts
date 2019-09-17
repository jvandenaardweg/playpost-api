import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveUnusedVoiceProperties1568723707634 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_6325930bd45df721e91288bac1"`, undefined);
        await queryRunner.query(`ALTER TABLE "voice" DROP COLUMN "audioProfile"`, undefined);
        await queryRunner.query(`DROP TYPE "public"."voice_audioprofile_enum"`, undefined);
        await queryRunner.query(`ALTER TABLE "voice" DROP COLUMN "speakingRate"`, undefined);
        await queryRunner.query(`ALTER TABLE "voice" DROP COLUMN "pitch"`, undefined);
        await queryRunner.query(`ALTER TABLE "voice" DROP COLUMN "naturalSampleRateHertz"`, undefined);
        await queryRunner.query(`ALTER TABLE "voice" DROP COLUMN "isHighestQuality"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "voice" ADD "isHighestQuality" boolean NOT NULL DEFAULT false`, undefined);
        await queryRunner.query(`ALTER TABLE "voice" ADD "naturalSampleRateHertz" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "voice" ADD "pitch" numeric NOT NULL DEFAULT 0`, undefined);
        await queryRunner.query(`ALTER TABLE "voice" ADD "speakingRate" numeric NOT NULL DEFAULT 1`, undefined);
        await queryRunner.query(`CREATE TYPE "public"."voice_audioprofile_enum" AS ENUM('default', 'headphone-class-device', 'handset-class-device', 'wearable-class-device', 'small-bluetooth-speaker-class-device', 'medium-bluetooth-speaker-class-device', 'large-home-entertainment-class-device', 'large-automotive-class-device', 'telephony-class-application')`, undefined);
        await queryRunner.query(`ALTER TABLE "voice" ADD "audioProfile" "voice_audioprofile_enum" NOT NULL DEFAULT 'default'`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_6325930bd45df721e91288bac1" ON "voice" ("isHighestQuality") `, undefined);
    }

}
