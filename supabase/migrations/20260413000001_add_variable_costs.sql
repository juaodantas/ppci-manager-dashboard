-- ============================================================
-- Add variable_costs table and integrate with financial_entries
-- ============================================================

CREATE TABLE "variable_costs" (
  "id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
  "name"        VARCHAR(255)  NOT NULL,
  "amount"      DECIMAL(10,2) NOT NULL,
  "date"        DATE          NOT NULL,
  "category"    VARCHAR(100),
  "description" TEXT,
  "created_at"  TIMESTAMP     NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMP     NOT NULL DEFAULT now(),
  CONSTRAINT "PK_variable_costs" PRIMARY KEY ("id")
);

CREATE INDEX "IDX_variable_costs_date"     ON "variable_costs" ("date");
CREATE INDEX "IDX_variable_costs_category"  ON "variable_costs" ("category");

-- Adicionar 'variable_cost' ao CHECK de source_type em financial_entries
ALTER TABLE "financial_entries"
  DROP CONSTRAINT IF EXISTS "financial_entries_source_type_check";

ALTER TABLE "financial_entries"
  ADD CONSTRAINT "financial_entries_source_type_check"
  CHECK (source_type IN ('payment', 'fixed_cost', 'variable_cost'));
