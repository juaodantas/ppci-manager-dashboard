-- ============================================================
-- M7 — PPCI Domain: drop boilerplate schema, add relational schema
-- ============================================================

-- -------------------------------------------------------
-- 1. Drop old services table and its enums
-- -------------------------------------------------------
DROP TABLE IF EXISTS "services" CASCADE;
DROP TYPE IF EXISTS "services_tipo_enum";
DROP TYPE IF EXISTS "services_status_enum";
DROP TYPE IF EXISTS "services_forma_pagamento_enum";

-- -------------------------------------------------------
-- 2. New enums
-- -------------------------------------------------------
CREATE TYPE "quote_status_enum"   AS ENUM ('draft', 'sent', 'approved', 'rejected');
CREATE TYPE "project_status_enum" AS ENUM ('planning', 'in_progress', 'finished', 'canceled');
CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'paid', 'overdue');
CREATE TYPE "entry_type_enum"     AS ENUM ('income', 'expense');

-- -------------------------------------------------------
-- 3. customers
-- -------------------------------------------------------
CREATE TABLE "customers" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "name"       VARCHAR(255) NOT NULL,
  "document"   VARCHAR(20),
  "email"      VARCHAR(255),
  "phone"      VARCHAR(20),
  "deleted_at" TIMESTAMP,
  "created_at" TIMESTAMP    NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP    NOT NULL DEFAULT now(),
  CONSTRAINT "PK_customers" PRIMARY KEY ("id")
);

CREATE INDEX "IDX_customers_deleted_at" ON "customers" ("deleted_at");

-- -------------------------------------------------------
-- 4. service_category
-- -------------------------------------------------------
CREATE TABLE "service_category" (
  "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
  "name"        VARCHAR(100) NOT NULL,
  "description" TEXT,
  CONSTRAINT "PK_service_category" PRIMARY KEY ("id")
);

-- -------------------------------------------------------
-- 5. services (catalog — NOT execution, see projects)
-- -------------------------------------------------------
CREATE TABLE "services" (
  "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
  "category_id" UUID         NOT NULL,
  "name"        VARCHAR(255) NOT NULL,
  "description" TEXT,
  "unit_type"   VARCHAR(50),
  "is_active"   BOOLEAN      NOT NULL DEFAULT true,
  CONSTRAINT "PK_services"          PRIMARY KEY ("id"),
  CONSTRAINT "FK_services_category" FOREIGN KEY ("category_id")
    REFERENCES "service_category" ("id")
);

CREATE INDEX "IDX_services_category" ON "services" ("category_id");
CREATE INDEX "IDX_services_active"   ON "services" ("is_active");

-- -------------------------------------------------------
-- 6. service_price
-- -------------------------------------------------------
CREATE TABLE "service_price" (
  "id"             UUID          NOT NULL DEFAULT gen_random_uuid(),
  "service_id"     UUID          NOT NULL,
  "price_per_unit" DECIMAL(10,2) NOT NULL,
  "minimum_price"  DECIMAL(10,2),
  "valid_from"     DATE          NOT NULL DEFAULT CURRENT_DATE,
  "valid_to"       DATE,
  CONSTRAINT "PK_service_price"         PRIMARY KEY ("id"),
  CONSTRAINT "FK_service_price_service" FOREIGN KEY ("service_id")
    REFERENCES "services" ("id") ON DELETE CASCADE
);

CREATE INDEX "IDX_service_price_service" ON "service_price" ("service_id");

-- -------------------------------------------------------
-- 7. quotes
-- -------------------------------------------------------
CREATE TABLE "quotes" (
  "id"           UUID               NOT NULL DEFAULT gen_random_uuid(),
  "customer_id"  UUID               NOT NULL,
  "status"       quote_status_enum  NOT NULL DEFAULT 'draft',
  "total_amount" DECIMAL(10,2)      NOT NULL DEFAULT 0,
  "discount"     DECIMAL(10,2)      NOT NULL DEFAULT 0,
  "valid_until"  DATE,
  "notes"        TEXT,
  "created_at"   TIMESTAMP          NOT NULL DEFAULT now(),
  "updated_at"   TIMESTAMP          NOT NULL DEFAULT now(),
  CONSTRAINT "PK_quotes"          PRIMARY KEY ("id"),
  CONSTRAINT "FK_quotes_customer" FOREIGN KEY ("customer_id")
    REFERENCES "customers" ("id")
);

