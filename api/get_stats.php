<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://om0rx.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

error_log('get_stats.php accessed');

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
    error_log('Database connected successfully');

    // Check if user is logged in
    if (!isset($_SESSION['username'])) {
        http_response_code(401);
        echo json_encode(['message' => 'Not logged in']);
        exit;
    }

    // Get username from query parameter
    $username = $_GET['username'] ?? '';
    if ($username !== $_SESSION['username']) {
        http_response_code(403);
        echo json_encode(['message' => 'Unauthorized access']);
        exit;
    }

    // Check if enhanced columns exist
    $hasEnhancedColumns = false;
    try {
        $checkColumns = $pdo->query("SHOW COLUMNS FROM stats LIKE 'letters'");
        $hasEnhancedColumns = $checkColumns->fetch() !== false;
    } catch (Exception $e) {
        error_log('Column check failed: ' . $e->getMessage());
    }

    // Fetch last stats with enhanced data if available
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
    
    if ($hasEnhancedColumns) {
        $stmt = $pdo->prepare('SELECT mode, correct, total, letters, numbers, signs, errors, time_seconds, accuracy, cpm, wpm, timestamp FROM stats WHERE username = :username ORDER BY timestamp DESC LIMIT :limit');
    } else {
        $stmt = $pdo->prepare('SELECT mode, correct, total, timestamp FROM stats WHERE username = :username ORDER BY timestamp DESC LIMIT :limit');
    }
    
    $stmt->bindValue(':username', $username, PDO::PARAM_STR);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $stats = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $stat = [
            'mode' => $row['mode'],
            'correct' => (int)$row['correct'],
            'total' => (int)$row['total'],
            'timestamp' => $row['timestamp']
        ];
        
        // Add enhanced data if available
        if ($hasEnhancedColumns) {
            $stat['letters'] = isset($row['letters']) ? (int)$row['letters'] : 0;
            $stat['numbers'] = isset($row['numbers']) ? (int)$row['numbers'] : 0;
            $stat['signs'] = isset($row['signs']) ? (int)$row['signs'] : 0;
            $stat['errors'] = isset($row['errors']) ? (int)$row['errors'] : 0;
            $stat['time_seconds'] = isset($row['time_seconds']) ? (float)$row['time_seconds'] : 0.0;
            $stat['accuracy'] = isset($row['accuracy']) ? (float)$row['accuracy'] : 0.0;
            $stat['cpm'] = isset($row['cpm']) ? (float)$row['cpm'] : 0.0;
            $stat['wpm'] = isset($row['wpm']) ? (float)$row['wpm'] : 0.0;
            $stat['enhanced'] = true;
        } else {
            $stat['enhanced'] = false;
        }
        
        $stats[] = $stat;
    }

    http_response_code(200);
    echo json_encode($stats);
} catch (Exception $e) {
    http_response_code(500);
    error_log('Stats fetch failed: ' . $e->getMessage());
    echo json_encode(['message' => 'Stats fetch failed: ' . $e->getMessage()]);
}
?>
