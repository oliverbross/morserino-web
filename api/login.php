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

     $data = json_decode(file_get_contents('php://input'), true);
     $username = trim($data['username'] ?? '');
     $password = trim($data['password'] ?? '');

     if (empty($username) || empty($password)) {
         http_response_code(400);
         echo json_encode(['message' => 'Username and password are required.']);
         exit;
     }

     $stmt = $pdo->prepare('SELECT hash FROM users WHERE username = ?');
     $stmt->execute([$username]);
     $user = $stmt->fetch(PDO::FETCH_ASSOC);

     if (!$user || !password_verify($password, $user['hash'])) {
         http_response_code(401);
         echo json_encode(['message' => 'Invalid username or password.']);
         exit;
     }

     $_SESSION['username'] = $username;
     http_response_code(200);
     echo json_encode(['username' => $username]);
     ?>
