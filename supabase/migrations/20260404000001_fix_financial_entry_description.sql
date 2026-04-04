CREATE OR REPLACE FUNCTION fn_payment_paid_create_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_project_name TEXT;
BEGIN
  IF OLD.paid_date IS NULL AND NEW.paid_date IS NOT NULL THEN
    SELECT name INTO v_project_name FROM projects WHERE id = NEW.project_id;

    INSERT INTO "financial_entries" (type, source_type, source_id, amount, date, description)
    VALUES (
      'income',
      'payment',
      NEW.id,
      NEW.amount,
      NEW.paid_date,
      'Pagamento recebido — ' || COALESCE(v_project_name, NEW.project_id::text)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
