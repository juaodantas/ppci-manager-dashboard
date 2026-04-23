-- ============================================================
-- Add periodization fields to fixed_costs
-- ============================================================

ALTER TABLE "fixed_costs"
  ADD COLUMN "start_date" DATE,
  ADD COLUMN "end_date" DATE;

UPDATE "fixed_costs"
SET "start_date" = "created_at"::date
WHERE "start_date" IS NULL;

ALTER TABLE "fixed_costs"
  ALTER COLUMN "start_date" SET DEFAULT CURRENT_DATE,
  ALTER COLUMN "start_date" SET NOT NULL;