CREATE INDEX "IDX_quotes_customer" ON "quotes" ("customer_id");
CREATE INDEX "IDX_quotes_status"   ON "quotes" ("status");

-- -------------------------------------------------------
-- 8. quote_items
-- -------------------------------------------------------
CREATE TABLE "quote_items" (
  "id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
  "quote_id"    UUID          NOT NULL,
  "service_id"  UUID          NOT NULL,
  "description" TEXT,
  "quantity"    DECIMAL(10,3) NOT NULL,
  "unit_price"  DECIMAL(10,2) NOT NULL,
  "total_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT "PK_quote_items"          PRIMARY KEY ("id"),
  CONSTRAINT "FK_quote_items_quote"    FOREIGN KEY ("quote_id")
    REFERENCES "quotes" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_quote_items_service"  FOREIGN KEY ("service_id")
    REFERENCES "services" ("id")
);

CREATE INDEX "IDX_quote_items_quote" ON "quote_items" ("quote_id");

-- -------------------------------------------------------
-- 9. projects
-- -------------------------------------------------------
CREATE TABLE "projects" (
  "id"          UUID                 NOT NULL DEFAULT gen_random_uuid(),
  "customer_id" UUID                 NOT NULL,
  "quote_id"    UUID,
  "name"        VARCHAR(255)         NOT NULL,
  "description" TEXT,
  "status"      project_status_enum  NOT NULL DEFAULT 'planning',
  "start_date"  DATE,
  "end_date"    DATE,
  "total_value" DECIMAL(10,2)        NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP            NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMP            NOT NULL DEFAULT now(),
  CONSTRAINT "PK_projects"          PRIMARY KEY ("id"),
  CONSTRAINT "FK_projects_customer" FOREIGN KEY ("customer_id")
    REFERENCES "customers" ("id"),
  CONSTRAINT "FK_projects_quote"    FOREIGN KEY ("quote_id")
    REFERENCES "quotes" ("id")
);

CREATE INDEX "IDX_projects_customer" ON "projects" ("customer_id");
CREATE INDEX "IDX_projects_status"   ON "projects" ("status");
CREATE INDEX "IDX_projects_quote"    ON "projects" ("quote_id");

-- -------------------------------------------------------
-- 10. project_services
-- -------------------------------------------------------
CREATE TABLE "project_services" (
  "id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
  "project_id"  UUID          NOT NULL,
  "service_id"  UUID          NOT NULL,
  "description" TEXT,
  "quantity"    DECIMAL(10,3) NOT NULL,
  "unit_price"  DECIMAL(10,2) NOT NULL,
  "total_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT "PK_project_services"         PRIMARY KEY ("id"),
  CONSTRAINT "FK_project_services_project" FOREIGN KEY ("project_id")
    REFERENCES "projects" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_project_services_service" FOREIGN KEY ("service_id")
    REFERENCES "services" ("id")
);

CREATE INDEX "IDX_project_services_project" ON "project_services" ("project_id");

-- -------------------------------------------------------
-- 11. payments
-- -------------------------------------------------------
CREATE TABLE "payments" (
  "id"             UUID                 NOT NULL DEFAULT gen_random_uuid(),
  "project_id"     UUID                 NOT NULL,
  "amount"         DECIMAL(10,2)        NOT NULL,
  "due_date"       DATE                 NOT NULL,
  "paid_date"      DATE,
  "status"         payment_status_enum  NOT NULL DEFAULT 'pending',
  "payment_method" VARCHAR(50),
  "notes"          TEXT,
  "created_at"     TIMESTAMP            NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMP            NOT NULL DEFAULT now(),
  CONSTRAINT "PK_payments"         PRIMARY KEY ("id"),
  CONSTRAINT "FK_payments_project" FOREIGN KEY ("project_id")
    REFERENCES "projects" ("id")
);

