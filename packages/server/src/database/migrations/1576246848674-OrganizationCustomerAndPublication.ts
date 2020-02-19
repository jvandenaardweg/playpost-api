import {MigrationInterface, QueryRunner} from "typeorm";

export class OrganizationCustomerAndPublication1576246848674 implements MigrationInterface {
    name = 'OrganizationCustomerAndPublication1576246848674'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "customer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "stripeCustomerId" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "organization" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "adminId" uuid NOT NULL, "customerId" uuid NOT NULL, CONSTRAINT "REL_ad3465c6feeec7c935a30289b8" UNIQUE ("adminId"), CONSTRAINT "REL_83c4b3bf6c323141c7424aae55" UNIQUE ("customerId"), CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "publication" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, "url" character varying(100), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, CONSTRAINT "PK_8aea8363d5213896a78d8365fab" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "article" ADD "publicationId" uuid`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "FK_ad3465c6feeec7c935a30289b8c" FOREIGN KEY ("adminId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "FK_83c4b3bf6c323141c7424aae55e" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "publication" ADD CONSTRAINT "FK_fc35c0c90a571760355576fe300" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "article" ADD CONSTRAINT "FK_a2af6ee773aa9189e04c0b30a6b" FOREIGN KEY ("publicationId") REFERENCES "publication"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "article" DROP CONSTRAINT "FK_a2af6ee773aa9189e04c0b30a6b"`, undefined);
        await queryRunner.query(`ALTER TABLE "publication" DROP CONSTRAINT "FK_fc35c0c90a571760355576fe300"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "FK_83c4b3bf6c323141c7424aae55e"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "FK_ad3465c6feeec7c935a30289b8c"`, undefined);
        await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "publicationId"`, undefined);
        await queryRunner.query(`DROP TABLE "publication"`, undefined);
        await queryRunner.query(`DROP TABLE "organization"`, undefined);
        await queryRunner.query(`DROP TABLE "customer"`, undefined);
    }

}
