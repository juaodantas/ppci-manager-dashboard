ALTER TABLE "fixed_cost_monthly_entries"
  DROP CONSTRAINT IF EXISTS "fixed_cost_monthly_entries_interest_amount_check";

ALTER TABLE "fixed_cost_monthly_entries"
  DROP CONSTRAINT IF EXISTS "CHK_fixed_cost_monthly_entries_total_non_negative";

ALTER TABLE "fixed_cost_monthly_entries"
  ADD CONSTRAINT "CHK_fixed_cost_monthly_entries_total_non_negative"
  CHECK ("amount" + "interest_amount" >= 0);
