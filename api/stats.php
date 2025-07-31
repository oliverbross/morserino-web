<?php
session_start();
header('Content-Type: application/json');

// Database connection
$dbHost = 'localhost';
$dbUser = 'm@om0rx.com';
$dbPass = 'N3DhN5kIMhbmceM';
$dbName = 'morserino';
$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Not logged in']);
    exit;
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON input']);
    exit;
}

$username = $input['username'] ?? '';
$mode = $input['mode'] ?? '';
$correct = isset($input['correct']) ? (int)$input['correct'] : 0;
$total = isset($input['total']) ? (int)$input['total'] : 0;

// Enhanced session data (v1.1 features)
$letters = isset($input['letters']) ? (int)$input['letters'] : 0;
$numbers = isset($input['numbers']) ? (int)$input['numbers'] : 0;
$signs = isset($input['signs']) ? (int)$input['signs'] : 0;
$errors = isset($input['errors']) ? (int)$input['errors'] : max(0, $total - $correct);
$time_seconds = isset($input['timeSeconds']) ? (float)$input['timeSeconds'] : 0.0;
$accuracy = isset($input['accuracy']) ? (float)$input['accuracy'] : ($total > 0 ? round(($correct / $total) * 100, 2) : 0.0);
$cpm = isset($input['cpm']) ? (float)$input['cpm'] : 0.0;
$wpm = isset($input['wpm']) ? (float)$input['wpm'] : 0.0;

// Validate input
if ($username !== $_SESSION['username'] || !in_array($mode, ['realWords', 'abbreviations', 'callsigns', 'qrCodes', 'topWords', 'mixed']) || $correct < 0 || $total < 0 || $correct > $total) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid data']);
    exit;
}

// Check if enhanced columns exist (backwards compatibility)
$hasNewColumns = false;
$checkColumns = $conn->query("SHOW COLUMNS FROM stats LIKE 'letters'");
if ($checkColumns && $checkColumns->num_rows > 0) {
    $hasNewColumns = true;
}

// Insert new session stats
if ($hasNewColumns) {
    // Use enhanced schema with detailed session tracking
    $stmt = $conn->prepare('INSERT INTO stats (username, mode, correct, total, letters, numbers, signs, errors, time_seconds, accuracy, cpm, wpm, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))');
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['message' => 'Database error: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param('ssiiiiiiiddd', $username, $mode, $correct, $total, $letters, $numbers, $signs, $errors, $time_seconds, $accuracy, $cpm, $wpm);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            'message' => 'Enhanced session stats saved successfully',
            'data' => [
                'letters' => $letters,
                'numbers' => $numbers,
                'signs' => $signs,
                'errors' => $errors,
                'accuracy' => $accuracy,
                'cpm' => $cpm,
                'wpm' => $wpm,
                'time_seconds' => $time_seconds
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to save enhanced stats: ' . $stmt->error]);
    }
} else {
    // Fallback to basic schema for compatibility
    $stmt = $conn->prepare('INSERT INTO stats (username, mode, correct, total, timestamp) VALUES (?, ?, ?, ?, NOW())');
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['message' => 'Database error: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param('ssii', $username, $mode, $correct, $total);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(['message' => 'Basic stats saved successfully (upgrade database for enhanced features)']);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to save stats: ' . $stmt->error]);
    }
}

$stmt->close();
$conn->close();
?>
