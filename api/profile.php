<?php
header('Content-Type: application/json');

$usersFilePath = '../data/users.json';


function loadJsonFile($filePath) {
    if (!file_exists($filePath) || !is_readable($filePath)) return false;
    $data = json_decode(file_get_contents($filePath), true);
    return json_last_error() === JSON_ERROR_NONE ? $data: false;
}

function saveJsonFile($filePath, $data) {

    $fileHandle = fopen($filePath, 'w');
    if ($fileHandle === false) return false;

    if (flock($fileHandle, LOCK_EX)) {
        $success = fwrite($fileHandle, json_encode($data, JSON_PRETTY_PRINT));
        flock($fileHandle, LOCK_UN);
        fclose($fileHandle);
        return $success !== false;
    }
    fclose($fileHandle);
    return false;
}


$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

if (!isset($data['id'], $data['name'], $data['email'], $data['bio'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data received (missing id, name, email, or bio).']);
    exit();
}

$updateUserId = (int)$data['id'];

$usersData = loadJsonFile($usersFilePath);

if (!$usersData) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not load or decode users data file. Check file path: ' . $usersFilePath]);
    exit();
}

$updated = false;
$updatedUser = null;

foreach ($usersData as $key => $user) {
    if (isset($user['id']) && (int)$user['id'] === $updateUserId) {
        $usersData[$key]['username'] = $data['name'];
        $usersData[$key]['email'] = $data['email'];
        $usersData[$key]['bio'] = $data['bio']; 
        $updatedUser = $usersData[$key];
        $updated = true;
        break;
    }
}

if ($updated) {
    if (saveJsonFile($usersFilePath, $usersData)) {
        echo json_encode(['message' => 'Profile updated successfully!', 'user' => $updatedUser]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save profile data. Check file permissions on ' . $usersFilePath]);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'User ID ' . $updateUserId . ' not found.']);
}
?>
