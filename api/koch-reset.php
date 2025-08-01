<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://om0rx.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

error_log('koch-reset.php accessed');

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
    error_log('Database connected successfully for Koch reset');
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Koch reset database connection failed: ' . $e->getMessage());
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

try {
    // Start transaction for data consistency
    $pdo->beginTransaction();
    
    // Reset user's Koch training progress to defaults
    $defaultMastery = json_encode(['K' => 0]);
    
    $resetProgressStmt = $pdo->prepare('
        INSERT INTO koch_progress (username, characters_learned, character_mastery, total_sessions, total_time) 
        VALUES (?, 1, ?, 0, 0)
        ON DUPLICATE KEY UPDATE 
            characters_learned = 1,
            character_mastery = ?,
            total_sessions = 0,
            total_time = 0,
            last_updated = CURRENT_TIMESTAMP
    ');
    
    $resetProgressStmt->execute([$username, $defaultMastery, $defaultMastery]);
    
    // Optionally, also delete all session history for this user
    // Uncomment the next lines if you want to completely wipe session history
    /*
    $deleteSessionsStmt = $pdo->prepare('DELETE FROM koch_sessions WHERE username = ?');
    $deleteSessionsStmt->execute([$username]);
    */
    
    // Alternative: Keep sessions but mark them as archived/reset
    // This preserves historical data while resetting progress
    $archiveSessionsStmt = $pdo->prepare('
        UPDATE koch_sessions 
        SET settings = JSON_SET(COALESCE(settings, "{}"), "$.archived_after_reset", ?)
        WHERE username = ? AND JSON_EXTRACT(settings, "$.archived_after_reset") IS NULL
    ');
    
    $archiveSessionsStmt->execute([date('Y-m-d H:i:s'), $username]);
    
    // Commit transaction
    $pdo->commit();
    
    // Return success response
    $response = [
        'success' => true,
        'message' => 'Koch training progress reset successfully',
        'progress' => [
            'charactersLearned' => 1,
            'characterMastery' => ['K' => 0],
            'totalSessions' => 0,
            'totalTime' => 0
        ]
    ];
    
    http_response_code(200);
    echo json_encode($response);
    
    error_log('Koch progress reset successfully for user: ' . $username);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $pdo->rollBack();
    
    http_response_code(500);
    error_log('Failed to reset Koch progress for user ' . $username . ': ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to reset progress']);
}
?>