<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://om0rx.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

error_log('koch-progress.php accessed');

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
    error_log('Database connected successfully for Koch progress');
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Koch progress database connection failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$username = $_SESSION['username'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get user's Koch training progress
    try {
        $stmt = $pdo->prepare('SELECT * FROM koch_progress WHERE username = ?');
        $stmt->execute([$username]);
        $progress = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$progress) {
            // Initialize default progress for new user
            $defaultMastery = json_encode(['K' => 0]);
            $initStmt = $pdo->prepare('INSERT INTO koch_progress (username, characters_learned, character_mastery, total_sessions, total_time) VALUES (?, 1, ?, 0, 0)');
            $initStmt->execute([$username, $defaultMastery]);
            
            // Fetch the newly created record
            $stmt->execute([$username]);
            $progress = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        // Decode JSON fields
        $progress['character_mastery'] = json_decode($progress['character_mastery'] ?? '{}', true);
        
        // Format response
        $response = [
            'success' => true,
            'progress' => [
                'charactersLearned' => (int)$progress['characters_learned'],
                'characterMastery' => $progress['character_mastery'],
                'totalSessions' => (int)$progress['total_sessions'],
                'totalTime' => (int)$progress['total_time']
            ]
        ];
        
        http_response_code(200);
        echo json_encode($response);
        
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Failed to get Koch progress: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to retrieve progress']);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Update user's Koch training progress
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
        exit;
    }
    
    try {
        $charactersLearned = (int)($input['charactersLearned'] ?? 1);
        $characterMastery = json_encode($input['characterMastery'] ?? []);
        $totalSessions = (int)($input['totalSessions'] ?? 0);
        $totalTime = (int)($input['totalTime'] ?? 0);
        
        // Update or insert progress
        $stmt = $pdo->prepare('
            INSERT INTO koch_progress (username, characters_learned, character_mastery, total_sessions, total_time) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                characters_learned = VALUES(characters_learned),
                character_mastery = VALUES(character_mastery),
                total_sessions = VALUES(total_sessions),
                total_time = VALUES(total_time),
                last_updated = CURRENT_TIMESTAMP
        ');
        
        $stmt->execute([$username, $charactersLearned, $characterMastery, $totalSessions, $totalTime]);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Progress updated successfully']);
        
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Failed to update Koch progress: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to update progress']);
    }
    
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>