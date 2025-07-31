-- Morserino Web v1.1 Database Update (Corrected)
-- Enhanced session tracking with detailed statistics

-- Since most columns already exist, we'll just add what's missing and create indexes

-- Check current table structure first
DESCRIBE stats;

-- Add indexes for better query performance (if they don't exist)
-- These will fail safely if indexes already exist
CREATE INDEX IF NOT EXISTS idx_stats_username_timestamp ON stats(username, timestamp);
CREATE INDEX IF NOT EXISTS idx_stats_mode ON stats(mode);

-- Optional: Update existing records to have calculated values for enhanced columns
-- This will set default values for any NULL entries
UPDATE stats SET 
    letters = COALESCE(letters, 0),
    numbers = COALESCE(numbers, 0), 
    signs = COALESCE(signs, 0),
    errors = COALESCE(errors, GREATEST(0, total - correct)),
    time_seconds = COALESCE(time_seconds, 0.000),
    accuracy = COALESCE(accuracy, 
        CASE 
            WHEN total > 0 THEN ROUND((correct / total) * 100, 2)
            ELSE 0.00 
        END
    ),
    cpm = COALESCE(cpm, 0.00),
    wpm = COALESCE(wpm, 0.00)
WHERE letters IS NULL OR numbers IS NULL OR signs IS NULL OR errors IS NULL 
   OR time_seconds IS NULL OR accuracy IS NULL OR cpm IS NULL OR wpm IS NULL;

-- Show final table structure
DESCRIBE stats;

-- Show sample data to verify
SELECT id, username, mode, letters, numbers, signs, errors, accuracy, cpm, wpm, timestamp 
FROM stats 
ORDER BY timestamp DESC 
LIMIT 3;