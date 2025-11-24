-- Add 'grado' column to 'grupos' table
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS grado TEXT;

-- Update existing groups with a default value if needed (optional)
-- UPDATE grupos SET grado = 'Sin Grado' WHERE grado IS NULL;
