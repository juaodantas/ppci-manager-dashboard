-- ============================================================
-- M8 — Project services: tax deductions
-- ============================================================

-- Enums
CREATE TYPE "project_service_type_enum" AS ENUM ('service', 'tax_deduction');
CREATE TYPE "project_tax_status_enum" AS ENUM ('not_issued', 'issued');

-- Fields on project_services
ALTER TABLE "project_services"
  ADD COLUMN "service_type" project_service_type_enum NOT NULL DEFAULT 'service',
  ADD COLUMN "tax_status" project_tax_status_enum,
  ADD COLUMN "tax_issued_at" DATE,
  ADD COLUMN "tax_variable_cost_id" UUID;

ALTER TABLE "project_services"
  ADD CONSTRAINT "FK_project_services_tax_variable_cost"
  FOREIGN KEY ("tax_variable_cost_id") REFERENCES "variable_costs" ("id");

-- Internal tax service (not visible in catalog)
DO $$
DECLARE
  v_category_id UUID;
BEGIN
  SELECT id INTO v_category_id FROM service_category WHERE name = 'Outros' ORDER BY id LIMIT 1;
  IF v_category_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM services WHERE name = 'Imposto interno') THEN
      INSERT INTO services (id, category_id, name, description, unit_type, is_active)
      VALUES (
        gen_random_uuid(),
        v_category_id,
        'Imposto interno',
        'Servico interno para deducao de imposto',
        'un',
        false
      );
    END IF;
  END IF;
END $$;

-- Recalcula total_value do projeto com deducao de imposto
CREATE OR REPLACE FUNCTION fn_project_services_recalc_total()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);

  UPDATE projects
  SET total_value = (
    SELECT COALESCE(SUM(
      CASE
        WHEN service_type = 'tax_deduction' THEN -total_price
        ELSE total_price
      END
    ), 0)
    FROM project_services
    WHERE project_id = v_project_id
  ),
  updated_at = now()
  WHERE id = v_project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
