import {MigrationInterface, QueryRunner} from "typeorm";

export class Publisher1575731651969 implements MigrationInterface {
    name = 'Publisher1575731651969'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "publisher" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "REL_edf47a1a1a6c9fca862a12ba07" UNIQUE ("userId"), CONSTRAINT "PK_70a5936b43177f76161724da3e6" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "publisher" ADD CONSTRAINT "FK_edf47a1a1a6c9fca862a12ba076" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "publisher" DROP CONSTRAINT "FK_edf47a1a1a6c9fca862a12ba076"`, undefined);
        await queryRunner.query(`DROP TABLE "publisher"`, undefined);
    }

}
