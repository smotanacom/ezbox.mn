-- Add admin tracking to history table
ALTER TABLE history
  ADD COLUMN changed_by_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL;

-- Create index for admin tracking
CREATE INDEX idx_history_changed_by_admin ON history(changed_by_admin_id);

-- Update the getHistoryForEntity query comments
COMMENT ON COLUMN history.changed_by_user_id IS 'User ID if changed by a regular user (customers)';
COMMENT ON COLUMN history.changed_by_admin_id IS 'Admin ID if changed by an admin';

-- Track schema migration
INSERT INTO schema_migrations (version) VALUES ('0012_update_history_for_admins');
