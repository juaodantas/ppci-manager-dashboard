-- ============================================================
-- Create companies table + company_type enum
-- ============================================================

CREATE TYPE "company_type_enum" AS ENUM ('internal', 'supplier', 'outsourced');

CREATE TABLE "companies" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "cnpj" TEXT NOT NULL,
  "responsible" TEXT NOT NULL,
  "type" "company_type_enum" NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_companies" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies" ("cnpj");
CREATE INDEX "companies_type_idx" ON "companies" ("type");
