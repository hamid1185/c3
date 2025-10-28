<?php
header('Content-Type: application/json');

$submissionsFilePath = '../data/submissions.json';


function loadJsonFile($filePath) {
    if (!file_exists($filePath) || !is_readable($filePath)) return false;
    $data = json_decode(file_get_contents($filePath), true);
    return json_last_error() === JSON_ERROR_NONE ? $data : false;
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


$data = json_decode(file_get_contents('php://input'), true);
$submissionId = isset($data['id']) ? (int)$data['id'] : null;

if (!$submissionId) {
    http_response_code(400);
    echo json_encode(['error' => 'Submission ID is required for deletion.']);
    exit();
}

$submissionsData = loadJsonFile($submissionsFilePath);

if (!$submissionsData) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not load or decode submissions data file. Check file path: ' . $submissionsFilePath]);
    exit();
}

$initialCount = count($submissionsData);

$submissionsData = array_filter($submissionsData, function($submission) use ($submissionId) {
    return isset($submission['id']) && (int)$submission['id'] !== $submissionId;
});

$finalCount = count($submissionsData);

if ($finalCount < $initialCount) {
    if (saveJsonFile($submissionsFilePath, array_values($submissionsData))) {
        echo json_encode(['message' => 'Artwork deleted successfully!', 'deletedId' => $submissionId]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save submissions data after deletion. Check file permissions on ' . $submissionsFilePath]);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Submission ID ' . $submissionId . ' not found or already deleted.']);
}
?>
