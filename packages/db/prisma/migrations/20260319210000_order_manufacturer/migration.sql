-- Add manufacturerId to orders for direct manufacturer assignment
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "manufacturerId" TEXT;

ALTER TABLE "orders" ADD CONSTRAINT "orders_manufacturerId_fkey"
  FOREIGN KEY ("manufacturerId") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
