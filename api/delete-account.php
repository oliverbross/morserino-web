  <?php
     session_start();
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

     if (!isset($_SESSION['username'])) {
         http_response_code(401);
         echo json_encode(['message' => 'Unauthorized.']);
         exit;
     }

     $data = json_decode(file_get_contents('php://input'), true);
     $username = trim($data['username'] ?? '');

     if ($username !== $_SESSION['username']) {
         http_response_code(401);
         echo json_encode(['message' => 'Unauthorized.']);
         exit;
     }

     $pdo->beginTransaction();
     try {
         $stmt = $pdo->prepare('DELETE FROM stats WHERE username = ?');
         $stmt->execute([$username]);
         $stmt = $pdo->prepare('DELETE FROM preferences WHERE username = ?');
         $stmt->execute([$username]);
         $stmt = $pdo->prepare('DELETE FROM users WHERE username = ?');
         $stmt->execute([$username]);
         $pdo->commit();
         session_unset();
         session_destroy();
         http_response_code(200);
         echo json_encode(['message' => 'Account deleted successfully.']);
     } catch (Exception $e) {
         $pdo->rollBack();
         http_response_code(500);
         echo json_encode(['message' => 'Failed to delete account: ' . $e->getMessage()]);
     }
     ?>
