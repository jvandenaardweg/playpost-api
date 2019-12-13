import {MigrationInterface, QueryRunner} from "typeorm";

export class CustomerOrganizationSetNull1576263832495 implements MigrationInterface {
    name = 'CustomerOrganizationSetNull1576263832495'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "FK_83c4b3bf6c323141c7424aae55e"`, undefined);
        await queryRunner.query(`ALTER TABLE "customer" ALTER COLUMN "stripeCustomerId" SET NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "FK_83c4b3bf6c323141c7424aae55e" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "FK_83c4b3bf6c323141c7424aae55e"`, undefined);
        await queryRunner.query(`ALTER TABLE "customer" ALTER COLUMN "stripeCustomerId" DROP NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "FK_83c4b3bf6c323141c7424aae55e" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`, undefined);
    }

}
