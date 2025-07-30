     <?php
     session_start();
     header('Content-Type: application/json');
     header('Access-Control-Allow-Origin: https://om0rx.com');
     header('Access-Control-Allow-Credentials: true');

     if (isset($_SESSION['username'])) {
         http_response_code(200);
         echo json_encode(['username' => $_SESSION['username']]);
     } else {
         http_response_code(200);
         echo json_encode([]);
     }
     ?>