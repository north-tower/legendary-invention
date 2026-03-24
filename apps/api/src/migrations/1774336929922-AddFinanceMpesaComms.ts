import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFinanceMpesaComms1774336929922 implements MigrationInterface {
    name = 'AddFinanceMpesaComms1774336929922'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."mpesa_transactions_status_enum" AS ENUM('INITIATED', 'SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "mpesa_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "checkout_request_id" character varying NOT NULL, "merchant_request_id" character varying NOT NULL, "phone_number" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "result_code" character varying, "result_desc" character varying, "mpesa_receipt" character varying, "status" "public"."mpesa_transactions_status_enum" NOT NULL DEFAULT 'INITIATED', "initiated_at" TIMESTAMP NOT NULL DEFAULT now(), "completed_at" TIMESTAMP, "raw_callback" jsonb, "student_id" uuid, CONSTRAINT "UQ_6e7336f2c404c7fbc41eb3c6876" UNIQUE ("checkout_request_id"), CONSTRAINT "PK_f5805e601b2ee42a565692a2c66" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."fee_structures_form_enum" AS ENUM('form_1', 'form_2', 'form_3', 'form_4')`);
        await queryRunner.query(`CREATE TYPE "public"."fee_structures_term_enum" AS ENUM('TERM_1', 'TERM_2', 'TERM_3')`);
        await queryRunner.query(`CREATE TABLE "fee_structures" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "form" "public"."fee_structures_form_enum" NOT NULL, "academic_year" character varying NOT NULL, "term" "public"."fee_structures_term_enum" NOT NULL, "total_amount" numeric(10,2) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_id" uuid, CONSTRAINT "PK_d634078deb9cf5ceb5788ad9b53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "medical_cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "blood_type" character varying, "allergies" text NOT NULL DEFAULT '', "chronic_conditions" text NOT NULL DEFAULT '', "current_medications" text NOT NULL DEFAULT '', "emergency_contact_name" character varying NOT NULL, "emergency_contact_phone" character varying NOT NULL, "emergency_contact_relation" character varying NOT NULL, "medical_notes" text, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "student_id" uuid, "last_updated_by_id" uuid, CONSTRAINT "REL_3011129e5ed27ed746ff86092e" UNIQUE ("student_id"), CONSTRAINT "PK_0a5fe330790fd6e28620012c0e0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."fee_payments_payment_method_enum" AS ENUM('MPESA', 'CASH', 'BANK_TRANSFER')`);
        await queryRunner.query(`CREATE TYPE "public"."fee_payments_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')`);
        await queryRunner.query(`CREATE TABLE "fee_payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(10,2) NOT NULL, "payment_method" "public"."fee_payments_payment_method_enum" NOT NULL, "mpesa_receipt" character varying, "mpesa_phone" character varying, "transaction_date" TIMESTAMP NOT NULL, "status" "public"."fee_payments_status_enum" NOT NULL DEFAULT 'COMPLETED', "notes" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "student_id" uuid, "fee_structure_id" uuid, "recorded_by_id" uuid, CONSTRAINT "UQ_fbb0a05801fc0f322d06c8f613d" UNIQUE ("mpesa_receipt"), CONSTRAINT "PK_9bd9fdfc57a96cadaefe822956d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "fee_balances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "total_billed" numeric(10,2) NOT NULL, "total_paid" numeric(10,2) NOT NULL DEFAULT '0', "balance" numeric(10,2) NOT NULL, "last_payment_at" TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "student_id" uuid, "fee_structure_id" uuid, CONSTRAINT "REL_f135fbb6c24566c1935247c5c2" UNIQUE ("student_id"), CONSTRAINT "PK_6b927566a644d744362f965bf10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."messages_priority_enum" AS ENUM('NORMAL', 'URGENT', 'FINANCIAL', 'ACADEMIC')`);
        await queryRunner.query(`CREATE TYPE "public"."messages_triage_label_enum" AS ENUM('FEE_QUERY', 'ACADEMIC_CONCERN', 'DISCIPLINARY', 'EMERGENCY', 'GENERAL_INQUIRY', 'COMPLAINT', 'PRAISE')`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subject" character varying NOT NULL, "body" text NOT NULL, "priority" "public"."messages_priority_enum" NOT NULL DEFAULT 'NORMAL', "triage_label" "public"."messages_triage_label_enum", "triage_confidence" numeric(3,2), "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "sender_id" uuid, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "mpesa_transactions" ADD CONSTRAINT "FK_9b60fb22ed79c10b0af08677305" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fee_structures" ADD CONSTRAINT "FK_e643074ef896a3789373c64b0a7" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_cards" ADD CONSTRAINT "FK_3011129e5ed27ed746ff86092e2" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_cards" ADD CONSTRAINT "FK_e495e2a21e2f8d795d1234a2c38" FOREIGN KEY ("last_updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fee_payments" ADD CONSTRAINT "FK_95be930f1a87918852588fa4ad2" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fee_payments" ADD CONSTRAINT "FK_f6a8cb8f8a4834651c04a425fc1" FOREIGN KEY ("fee_structure_id") REFERENCES "fee_structures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fee_payments" ADD CONSTRAINT "FK_33cdd65074a3e255c1b51bad886" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fee_balances" ADD CONSTRAINT "FK_f135fbb6c24566c1935247c5c2e" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fee_balances" ADD CONSTRAINT "FK_bb6df787e670dc2ad1671e2261a" FOREIGN KEY ("fee_structure_id") REFERENCES "fee_structures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "fee_balances" DROP CONSTRAINT "FK_bb6df787e670dc2ad1671e2261a"`);
        await queryRunner.query(`ALTER TABLE "fee_balances" DROP CONSTRAINT "FK_f135fbb6c24566c1935247c5c2e"`);
        await queryRunner.query(`ALTER TABLE "fee_payments" DROP CONSTRAINT "FK_33cdd65074a3e255c1b51bad886"`);
        await queryRunner.query(`ALTER TABLE "fee_payments" DROP CONSTRAINT "FK_f6a8cb8f8a4834651c04a425fc1"`);
        await queryRunner.query(`ALTER TABLE "fee_payments" DROP CONSTRAINT "FK_95be930f1a87918852588fa4ad2"`);
        await queryRunner.query(`ALTER TABLE "medical_cards" DROP CONSTRAINT "FK_e495e2a21e2f8d795d1234a2c38"`);
        await queryRunner.query(`ALTER TABLE "medical_cards" DROP CONSTRAINT "FK_3011129e5ed27ed746ff86092e2"`);
        await queryRunner.query(`ALTER TABLE "fee_structures" DROP CONSTRAINT "FK_e643074ef896a3789373c64b0a7"`);
        await queryRunner.query(`ALTER TABLE "mpesa_transactions" DROP CONSTRAINT "FK_9b60fb22ed79c10b0af08677305"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TYPE "public"."messages_triage_label_enum"`);
        await queryRunner.query(`DROP TYPE "public"."messages_priority_enum"`);
        await queryRunner.query(`DROP TABLE "fee_balances"`);
        await queryRunner.query(`DROP TABLE "fee_payments"`);
        await queryRunner.query(`DROP TYPE "public"."fee_payments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."fee_payments_payment_method_enum"`);
        await queryRunner.query(`DROP TABLE "medical_cards"`);
        await queryRunner.query(`DROP TABLE "fee_structures"`);
        await queryRunner.query(`DROP TYPE "public"."fee_structures_term_enum"`);
        await queryRunner.query(`DROP TYPE "public"."fee_structures_form_enum"`);
        await queryRunner.query(`DROP TABLE "mpesa_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."mpesa_transactions_status_enum"`);
    }

}
