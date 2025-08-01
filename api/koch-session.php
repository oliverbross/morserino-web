<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://om0rx.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

error_log('koch-session.php accessed');

require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();
$dbHost = $_ENV['DB_HOST'];
$dbName = $_ENV['DB_NAME'];
$dbUser = $_ENV['DB_USER'];
$dbPass = $_ENV['DB_PASS'];

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    error_log('Database connected successfully for Koch session');
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Koch session database connection failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$username = $_SESSION['username'];
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

try {
    // Start transaction for data consistency
    $pdo->beginTransaction();
    
    // Extract session data
    $duration = (int)($input['duration'] ?? 0);
    $correct = (int)($input['correct'] ?? 0);
    $total = (int)($input['total'] ?? 0);
    $accuracy = (float)($input['accuracy'] ?? 0);
    $characterStats = json_encode($input['characterStats'] ?? []);
    $settings = json_encode($input['settings'] ?? []);
    $charactersPracticed = count($input['characterStats'] ?? []);
    $maxStreak = (int)($input['maxStreak'] ?? 0);
    
    // Insert session record
    $sessionStmt = $pdo->prepare('
        INSERT INTO koch_sessions 
        (username, duration, characters_practiced, correct_answers, total_answers, accuracy, character_stats, settings, max_streak) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    
    $sessionStmt->execute([
        $username, $duration, $charactersPracticed, $correct, $total, $accuracy, $characterStats, $settings, $maxStreak
    ]);
    
    // Update user progress
    // First, get current progress
    $progressStmt = $pdo->prepare('SELECT * FROM koch_progress WHERE username = ?');
    $progressStmt->execute([$username]);
    $currentProgress = $progressStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$currentProgress) {
        // Initialize default progress
        $defaultMastery = json_encode(['K' => 0]);
        $initStmt = $pdo->prepare('INSERT INTO koch_progress (username, characters_learned, character_mastery, total_sessions, total_time) VALUES (?, 1, ?, 0, 0)');
        $initStmt->execute([$username, $defaultMastery]);
        
        $progressStmt->execute([$username]);
        $currentProgress = $progressStmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Decode current character mastery
    $currentMastery = json_decode($currentProgress['character_mastery'] ?? '{}', true);
    $newCharStats = $input['characterStats'] ?? [];
    
    // Update character mastery based on session performance
    foreach ($newCharStats as $char => $stats) {
        if (isset($stats['correct']) && isset($stats['total']) && $stats['total'] > 0) {
            $charAccuracy = ($stats['correct'] / $stats['total']) * 100;
            
            // Use weighted average if character already has history
            if (isset($currentMastery[$char])) {
                // Weight: 70% previous, 30% current session
                $currentMastery[$char] = ($currentMastery[$char] * 0.7) + ($charAccuracy * 0.3);
            } else {
                $currentMastery[$char] = $charAccuracy;
            }
            
            $currentMastery[$char] = round($currentMastery[$char], 1);
        }
    }
    
    // Calculate how many characters are "learned" (>= 90% accuracy)
    $charactersLearned = 0;
    $kochOrder = ['K', 'M', 'R', 'S', 'U', 'A', 'P', 'T', 'L', 'O', 'W', 'I', 'N', 'J', 'E', 'F', '0', 'Y', 'V', 'G', '5', 'Q', '9', 'Z', 'H', '8', 'B', '?', '4', 'X', 'C', 'D', '6', '7', '1', '2', '3', '<AR>', '<SK>', '<KN>', '<BT>'];
    
    foreach ($kochOrder as $char) {
        if (isset($currentMastery[$char]) && $currentMastery[$char] >= 90) {
            $charactersLearned++;
        } else {
            // Koch method: must master characters in order
            break;
        }
    }
    
    // Ensure at least 1 character is considered "learned" (K)
    $charactersLearned = max(1, $charactersLearned);
    
    // Update progress record
    $newTotalSessions = (int)$currentProgress['total_sessions'] + 1;
    $newTotalTime = (int)$currentProgress['total_time'] + $duration;
    
    $updateStmt = $pdo->prepare('
        UPDATE koch_progress 
        SET characters_learned = ?, 
            character_mastery = ?, 
            total_sessions = ?, 
            total_time = ?,
            last_updated = CURRENT_TIMESTAMP
        WHERE username = ?
    ');
    
    $updateStmt->execute([
        $charactersLearned,
        json_encode($currentMastery),
        $newTotalSessions,
        $newTotalTime,
        $username
    ]);
    
    // Commit transaction
    $pdo->commit();
    
    // Return success with updated progress
    $response = [
        'success' => true,
        'message' => 'Session saved successfully',
        'progress' => [
            'charactersLearned' => $charactersLearned,
            'characterMastery' => $currentMastery,
            'totalSessions' => $newTotalSessions,
            'totalTime' => $newTotalTime
        ]
    ];
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $pdo->rollBack();
    
    http_response_code(500);
    error_log('Failed to save Koch session: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to save session']);
}
?>