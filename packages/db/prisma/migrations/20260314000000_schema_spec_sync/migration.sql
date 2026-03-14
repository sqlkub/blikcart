-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: schema_spec_sync
-- Sync Prisma schema with blikcart_database_schema.docx spec v1.0
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. New enum: ConfiguratorAssetType
CREATE TYPE "ConfiguratorAssetType" AS ENUM (
  'base', 'color', 'hardware', 'padding', 'stitch', 'overlay'
);

-- 2. users: add email_verified_at
ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMPTZ;

-- 3. products: make sku nullable, fix lead_time_days default
ALTER TABLE "products" ALTER COLUMN "sku" DROP NOT NULL;
ALTER TABLE "products" ALTER COLUMN "lead_time_days" SET DEFAULT 21;

-- 4. configurator_schemas: add current_version_id FK
ALTER TABLE "configurator_schemas"
  ADD COLUMN "current_version_id" UUID;

ALTER TABLE "configurator_schemas"
  ADD CONSTRAINT "configurator_schemas_current_version_id_fkey"
  FOREIGN KEY ("current_version_id")
  REFERENCES "schema_versions"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 5. schema_versions: add created_by_id FK
ALTER TABLE "schema_versions"
  ADD COLUMN "created_by_id" UUID;

ALTER TABLE "schema_versions"
  ADD CONSTRAINT "schema_versions_created_by_id_fkey"
  FOREIGN KEY ("created_by_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 6. configurator_assets: migrate asset_type from TEXT to enum
--    Step 1: add a new typed column
ALTER TABLE "configurator_assets"
  ADD COLUMN "asset_type_new" "ConfiguratorAssetType";

--    Step 2: copy existing data (cast valid values; unknown values become NULL)
UPDATE "configurator_assets"
SET "asset_type_new" = "asset_type"::"ConfiguratorAssetType"
WHERE "asset_type" IN ('base','color','hardware','padding','stitch','overlay');

--    Step 3: drop old column, rename new
ALTER TABLE "configurator_assets" DROP COLUMN "asset_type";
ALTER TABLE "configurator_assets" RENAME COLUMN "asset_type_new" TO "asset_type";

-- 7. order_items: add product_name (capture name at time of order)
ALTER TABLE "order_items"
  ADD COLUMN "product_name" VARCHAR(255) NOT NULL DEFAULT '';

-- Remove the default after backfill so it's a real required field going forward
ALTER TABLE "order_items"
  ALTER COLUMN "product_name" DROP DEFAULT;

-- 8. quote_revisions: add created_by_id FK
ALTER TABLE "quote_revisions"
  ADD COLUMN "created_by_id" UUID;

ALTER TABLE "quote_revisions"
  ADD CONSTRAINT "quote_revisions_created_by_id_fkey"
  FOREIGN KEY ("created_by_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 9. carts: make expires_at nullable (guest cart expiry is optional)
ALTER TABLE "carts" ALTER COLUMN "expires_at" DROP NOT NULL;
