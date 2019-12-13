import {MigrationInterface, QueryRunner} from "typeorm";

export class CorrectOnDeleteConstraintsPublicationUsers1576257797533 implements MigrationInterface {
    name = 'CorrectOnDeleteConstraintsPublicationUsers1576257797533'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "publication_users_user" DROP CONSTRAINT "FK_2fb335a82a7e31e6ad2ea25e84e"`, undefined);
        await queryRunner.query(`ALTER TABLE "publication_users_user" DROP CONSTRAINT "FK_cde89c7c247524697d52aa546b4"`, undefined);
        await queryRunner.query(`ALTER TABLE "publication_users_user" ADD CONSTRAINT "FK_cde89c7c247524697d52aa546b4" FOREIGN KEY ("publicationId") REFERENCES "publication"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "publication_users_user" ADD CONSTRAINT "FK_2fb335a82a7e31e6ad2ea25e84e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "publication_users_user" DROP CONSTRAINT "FK_2fb335a82a7e31e6ad2ea25e84e"`, undefined);
        await queryRunner.query(`ALTER TABLE "publication_users_user" DROP CONSTRAINT "FK_cde89c7c247524697d52aa546b4"`, undefined);
        await queryRunner.query(`ALTER TABLE "publication_users_user" ADD CONSTRAINT "FK_cde89c7c247524697d52aa546b4" FOREIGN KEY ("publicationId") REFERENCES "publication"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "publication_users_user" ADD CONSTRAINT "FK_2fb335a82a7e31e6ad2ea25e84e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`, undefined);
    }

}
