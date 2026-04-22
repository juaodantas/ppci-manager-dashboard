-- -------------------------------------------------------
-- Add timestamps to services catalog
-- -------------------------------------------------------
ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now();
