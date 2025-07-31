<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://om0rx.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

error_log('test.php accessed');

$dbHost = 'localhost';
$dbName = 'morserino';
$dbUser = 'm@om0rx.com';
$dbPass = 'N3DhN5kIMhbmceM';

// Use an existing username or session username
$username = isset($_SESSION['username']) ? $_SESSION['username'] : 'test2';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Verify username exists in users table
    $stmt = $pdo->prepare('SELECT username FROM users WHERE username = ?');
    $stmt->execute([$username]);
    if (!$stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['message' => "Username '$username' not found in users table"]);
        exit;
    }

    // Insert test stats
    $stmt = $pdo->prepare('INSERT INTO stats (username, correct, total, mode, date) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$username, 2, 2, 'words', '2025-07-30 09:00:00']);
    echo json_encode(['message' => 'Test session saved']);
} catch (Exception $e) {
    http_response_code(500);
    error_log('Test failed: ' . $e->getMessage());
    echo json_encode(['message' => 'Test failed: ' . $e->getMessage()]);
}
?>
