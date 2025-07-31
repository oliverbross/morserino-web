<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://om0rx.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

error_log('register.php accessed');

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
    
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid input: username and password required']);
        exit;
    }
    
    $username = $data['username'];
    $password = $data['password'];
    
    // Check if username already exists
    $stmt = $pdo->prepare('SELECT username FROM users WHERE username = ?');
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['message' => 'Username already exists']);
        exit;
    }
    
    $salt = bin2hex(random_bytes(16));
    $hash = password_hash($password . $salt, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO users (username, hash, salt) VALUES (?, ?, ?)');
    $stmt->execute([$username, $hash, $salt]);
    $_SESSION['username'] = $username;
    http_response_code(200);
    echo json_encode(['message' => 'Registered successfully']);
} catch (Exception $e) {
    http_response_code(500);
    error_log('Registration failed: ' . $e->getMessage());
    echo json_encode(['message' => 'Registration failed: ' . $e->getMessage()]);
}
?>
