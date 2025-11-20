-- Migration: Remove redundant Quantity parameter group
-- Quantity should only be managed at cart level (product_in_cart.quantity)
-- Not as a product parameter group

-- First, remove product_parameter_groups entries that reference the Quantity parameter group (id=7)
DELETE FROM product_parameter_groups WHERE parameter_group_id = 7;

-- Remove the parameters for the Quantity parameter group (id=7)
DELETE FROM parameters WHERE parameter_group_id = 7;

-- Remove the Quantity parameter group itself
DELETE FROM parameter_groups WHERE id = 7;

-- Track migration
INSERT INTO schema_migrations (version) VALUES ('0003_remove_quantity_parameter_group');
