import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAttendanceAndDiscipline1774276222763 implements MigrationInterface {
    name = 'AddAttendanceAndDiscipline1774276222763'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "discipline_scores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" integer NOT NULL DEFAULT '100', "total_incidents" integer NOT NULL DEFAULT '0', "last_incident_at" TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "student_id" uuid, CONSTRAINT "REL_0dcad9358ee76225d9cf96f937" UNIQUE ("student_id"), CONSTRAINT "PK_decb7c584c90aca4bcd2a5c5af2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."discipline_incidents_incident_type_enum" AS ENUM('MISCONDUCT', 'ABSENTEEISM', 'VIOLENCE', 'SUBSTANCE_ABUSE', 'INSUBORDINATION', 'BULLYING', 'ACADEMIC_DISHONESTY', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."discipline_incidents_severity_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`);
        await queryRunner.query(`CREATE TYPE "public"."discipline_incidents_status_enum" AS ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'ESC_ALATED')`);
        await queryRunner.query(`CREATE TABLE "discipline_incidents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "incident_type" "public"."discipline_incidents_incident_type_enum" NOT NULL, "severity" "public"."discipline_incidents_severity_enum" NOT NULL, "description" text NOT NULL, "action_taken" character varying, "status" "public"."discipline_incidents_status_enum" NOT NULL DEFAULT 'OPEN', "incident_date" date NOT NULL, "resolved_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "student_id" uuid, "reported_by_id" uuid, "reviewed_by_id" uuid, CONSTRAINT "PK_6ca56915b63e4b37bad3ecbd425" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9a0e6e4725532ffa510b59ad5c" ON "discipline_incidents" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a199e73308a7fa492d124ad55b" ON "discipline_incidents" ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."attendance_status_enum" AS ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')`);
        await queryRunner.query(`CREATE TABLE "attendance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "status" "public"."attendance_status_enum" NOT NULL, "remarks" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "student_id" uuid, "recorded_by_id" uuid, CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ca727371ba6376f1acdec2a6db" ON "attendance" ("student_id", "date") `);
        await queryRunner.query(`ALTER TABLE "discipline_scores" ADD CONSTRAINT "FK_0dcad9358ee76225d9cf96f9370" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "discipline_incidents" ADD CONSTRAINT "FK_9a0e6e4725532ffa510b59ad5ce" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "discipline_incidents" ADD CONSTRAINT "FK_3e3bd0631b752b33597f3dba8b7" FOREIGN KEY ("reported_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "discipline_incidents" ADD CONSTRAINT "FK_8113904ede50d9dc60a7e87d176" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_6200532f3ef99f639a27bdcae7f" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_17bb15a4c1188987b0e9d7bc33b" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_17bb15a4c1188987b0e9d7bc33b"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_6200532f3ef99f639a27bdcae7f"`);
        await queryRunner.query(`ALTER TABLE "discipline_incidents" DROP CONSTRAINT "FK_8113904ede50d9dc60a7e87d176"`);
        await queryRunner.query(`ALTER TABLE "discipline_incidents" DROP CONSTRAINT "FK_3e3bd0631b752b33597f3dba8b7"`);
        await queryRunner.query(`ALTER TABLE "discipline_incidents" DROP CONSTRAINT "FK_9a0e6e4725532ffa510b59ad5ce"`);
        await queryRunner.query(`ALTER TABLE "discipline_scores" DROP CONSTRAINT "FK_0dcad9358ee76225d9cf96f9370"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ca727371ba6376f1acdec2a6db"`);
        await queryRunner.query(`DROP TABLE "attendance"`);
        await queryRunner.query(`DROP TYPE "public"."attendance_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a199e73308a7fa492d124ad55b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a0e6e4725532ffa510b59ad5c"`);
        await queryRunner.query(`DROP TABLE "discipline_incidents"`);
        await queryRunner.query(`DROP TYPE "public"."discipline_incidents_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."discipline_incidents_severity_enum"`);
        await queryRunner.query(`DROP TYPE "public"."discipline_incidents_incident_type_enum"`);
        await queryRunner.query(`DROP TABLE "discipline_scores"`);
    }

}
