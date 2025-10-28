<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'OPTIONS') {
    exit(0);
}


if ($method === 'GET' && $action === 'list') {
    $artworks = read_json('submissions.json');
    $approved = array_filter($artworks, function($art) {
        return $art['status'] === 'approved';
    });
    
 
    $search = $_GET['search'] ?? '';
    if (!empty($search)) {
        $approved = array_filter($approved, function($art) use ($search) {
            return stripos($art['title'], $search) !== false || 
                   stripos($art['description'], $search) !== false ||
                   stripos($art['type'], $search) !== false;
        });
    }
    

    $type_filter = $_GET['type'] ?? '';
    if (!empty($type_filter)) {
        $types = explode(',', $type_filter);
        $approved = array_filter($approved, function($art) use ($types) {
            return in_array($art['type'], $types);
        });
    }
    

    $period_filter = $_GET['period'] ?? '';
    if (!empty($period_filter)) {
        $periods = explode(',', $period_filter);
        $approved = array_filter($approved, function($art) use ($periods) {
            return in_array($art['period'], $periods);
        });
    }

    $sort = $_GET['sort'] ?? 'title_asc';
    $approved = array_values($approved);
    
    if ($sort === 'title_asc') {
        usort($approved, function($a, $b) {
            return strcmp($a['title'], $b['title']);
        });
    } elseif ($sort === 'title_desc') {
        usort($approved, function($a, $b) {
            return strcmp($b['title'], $a['title']);
        });
    } elseif ($sort === 'recent') {
        usort($approved, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
    }
    

    $limit = $_GET['limit'] ?? 12;
    $page = $_GET['page'] ?? 1;
    $offset = ($page - 1) * $limit;
    $paginated = array_slice($approved, $offset, $limit);
    
    send_response([
        'success' => true,
        'artworks' => $paginated,
        'total' => count($approved)
    ]);
}


if ($method === 'GET' && ($action === 'get' || $action === 'detail')) {
    $id = $_GET['id'] ?? 0;
    $artworks = read_json('submissions.json');
    
    foreach ($artworks as $art) {
        if ($art['id'] == $id && $art['status'] === 'approved') {
            send_response(['success' => true, 'artwork' => $art]);
        }
    }
    
    send_response(['success' => false, 'error' => 'Artwork not found'], 404);
}


if ($method === 'GET' && empty($action)) {
    $artworks = read_json('submissions.json');
    $approved = array_filter($artworks, function($art) {
        return $art['status'] === 'approved';
    });
    send_response(['success' => true, 'artworks' => array_values($approved)]);
}


if ($method === 'GET' && $action === 'latest') {
    $limit = $_GET['limit'] ?? 6;
    $artworks = read_json('submissions.json');
    
    $approved = array_filter($artworks, function($art) {
        return $art['status'] === 'approved';
    });
    

    usort($approved, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    $latest = array_slice($approved, 0, $limit);
    send_response(['success' => true, 'artworks' => $latest]);
}

if ($method === 'GET' && $action === 'similar') {
    $id = $_GET['id'] ?? 0;
    $limit = $_GET['limit'] ?? 3;
    $artworks = read_json('submissions.json');
    
    $current = null;
    foreach ($artworks as $art) {
        if ($art['id'] == $id) {
            $current = $art;
            break;
        }
    }
    
    if (!$current) {
        send_response(['success' => true, 'artworks' => []]);
    }
    
    $similar = array_filter($artworks, function($art) use ($current, $id) {
        return $art['id'] != $id && 
               $art['type'] === $current['type'] && 
               $art['status'] === 'approved';
    });
    
    $similar = array_slice(array_values($similar), 0, $limit);
    send_response(['success' => true, 'artworks' => $similar]);
}

if ($method === 'POST' && $action === 'submit') {
    $user_id = check_auth();
    
    $data = get_post_data();

    // image save
    
    $image_url = '';

    if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
    $targetDir = "../imgs/";
    if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);
    
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxFileSize = 5 * 1024 * 1024; // 5MB

    foreach ($_FILES['images']['name'] as $key => $name) {
        $tmpName = $_FILES['images']['tmp_name'][$key];
        $fileSize = $_FILES['images']['size'][$key];
        $fileType = $_FILES['images']['type'][$key];
        $error = $_FILES['images']['error'][$key];

        if ($error == UPLOAD_ERR_OK && $tmpName) {
            // Validate file type
            if (in_array($fileType, $allowedTypes)) {
                // Validate file size
                if ($fileSize <= $maxFileSize) {
                    // Create safe filename
                    $safeName = preg_replace("/[^a-zA-Z0-9\._-]/", "_", $name);
                    $filename = time() . "_" . uniqid() . "_" . $safeName;
                    $targetFile = $targetDir . $filename;

                    if (move_uploaded_file($tmpName, $targetFile)) {
                        $image_urls[] = "imgs/" . $filename;
                    }
                }
            }
        }
    }
}


$all_images = $image_urls;

    
    $required = ['title', 'type', 'description', 'artist_name', 'period'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            send_response(['success' => false, 'error' => "Field $field is required"], 400);
        }
    }
    
    $submissions = read_json('submissions.json');
    
   $new_submission = [
    'id' => count($submissions) + 1,
    'title' => $data['title'],
    'type' => $data['type'],
    'description' => $data['description'],
    'artist_name' => $data['artist_name'],
    'period' => $data['period'],
    'location' => $data['location'] ?? '',
    'location_notes' => $data['location_notes'] ?? '',
    'location_sensitive' => $data['location_sensitive'] ?? false,
    'condition_note' => $data['condition_note'] ?? '',
    'image_url' => $image_urls,
    'user_id' => $user_id,
    'status' => 'pending',
    'created_at' => date('Y-m-d H:i:s')
    ];
    
    $submissions[] = $new_submission;
    write_json('submissions.json', $submissions);
    
    send_response([
        'success' => true,
        'submission' => $new_submission,
        'message' => 'Artwork submitted for review'
    ]);
}

if ($method === 'GET' && $action === 'my_submissions') {
    $user_id = check_auth();
    $submissions = read_json('submissions.json');
    
    $my_subs = array_filter($submissions, function($s) use ($user_id) {
        return $s['user_id'] == $user_id;
    });
    
    send_response([
        'success' => true,
        'submissions' => array_values($my_subs)
    ]);
}

send_response(['success' => false, 'error' => 'Invalid request'], 400);
?>