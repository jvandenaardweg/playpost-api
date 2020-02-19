import {MigrationInterface, QueryRunner} from "typeorm";

export class MoveStripeCustomerIdToOrganization1582099944020 implements MigrationInterface {
    name = 'MoveStripeCustomerIdToOrganization1582099944020'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "FK_83c4b3bf6c323141c7424aae55e"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" RENAME COLUMN "customerId" TO "stripeCustomerId"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" RENAME CONSTRAINT "REL_83c4b3bf6c323141c7424aae55" TO "UQ_6577a5c81fedc33f9d8d284d491"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "UQ_6577a5c81fedc33f9d8d284d491"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "stripeCustomerId"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" ADD "stripeCustomerId" character varying(255)`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "stripeCustomerId"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" ADD "stripeCustomerId" uuid`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "UQ_6577a5c81fedc33f9d8d284d491" UNIQUE ("stripeCustomerId")`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" RENAME CONSTRAINT "UQ_6577a5c81fedc33f9d8d284d491" TO "REL_83c4b3bf6c323141c7424aae55"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" RENAME COLUMN "stripeCustomerId" TO "customerId"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "FK_83c4b3bf6c323141c7424aae55e" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
    }

}
