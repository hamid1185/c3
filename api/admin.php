<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($action === 'check_session') {
    $loggedInUserId = $_SESSION['user_id'] ?? null;
    $role = $_SESSION['user_role'] ?? null;

    if (!$loggedInUserId) {
        http_response_code(401);
        echo json_encode(['error' => 'User not logged in']);
        exit();
    }

    echo json_encode([
        'logged_in' => true,
        'user_id' => $loggedInUserId,
        'role' => $role
    ]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function read_json($filename) {
    if (!file_exists($filename)) {
        error_log("File not found: " . $filename);
        return []; 
    }
    $json = file_get_contents($filename);
    $data = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON decode error in " . $filename . ": " . json_last_error_msg());
        return [];
    }
 
    return $data['submissions'] ?? $data['users'] ?? $data['artworks'] ?? $data['categories'] ?? $data;
}

function write_json($filename, $data) {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    return file_put_contents($filename, $json);
}

function send_response($data, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode($data);
    exit;
}

function get_json_input() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

function get_user_id() {
    $user_id = $_GET['user_id'] ?? $_POST['user_id'] ?? 0;
    if (empty($user_id)) {
        $input = get_json_input();
        $user_id = $input['user_id'] ?? 0;
    }
    return $user_id;
}

function check_admin() {
    $user_id = get_user_id();
    
    if (empty($user_id)) {
        return false;
    }
    
    $users = read_json(__DIR__ . '/../data/users.json');
    
    foreach ($users as $user) {
        if (isset($user['id']) && $user['id'] == $user_id) {
            $userRole = $user['role'] ?? $user['user_role'] ?? 'user';
            if ($userRole === 'admin') {
                return true;
            }
        }
    }
    return false;
}

if ($method === 'GET' && $action === 'stats') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized - Admin access required'], 403);
    }
    
    $submissions = read_json(__DIR__ . '/../data/submissions.json');
    $users = read_json(__DIR__ . '/../data/users.json');
    
    $pending = count(array_filter($submissions, function($s) {
        return ($s['status'] ?? 'pending') === 'pending';
    }));
    
    $approved_artworks = count($submissions);
    
    send_response([
        'success' => true,
        'stats' => [
            'pending' => $pending,
            'users' => count($users),
            'artworks' => $approved_artworks
        ]
    ]);
}

if ($method === 'GET' && $action === 'pending') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized - Admin access required'], 403);
    }
    
    $submissions = read_json(__DIR__ . '/../data/submissions.json');
    
    $pending = array_filter($submissions, function($s) {
        return ($s['status'] ?? 'pending') === 'pending';
    });
    
    send_response([
        'success' => true,
        'submissions' => array_values($pending)
    ]);
}

if ($method === 'POST' && $action === 'approve') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized - Admin access required'], 403);
    }
    
    $data = get_json_input();
    $id = $data['id'] ?? 0;
    
    $submissions = read_json(__DIR__ . '/../data/submissions.json');
    
    $found = false;
    foreach ($submissions as &$sub) {
        if (($sub['id'] ?? 0) == $id) {
            $sub['status'] = 'approved';
            $sub['approved_at'] = date('c');
            $sub['approved_by'] = get_user_id();
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        send_response(['success' => false, 'error' => 'Submission not found'], 404);
    }
    
    write_json(__DIR__ . '/../data/submissions.json', $submissions);
    
    send_response(['success' => true, 'message' => 'Artwork approved']);
}

if ($method === 'POST' && $action === 'reject') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized - Admin access required'], 403);
    }
    
    $data = get_json_input();
    $id = $data['id'] ?? 0;
    
    $submissions = read_json(__DIR__ . '/../data/submissions.json');
    
    $found = false;
    foreach ($submissions as &$sub) {
        if (($sub['id'] ?? 0) == $id) {
            $sub['status'] = 'rejected';
            $sub['rejected_at'] = date('c');
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        send_response(['success' => false, 'error' => 'Submission not found'], 404);
    }
    
    write_json(__DIR__ . '/../data/submissions.json', $submissions);
    
    send_response(['success' => true, 'message' => 'Submission rejected']);
}

if ($method === 'GET' && $action === 'users') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized - Admin access required'], 403);
    }
    
    $users = read_json(__DIR__ . '/../data/users.json');
    
    $safe_users = [];
    foreach ($users as $user) {
        unset($user['password']);
        $safe_users[] = $user;
    }
    
    send_response([
        'success' => true,
        'users' => $safe_users
    ]);
}

if ($method === 'POST' && $action === 'update_role') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized - Admin access required'], 403);
    }
    
    $data = get_json_input();
    $user_id = $data['user_id'] ?? 0;
    $new_role = $data['role'] ?? '';
    
    $users = read_json(__DIR__ . '/../data/users.json');
    
    $found = false;
    foreach ($users as &$user) {
        if (($user['id'] ?? 0) == $user_id) {
            $user['role'] = $new_role;
            $user['account_type'] = $new_role;
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        send_response(['success' => false, 'error' => 'User not found'], 404);
    }
    
    write_json(__DIR__ . '/../data/users.json', $users);
    send_response(['success' => true, 'message' => 'User role updated']);
}

