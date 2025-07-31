<?php
     session_start();
     header('Content-Type: application/json');
     header('Access-Control-Allow-Origin: https://om0rx.com');
     header('Access-Control-Allow-Credentials: true');
     header('Access-Control-Allow-Methods: GET');
     header('Access-Control-Allow-Headers: Content-Type');

     error_log('session.php accessed');

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
         if (isset($_SESSION['username'])) {
             $stmt = $pdo->prepare('SELECT username FROM users WHERE username = ?');
             $stmt->execute([$_SESSION['username']]);
             if ($stmt->fetch()) {
                 http_response_code(200);
                 echo json_encode(['username' => $_SESSION['username']]);
             } else {
                 unset($_SESSION['username']);
                 http_response_code(401);
                 echo json_encode(['message' => 'No valid session found']);
             }
         } else {
             http_response_code(401);
             echo json_encode(['message' => 'No valid session found']);
         }
     } catch (Exception $e) {
         http_response_code(500);
         error_log('Session check failed: ' . $e->getMessage());
         echo json_encode(['message' => 'Session check failed: ' . $e->getMessage()]);
     }
     ?>
