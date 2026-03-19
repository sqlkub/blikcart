-- CreateEnum
CREATE TYPE "SampleStatus" AS ENUM ('requested', 'in_review', 'sample_sent', 'approved', 'rejected', 'revision_requested');

-- CreateTable
CREATE TABLE "samples" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "description" TEXT,
    "status" "SampleStatus" NOT NULL DEFAULT 'requested',
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentSampleId" TEXT,
    "configSnapshot" JSONB NOT NULL,
    "schemaVersionId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "samplingFee" DECIMAL(10,2),
    "samplingFeeRecovered" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "clientNotes" TEXT,
    "referenceFiles" TEXT[],
    "approvedAt" TIMESTAMP(3),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_templates" (
    "id" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categorySlug" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "configSnapshot" JSONB NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sample_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "samples_userId_status_idx" ON "samples"("userId", "status");

-- CreateIndex
CREATE INDEX "samples_status_requestedAt_idx" ON "samples"("status", "requestedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sample_templates_sampleId_key" ON "sample_templates"("sampleId");

-- CreateIndex
CREATE INDEX "sample_templates_categorySlug_isPublic_idx" ON "sample_templates"("categorySlug", "isPublic");

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_parentSampleId_fkey" FOREIGN KEY ("parentSampleId") REFERENCES "samples"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_templates" ADD CONSTRAINT "sample_templates_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
