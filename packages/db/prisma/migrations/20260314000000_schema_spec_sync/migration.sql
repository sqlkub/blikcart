-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: schema_spec_sync
-- Sync Prisma schema with blikcart_database_schema.docx spec v1.0
-- NOTE: Prisma preserves camelCase column names (quoted) in PostgreSQL.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. New enum: ConfiguratorAssetType
CREATE TYPE "ConfiguratorAssetType" AS ENUM (
  'base', 'color', 'hardware', 'padding', 'stitch', 'overlay'
);

-- 2. users: add "emailVerifiedAt"
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- 3. users: add "adminNotes" (if not already present from a prior migration)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;

-- 4. products: make "sku" nullable
ALTER TABLE "products" ALTER COLUMN "sku" DROP NOT NULL;

-- 5. products: fix "leadTimeDays" default (0 → 21)
ALTER TABLE "products" ALTER COLUMN "leadTimeDays" SET DEFAULT 21;

-- 6. configurator_schemas: add "currentVersionId" FK → schema_versions
ALTER TABLE "configurator_schemas"
  ADD COLUMN "currentVersionId" TEXT;

ALTER TABLE "configurator_schemas"
  ADD CONSTRAINT "configurator_schemas_currentVersionId_fkey"
  FOREIGN KEY ("currentVersionId")
  REFERENCES "schema_versions"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 7. schema_versions: add "createdById" FK → users
ALTER TABLE "schema_versions"
  ADD COLUMN "createdById" TEXT;

ALTER TABLE "schema_versions"
  ADD CONSTRAINT "schema_versions_createdById_fkey"
  FOREIGN KEY ("createdById")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 8. configurator_assets: migrate "assetType" from TEXT to enum
--    Add new typed column
ALTER TABLE "configurator_assets"
  ADD COLUMN "assetTypeEnum" "ConfiguratorAssetType";

--    Copy existing valid values
UPDATE "configurator_assets"
SET "assetTypeEnum" = "assetType"::"ConfiguratorAssetType"
WHERE "assetType" IN ('base','color','hardware','padding','stitch','overlay');

--    Drop old TEXT column, rename new enum column
ALTER TABLE "configurator_assets" DROP COLUMN "assetType";
ALTER TABLE "configurator_assets" RENAME COLUMN "assetTypeEnum" TO "assetType";

-- 9. order_items: add "productName" (snapshot product name at order time)
ALTER TABLE "order_items"
  ADD COLUMN "productName" TEXT NOT NULL DEFAULT '';

ALTER TABLE "order_items"
  ALTER COLUMN "productName" DROP DEFAULT;

-- 10. quote_revisions: add "createdById" FK → users
ALTER TABLE "quote_revisions"
  ADD COLUMN "createdById" TEXT;

ALTER TABLE "quote_revisions"
  ADD CONSTRAINT "quote_revisions_createdById_fkey"
  FOREIGN KEY ("createdById")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 11. carts: make "expiresAt" nullable (guest carts do not require expiry)
ALTER TABLE "carts" ALTER COLUMN "expiresAt" DROP NOT NULL;
