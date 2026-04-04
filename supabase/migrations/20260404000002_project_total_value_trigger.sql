-- Recalcula total_value do projeto sempre que project_services muda
CREATE OR REPLACE FUNCTION fn_project_services_recalc_total()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);

  UPDATE projects
  SET total_value = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM project_services
    WHERE project_id = v_project_id
  ),
  updated_at = now()
  WHERE id = v_project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_project_services_recalc_total ON project_services;
CREATE TRIGGER trg_project_services_recalc_total
  AFTER INSERT OR UPDATE OR DELETE ON project_services
  FOR EACH ROW EXECUTE FUNCTION fn_project_services_recalc_total();
