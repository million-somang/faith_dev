-- Add role column to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- Create index on role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing test user to admin
UPDATE users SET role = 'admin' WHERE email = 'test@example.com';
