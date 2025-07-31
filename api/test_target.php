<?php
// Simple test script to verify target.php functionality
// Run this via web browser: http://localhost/morserino/api/test_target.php

echo "<h2>Testing target.php API</h2>";
echo "<h3>Testing different modes:</h3>";

$modes = ['realWords', 'codeGroups', 'callsigns', 'mixed'];

foreach ($modes as $mode) {
    echo "<h4>Mode: $mode</h4>";
    for ($i = 1; $i <= 5; $i++) {
        // Simulate the API call
        $_GET['mode'] = $mode;
        ob_start();
        include 'target.php';
        $result = ob_get_clean();
        
        $data = json_decode($result, true);
        if ($data && isset($data['target'])) {
            echo "Test $i: <strong>" . htmlspecialchars($data['target']) . "</strong><br>";
        } else {
            echo "Test $i: <span style='color:red'>ERROR - " . htmlspecialchars($result) . "</span><br>";
        }
    }
    echo "<br>";
}

echo "<h3>File Information:</h3>";
$wordsFile = __DIR__ . '/../data/words.txt';
if (file_exists($wordsFile)) {
    $fileSize = filesize($wordsFile);
    $lineCount = count(file($wordsFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES));
    echo "Words file exists: <strong>YES</strong><br>";
    echo "File size: <strong>" . number_format($fileSize) . " bytes</strong><br>";
    echo "Approximate word count: <strong>" . number_format($lineCount) . " words</strong><br>";
} else {
    echo "Words file exists: <strong style='color:red'>NO</strong><br>";
    echo "Expected path: <code>" . htmlspecialchars($wordsFile) . "</code><br>";
}
?>