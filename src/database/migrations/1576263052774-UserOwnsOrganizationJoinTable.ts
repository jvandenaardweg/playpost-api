import {MigrationInterface, QueryRunner} from "typeorm";

export class UserOwnsOrganizationJoinTable1576263052774 implements MigrationInterface {
    name = 'UserOwnsOrganizationJoinTable1576263052774'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "user_organizations_organization" ("userId" uuid NOT NULL, "organizationId" uuid NOT NULL, CONSTRAINT "PK_d89fbba617c90c71e2fc0bee26f" PRIMARY KEY ("userId", "organizationId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_7ad3d8541fbdb5a3d137c50fb4" ON "user_organizations_organization" ("userId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_8d7c566d5a234be0a646101326" ON "user_organizations_organization" ("organizationId") `, undefined);
        await queryRunner.query(`ALTER TABLE "user_organizations_organization" ADD CONSTRAINT "FK_7ad3d8541fbdb5a3d137c50fb40" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "user_organizations_organization" ADD CONSTRAINT "FK_8d7c566d5a234be0a6461013269" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user_organizations_organization" DROP CONSTRAINT "FK_8d7c566d5a234be0a6461013269"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_organizations_organization" DROP CONSTRAINT "FK_7ad3d8541fbdb5a3d137c50fb40"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_8d7c566d5a234be0a646101326"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_7ad3d8541fbdb5a3d137c50fb4"`, undefined);
        await queryRunner.query(`DROP TABLE "user_organizations_organization"`, undefined);
    }

}
