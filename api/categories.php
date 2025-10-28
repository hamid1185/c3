<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];


if ($method === 'GET') {
    $categories = read_json('categories.json');
    send_response(['categories' => $categories]);
}


if ($method === 'POST') {
    $data = get_post_data();
    $name = $data['name'] ?? '';
    
    if (empty($name)) {
        send_response(['error' => 'Category name required'], 400);
    }
    
    $categories = read_json('categories.json');
    
    $new_category = [
        'id' => count($categories) + 1,
        'name' => $name,
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    $categories[] = $new_category;
    write_json('categories.json', $categories);
    
    send_response(['success' => true, 'category' => $new_category]);
}

send_response(['error' => 'Invalid request'], 400);
?>
