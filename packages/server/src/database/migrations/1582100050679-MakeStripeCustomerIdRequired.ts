import {MigrationInterface, QueryRunner} from "typeorm";

export class MakeStripeCustomerIdRequired1582100050678 implements MigrationInterface {
    name = 'MakeStripeCustomerIdRequired1582100050678'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "organization" ALTER COLUMN "stripeCustomerId" SET NOT NULL`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "organization" ALTER COLUMN "stripeCustomerId" DROP NOT NULL`, undefined);
    }

}
