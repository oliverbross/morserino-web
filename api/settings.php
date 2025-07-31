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
        if (!isset($_SESSION['username']) || !isset($_GET['username']) || $_GET['username'] !== $_SESSION['username']) {
            http_response_code(401);
            echo json_encode(['message' => 'Not logged in or unauthorized']);
            error_log("Settings.php: Unauthorized GET, session username: " . ($_SESSION['username'] ?? 'none') . ", GET username: " . ($_GET['username'] ?? 'none'));
            exit;
        }
        $username = $_SESSION['username'];
        $stmt = $conn->prepare("SELECT email, date_format, time_format, section_order FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        error_log("Settings.php: Fetch settings for username: $username, found: " . ($user ? 'yes' : 'no'));
        if ($user) {
            echo json_encode([
                'email' => $user['email'] ?? '',
                'dateFormat' => $user['date_format'] ?? 'DD/MM/YYYY',
                'timeFormat' => $user['time_format'] ?? '12h',
                'sectionOrder' => $user['section_order'] ? json_decode($user['section_order'], true) : []
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'User not found']);
            error_log("Settings.php: User not found: $username");
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!isset($_SESSION['username'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Not logged in']);
            error_log("Settings.php: Not logged in for POST");
            exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        error_log("Settings.php: Input received: " . json_encode($input));
        if (!$input || !isset($input['username']) || $input['username'] !== $_SESSION['username']) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid input or unauthorized']);
            error_log("Settings.php: Invalid input or username mismatch, input username: " . ($input['username'] ?? 'none'));
            exit;
        }
        $username = $_SESSION['username'];
        $updates = [];
        $params = [];
        if (isset($input['email'])) {
            $updates[] = "email = ?";
            $params[] = $input['email'];
        }
        if (isset($input['dateFormat'])) {
            $updates[] = "date_format = ?";
            $params[] = $input['dateFormat'];
        }
        if (isset($input['timeFormat'])) {
            $updates[] = "time_format = ?";
            $params[] = $input['timeFormat'];
        }
        if (isset($input['sectionOrder']) && is_array($input['sectionOrder'])) {
            $updates[] = "section_order = ?";
            $params[] = json_encode($input['sectionOrder']);
        }
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['message' => 'No changes provided']);
            error_log("Settings.php: No changes provided for username: $username");
            exit;
        }
        // Add username as the last parameter for the WHERE clause
        $params[] = $username;
        $query = "UPDATE users SET " . implode(', ', $updates) . " WHERE username = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        $rowCount = $stmt->rowCount();
        error_log("Settings.php: Update executed, rows affected: $rowCount, username: $username");
        if ($rowCount > 0) {
            echo json_encode(['message' => 'Settings updated successfully']);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'No changes made or user not found']);
            error_log("Settings.php: No rows updated for username: $username");
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
