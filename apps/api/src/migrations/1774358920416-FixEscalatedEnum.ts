import { MigrationInterface, QueryRunner } from "typeorm";

export class FixEscalatedEnum1774358920416 implements MigrationInterface {
    name = 'FixEscalatedEnum1774358920416'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" ADD "recipient_id" uuid`);
        await queryRunner.query(`ALTER TYPE "public"."discipline_incidents_status_enum" RENAME TO "discipline_incidents_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."discipline_incidents_status_enum" AS ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'ESCALATED')`);
        await queryRunner.query(`ALTER TABLE "discipline_incidents" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "discipline_incidents" ALTER COLUMN "status" TYPE "public"."discipline_incidents_status_enum" USING "status"::"text"::"public"."discipline_incidents_status_enum"`);
        await queryRunner.query(`ALTER TABLE "discipline_incidents" ALTER COLUMN "status" SET DEFAULT 'OPEN'`);
        await queryRunner.query(`DROP TYPE "public"."discipline_incidents_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_566c3d68184e83d4307b86f85ab" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_566c3d68184e83d4307b86f85ab"`);
        await queryRunner.query(`CREATE TYPE "public"."discipline_incidents_status_enum_old" AS ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'ESC_ALATED')`);
        await queryRunner.query(`ALTER TABLE "discipline_incidents" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "discipline_incidents" ALTER COLUMN "status" TYPE "public"."discipline_incidents_status_enum_old" USING "status"::"text"::"public"."discipline_incidents_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "discipline_incidents" ALTER COLUMN "status" SET DEFAULT 'OPEN'`);
        await queryRunner.query(`DROP TYPE "public"."discipline_incidents_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."discipline_incidents_status_enum_old" RENAME TO "discipline_incidents_status_enum"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "recipient_id"`);
    }

}
