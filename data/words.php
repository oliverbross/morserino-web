<?php
header('Content-Type: text/plain');
header('Access-Control-Allow-Origin: https://om0rx.com');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Get the mode from query parameter
$mode = $_GET['mode'] ?? 'realWords';

// Map modes to file names
$fileMap = [
    'realWords' => 'words.txt',
    'abbreviations' => 'abbreviations.txt',
    'callsigns' => 'callsigns.txt',
    'qrCodes' => 'qr-codes.txt',
    'topWords' => 'top-words-in-cw.txt',
    'mixed' => 'words.txt' // Default to words.txt for mixed mode, we'll mix it up
];

// Get the appropriate file
$filename = $fileMap[$mode] ?? 'words.txt';
$filepath = __DIR__ . '/' . $filename;

if (!file_exists($filepath)) {
    http_response_code(404);
    echo "HELLO"; // Fallback word
    exit;
}

// Read the file and get a random word
$content = file_get_contents($filepath);
$lines = array_filter(array_map('trim', explode("\n", $content)));

if (empty($lines)) {
    echo "HELLO"; // Fallback word
    exit;
}

// For mixed mode, combine words from multiple files
if ($mode === 'mixed') {
    $allWords = [];
    
    // Add words from each category
    foreach (['words.txt', 'abbreviations.txt', 'callsigns.txt', 'qr-codes.txt'] as $file) {
        $filePath = __DIR__ . '/' . $file;
        if (file_exists($filePath)) {
            $fileContent = file_get_contents($filePath);
            $fileLines = array_filter(array_map('trim', explode("\n", $fileContent)));
            $allWords = array_merge($allWords, array_slice($fileLines, 0, 10)); // Take first 10 from each
        }
    }
    
    if (!empty($allWords)) {
        $lines = $allWords;
    }
}

// Return a random word
$randomWord = $lines[array_rand($lines)];
echo strtoupper(trim($randomWord));
?>