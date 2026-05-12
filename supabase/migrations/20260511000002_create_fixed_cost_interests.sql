CREATE TABLE "fixed_cost_interests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "fixed_cost_id" UUID NOT NULL,
  "reference_year" INT NOT NULL,
  "reference_month" INT NOT NULL CHECK ("reference_month" BETWEEN 1 AND 12),
  "interest_amount" DECIMAL(10,2) NOT NULL CHECK ("interest_amount" >= 0),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_fixed_cost_interests" PRIMARY KEY ("id"),
  CONSTRAINT "FK_fixed_cost_interests_fixed_cost" FOREIGN KEY ("fixed_cost_id")
    REFERENCES "fixed_costs" ("id") ON DELETE CASCADE,
  CONSTRAINT "UQ_fixed_cost_interests_competence"
    UNIQUE ("fixed_cost_id", "reference_year", "reference_month")
);

CREATE INDEX "IDX_fixed_cost_interests_fixed_cost" ON "fixed_cost_interests" ("fixed_cost_id");
CREATE INDEX "IDX_fixed_cost_interests_competence" ON "fixed_cost_interests" ("reference_year", "reference_month");
