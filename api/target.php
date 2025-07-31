<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://om0rx.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET');
error_log("target.php: Request started");

// Get mode from query parameter
$mode = isset($_GET['mode']) ? $_GET['mode'] : 'realWords';
$validModes = ['realWords', 'abbreviations', 'callsigns', 'qrCodes', 'topWords', 'mixed'];

if (!in_array($mode, $validModes)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid mode']);
    error_log("target.php: Invalid mode: $mode");
    exit;
}

error_log("target.php: Processing mode: $mode");

try {
    $target = '';
    
    switch ($mode) {
        case 'realWords':
            $target = getRandomWord();
            break;
        case 'abbreviations':
            $target = getRandomFromFile('abbreviations.txt');
            break;
        case 'callsigns':
            $target = getRandomFromFile('callsigns.txt', true); // Use sampling for large file
            break;
        case 'qrCodes':
            $target = getRandomFromFile('qr-codes.txt');
            break;
        case 'topWords':
            $target = getRandomFromFile('top-words-in-cw.txt');
            break;
        case 'mixed':
            $mixedTypes = ['realWords', 'abbreviations', 'callsigns', 'qrCodes', 'topWords'];
            $randomType = $mixedTypes[array_rand($mixedTypes)];
            switch ($randomType) {
                case 'realWords':
                    $target = getRandomWord();
                    break;
                case 'abbreviations':
                    $target = getRandomFromFile('abbreviations.txt');
                    break;
                case 'callsigns':
                    $target = getRandomFromFile('callsigns.txt', true);
                    break;
                case 'qrCodes':
                    $target = getRandomFromFile('qr-codes.txt');
                    break;
                case 'topWords':
                    $target = getRandomFromFile('top-words-in-cw.txt');
                    break;
            }
            break;
    }
    
    if (empty($target)) {
        throw new Exception('Failed to generate target');
    }
    
    http_response_code(200);
    echo json_encode(['target' => $target]);
    error_log("target.php: Returned target: $target for mode: $mode");
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Server error: ' . $e->getMessage()]);
    error_log("target.php: Error: " . $e->getMessage());
}

function getRandomWord() {
    $filePath = __DIR__ . '/../data/words.txt';
    if (!file_exists($filePath)) {
        error_log("target.php: Words file not found: $filePath");
        // Fallback to basic words
        $fallbackWords = ['HELLO', 'WORLD', 'MORSE', 'CODE', 'RADIO', 'SIGNAL', 'STATION', 'ANTENNA', 'CIRCUIT', 'DEVICE'];
        return $fallbackWords[array_rand($fallbackWords)];
    }
    
    try {
        // Use reservoir sampling for efficient random selection from large file
        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            throw new Exception('Failed to open words file');
        }
        
        $selectedWord = '';
        $lineNumber = 0;
        
        while (($line = fgets($handle)) !== false) {
            $line = trim($line);
            if ($line !== '') {
                $lineNumber++;
                // Reservoir sampling: replace with probability 1/lineNumber
                if (rand(1, $lineNumber) === 1) {
                    $selectedWord = $line;
                }
            }
        }
        fclose($handle);
        
        if (empty($selectedWord)) {
            throw new Exception('No words found in file');
        }
        
        // Convert to uppercase for Morse code training
        return strtoupper($selectedWord);
        
    } catch (Exception $e) {
        error_log("target.php: Error reading words file: " . $e->getMessage());
        // Fallback to basic words
        $fallbackWords = ['HELLO', 'WORLD', 'MORSE', 'CODE', 'RADIO', 'SIGNAL', 'STATION', 'ANTENNA', 'CIRCUIT', 'DEVICE'];
        return $fallbackWords[array_rand($fallbackWords)];
    }
}

function generateCodeGroup() {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $group = '';
    $length = rand(4, 6); // Variable length code groups
    for ($i = 0; $i < $length; $i++) {
        $group .= $chars[rand(0, strlen($chars) - 1)];
    }
    return $group;
}

