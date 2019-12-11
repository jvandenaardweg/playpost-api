import {MigrationInterface, QueryRunner} from "typeorm";

export class PublisherChanges1576010672013 implements MigrationInterface {
    name = 'PublisherChanges1576010672013'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "publisher" DROP CONSTRAINT "FK_edf47a1a1a6c9fca862a12ba076"`, undefined);
        await queryRunner.query(`ALTER TABLE "publisher" DROP CONSTRAINT "REL_edf47a1a1a6c9fca862a12ba07"`, undefined);
        await queryRunner.query(`ALTER TABLE "publisher" DROP COLUMN "userId"`, undefined);
        await queryRunner.query(`ALTER TABLE "user" ADD "publisherId" uuid`, undefined);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_7f01b2d6c8a7ff856455eaf16f9" UNIQUE ("publisherId")`, undefined);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_7f01b2d6c8a7ff856455eaf16f9" FOREIGN KEY ("publisherId") REFERENCES "publisher"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_7f01b2d6c8a7ff856455eaf16f9"`, undefined);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_7f01b2d6c8a7ff856455eaf16f9"`, undefined);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "publisherId"`, undefined);
        await queryRunner.query(`ALTER TABLE "publisher" ADD "userId" uuid`, undefined);
        await queryRunner.query(`ALTER TABLE "publisher" ADD CONSTRAINT "REL_edf47a1a1a6c9fca862a12ba07" UNIQUE ("userId")`, undefined);
        await queryRunner.query(`ALTER TABLE "publisher" ADD CONSTRAINT "FK_edf47a1a1a6c9fca862a12ba076" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

}
