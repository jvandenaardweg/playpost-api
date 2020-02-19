import {MigrationInterface, QueryRunner} from "typeorm";

export class VoiceQuality1564674653133 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TYPE "voice_quality_enum" AS ENUM('Normal', 'High', 'Very High')`);
        await queryRunner.query(`ALTER TABLE "voice" ADD "quality" "voice_quality_enum" NOT NULL DEFAULT 'Normal'`);
        await queryRunner.query(`CREATE INDEX "IDX_3d46f8e6297dffad023cd1d928" ON "voice" ("languageCode", "isActive", "isPremium", "isHighestQuality", "quality") `);

        // Remove the default from isLanguageDefault, it defaults properly already
        await queryRunner.query(`ALTER TABLE "voice" ALTER COLUMN "isLanguageDefault" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_3d46f8e6297dffad023cd1d928"`);
        await queryRunner.query(`ALTER TABLE "voice" DROP COLUMN "quality"`);
        await queryRunner.query(`DROP TYPE "voice_quality_enum"`);
    }

}
