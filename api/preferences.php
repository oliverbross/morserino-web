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
         $stmt = $pdo->prepare('SELECT dateFormat, timeFormat FROM preferences WHERE username = ?');
         $stmt->execute([$username]);
         $prefs = $stmt->fetch(PDO::FETCH_ASSOC);
         if (!$prefs) {
             $prefs = ['dateFormat' => 'DD/MM/YYYY', 'timeFormat' => '24h'];
             $stmt = $pdo->prepare('INSERT INTO preferences (username, dateFormat, timeFormat) VALUES (?, ?, ?)');
             $stmt->execute([$username, $prefs['dateFormat'], $prefs['timeFormat']]);
         }
         http_response_code(200);
         echo json_encode($prefs);
     } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
         $data = json_decode(file_get_contents('php://input'), true);
         $username = $data['username'] ?? '';
         $dateFormat = $data['dateFormat'] ?? 'DD/MM/YYYY';
         $timeFormat = $data['timeFormat'] ?? '24h';
         if ($username !== $_SESSION['username']) {
             http_response_code(401);
             echo json_encode(['message' => 'Unauthorized.']);
             exit;
         }
         $stmt = $pdo->prepare('INSERT INTO preferences (username, dateFormat, timeFormat) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE dateFormat = ?, timeFormat = ?');
         $stmt->execute([$username, $dateFormat, $timeFormat, $dateFormat, $timeFormat]);
         http_response_code(200);
         echo json_encode(['message' => 'Preferences saved.']);
     } else {
         http_response_code(405);
         echo json_encode(['message' => 'Method not allowed.']);
     }
     ?>
