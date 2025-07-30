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

     if ($_SERVER['REQUEST_METHOD'] === 'GET') {
         $username = $_GET['username'] ?? '';
         if ($username !== $_SESSION['username']) {
             http_response_code(401);
             echo json_encode(['message' => 'Unauthorized.']);
             exit;
         }
         $stmt = $pdo->prepare('SELECT correct, total, mode, date FROM stats WHERE username = ? ORDER BY date');
         $stmt->execute([$username]);
         $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
         http_response_code(200);
         echo json_encode(['sessions' => $sessions]);
     } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
         $data = json_decode(file_get_contents('php://input'), true);
         $username = $data['username'] ?? '';
         $session = $data['session'] ?? [];
         if ($username !== $_SESSION['username'] || empty($session)) {
             http_response_code(401);
             echo json_encode(['message' => 'Unauthorized or invalid session data.']);
             exit;
         }
         $stmt = $pdo->prepare('INSERT INTO stats (username, correct, total, mode, date) VALUES (?, ?, ?, ?, ?)');
         $stmt->execute([$username, $session['correct'], $session['total'], $session['mode'], $session['date']]);
         http_response_code(200);
         echo json_encode(['message' => 'Session saved.']);
     } else {
         http_response_code(405);
         echo json_encode(['message' => 'Method not allowed.']);
     }
     ?>
