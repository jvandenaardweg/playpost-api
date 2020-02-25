import {MigrationInterface, QueryRunner} from "typeorm";

export class AudiofilePublication1582626625547 implements MigrationInterface {
    name = 'AudiofilePublication1582626625547'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "audiofile" ADD "publicationId" uuid`, undefined);
        await queryRunner.query(`ALTER TABLE "audiofile" ADD CONSTRAINT "FK_c3632a92f0f23e1461beb6dc70c" FOREIGN KEY ("publicationId") REFERENCES "publication"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "audiofile" DROP CONSTRAINT "FK_c3632a92f0f23e1461beb6dc70c"`, undefined);
        await queryRunner.query(`ALTER TABLE "audiofile" DROP COLUMN "publicationId"`, undefined);
    }

}
