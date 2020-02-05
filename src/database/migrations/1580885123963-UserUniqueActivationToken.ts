import {MigrationInterface, QueryRunner} from "typeorm";

export class UserUniqueActivationToken1580885123963 implements MigrationInterface {
    name = 'UserUniqueActivationToken1580885123963'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_1bc679ca7cd42944704b3229aeb" UNIQUE ("activationToken")`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_1bc679ca7cd42944704b3229aeb"`, undefined);
    }

}
