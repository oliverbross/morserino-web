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

// Validate input
if ($username !== $_SESSION['username'] || !in_array($mode, ['realWords', 'codeGroups', 'callsigns', 'mixed']) || $correct < 0 || $total < 0 || $correct > $total) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid data']);
    exit;
}

// Insert new session stats
$stmt = $conn->prepare('INSERT INTO stats (username, mode, correct, total, timestamp) VALUES (?, ?, ?, ?, NOW())');
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['message' => 'Database error: ' . $conn->error]);
    exit;
}

$stmt->bind_param('ssii', $username, $mode, $correct, $total);
if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode(['message' => 'Stats saved successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to save stats: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
