import {MigrationInterface, QueryRunner} from "typeorm";

export class UsageRecordTable1576585231400 implements MigrationInterface {
    name = 'UsageRecordTable1576585231400'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "usage_record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" integer NOT NULL DEFAULT 0, "isMetered" boolean NOT NULL DEFAULT true, "timestamp" TIMESTAMP NOT NULL, "stripeSubscriptionItemId" character varying, "stripeUsageRecordId" character varying DEFAULT null, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "articleId" uuid, "audiofileId" uuid, "organizationId" uuid, "publicationId" uuid, CONSTRAINT "PK_f22cc039acc8b1bd333978b7cf7" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_2e098683e839306474efb20578" ON "usage_record" ("userId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_385f4e0d50e58809780a1ac10c" ON "usage_record" ("articleId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_0a1b66c3d4141ed55bb5abc5be" ON "usage_record" ("audiofileId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_f5e6bf2dc2a8c8a870485a6640" ON "usage_record" ("organizationId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_7cf541e1eb3a88d97263f2b720" ON "usage_record" ("publicationId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_303d4a0c9395b6bdf4f101c2d6" ON "usage_record" ("stripeSubscriptionItemId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_553b5c3e18b798d7ac9c7ab9bf" ON "usage_record" ("stripeUsageRecordId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_b5cffb21e56a4770cc94efcb6e" ON "usage_record" ("createdAt") `, undefined);
        await queryRunner.query(`ALTER TABLE "usage_record" ADD CONSTRAINT "FK_2e098683e839306474efb20578e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "usage_record" ADD CONSTRAINT "FK_385f4e0d50e58809780a1ac10c3" FOREIGN KEY ("articleId") REFERENCES "article"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "usage_record" ADD CONSTRAINT "FK_0a1b66c3d4141ed55bb5abc5be5" FOREIGN KEY ("audiofileId") REFERENCES "audiofile"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "usage_record" ADD CONSTRAINT "FK_f5e6bf2dc2a8c8a870485a6640a" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "usage_record" ADD CONSTRAINT "FK_7cf541e1eb3a88d97263f2b720b" FOREIGN KEY ("publicationId") REFERENCES "publication"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "usage_record" DROP CONSTRAINT "FK_7cf541e1eb3a88d97263f2b720b"`, undefined);
        await queryRunner.query(`ALTER TABLE "usage_record" DROP CONSTRAINT "FK_f5e6bf2dc2a8c8a870485a6640a"`, undefined);
        await queryRunner.query(`ALTER TABLE "usage_record" DROP CONSTRAINT "FK_0a1b66c3d4141ed55bb5abc5be5"`, undefined);
        await queryRunner.query(`ALTER TABLE "usage_record" DROP CONSTRAINT "FK_385f4e0d50e58809780a1ac10c3"`, undefined);
        await queryRunner.query(`ALTER TABLE "usage_record" DROP CONSTRAINT "FK_2e098683e839306474efb20578e"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_b5cffb21e56a4770cc94efcb6e"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_553b5c3e18b798d7ac9c7ab9bf"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_303d4a0c9395b6bdf4f101c2d6"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_7cf541e1eb3a88d97263f2b720"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_f5e6bf2dc2a8c8a870485a6640"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_0a1b66c3d4141ed55bb5abc5be"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_385f4e0d50e58809780a1ac10c"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_2e098683e839306474efb20578"`, undefined);
        await queryRunner.query(`DROP TABLE "usage_record"`, undefined);
    }

}
