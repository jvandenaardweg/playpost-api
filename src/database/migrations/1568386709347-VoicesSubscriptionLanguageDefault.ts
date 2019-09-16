import {MigrationInterface, QueryRunner} from "typeorm";

export class VoicesSubscriptionLanguageDefault1568386709347 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "voice" ADD "isUnsubscribedLanguageDefault" boolean`);
        await queryRunner.query(`ALTER TABLE "voice" ADD "isSubscribedLanguageDefault" boolean`);
        await queryRunner.query(`ALTER TABLE "voice" ADD CONSTRAINT "UQ_600978cbd45fd7628f1fca1243f" UNIQUE ("isSubscribedLanguageDefault", "languageId")`);
        await queryRunner.query(`ALTER TABLE "voice" ADD CONSTRAINT "UQ_979e7eee5b872c449bb59863eea" UNIQUE ("isUnsubscribedLanguageDefault", "languageId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "voice" DROP CONSTRAINT "UQ_979e7eee5b872c449bb59863eea"`);
        await queryRunner.query(`ALTER TABLE "voice" DROP CONSTRAINT "UQ_600978cbd45fd7628f1fca1243f"`);
        await queryRunner.query(`ALTER TABLE "voice" DROP COLUMN "isSubscribedLanguageDefault"`);
        await queryRunner.query(`ALTER TABLE "voice" DROP COLUMN "isUnsubscribedLanguageDefault"`);
    }

}
