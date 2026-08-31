-- Add birth date and saju information columns to users table
ALTER TABLE users ADD COLUMN birth_date TEXT;
ALTER TABLE users ADD COLUMN birth_time TEXT;
ALTER TABLE users ADD COLUMN gender TEXT DEFAULT 'M';
ALTER TABLE users ADD COLUMN is_solar INTEGER DEFAULT 1;
