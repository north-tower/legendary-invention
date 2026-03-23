import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1774275748584 implements MigrationInterface {
    name = 'InitSchema1774275748584'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('principal', 'deputy_principal', 'hod', 'class_teacher', 'accountant', 'parent', 'nurse')`);
        await queryRunner.query(`CREATE TYPE "public"."users_gender_enum" AS ENUM('male', 'female')`);
        await queryRunner.query(`CREATE TYPE "public"."users_assigned_form_enum" AS ENUM('form_1', 'form_2', 'form_3', 'form_4')`);
        await queryRunner.query(`CREATE TYPE "public"."users_assigned_stream_enum" AS ENUM('A', 'B', 'C', 'D')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "full_name" character varying NOT NULL, "phone" character varying, "role" "public"."users_role_enum" NOT NULL, "gender" "public"."users_gender_enum", "password_hash" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "assigned_form" "public"."users_assigned_form_enum", "assigned_stream" "public"."users_assigned_stream_enum", "department" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."students_form_enum" AS ENUM('form_1', 'form_2', 'form_3', 'form_4')`);
        await queryRunner.query(`CREATE TYPE "public"."students_stream_enum" AS ENUM('A', 'B', 'C', 'D')`);
        await queryRunner.query(`CREATE TYPE "public"."students_gender_enum" AS ENUM('male', 'female')`);
        await queryRunner.query(`CREATE TABLE "students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying NOT NULL, "admission_number" character varying NOT NULL, "form" "public"."students_form_enum" NOT NULL, "stream" "public"."students_stream_enum" NOT NULL, "gender" "public"."students_gender_enum" NOT NULL, "date_of_birth" date, "blood_type" character varying, "allergies" text, "emergency_contact" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "parent_id" uuid, CONSTRAINT "UQ_3a5a65fd14ee5058740f7e119e5" UNIQUE ("admission_number"), CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "refresh_token_hash" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_209313beb8d3f51f7ad69214d90" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_209313beb8d3f51f7ad69214d90"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP TABLE "students"`);
        await queryRunner.query(`DROP TYPE "public"."students_gender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."students_stream_enum"`);
        await queryRunner.query(`DROP TYPE "public"."students_form_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_assigned_stream_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_assigned_form_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