if ($method === 'POST' && $action === 'toggle_user_status') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized - Admin access required'], 403);
    }
    
    $data = get_json_input();
    $user_id = $data['user_id'] ?? 0;
    $new_status = $data['status'] ?? '';
    
    if (!in_array($new_status, ['active', 'inactive'])) {
        send_response(['success' => false, 'error' => 'Invalid status'], 400);
    }
    
    $users = read_json(__DIR__ . '/../data/users.json');
    
    $found = false;
    foreach ($users as &$user) {
        if (($user['id'] ?? 0) == $user_id) {
            $user['status'] = $new_status;
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        send_response(['success' => false, 'error' => 'User not found'], 404);
    }
    
    write_json(__DIR__ . '/../data/users.json', $users);
    
    $actionText = $new_status === 'active' ? 'activated' : 'deactivated';
    send_response(['success' => true, 'message' => "User {$actionText} successfully"]);
}

if ($method === 'POST' && $action === 'delete_user') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized - Admin access required'], 403);
    }
    
    $data = get_json_input();
    $user_id = $data['user_id'] ?? 0;
    
    if ($user_id == 1) {
        send_response(['success' => false, 'error' => 'Cannot delete main admin account'], 403);
    }
    
    $users = read_json(__DIR__ . '/../data/users.json');
    $initial_count = count($users);
    $users = array_filter($users, function($user) use ($user_id) {
        return ($user['id'] ?? 0) != $user_id;
    });
    
    if (count($users) === $initial_count) {
        send_response(['success' => false, 'error' => 'User not found'], 404);
    }
    
    $users = array_values($users);
    write_json(__DIR__ . '/../data/users.json', $users);
    
    $submissions = read_json(__DIR__ . '/../data/submissions.json');
    $submissions = array_filter($submissions, function($sub) use ($user_id) {
        return ($sub['user_id'] ?? 0) != $user_id;
    });
    $submissions = array_values($submissions);
    write_json(__DIR__ . '/../data/submissions.json', $submissions);
    
    send_response(['success' => true, 'message' => 'User and their submissions deleted successfully']);
}

if ($method === 'GET' && $action === 'categories') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized - Admin access required'], 403);
    }
    
    $categories = read_json(__DIR__ . '/../data/categories.json');
    
    send_response([
        'success' => true,
        'categories' => $categories
    ]);
}

if ($method === 'POST' && $action === 'add_category') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized - Admin access required'], 403);
    }
    
    $data = get_json_input();
    $name = trim($data['name'] ?? '');
    
    if (empty($name)) {
        send_response(['success' => false, 'error' => 'Category name is required'], 400);
    }
    
    $categories = read_json(__DIR__ . '/../data/categories.json');
    
    $new_id = (count($categories) > 0) ? max(array_column($categories, 'id')) + 1 : 1;
    
    $new_category = [
        'id' => $new_id,
        'name' => $name,
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    $categories[] = $new_category;
    
    write_json(__DIR__ . '/../data/categories.json', $categories);
    
    send_response(['success' => true, 'message' => 'Category added', 'category' => $new_category]);
}

if ($method === 'POST' && $action === 'update_category') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized - Admin access required'], 403);
    }
    
    $data = get_json_input();
    $id = $data['id'] ?? 0;
    $new_name = trim($data['name'] ?? '');
    
    if (empty($new_name)) {
        send_response(['success' => false, 'error' => 'New category name is required'], 400);
    }
    
    $categories = read_json(__DIR__ . '/../data/categories.json');
    
    $found = false;
    foreach ($categories as &$cat) {
        if (($cat['id'] ?? 0) == $id) {
            $cat['name'] = $new_name;
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        send_response(['success' => false, 'error' => 'Category not found'], 404);
    }
    
    write_json(__DIR__ . '/../data/categories.json', $categories);
    
    send_response(['success' => true, 'message' => 'Category updated']);
}

if ($method === 'POST' && $action === 'delete_category') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized - Admin access required'], 403);
    }
    
    $data = get_json_input();
    $id = $data['id'] ?? 0;
    
    $categories = read_json(__DIR__ . '/../data/categories.json');
    
    $initial_count = count($categories);
    $categories = array_filter($categories, function($cat) use ($id) {
        return ($cat['id'] ?? 0) != $id;
    });
    
    if (count($categories) === $initial_count) {
        send_response(['success' => false, 'error' => 'Category not found'], 404);
    }
    
    $categories = array_values($categories);
    write_json(__DIR__ . '/../data/categories.json', $categories);
    
    send_response(['success' => true, 'message' => 'Category deleted']);
}

send_response(['success' => false, 'error' => 'Invalid request'], 400);
?>