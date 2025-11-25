-- Add email column to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Backfill emails for existing admins
UPDATE admins SET email = 'amarkhuu@gmail.com' WHERE username = 'amarkhuu';
UPDATE admins SET email = 'matus@smotana.com' WHERE username = 'matus';

-- Add comment to document the column
COMMENT ON COLUMN admins.email IS 'Admin email address for notifications (order confirmations, custom design requests)';
