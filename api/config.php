<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

define('DATA_DIR', __DIR__ . '/../data/');

function read_json($filename) {
    $path = DATA_DIR . $filename;
    if (!file_exists($path)) {
        if ($filename === 'users.json') {
            $default_users = [
                [
                    "id" => 1,
                    "username" => "admin",
                    "email" => "admin@example.com",
                    "password" => "admin123",
                    "account_type" => "Admin",
                    "role" => "admin",
                    "status" => "active",
                    "created_at" => date('Y-m-d H:i:s')
                ]
            ];
            write_json('users.json', $default_users);
            return $default_users;
        }
        return [];
    }
    $content = file_get_contents($path);
    $data = json_decode($content, true);
    return $data ?: [];
}

function write_json($filename, $data) {
    $path = DATA_DIR . $filename;
    // Ensure directory exists
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0755, true);
    }
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT));
}

function send_response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function get_post_data() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return $_POST;
    }
    return $data ?: [];
}

function check_auth() {
    if (!isset($_SESSION['user_id'])) {
        send_response(['error' => 'Not authenticated'], 401);
    }
    return $_SESSION['user_id'];
}

function check_admin() {
    $user_id = check_auth();
    $users = read_json('users.json');
    
    foreach ($users as $user) {
        if ($user['id'] == $user_id && $user['role'] === 'admin') {
            return $user;
        }
    }
    
    send_response(['error' => 'Admin access required'], 403);
}

function check_artist() {
    $user_id = check_auth();
    $users = read_json('users.json');
    
    foreach ($users as $user) {
        if ($user['id'] == $user_id && ($user['role'] === 'artist' || $user['role'] === 'admin')) {
            return $user;
        }
    }
    
    send_response(['error' => 'Artist access required'], 403);
}
?>