import {MigrationInterface, QueryRunner} from "typeorm";

export class PublicationUsers1576251871318 implements MigrationInterface {
    name = 'PublicationUsers1576251871318'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "publication_users_user" ("publicationId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_ca2169e7723d4d81bb1a51cd656" PRIMARY KEY ("publicationId", "userId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_cde89c7c247524697d52aa546b" ON "publication_users_user" ("publicationId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_2fb335a82a7e31e6ad2ea25e84" ON "publication_users_user" ("userId") `, undefined);
        await queryRunner.query(`ALTER TABLE "publication_users_user" ADD CONSTRAINT "FK_cde89c7c247524697d52aa546b4" FOREIGN KEY ("publicationId") REFERENCES "publication"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "publication_users_user" ADD CONSTRAINT "FK_2fb335a82a7e31e6ad2ea25e84e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "publication_users_user" DROP CONSTRAINT "FK_2fb335a82a7e31e6ad2ea25e84e"`, undefined);
        await queryRunner.query(`ALTER TABLE "publication_users_user" DROP CONSTRAINT "FK_cde89c7c247524697d52aa546b4"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_2fb335a82a7e31e6ad2ea25e84"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_cde89c7c247524697d52aa546b"`, undefined);
        await queryRunner.query(`DROP TABLE "publication_users_user"`, undefined);
    }

}
