import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveCustomerTable1582100050680 implements MigrationInterface {
    name = 'RemoveCustomerTable1582100050680'

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`DROP TABLE "customer"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        // await queryRunner.query(`DROP TABLE "customer"`, undefined);
    }

}
