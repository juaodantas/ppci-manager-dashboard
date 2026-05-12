ALTER TABLE "variable_costs"
  ADD COLUMN "interest_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE "variable_costs"
  ADD CONSTRAINT "CHK_variable_costs_interest_amount_non_negative"
  CHECK ("interest_amount" >= 0);
