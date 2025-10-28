<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'OPTIONS') {
    exit(0);
}

if ($method === 'GET') {
    $admin = check_admin();
    $reports = read_json('reports.json');
    send_response(['success' => true, 'reports' => $reports]);
}

if ($method === 'POST' && empty($action)) {
    $user_id = check_auth();
    $data = get_post_data();
    
    $artwork_id = $data['artwork_id'] ?? 0;
    $reason = $data['reason'] ?? '';
    $details = $data['details'] ?? '';
    
    if (empty($artwork_id) || empty($reason) || empty($details)) {
        send_response(['success' => false, 'error' => 'All fields are required'], 400);
    }
    
    $reports = read_json('reports.json');
    
    $new_report = [
        'id' => count($reports) + 1,
        'artwork_id' => $artwork_id,
        'user_id' => $user_id,
        'reason' => $reason,
        'details' => $details,
        'status' => 'pending',
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    $reports[] = $new_report;
    write_json('reports.json', $reports);
    
    send_response(['success' => true, 'message' => 'Report submitted successfully']);
}

if ($method === 'POST' && $action === 'resolve') {
    $admin = check_admin();
    $id = $_GET['id'] ?? 0;
    
    $reports = read_json('reports.json');
    
    $found = false;
    foreach ($reports as &$report) {
        if ($report['id'] == $id) {
            $report['status'] = 'resolved';
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        send_response(['success' => false, 'error' => 'Report not found'], 404);
    }
    
    write_json('reports.json', $reports);
    send_response(['success' => true, 'message' => 'Report resolved']);
}

if ($method === 'DELETE') {
    $admin = check_admin();
    $id = $_GET['id'] ?? 0;
    
    $reports = read_json('reports.json');
    $filtered = array_filter($reports, function($report) use ($id) {
        return $report['id'] != $id;
    });
    
    write_json('reports.json', array_values($filtered));
    send_response(['success' => true, 'message' => 'Report deleted']);
}

send_response(['success' => false, 'error' => 'Invalid request'], 400);
?>