-- Create history table to track changes to orders, products, and other entities
CREATE TABLE history (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- e.g., 'order', 'product', 'cart', 'special'
  entity_id INTEGER NOT NULL, -- the ID of the entity that changed
  action VARCHAR(50) NOT NULL, -- e.g., 'created', 'status_changed', 'updated', 'deleted'
  field_name VARCHAR(100), -- optional: specific field that changed (e.g., 'status', 'price')
  old_value TEXT, -- optional: previous value (stored as text/JSON)
  new_value TEXT, -- optional: new value (stored as text/JSON)
  changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- admin who made the change
  notes TEXT, -- optional: additional context or notes
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX idx_history_entity ON history(entity_type, entity_id);
CREATE INDEX idx_history_created_at ON history(created_at DESC);
CREATE INDEX idx_history_changed_by ON history(changed_by_user_id);

-- Enable RLS (but policies will need to be implemented at application level
-- since we're using custom phone-based auth, not Supabase Auth)
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Allow service role to access everything (for admin operations)
CREATE POLICY "Allow service role full access"
  ON history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon role to read and insert (application will enforce admin checks)
CREATE POLICY "Allow anon access"
  ON history
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Track schema migration
INSERT INTO schema_migrations (version) VALUES ('0011_create_history_table');