CREATE INDEX "IDX_payments_project" ON "payments" ("project_id");
CREATE INDEX "IDX_payments_status"  ON "payments" ("status");
CREATE INDEX "IDX_payments_due"     ON "payments" ("due_date");

-- -------------------------------------------------------
-- 12. fixed_costs
-- -------------------------------------------------------
CREATE TABLE "fixed_costs" (
  "id"         UUID          NOT NULL DEFAULT gen_random_uuid(),
  "name"       VARCHAR(255)  NOT NULL,
  "amount"     DECIMAL(10,2) NOT NULL,
  "due_day"    SMALLINT      NOT NULL CHECK ("due_day" BETWEEN 1 AND 31),
  "category"   VARCHAR(100),
  "active"     BOOLEAN       NOT NULL DEFAULT true,
  "created_at" TIMESTAMP     NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP     NOT NULL DEFAULT now(),
  CONSTRAINT "PK_fixed_costs" PRIMARY KEY ("id")
);

-- -------------------------------------------------------
-- 13. financial_entries
-- -------------------------------------------------------
CREATE TABLE "financial_entries" (
  "id"          UUID             NOT NULL DEFAULT gen_random_uuid(),
  "type"        entry_type_enum  NOT NULL,
  "source_type" VARCHAR(50)      NOT NULL CHECK ("source_type" IN ('payment', 'fixed_cost')),
  "source_id"   UUID             NOT NULL,
  "amount"      DECIMAL(10,2)    NOT NULL,
  "date"        DATE             NOT NULL,
  "description" TEXT,
  "created_at"  TIMESTAMP        NOT NULL DEFAULT now(),
  CONSTRAINT "PK_financial_entries" PRIMARY KEY ("id")
);

CREATE INDEX "IDX_financial_entries_date"        ON "financial_entries" ("date");
CREATE INDEX "IDX_financial_entries_type"        ON "financial_entries" ("type");
CREATE INDEX "IDX_financial_entries_source"      ON "financial_entries" ("source_type", "source_id");

-- ============================================================
-- TRIGGERS
-- ============================================================

-- -------------------------------------------------------
-- Trigger 1: quote_items.total_price = quantity * unit_price
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_quote_items_calc_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_quote_items_total
  BEFORE INSERT OR UPDATE OF quantity, unit_price ON "quote_items"
  FOR EACH ROW EXECUTE FUNCTION fn_quote_items_calc_total();

-- -------------------------------------------------------
-- Trigger 2: project_services.total_price = quantity * unit_price
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_project_services_calc_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_project_services_total
  BEFORE INSERT OR UPDATE OF quantity, unit_price ON "project_services"
  FOR EACH ROW EXECUTE FUNCTION fn_project_services_calc_total();

-- -------------------------------------------------------
-- Trigger 3: recalcula quotes.total_amount após mudanças em quote_items
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_quotes_recalc_total()
RETURNS TRIGGER AS $$
DECLARE
  v_quote_id UUID;
BEGIN
  v_quote_id := COALESCE(NEW.quote_id, OLD.quote_id);
  UPDATE "quotes"
  SET
    total_amount = COALESCE((
      SELECT SUM(total_price) FROM "quote_items" WHERE quote_id = v_quote_id
    ), 0),
    updated_at = now()
  WHERE id = v_quote_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_quotes_total_amount
  AFTER INSERT OR UPDATE OR DELETE ON "quote_items"
  FOR EACH ROW EXECUTE FUNCTION fn_quotes_recalc_total();

-- -------------------------------------------------------
-- Trigger 4: cria financial_entry quando payment é marcado como pago
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_payment_paid_create_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- só age quando paid_date passa de NULL para uma data
  IF OLD.paid_date IS NULL AND NEW.paid_date IS NOT NULL THEN
    INSERT INTO "financial_entries" (type, source_type, source_id, amount, date, description)
    VALUES (
      'income',
      'payment',
      NEW.id,
      NEW.amount,
      NEW.paid_date,
      'Pagamento recebido — projeto ' || NEW.project_id::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_paid_create_entry
  AFTER UPDATE OF paid_date ON "payments"
  FOR EACH ROW EXECUTE FUNCTION fn_payment_paid_create_entry();
