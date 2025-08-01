-- Database schema for Koch CW Training
-- Add these tables to the existing morserino database

-- Koch Training Progress Table
CREATE TABLE IF NOT EXISTS koch_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    characters_learned INT DEFAULT 1,
    character_mastery JSON DEFAULT NULL COMMENT 'Character accuracy percentages as JSON',
    total_sessions INT DEFAULT 0,
    total_time INT DEFAULT 0 COMMENT 'Total training time in seconds',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    UNIQUE KEY unique_user (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Koch Training Sessions Table
CREATE TABLE IF NOT EXISTS koch_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration INT NOT NULL COMMENT 'Session duration in seconds',
    characters_practiced INT NOT NULL COMMENT 'Number of different characters practiced',
    correct_answers INT NOT NULL,
    total_answers INT NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL COMMENT 'Session accuracy percentage',
    character_stats JSON DEFAULT NULL COMMENT 'Per-character statistics as JSON',
    settings JSON DEFAULT NULL COMMENT 'Training settings used as JSON',
    max_streak INT DEFAULT 0,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    INDEX idx_username_date (username, session_date),
    INDEX idx_session_date (session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialize default progress for existing users
INSERT IGNORE INTO koch_progress (username, characters_learned, character_mastery, total_sessions, total_time)
SELECT username, 1, JSON_OBJECT('K', 0), 0, 0
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
GROUP BY kp.username, kp.characters_learned, kp.total_sessions, kp.total_time;