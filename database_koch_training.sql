-- Database schema for Koch CW Training
-- Add these tables to the existing morserino database

-- Koch Training Progress Table
CREATE TABLE IF NOT EXISTS koch_progress (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    characters_learned INT(11) DEFAULT 1,
    character_mastery TEXT DEFAULT NULL COMMENT 'Character accuracy percentages as JSON',
    total_sessions INT(11) DEFAULT 0,
    total_time INT(11) DEFAULT 0 COMMENT 'Total training time in seconds',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user (username),
    KEY idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Koch Training Sessions Table
CREATE TABLE IF NOT EXISTS koch_sessions (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration INT(11) NOT NULL COMMENT 'Session duration in seconds',
    characters_practiced INT(11) NOT NULL COMMENT 'Number of different characters practiced',
    correct_answers INT(11) NOT NULL,
    total_answers INT(11) NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL COMMENT 'Session accuracy percentage',
    character_stats TEXT DEFAULT NULL COMMENT 'Per-character statistics as JSON',
    settings TEXT DEFAULT NULL COMMENT 'Training settings used as JSON',
    max_streak INT(11) DEFAULT 0,
    KEY idx_username (username),
    KEY idx_username_date (username, session_date),
    KEY idx_session_date (session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Initialize default progress for existing users
INSERT IGNORE INTO koch_progress (username, characters_learned, character_mastery, total_sessions, total_time)
SELECT username, 1, '{"K": 0}', 0, 0
FROM users;

-- Add Koch training mode to existing stats table (optional - for integration)
-- ALTER TABLE stats ADD COLUMN training_mode ENUM('words', 'callsigns', 'abbreviations', 'qrcodes', 'topwords', 'mixed', 'koch') DEFAULT 'words';

-- View for Koch training statistics (useful for reporting)
CREATE OR REPLACE VIEW koch_training_stats AS
SELECT 
    kp.username,
    kp.characters_learned,
    kp.total_sessions,
    kp.total_time,
    COALESCE(AVG(ks.accuracy), 0) as average_accuracy,
    COUNT(ks.id) as completed_sessions,
    MAX(ks.session_date) as last_session_date,
    COALESCE(AVG(ks.duration), 0) as average_session_duration,
    COALESCE(MAX(ks.max_streak), 0) as best_streak
FROM koch_progress kp
LEFT JOIN koch_sessions ks ON kp.username = ks.username
GROUP BY kp.username;