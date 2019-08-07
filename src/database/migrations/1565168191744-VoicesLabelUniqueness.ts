import {MigrationInterface, QueryRunner} from "typeorm";

export class VoicesLabelUniqueness1565168191744 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "voice" DROP CONSTRAINT "UQ_74d19533342aa4e610a4ba1978f"`);
        await queryRunner.query(`ALTER TABLE "voice" ADD CONSTRAINT "UQ_1b219fb06494191222077da6a05" UNIQUE ("languageCode", "label")`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "voice" DROP CONSTRAINT "UQ_1b219fb06494191222077da6a05"`);
        await queryRunner.query(`ALTER TABLE "voice" ADD CONSTRAINT "UQ_74d19533342aa4e610a4ba1978f" UNIQUE ("label")`);
    }

}
