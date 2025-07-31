<?php
// Comprehensive test for enhanced training modes
// Access via: http://localhost/morserino/api/test_enhanced_modes.php
?>
<!DOCTYPE html>
<html>
<head>
    <title>Enhanced Modes Test - Morserino Web</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .mode-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .mode-title { color: #333; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .test-result { display: inline-block; margin: 5px; padding: 5px 10px; border-radius: 3px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        .file-stats { background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 3px; font-family: monospace; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Enhanced Training Modes Test</h1>
        <p><strong>Testing all 6 training modes with file-based content</strong></p>
        
        <?php
        // Test all modes
        $modes = [
            'realWords' => 'Real Words (400k+ English dictionary)',
            'abbreviations' => 'Abbreviations (Ham radio abbreviations)',
            'callsigns' => 'Callsigns (Real amateur radio callsigns)',
            'qrCodes' => 'QR-codes (Q-codes for amateur radio)',
            'topWords' => 'Top Words in CW (Most common CW words)',
            'mixed' => 'Mixed (Random selection from all modes)'
        ];
        
        echo "<h2>📊 File Information</h2>";
        $dataDir = __DIR__ . '/../data/';
        $files = [
            'words.txt' => 'English Dictionary',
            'abbreviations.txt' => 'Ham Radio Abbreviations',
            'callsigns.txt' => 'Amateur Radio Callsigns',
            'qr-codes.txt' => 'Q-codes',
            'top-words-in-cw.txt' => 'Top CW Words'
        ];
        
        echo "<table>";
        echo "<tr><th>File</th><th>Description</th><th>Size</th><th>Lines</th><th>Status</th></tr>";
        
        foreach ($files as $filename => $description) {
            $filepath = $dataDir . $filename;
            if (file_exists($filepath)) {
                $size = filesize($filepath);
                $lines = count(file($filepath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES));
                $sizeFormatted = $size > 1024*1024 ? round($size/(1024*1024), 1) . ' MB' : round($size/1024, 1) . ' KB';
                echo "<tr><td><code>$filename</code></td><td>$description</td><td>$sizeFormatted</td><td>" . number_format($lines) . "</td><td><span class='success'>✅ EXISTS</span></td></tr>";
            } else {
                echo "<tr><td><code>$filename</code></td><td>$description</td><td>-</td><td>-</td><td><span class='error'>❌ MISSING</span></td></tr>";
            }
        }
        echo "</table>";
        
        echo "<h2>🎯 Mode Testing Results</h2>";
        
        foreach ($modes as $mode => $description) {
            echo "<div class='mode-section'>";
            echo "<div class='mode-title'>$description</div>";
            
            // Test each mode 5 times
            echo "<strong>Sample targets:</strong><br>";
            $targets = [];
            $errors = [];
            
            for ($i = 1; $i <= 8; $i++) {
                try {
                    $_GET['mode'] = $mode;
                    ob_start();
                    include 'target.php';
                    $result = ob_get_clean();
                    
                    $data = json_decode($result, true);
                    if ($data && isset($data['target'])) {
                        $targets[] = $data['target'];
                        echo "<span class='test-result success'>" . htmlspecialchars($data['target']) . "</span>";
                    } else {
                        $errors[] = "Test $i: Invalid response - $result";
                        echo "<span class='test-result error'>ERROR $i</span>";
                    }
                } catch (Exception $e) {
                    $errors[] = "Test $i: Exception - " . $e->getMessage();
                    echo "<span class='test-result error'>EXCEPTION $i</span>";
                }
            }
            
            // Analysis
            echo "<br><br><strong>Analysis:</strong><br>";
            $uniqueCount = count(array_unique($targets));
            $totalCount = count($targets);
            
            if ($totalCount > 0) {
                echo "<span class='test-result info'>✅ Generated $totalCount targets</span>";
                echo "<span class='test-result info'>🎲 $uniqueCount unique targets</span>";
                
                if ($uniqueCount > 1) {
                    echo "<span class='test-result success'>✅ Good variety</span>";
                } else {
                    echo "<span class='test-result error'>⚠️ Low variety</span>";
                }
                
                // Check if targets are uppercase
                $uppercaseCount = 0;
                foreach ($targets as $target) {
                    if ($target === strtoupper($target)) {
                        $uppercaseCount++;
                    }
                }
                
                if ($uppercaseCount === $totalCount) {
                    echo "<span class='test-result success'>✅ All uppercase</span>";
                } else {
                    echo "<span class='test-result error'>⚠️ Mixed case detected</span>";
                }
            }
            
            if (!empty($errors)) {
                echo "<br><strong>Errors:</strong><br>";
                foreach ($errors as $error) {
                    echo "<span class='test-result error'>$error</span><br>";
                }
            }
            
            echo "</div>";
        }
        
        echo "<h2>🔧 System Information</h2>";
        echo "<div class='file-stats'>";
        echo "PHP Version: " . phpversion() . "<br>";
        echo "Memory Limit: " . ini_get('memory_limit') . "<br>";
        echo "Max Execution Time: " . ini_get('max_execution_time') . "s<br>";
        echo "Data Directory: " . realpath($dataDir) . "<br>";
        echo "Test Time: " . date('Y-m-d H:i:s') . "<br>";
        echo "</div>";
        
        echo "<h2>✅ Next Steps</h2>";
        echo "<ol>";
        echo "<li><strong>If all modes show ✅ Generated targets:</strong> Your enhanced modes are working perfectly!</li>";
        echo "<li><strong>If any mode shows errors:</strong> Check the file exists and has proper permissions</li>";
        echo "<li><strong>Test in browser:</strong> Go to your main application and try each mode</li>";
        echo "<li><strong>Check variety:</strong> Each mode should show different content on multiple tries</li>";
        echo "</ol>";
        
        echo "<p><strong>🎉 Enhanced Training Modes Status:</strong> ";
        $allGood = true;
        foreach ($modes as $mode => $description) {
            try {
                $_GET['mode'] = $mode;
                ob_start();
                include 'target.php';
                $result = ob_get_clean();
                $data = json_decode($result, true);
                if (!($data && isset($data['target']))) {
                    $allGood = false;
                    break;
                }
            } catch (Exception $e) {
                $allGood = false;
                break;
            }
        }
        
        if ($allGood) {
            echo "<span class='success'>🚀 ALL SYSTEMS GO! Enhanced modes are ready for training.</span>";
        } else {
            echo "<span class='error'>⚠️ Some issues detected. Check the results above.</span>";
        }
        echo "</p>";
        ?>
        
        <hr style="margin: 30px 0;">
        <p><small><strong>Note:</strong> This test file can be deleted after verification. It's only for testing the enhanced functionality.</small></p>
    </div>
</body>
</html>