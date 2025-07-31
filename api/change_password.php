<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/home/om0rx/public_html/morserino/api/error.log');

// Log request start
error_log("Change_password.php: Request started, method: " . $_SERVER['REQUEST_METHOD'] . ", username: " . ($_SESSION['username'] ?? 'none'));

try {
    // Check for vendor/autoload.php
    if (!file_exists('/home/om0rx/public_html/morserino/vendor/autoload.php')) {
        error_log("Change_password.php: Missing vendor/autoload.php");
        http_response_code(500);
        echo json_encode(['message' => 'Server configuration error: Missing dependencies']);
        exit;
    }
    require_once '/home/om0rx/public_html/morserino/vendor/autoload.php';

    // Load .env
    try {
        $dotenv = Dotenv\Dotenv::createImmutable('/home/om0rx/public_html/morserino');
        $dotenv->load();
        error_log("Change_password.php: .env loaded successfully");
    } catch (Exception $e) {
        error_log("Change_password.php: Failed to load .env: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error: Failed to load configuration']);
        exit;
    }

    // Verify environment variables
    if (!isset($_ENV['DB_HOST'], $_ENV['DB_NAME'], $_ENV['DB_USER'], $_ENV['DB_PASS'])) {
        error_log("Change_password.php: Missing environment variables");
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
    error_log("Change_password.php: Database connected successfully");

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!isset($_SESSION['username'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Not logged in']);
            error_log("Change_password.php: Not logged in");
            exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        error_log("Change_password.php: Input received: " . json_encode($input));
        if (!$input || !isset($input['username']) || $input['username'] !== $_SESSION['username'] || !isset($input['password']) || empty($input['password'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid input or unauthorized']);
            error_log("Change_password.php: Invalid input or username mismatch");
            exit;
        }
        // Generate salt and hash to match login.php
        $salt = bin2hex(random_bytes(16));
        $hashedPassword = password_hash($input['password'] . $salt, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET hash = ?, salt = ? WHERE username = ?");
        $stmt->execute([$hashedPassword, $salt, $_SESSION['username']]);
        $rowCount = $stmt->rowCount();
        error_log("Change_password.php: Update executed, rows affected: $rowCount, username: " . $_SESSION['username']);
        if ($rowCount > 0) {
            echo json_encode(['message' => 'Password changed successfully']);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'No changes made or user not found']);
            error_log("Change_password.php: No rows updated for username: " . $_SESSION['username']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
        error_log("Change_password.php: Method not allowed: " . $_SERVER['REQUEST_METHOD']);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log("Change_password.php error: " . $e->getMessage() . " in " . __FILE__ . " on line " . __LINE__);
    echo json_encode(['message' => 'Server error: ' . $e->getMessage()]);
}
$conn = null;
?>
