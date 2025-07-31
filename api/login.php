<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://om0rx.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

error_log('login.php accessed');

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
    
    $stmt = $pdo->prepare('SELECT hash, salt FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($password . $user['salt'], $user['hash'])) {
        $_SESSION['username'] = $username;
        http_response_code(200);
        echo json_encode(['message' => 'Login successful']);
    } else {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid credentials']);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('Login failed: ' . $e->getMessage());
    echo json_encode(['message' => 'Login failed: ' . $e->getMessage()]);
}
?>
