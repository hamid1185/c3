<?php
	 
header('Content-Type: application/json');			
session_start();


$loggedInUserId = $_SESSION['user_id'] ?? null;
if (!$loggedInUserId) {
    http_response_code(401);
    echo json_encode(['error' => 'User not logged in or session expired.']);
    exit();
}
					   
							
																			
		   
 

$usersFilePath = '../data/users.json'; 
$submissionsFilePath = '../data/submissions.json';

function loadJsonFile($filePath) {
    if (!file_exists($filePath)) {
        return ['error' => 'File not found: ' . $filePath];
    }
    if (!is_readable($filePath)) {
        return ['error' => 'File not readable. Check file permissions on: ' . $filePath];
    }
    
    $content = file_get_contents($filePath);
    if ($content === false) {
        return ['error' => 'Failed to read file content: ' . $filePath];
    }

    $data = json_decode($content, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['error' => 'JSON decode failed for ' . $filePath . '. Error: ' . json_last_error_msg()];
    }
    return $data;
}

$usersDataResult = loadJsonFile($usersFilePath);

if (isset($usersDataResult['error'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Users Data Error: ' . $usersDataResult['error'] . ' (Path: ' . $usersFilePath . ')']);
    exit();
}
$usersData = $usersDataResult;

$artistProfile = null;
foreach ($usersData as $user) {
    if (isset($user['id']) && (int)$user['id'] === $loggedInUserId && $user['role'] === 'artist') {
        $artistProfile = $user;
        break;
    }
}

if (!$artistProfile) {
    http_response_code(401);
    echo json_encode(['error' => 'Artist (ID ' . $loggedInUserId . ') not found or unauthorized.']);
    exit();
}


$submissionsDataResult = loadJsonFile($submissionsFilePath);

if (isset($submissionsDataResult['error'])) {

    $artistSubmissions = []; 

} else {
    $submissionsData = $submissionsDataResult;
    $artistSubmissions = array_filter($submissionsData, function($submission) use ($loggedInUserId) {
        return isset($submission['user_id']) && (int)$submission['user_id'] === $loggedInUserId;
    });
}



$total = count($artistSubmissions);
$approved = 0;
$pending = 0;

foreach ($artistSubmissions as $submission) {
    $status = strtolower($submission['status'] ?? '');
    if ($status === 'approved') {
        $approved++;
    } elseif ($status === 'pending') {
        $pending++;
    }
}

$response = [
    'profile' => [
        'id' => (int)$artistProfile['id'],
        'name' => $artistProfile['username'],
        'email' => $artistProfile['email'],
        'bio' => $artistProfile['bio'] ?? 'No biography provided.',
        'avatar' => $artistProfile['avatar'] ?? 'https://via.placeholder.com/80/007bff/FFFFFF?text=profile' . strtoupper(substr($artistProfile['username'], 0, 1))
    ],
    'stats' => [
        'total' => $total,
        'approved' => $approved,
        'pending' => $pending
    ],
    'artworks' => array_map(function($art) {
        if (isset($art['id'])) $art['id'] = (int)$art['id'];
        if (isset($art['user_id'])) $art['user_id'] = (int)$art['user_id'];
        return $art;
    }, array_values($artistSubmissions))
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>

