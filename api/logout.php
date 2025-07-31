<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://om0rx.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

error_log('logout.php accessed');

session_unset();
session_destroy();
http_response_code(200);
echo json_encode(['message' => 'Logged out successfully']);
?>