// Generic function to get random content from any data file
function getRandomFromFile($filename, $useSampling = false) {
    $filePath = __DIR__ . '/../data/' . $filename;
    if (!file_exists($filePath)) {
        error_log("target.php: File not found: $filePath");
        return getFallbackContent($filename);
    }
    
    try {
        if ($useSampling) {
            // Use reservoir sampling for large files (like callsigns.txt)
            $handle = fopen($filePath, 'r');
            if ($handle === false) {
                throw new Exception('Failed to open file');
            }
            
            $selectedItem = '';
            $lineNumber = 0;
            
            while (($line = fgets($handle)) !== false) {
                $line = trim($line);
                if ($line !== '') {
                    $lineNumber++;
                    // Reservoir sampling: replace with probability 1/lineNumber
                    if (rand(1, $lineNumber) === 1) {
                        $selectedItem = $line;
                    }
                }
            }
            fclose($handle);
            
            if (empty($selectedItem)) {
                throw new Exception('No content found in file');
            }
            
            return strtoupper($selectedItem);
        } else {
            // Load all lines for small files
            $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if (empty($lines)) {
                throw new Exception('File is empty');
            }
            
            $randomLine = $lines[array_rand($lines)];
            return strtoupper(trim($randomLine));
        }
        
    } catch (Exception $e) {
        error_log("target.php: Error reading $filename: " . $e->getMessage());
        return getFallbackContent($filename);
    }
}

// Fallback content for each file type
function getFallbackContent($filename) {
    $fallbacks = [
        'abbreviations.txt' => ['CQ', 'DE', 'TNX', 'FB', 'QSL', 'QRT', 'CUL', '73', 'ARRL', 'DX', 'QTH', 'WX', 'HR', 'RIG', 'ANT'],
        'callsigns.txt' => ['OM0RX', 'W1AW', 'K9LA', 'VE3ABC', 'G0XYZ', 'DL1QRS', 'JA1TNX', 'VK2DEF', 'S51MNO', '2E0ABC'],
        'qr-codes.txt' => ['QRA', 'QRB', 'QRG', 'QRH', 'QRI', 'QRK', 'QRL', 'QRM', 'QRN', 'QRO', 'QRP', 'QRQ', 'QRS', 'QRT', 'QRU'],
        'top-words-in-cw.txt' => ['I', 'AND', 'THE', 'YOU', 'THAT', 'A', 'TO', 'KNOW', 'OF', 'IT', 'YEAH', 'IN', 'THEY', 'DO', 'SO', 'BUT']
    ];
    
    $options = $fallbacks[$filename] ?? ['HELLO', 'WORLD', 'MORSE'];
    return $options[array_rand($options)];
}

function generateCallsign() {
    // Generate realistic amateur radio callsigns
    $prefixes = ['K', 'W', 'N', 'A', 'VE', 'G', 'DL', 'JA', 'VK', 'OM', 'OK', 'LZ', 'UR', 'S5'];
    $numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    $suffixes = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AV', 'AW', 'AX', 'AY', 'AZ',
        'BA', 'BB', 'BC', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BK', 'BL', 'BM', 'BN', 'BO', 'BP', 'BQ', 'BR', 'BS', 'BT', 'BU', 'BV', 'BW', 'BX', 'BY', 'BZ',
        'CA', 'CB', 'CC', 'CD', 'CE', 'CF', 'CG', 'CH', 'CI', 'CJ', 'CK', 'CL', 'CM', 'CN', 'CO', 'CP', 'CQ', 'CR', 'CS', 'CT', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ'
    ];
    
    $prefix = $prefixes[array_rand($prefixes)];
    $number = $numbers[array_rand($numbers)];
    $suffix = $suffixes[array_rand($suffixes)];
    
    return $prefix . $number . $suffix;
}
?>