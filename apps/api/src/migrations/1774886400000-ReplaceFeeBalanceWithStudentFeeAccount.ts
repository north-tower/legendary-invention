import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceFeeBalanceWithStudentFeeAccount1774886400000
  implements MigrationInterface
{
  name = 'ReplaceFeeBalanceWithStudentFeeAccount1774886400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "fee_balances"`);
    await queryRunner.query(
      `CREATE TYPE "public"."student_fee_accounts_status_enum" AS ENUM('PENDING', 'PARTIAL', 'CLEARED', 'OVERPAID')`,
    );
    await queryRunner.query(
      `CREATE TABLE "student_fee_accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "billed_amount" numeric(10,2) NOT NULL,
        "exemption_amount" numeric(10,2) NOT NULL DEFAULT '0',
        "exemption_reason" text,
        "arrears_brought_forward" numeric(10,2) NOT NULL DEFAULT '0',
        "total_paid" numeric(10,2) NOT NULL DEFAULT '0',
        "balance" numeric(10,2) NOT NULL DEFAULT '0',
        "status" "public"."student_fee_accounts_status_enum" NOT NULL DEFAULT 'PENDING',
        "last_payment_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "student_id" uuid NOT NULL,
        "fee_structure_id" uuid NOT NULL,
        CONSTRAINT "UQ_student_fee_accounts_student_structure" UNIQUE ("student_id", "fee_structure_id"),
        CONSTRAINT "PK_student_fee_accounts_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "student_fee_accounts"
        ADD CONSTRAINT "FK_student_fee_accounts_student"
        FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_fee_accounts"
        ADD CONSTRAINT "FK_student_fee_accounts_fee_structure"
        FOREIGN KEY ("fee_structure_id") REFERENCES "fee_structures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "fee_payments" DROP CONSTRAINT IF EXISTS "FK_f6a8cb8f8a4834651c04a425fc1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_payments" DROP COLUMN IF EXISTS "fee_structure_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_payments" ADD COLUMN "student_fee_account_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_payments"
        ADD CONSTRAINT "FK_fee_payments_student_fee_account"
        FOREIGN KEY ("student_fee_account_id") REFERENCES "student_fee_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`CREATE INDEX "IDX_student_fee_accounts_student" ON "student_fee_accounts" ("student_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_student_fee_accounts_fee_structure" ON "student_fee_accounts" ("fee_structure_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_student_fee_accounts_status" ON "student_fee_accounts" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_student_fee_accounts_balance" ON "student_fee_accounts" ("balance" DESC)`);
    await queryRunner.query(`CREATE INDEX "IDX_fee_payments_student_fee_account" ON "fee_payments" ("student_fee_account_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_fee_payments_student_fee_account"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_student_fee_accounts_balance"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_student_fee_accounts_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_student_fee_accounts_fee_structure"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_student_fee_accounts_student"`);

    await queryRunner.query(
      `ALTER TABLE "fee_payments" DROP CONSTRAINT IF EXISTS "FK_fee_payments_student_fee_account"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_payments" DROP COLUMN IF EXISTS "student_fee_account_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_payments" ADD COLUMN "fee_structure_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_payments"
        ADD CONSTRAINT "FK_f6a8cb8f8a4834651c04a425fc1"
        FOREIGN KEY ("fee_structure_id") REFERENCES "fee_structures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`ALTER TABLE "student_fee_accounts" DROP CONSTRAINT "FK_student_fee_accounts_fee_structure"`);
    await queryRunner.query(`ALTER TABLE "student_fee_accounts" DROP CONSTRAINT "FK_student_fee_accounts_student"`);
    await queryRunner.query(`DROP TABLE "student_fee_accounts"`);
    await queryRunner.query(`DROP TYPE "public"."student_fee_accounts_status_enum"`);

    await queryRunner.query(
      `CREATE TABLE "fee_balances" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "total_billed" numeric(10,2) NOT NULL,
        "total_paid" numeric(10,2) NOT NULL DEFAULT '0',
        "balance" numeric(10,2) NOT NULL,
        "last_payment_at" TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "student_id" uuid,
        "fee_structure_id" uuid,
        CONSTRAINT "REL_f135fbb6c24566c1935247c5c2" UNIQUE ("student_id"),
        CONSTRAINT "PK_6b927566a644d744362f965bf10" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_balances"
        ADD CONSTRAINT "FK_f135fbb6c24566c1935247c5c2e"
        FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_balances"
        ADD CONSTRAINT "FK_bb6df787e670dc2ad1671e2261a"
        FOREIGN KEY ("fee_structure_id") REFERENCES "fee_structures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
