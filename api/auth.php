<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'OPTIONS') {
    exit(0);
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($method === 'POST' && $action === 'login') {
    $data = get_post_data();
    
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        send_response(['success' => false, 'message' => 'Email and password required'], 400);
    }
    
    $users = read_json('../data/users.json');
    
    $found_user = null;
    foreach ($users as $user) {
        if (trim($user['email']) === trim($email)) {
            $found_user = $user;
            break;
        }
    }
    
    if (!$found_user) {
        send_response(['success' => false, 'message' => 'Invalid email or password'], 401);
    }
    
    $stored_password = $found_user['password'];
    
    if (strpos($stored_password, '$2y$') === 0) {
        if (!password_verify($password, $stored_password)) {
            send_response(['success' => false, 'message' => 'Invalid email or password'], 401);
        }
    } else {
        if ($stored_password !== $password) {
            send_response(['success' => false, 'message' => 'Invalid email or password'], 401);
        }
    }
    
    if ($found_user['status'] !== 'active') {
        send_response(['success' => false, 'message' => 'Account is not active'], 403);
    }
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    $_SESSION['user_id'] = $found_user['id'];
    $_SESSION['user_role'] = $found_user['role'];
    $_SESSION['username'] = $found_user['username'];
    $_SESSION['email'] = $found_user['email'];
    
    unset($found_user['password']);
    
    send_response([
        'success' => true,
        'user' => $found_user,
        'message' => 'Login successful'
    ]);
}

if ($method === 'POST' && $action === 'register') {
    $data = get_post_data();
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $account_type = $data['account_type'] ?? 'General';
    
    if (empty($username) || empty($email) || empty($password)) {
        send_response(['success' => false, 'message' => 'All fields are required'], 400);
    }
    
    if (strlen($password) < 6) {
        send_response(['success' => false, 'message' => 'Password must be at least 6 characters'], 400);
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_response(['success' => false, 'message' => 'Invalid email format'], 400);
    }
    
    $users = read_json('users.json');
    
    foreach ($users as $user) {
        if (strtolower($user['email']) === strtolower($email)) {
            send_response(['success' => false, 'message' => 'Email already exists'], 400);
        }
        if (strtolower($user['username']) === strtolower($username)) {
            send_response(['success' => false, 'message' => 'Username already exists'], 400);
        }
    }
    
    $role = ($account_type === 'Artist') ? 'artist' : 'user';
    
    $new_user = [
        'id' => count($users) + 1,
        'username' => $username,
        'email' => $email,
        // ✅ Hash password here
        'password' => password_hash($password, PASSWORD_BCRYPT),
        'account_type' => $account_type,
        'role' => $role,
        'status' => 'active',
        'bio' => '',
        'contact' => $email,
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    $users[] = $new_user;
    write_json('users.json', $users);
    
    send_response([
        'success' => true,
        'message' => 'Account created successfully. Please login.'
    ]);
}


if ($method === 'POST' && $action === 'logout') {
    $_SESSION = array();
    
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    session_destroy();
    
    send_response(['success' => true, 'message' => 'Logged out successfully']);
}

if ($method === 'GET' && $action === 'check') {
    if (isset($_SESSION['user_id'])) {
        $users = read_json('users.json');
        foreach ($users as $user) {
            if ($user['id'] == $_SESSION['user_id']) {
                unset($user['password']);
                send_response(['success' => true, 'user' => $user]);
            }
        }
    }
    send_response(['success' => false, 'authenticated' => false]);
}

if ($method === 'POST' && $action === 'update_profile') {
    if (!isset($_SESSION['user_id'])) {
        send_response(['success' => false, 'error' => 'Not authenticated'], 401);
    }
    
    $user_id = $_SESSION['user_id'];
    $data = get_post_data();
    
    $bio = $data['bio'] ?? '';
    $contact = $data['contact'] ?? '';
    
    $users = read_json('users.json');
    
    $found = false;
    foreach ($users as &$user) {
        if ($user['id'] == $user_id) {
            $user['bio'] = $bio;
            $user['contact'] = $contact;
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        send_response(['success' => false, 'error' => 'User not found'], 404);
    }
    
    write_json('users.json', $users);
    
    foreach ($users as $user) {
        if ($user['id'] == $user_id) {
            unset($user['password']);
            send_response(['success' => true, 'user' => $user, 'message' => 'Profile updated']);
        }
    }
}

send_response(['success' => false, 'message' => 'Invalid request'], 400);
?>