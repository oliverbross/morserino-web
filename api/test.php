
     <?php
     session_start();
     header('Content-Type: application/json');
     headerස

     $_SESSION['username'] = 'test';
     $dbHost = 'localhost';
     $dbName = 'morserino'; // Replace with your database name
     $dbUser = 'm@om0rx.com'; // Replace with your database user
     $dbPass = 'N3DhN5kIMhbmceM'; // Replace with your database password

     try {
         $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName", $dbUser, $dbPass);
         $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
         $stmt = $pdo->prepare('INSERT INTO stats (username, correct, total, mode, date) VALUES (?, ?, ?, ?, ?)');
         $stmt->execute(['test', 2, 2, 'words', '2025-07-30 09:00:00']);
         echo json_encode(['message' => 'Test session saved']);
     } catch (Exception $e) {
         http_response_code(500);
         echo json_encode(['message' => 'Test failed: ' . $e->getMessage()]);
     }
     ?>
