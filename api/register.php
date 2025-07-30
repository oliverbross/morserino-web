<?php
     header('Content-Type: application/json');
     header('Access-Control-Allow-Origin: https://om0rx.com');
     header('Access-Control-Allow-Credentials: true');

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
     } catch (PDOException $e) {
         http_response_code(500);
         echo json_encode(['message' => 'Database connection failed: ' . $e->getMessage()]);
         exit;
     }

     $data = json_decode(file_get_contents('php://input'), true);
     $username = trim($data['username'] ?? '');
     $password = trim($data['password'] ?? '');

     if (empty($username) || empty($password)) {
         http_response_code(400);
         echo json_encode(['message' => 'Username and password are required.']);
         exit;
     }

     // Check if username exists
     $stmt = $pdo->prepare('SELECT COUNT(*) FROM users WHERE username = ?');
     $stmt->execute([$username]);
     if ($stmt->fetchColumn() > 0) {
         http_response_code(400);
         echo json_encode(['message' => 'Username already exists.']);
         exit;
     }

     // Hash password (Web Crypto API is handled client-side, so use PHP's password_hash)
     $hash = password_hash($password, PASSWORD_BCRYPT);
     $salt = base64_encode(random_bytes(16)); // Store salt for compatibility

     // Insert user
     $stmt = $pdo->prepare('INSERT INTO users (username, hash, salt) VALUES (?, ?, ?)');
     $stmt->execute([$username, $hash, $salt]);

     http_response_code(200);
     echo json_encode(['message' => 'Registered successfully.']);
     ?>
