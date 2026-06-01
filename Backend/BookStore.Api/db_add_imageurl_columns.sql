-- Add missing "ImageUrl" columns (Option A - low-risk immediate fix)
-- Usage: open in pgAdmin Query Tool and run, or run with psql.
-- Recommended: take a DB backup first (pg_dump) before running.

-- Optional check: list existing ImageUrl columns
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE column_name = 'ImageUrl'
-- ORDER BY table_name;

BEGIN;

-- Books and Stationeries use text in EF mapping
ALTER TABLE "Books" ADD COLUMN IF NOT EXISTS "ImageUrl" text;
ALTER TABLE "Stationeries" ADD COLUMN IF NOT EXISTS "ImageUrl" text;

-- BookCategories (main categories) and other category tables: use varchar(500) to match HasMaxLength(500)
ALTER TABLE "BookCategories" ADD COLUMN IF NOT EXISTS "ImageUrl" character varying(500);
ALTER TABLE "StationeryCategories" ADD COLUMN IF NOT EXISTS "ImageUrl" character varying(500);
ALTER TABLE "ToyCategories" ADD COLUMN IF NOT EXISTS "ImageUrl" character varying(500);
ALTER TABLE "SouvenirCategories" ADD COLUMN IF NOT EXISTS "ImageUrl" character varying(500);
ALTER TABLE "AccessoryCategories" ADD COLUMN IF NOT EXISTS "ImageUrl" character varying(500);
ALTER TABLE "SchoolSupplyCategories" ADD COLUMN IF NOT EXISTS "ImageUrl" character varying(500);

COMMIT;

-- After running, you can re-run the optional check above to verify.
-- If your app still throws errors, restart the BookStore.Api process (dotnet run / systemd service / IISExpress) so EF re-connects.
