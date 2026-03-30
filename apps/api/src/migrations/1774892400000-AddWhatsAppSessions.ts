import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWhatsAppSessions1774892400000 implements MigrationInterface {
  name = 'AddWhatsAppSessions1774892400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "whatsapp_sessions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "phone_number" TEXT NOT NULL UNIQUE,
        "parent_id" UUID REFERENCES users(id) ON DELETE SET NULL,
        "selected_child_id" UUID REFERENCES students(id) ON DELETE SET NULL,
        "context" JSONB NOT NULL DEFAULT '[]',
        "state" VARCHAR(64) NOT NULL DEFAULT 'idle',
        "pending_action" JSONB,
        "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_whatsapp_sessions_phone_number" ON "whatsapp_sessions" ("phone_number")`);
    await queryRunner.query(`CREATE INDEX "IDX_whatsapp_sessions_parent_id" ON "whatsapp_sessions" ("parent_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_whatsapp_sessions_parent_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_whatsapp_sessions_phone_number"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "whatsapp_sessions"`);
  }
}
