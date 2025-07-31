-- Morserino Web v1.1 Database Update
-- Enhanced session tracking with detailed statistics

-- Add new columns to existing stats table
ALTER TABLE stats ADD COLUMN letters INT DEFAULT 0 AFTER total;
ALTER TABLE stats ADD COLUMN numbers INT DEFAULT 0 AFTER letters;
ALTER TABLE stats ADD COLUMN signs INT DEFAULT 0 AFTER numbers;
ALTER TABLE stats ADD COLUMN errors INT DEFAULT 0 AFTER signs;
ALTER TABLE stats ADD COLUMN time_seconds DECIMAL(10,3) DEFAULT 0.000 AFTER errors;
ALTER TABLE stats ADD COLUMN accuracy DECIMAL(5,2) DEFAULT 0.00 AFTER time_seconds;
ALTER TABLE stats ADD COLUMN cpm DECIMAL(6,2) DEFAULT 0.00 AFTER accuracy;
ALTER TABLE stats ADD COLUMN wpm DECIMAL(6,2) DEFAULT 0.00 AFTER cpm;

-- Update the date column to include milliseconds for better precision
ALTER TABLE stats MODIFY COLUMN date TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3);

-- Add index for better query performance
CREATE INDEX idx_stats_username_date ON stats(username, date);
CREATE INDEX idx_stats_mode ON stats(mode);

-- Optional: Update existing records to have default values (if needed)
UPDATE stats SET 
    letters = 0, 
    numbers = 0, 
    signs = 0, 
    errors = GREATEST(0, total - correct),
    accuracy = CASE 
        WHEN total > 0 THEN ROUND((correct / total) * 100, 2)
        ELSE 0.00 
    END
WHERE letters IS NULL;

-- Verify the table structure
DESCRIBE stats;

-- Example of new table structure:
-- +-------------+---------------+------+-----+-------------------+-------------------+
-- | Field       | Type          | Null | Key | Default           | Extra             |
-- +-------------+---------------+------+-----+-------------------+-------------------+
-- | id          | int(11)       | NO   | PRI | NULL              | auto_increment    |
-- | username    | varchar(255)  | NO   | MUL | NULL              |                   |
-- | correct     | int(11)       | NO   |     | NULL              |                   |
-- | total       | int(11)       | NO   |     | NULL              |                   |
-- | letters     | int(11)       | YES  |     | 0                 |                   |
-- | numbers     | int(11)       | YES  |     | 0                 |                   |
-- | signs       | int(11)       | YES  |     | 0                 |                   |
-- | errors      | int(11)       | YES  |     | 0                 |                   |
-- | time_seconds| decimal(10,3) | YES  |     | 0.000             |                   |
-- | accuracy    | decimal(5,2)  | YES  |     | 0.00              |                   |
-- | cpm         | decimal(6,2)  | YES  |     | 0.00              |                   |
-- | wpm         | decimal(6,2)  | YES  |     | 0.00              |                   |
-- | mode        | varchar(50)   | NO   |     | NULL              |                   |
-- | date        | timestamp(3)  | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
-- +-------------+---------------+------+-----+-------------------+-------------------+