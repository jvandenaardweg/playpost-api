import {MigrationInterface, QueryRunner} from "typeorm";

export class CustomerOptionalStripeId1576263503710 implements MigrationInterface {
    name = 'CustomerOptionalStripeId1576263503710'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "customer" ALTER COLUMN "stripeCustomerId" DROP NOT NULL`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "customer" ALTER COLUMN "stripeCustomerId" SET NOT NULL`, undefined);
    }

}
