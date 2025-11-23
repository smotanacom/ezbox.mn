-- Add internal_name field to parameter_groups table
-- This field is used for admin organization to distinguish groups with same display name
-- e.g., "Height" (display) might have internal names like "Height Base" or "Height Special"

ALTER TABLE parameter_groups
ADD COLUMN internal_name VARCHAR(255);

-- Set default internal_name to be the same as name for existing records
UPDATE parameter_groups
SET internal_name = name
WHERE internal_name IS NULL;

-- Add schema_migrations entry
INSERT INTO schema_migrations (version)
VALUES ('0008_add_internal_name_to_parameter_groups');
