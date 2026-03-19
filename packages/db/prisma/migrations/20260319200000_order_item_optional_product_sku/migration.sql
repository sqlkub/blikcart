-- Make productId optional and add sku field to order_items
-- This allows bulk imports with B2B client-internal SKUs that don't exist in the product catalog

-- Drop the existing NOT NULL foreign key constraint
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_productId_fkey";

-- Make productId nullable
ALTER TABLE "order_items" ALTER COLUMN "productId" DROP NOT NULL;

-- Add sku column for storing client-provided SKU codes
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "sku" TEXT;

-- Re-add foreign key as optional (allows NULL)
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
