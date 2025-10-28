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

// Get form data
$submissionId = isset($_POST['id']) ? (int)$_POST['id'] : null;
$title = $_POST['title'] ?? '';
$type = $_POST['type'] ?? '';
$description = $_POST['description'] ?? '';
$artist_name = $_POST['artist_name'] ?? '';
$period = $_POST['period'] ?? '';
$location = $_POST['location'] ?? '';
$location_notes = $_POST['location_notes'] ?? '';
$location_sensitive = isset($_POST['location_sensitive']) ? filter_var($_POST['location_sensitive'], FILTER_VALIDATE_BOOLEAN) : false;
$condition_note = $_POST['condition_note'] ?? '';
$status = $_POST['status'] ?? 'pending';
$final_images = isset($_POST['final_images']) ? json_decode($_POST['final_images'], true) : [];

// Debug logging
error_log("=== EDIT SUBMISSION DEBUG ===");
error_log("Submission ID: " . $submissionId);
error_log("Final images from form: " . print_r($final_images, true));
error_log("Files received: " . print_r($_FILES, true));

if (!$submissionId || empty($title) || empty($type) || empty($description) || empty($artist_name)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data received. Missing submission ID or required fields (title, type, description, artist_name).']);
    exit();
}

$submissionsData = loadJsonFile($submissionsFilePath);

if (!$submissionsData) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not load or decode submissions data file. Check file path: ' . $submissionsFilePath]);
    exit();
}

$updated = false;
$updatedSubmission = null;

foreach ($submissionsData as $key => $submission) {
    if (isset($submission['id']) && (int)$submission['id'] === $submissionId) {

        // Start with existing images from final_images (these are the ones that weren't deleted)
        $image_urls = $final_images;

        // Handle new image uploads - APPEND to existing URLs
        if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
            $targetDir = "../imgs/";
            if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);
            
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            $maxFileSize = 5 * 1024 * 1024;

            foreach ($_FILES['images']['name'] as $fileKey => $name) {
                $tmpName = $_FILES['images']['tmp_name'][$fileKey];
                $fileSize = $_FILES['images']['size'][$fileKey];
                $fileType = $_FILES['images']['type'][$fileKey];
                $error = $_FILES['images']['error'][$fileKey];

                if ($error == UPLOAD_ERR_OK && $tmpName) {
                    if (in_array($fileType, $allowedTypes) && $fileSize <= $maxFileSize) {
                        $safeName = preg_replace("/[^a-zA-Z0-9\._-]/", "_", $name);
                        $filename = time() . "_" . uniqid() . "_" . $safeName;
                        $targetFile = $targetDir . $filename;

                        if (move_uploaded_file($tmpName, $targetFile)) {
                            $newImageUrl = "imgs/" . $filename;
                            $image_urls[] = $newImageUrl;
                            error_log("Successfully uploaded new image: " . $newImageUrl);
                        }
                    }
                }
            }
        }

        error_log("Final image URLs after processing: " . print_r($image_urls, true));

        $submissionsData[$key]['title'] = $title;
        $submissionsData[$key]['type'] = $type;
        $submissionsData[$key]['description'] = $description;
        $submissionsData[$key]['artist_name'] = $artist_name;
        $submissionsData[$key]['period'] = $period;
        $submissionsData[$key]['location'] = $location;
        $submissionsData[$key]['location_notes'] = $location_notes;
        $submissionsData[$key]['location_sensitive'] = $location_sensitive;
        $submissionsData[$key]['condition_note'] = $condition_note;
        $submissionsData[$key]['image_url'] = $image_urls;
        $submissionsData[$key]['status'] = $status;

        $updatedSubmission = $submissionsData[$key];
        $updated = true;
        break;
    }
}

if ($updated) {
    if (saveJsonFile($submissionsFilePath, $submissionsData)) {
        echo json_encode(['message' => 'Artwork updated successfully!', 'submission' => $updatedSubmission]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save submissions data. Check file permissions on ' . $submissionsFilePath]);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Submission ID ' . $submissionId . ' not found.']);
}
?>