<?php
// Quick test for enhanced modes functionality
// Access: http://localhost/morserino/api/quick_test.php

echo "<h2>🚀 Quick Enhanced Modes Test</h2>";

$modes = ['realWords', 'abbreviations', 'callsigns', 'qrCodes', 'topWords', 'mixed'];

foreach ($modes as $mode) {
    echo "<h3>Testing: $mode</h3>";
    
    // Test API call
    $_GET['mode'] = $mode;
    ob_start();
    include 'target.php';
    $result = ob_get_clean();
    
    $data = json_decode($result, true);
    if ($data && isset($data['target'])) {
        echo "<p style='color: green;'>✅ <strong>" . htmlspecialchars($data['target']) . "</strong></p>";
    } else {
        echo "<p style='color: red;'>❌ Error: " . htmlspecialchars($result) . "</p>";
    }
}

echo "<hr><p><strong>If all modes show ✅ with a target word, your enhanced system is working!</strong></p>";
echo "<p><small>Now test the UI: mode selection buttons should work and show toast notifications.</small></p>";
?>