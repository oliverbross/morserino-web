<?php
header('Content-Type: application/json');
error_log("words.php: Request started");

// Read numItems from query parameter
$numItems = isset($_GET['numItems']) ? (int)$_GET['numItems'] : 5;
if ($numItems < 1 || $numItems > 100) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid numItems (1-100)']);
    error_log("words.php: Invalid numItems: $numItems");
    exit;
}

// Path to words.txt
$filePath = __DIR__ . '/../data/words.txt';
if (!file_exists($filePath)) {
    http_response_code(500);
    echo json_encode(['message' => 'Words file not found']);
    error_log("words.php: File not found: $filePath");
    exit;
}

try {
    // Read all lines into an array (memory-efficient for random sampling)
    $lines = [];
    $handle = fopen($filePath, 'r');
    if ($handle === false) {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to open words file']);
        error_log("words.php: Failed to open file: $filePath");
        exit;
    }

    // Collect all lines
    while (($line = fgets($handle)) !== false) {
        $line = trim($line);
        if ($line !== '') {
            $lines[] = $line;
        }
    }
    fclose($handle);

    $totalLines = count($lines);
    error_log("words.php: Loaded $totalLines words");

    if ($totalLines === 0) {
        http_response_code(500);
        echo json_encode(['message' => 'Words file is empty']);
        error_log("words.php: Empty file: $filePath");
        exit;
    }

    // Select random words
    $selectedWords = [];
    $numItems = min($numItems, $totalLines); // Ensure we don't exceed available words
    $indices = array_rand($lines, $numItems);
    if (!is_array($indices)) {
        $indices = [$indices]; // array_rand returns scalar for single item
    }
    foreach ($indices as $index) {
        $selectedWords[] = $lines[$index];
    }

    http_response_code(200);
    echo json_encode(['words' => $selectedWords]);
    error_log("words.php: Returned $numItems words: " . implode(', ', array_slice($selectedWords, 0, 5)));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Server error: ' . $e->getMessage()]);
    error_log("words.php: Error: " . $e->getMessage());
}
?>
