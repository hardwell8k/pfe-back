-- Add available column to equipement table
ALTER TABLE equipement 
ADD COLUMN available BOOLEAN DEFAULT TRUE;

-- Update existing records to be available by default
UPDATE equipement 
SET available = TRUE 
WHERE available IS NULL; 