import {MigrationInterface, QueryRunner} from "typeorm";

export class UserPublicationsJoinTable1576266705075 implements MigrationInterface {
    name = 'UserPublicationsJoinTable1576266705075'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "user_publications_publication" ("userId" uuid NOT NULL, "publicationId" uuid NOT NULL, CONSTRAINT "PK_32c142a34bcb3ddd6f6fbdf63d7" PRIMARY KEY ("userId", "publicationId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_2e09ab3297e1a862eea819ba2a" ON "user_publications_publication" ("userId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_9bace62e5f8f8256cfd24ac9a3" ON "user_publications_publication" ("publicationId") `, undefined);
        await queryRunner.query(`ALTER TABLE "user_publications_publication" ADD CONSTRAINT "FK_2e09ab3297e1a862eea819ba2a3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "user_publications_publication" ADD CONSTRAINT "FK_9bace62e5f8f8256cfd24ac9a34" FOREIGN KEY ("publicationId") REFERENCES "publication"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user_publications_publication" DROP CONSTRAINT "FK_9bace62e5f8f8256cfd24ac9a34"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_publications_publication" DROP CONSTRAINT "FK_2e09ab3297e1a862eea819ba2a3"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_9bace62e5f8f8256cfd24ac9a3"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_2e09ab3297e1a862eea819ba2a"`, undefined);
        await queryRunner.query(`DROP TABLE "user_publications_publication"`, undefined);
    }

}
