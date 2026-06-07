CREATE TABLE "fixed_cost_months" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reference_year" INT NOT NULL CHECK ("reference_year" BETWEEN 1900 AND 9999),
  "reference_month" INT NOT NULL CHECK ("reference_month" BETWEEN 1 AND 12),
  "company_id" UUID,
  "status" TEXT NOT NULL DEFAULT 'open' CHECK ("status" IN ('open', 'confirmed', 'closed')),
  "confirmed_at" TIMESTAMP,
  "closed_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_fixed_cost_months" PRIMARY KEY ("id"),
  CONSTRAINT "FK_fixed_cost_months_company" FOREIGN KEY ("company_id")
    REFERENCES "companies" ("id") ON DELETE SET NULL,
  CONSTRAINT "UQ_fixed_cost_months_competence"
    UNIQUE ("reference_year", "reference_month", "company_id")
);

CREATE TABLE "fixed_cost_monthly_entries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "fixed_cost_id" UUID NOT NULL,
  "reference_year" INT NOT NULL CHECK ("reference_year" BETWEEN 1900 AND 9999),
  "reference_month" INT NOT NULL CHECK ("reference_month" BETWEEN 1 AND 12),
  "amount" DECIMAL(10,2) NOT NULL CHECK ("amount" >= 0),
  "interest_amount" DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK ("interest_amount" >= 0),
  "due_day" INT NOT NULL CHECK ("due_day" BETWEEN 1 AND 31),
  "name" TEXT NOT NULL,
  "category" TEXT,
  "company_id" UUID,
  "included" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT NOT NULL DEFAULT 'edited' CHECK ("status" IN ('edited', 'confirmed', 'closed')),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "confirmed_at" TIMESTAMP,
  "closed_at" TIMESTAMP,
  CONSTRAINT "PK_fixed_cost_monthly_entries" PRIMARY KEY ("id"),
  CONSTRAINT "FK_fixed_cost_monthly_entries_fixed_cost" FOREIGN KEY ("fixed_cost_id")
    REFERENCES "fixed_costs" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_fixed_cost_monthly_entries_company" FOREIGN KEY ("company_id")
    REFERENCES "companies" ("id") ON DELETE SET NULL,
  CONSTRAINT "UQ_fixed_cost_monthly_entries_competence"
    UNIQUE ("fixed_cost_id", "reference_year", "reference_month")
);

CREATE INDEX "IDX_fixed_cost_months_competence" ON "fixed_cost_months" ("reference_year", "reference_month");
CREATE UNIQUE INDEX "UQ_fixed_cost_months_general_competence"
  ON "fixed_cost_months" ("reference_year", "reference_month")
  WHERE "company_id" IS NULL;
CREATE INDEX "IDX_fixed_cost_monthly_entries_competence" ON "fixed_cost_monthly_entries" ("reference_year", "reference_month");
CREATE INDEX "IDX_fixed_cost_monthly_entries_fixed_cost" ON "fixed_cost_monthly_entries" ("fixed_cost_id");
