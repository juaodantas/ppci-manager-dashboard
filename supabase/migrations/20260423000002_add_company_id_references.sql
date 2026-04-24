-- ============================================================
-- Add company_id FK to projects, quotes, fixed_costs, variable_costs
-- ============================================================

ALTER TABLE "projects" ADD COLUMN "company_id" UUID REFERENCES "companies" ("id");
ALTER TABLE "quotes" ADD COLUMN "company_id" UUID REFERENCES "companies" ("id");
ALTER TABLE "fixed_costs" ADD COLUMN "company_id" UUID REFERENCES "companies" ("id");
ALTER TABLE "variable_costs" ADD COLUMN "company_id" UUID REFERENCES "companies" ("id");

CREATE INDEX "projects_company_id_idx" ON "projects" ("company_id");
CREATE INDEX "quotes_company_id_idx" ON "quotes" ("company_id");
CREATE INDEX "fixed_costs_company_id_idx" ON "fixed_costs" ("company_id");
CREATE INDEX "variable_costs_company_id_idx" ON "variable_costs" ("company_id");
