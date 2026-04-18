-- ============================================================
-- Add updated_at to project_services
-- ============================================================

ALTER TABLE "project_services"
  ADD COLUMN "updated_at" TIMESTAMP NOT NULL DEFAULT now();
