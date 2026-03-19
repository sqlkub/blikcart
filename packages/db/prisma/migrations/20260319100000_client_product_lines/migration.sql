-- CreateEnum
CREATE TYPE "ClientProductStatus" AS ENUM ('draft', 'in_development', 'approved', 'discontinued');

-- CreateEnum
CREATE TYPE "ProformaStatus" AS ENUM ('draft', 'sent', 'approved', 'rejected');

-- CreateTable: manufacturers
CREATE TABLE "manufacturers" (
    "id"           TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "country"      TEXT,
    "contactName"  TEXT,
    "contactEmail" TEXT,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 21,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "notes"        TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: client_products
CREATE TABLE "client_products" (
    "id"                   TEXT NOT NULL,
    "clientId"             TEXT NOT NULL,
    "name"                 TEXT NOT NULL,
    "category"             TEXT NOT NULL,
    "specifications"       JSONB NOT NULL DEFAULT '{}',
    "images"               TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status"               "ClientProductStatus" NOT NULL DEFAULT 'draft',
    "version"              INTEGER NOT NULL DEFAULT 1,
    "parentId"             TEXT,
    "basePrice"            DECIMAL(10,2) NOT NULL,
    "unitPrice"            DECIMAL(10,2) NOT NULL,
    "moq"                  INTEGER NOT NULL DEFAULT 1,
    "leadTimeDays"         INTEGER NOT NULL DEFAULT 21,
    "manufacturerId"       TEXT,
    "backupManufacturerId" TEXT,
    "adminNotes"           TEXT,
    "clientNotes"          TEXT,
    "sampleId"             TEXT,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: client_product_reorders
CREATE TABLE "client_product_reorders" (
    "id"              TEXT NOT NULL,
    "clientProductId" TEXT NOT NULL,
    "clientId"        TEXT NOT NULL,
    "quantity"        INTEGER NOT NULL,
    "unitPrice"       DECIMAL(10,2) NOT NULL,
    "totalPrice"      DECIMAL(10,2) NOT NULL,
    "status"          TEXT NOT NULL DEFAULT 'pending',
    "notes"           TEXT,
    "proformaId"      TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_product_reorders_pkey" PRIMARY KEY ("id")
);

-- CreateTable: proforma_invoices
CREATE TABLE "proforma_invoices" (
    "id"                TEXT NOT NULL,
    "invoiceNumber"     TEXT NOT NULL,
    "clientId"          TEXT NOT NULL,
    "status"            "ProformaStatus" NOT NULL DEFAULT 'draft',
    "lines"             JSONB NOT NULL DEFAULT '[]',
    "clientDetails"     JSONB NOT NULL DEFAULT '{}',
    "subtotal"          DECIMAL(10,2) NOT NULL,
    "taxAmount"         DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total"             DECIMAL(10,2) NOT NULL,
    "currency"          TEXT NOT NULL DEFAULT 'EUR',
    "estimatedDelivery" INTEGER NOT NULL DEFAULT 21,
    "notes"             TEXT,
    "sentAt"            TIMESTAMP(3),
    "approvedAt"        TIMESTAMP(3),
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "proforma_invoices_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
ALTER TABLE "proforma_invoices" ADD CONSTRAINT "proforma_invoices_invoiceNumber_key" UNIQUE ("invoiceNumber");

-- Foreign keys: client_products
ALTER TABLE "client_products"
    ADD CONSTRAINT "client_products_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "client_products_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "client_products"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "client_products_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "client_products_backupManufacturerId_fkey" FOREIGN KEY ("backupManufacturerId") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign keys: client_product_reorders
ALTER TABLE "client_product_reorders"
    ADD CONSTRAINT "client_product_reorders_clientProductId_fkey" FOREIGN KEY ("clientProductId") REFERENCES "client_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "client_product_reorders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "client_product_reorders_proformaId_fkey" FOREIGN KEY ("proformaId") REFERENCES "proforma_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign keys: proforma_invoices
ALTER TABLE "proforma_invoices"
    ADD CONSTRAINT "proforma_invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "client_products_clientId_status_idx" ON "client_products"("clientId", "status");
CREATE INDEX "client_products_status_idx" ON "client_products"("status");
CREATE INDEX "client_product_reorders_clientId_idx" ON "client_product_reorders"("clientId");
CREATE INDEX "proforma_invoices_clientId_status_idx" ON "proforma_invoices"("clientId", "status");
