<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/home/om0rx/public_html/morserino/api/error.log');

// Log request start
error_log("Settings.php: Request started, method: " . $_SERVER['REQUEST_METHOD'] . ", username: " . ($_SESSION['username'] ?? 'none'));

try {
    // Check for vendor/autoload.php
    if (!file_exists('/home/om0rx/public_html/morserino/vendor/autoload.php')) {
        error_log("Settings.php: Missing vendor/autoload.php");
        http_response_code(500);
        echo json_encode(['message' => 'Server configuration error: Missing dependencies']);
        exit;
    }
    require_once '/home/om0rx/public_html/morserino/vendor/autoload.php';

    // Load .env
    try {
        $dotenv = Dotenv\Dotenv::createImmutable('/home/om0rx/public_html/morserino');
        $dotenv->load();
        error_log("Settings.php: .env loaded successfully");
    } catch (Exception $e) {
        error_log("Settings.php: Failed to load .env: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error: Failed to load configuration']);
        exit;
    }

    // Verify environment variables
    if (!isset($_ENV['DB_HOST'], $_ENV['DB_NAME'], $_ENV['DB_USER'], $_ENV['DB_PASS'])) {
        error_log("Settings.php: Missing environment variables");
        http_response_code(500);
        echo json_encode(['message' => 'Server error: Missing database configuration']);
        exit;
    }

    // Database connection
    $conn = new PDO(
        "mysql:host=" . $_ENV['DB_HOST'] . ";dbname=" . $_ENV['DB_NAME'] . ";charset=utf8",
        $_ENV['DB_USER'],
        $_ENV['DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    error_log("Settings.php: Database connected successfully");

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!isset($_SESSION['username']) || empty($_GET['username']) || $_GET['username'] !== $_SESSION['username']) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized or not logged in']);
            error_log("Settings.php GET: Unauthorized, session username: " . ($_SESSION['username'] ?? 'none') . ", GET username: " . ($_GET['username'] ?? 'none'));
            exit;
        }
        $stmt = $conn->prepare("SELECT email, date_format, time_format FROM users WHERE username = ?");
        $stmt->execute([$_SESSION['username']]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result) {
            echo json_encode([
                'email' => $result['email'] ?? '',
                'dateFormat' => $result['date_format'] ?? 'DD/MM/YYYY',
                'timeFormat' => $result['time_format'] ?? '12h'
            ]);
            error_log("Settings.php GET: Success for username: " . $_SESSION['username'] . ", data: " . json_encode($result));
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'User not found']);
            error_log("Settings.php GET: User not found: " . $_SESSION['username']);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!isset($_SESSION['username'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Not logged in']);
            error_log("Settings.php POST: Not logged in");
            exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        error_log("Settings.php POST: Input received: " . json_encode($input));
        if (!$input || !isset($input['email'], $input['dateFormat'], $input['timeFormat'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid input']);
            error_log("Settings.php POST: Invalid input: " . (is_array($input) ? json_encode($input) : 'none'));
            exit;
        }
        // Validate input
        $email = filter_var($input['email'], FILTER_VALIDATE_EMAIL) ? $input['email'] : ($input['email'] === '' ? '' : null);
        $dateFormat = in_array($input['dateFormat'], ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD']) ? $input['dateFormat'] : 'DD/MM/YYYY';
        $timeFormat = in_array($input['timeFormat'], ['12h', '24h']) ? $input['timeFormat'] : '12h';
        error_log("Settings.php POST: Validated input - email: " . ($email ?? 'null') . ", dateFormat: $dateFormat, timeFormat: $timeFormat");

        $stmt = $conn->prepare("UPDATE users SET email = ?, date_format = ?, time_format = ? WHERE username = ?");
        $stmt->execute([$email, $dateFormat, $timeFormat, $_SESSION['username']]);
        $rowCount = $stmt->rowCount();
        error_log("Settings.php POST: Update executed, rows affected: $rowCount, username: " . $_SESSION['username']);
        if ($rowCount > 0) {
            echo json_encode(['message' => 'Settings updated successfully']);
        } else {
            // Check current values to determine why no rows were updated
            $stmt = $conn->prepare("SELECT email, date_format, time_format FROM users WHERE username = ?");
            $stmt->execute([$_SESSION['username']]);
            $current = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("Settings.php POST: Current values - email: " . ($current['email'] ?? 'null') . ", date_format: " . ($current['date_format'] ?? 'null') . ", time_format: " . ($current['time_format'] ?? 'null'));
            http_response_code(400);
            echo json_encode(['message' => 'No changes made or user not found']);
            error_log("Settings.php POST: No rows updated for username: " . $_SESSION['username']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
        error_log("Settings.php: Method not allowed: " . $_SERVER['REQUEST_METHOD']);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log("Settings.php error: " . $e->getMessage() . " in " . __FILE__ . " on line " . __LINE__);
    echo json_encode(['message' => 'Server error: ' . $e->getMessage()]);
}
$conn = null;
?>
