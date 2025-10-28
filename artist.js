document.addEventListener('DOMContentLoaded', () => {
    let artistData = {};
    let artworks = [];
    let allImages = []; 

    const artworkTableBody = document.getElementById('artworkTableBody');

    const editProfileModal = document.getElementById('editProfileModal');
    const editProfileForm = document.getElementById('editProfileForm');

    // Artwork Modal Elements
    const editArtworkModal = document.getElementById('editArtworkModal');
    const editArtworkForm = document.getElementById('editArtworkForm');
    const closeProfileModal = editProfileModal.querySelector('.profile-close-button');
    const closeArtworkModal = editArtworkModal.querySelector('.artwork-close-button');

    // --- Utility Functions ---

    function refreshData() {
        return loadProfileData();
    }

    function showCustomAlert(message) {
        console.log("STATUS MESSAGE:", message);
        alert(message);
    }

    async function fetchWithRetry(url, options = {}, maxRetries = 3) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) return response;
                
                const errorBody = await response.json().catch(() => ({ 
                    error: `Server responded with status ${response.status}. No JSON body.` 
                }));
                throw new Error(errorBody.error || `HTTP error! Status: ${response.status}`);
            } catch (error) {
                if (attempt === maxRetries - 1) throw error;
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }


    function handleFileSelect(files) {
    const MAX_FILES = 10;
    const MAX_SIZE = 5 * 1024 * 1024;
    
    if (allImages.length + files.length > MAX_FILES) {
        showCustomAlert(`Maximum ${MAX_FILES} images allowed.`);
        return;
    }

    const validFiles = Array.from(files).filter(file => {
        if (file.size > MAX_SIZE) {
            showCustomAlert(`File ${file.name} is too large. Max size is 5MB.`);
            return false;
        }
        if (!file.type.startsWith('image/')) {
            showCustomAlert(`File ${file.name} is not an image.`);
            return false;
        }
        const isDuplicate = allImages.some(img => 
            img.file && img.file.name === file.name
        );
        if (isDuplicate) {
            showCustomAlert(`File ${file.name} already added.`);
            return false;
        }
        return true;
    });

    validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            allImages.push({
                url: e.target.result,
                file: file,
                isNew: true
            });
            updateAllImagesPreview();
        };
        reader.readAsDataURL(file);
    });

    if (validFiles.length > 0) {
        showCustomAlert(`Added ${validFiles.length} image(s). Total: ${allImages.length + validFiles.length}`);
    }
}


    function updateAllImagesPreview() {
        const previewContainer = document.getElementById('allImagesPreview');
        if (!previewContainer) return;
        
        previewContainer.innerHTML = '';
        
        allImages.forEach((image, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.style.position = 'relative';
            previewItem.style.borderRadius = '8px';
            previewItem.style.overflow = 'hidden';
            previewItem.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            
            previewItem.innerHTML = `
                <img src="${image.url}" alt="Preview ${index + 1}" style="width: 100%; height: 80px; object-fit: cover;">
                <button type="button" class="remove-btn" data-index="${index}" style="position: absolute; top: 5px; right: 5px; background: rgba(255,0,0,0.7); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px;">×</button>
                ${index === 0 ? '<span class="primary-badge" style="position: absolute; top: 5px; left: 5px; background: rgba(0,100,0,0.7); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">Primary</span>' : ''}
                ${image.isNew ? '<span class="new-badge" style="position: absolute; bottom: 5px; left: 5px; background: rgba(0,0,255,0.7); color: white; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: bold;">NEW</span>' : ''}
            `;
            
            previewContainer.appendChild(previewItem);
            
            const removeBtn = previewItem.querySelector('.remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                removeImage(index);
            });
        });
        
        const remainingUrls = allImages.map(img => img.url);
        document.getElementById('finalImages').value = JSON.stringify(remainingUrls);
    }

    function removeImage(index) {
        allImages.splice(index, 1);
        updateAllImagesPreview();
        showCustomAlert(`Image removed. ${allImages.length} image(s) remaining.`);
    }

    // --- Rendering Functions ---

    function renderProfile() {
        document.querySelector('.profile-info h2').textContent = artistData.name || '';
        document.querySelector('.profile-info p:nth-of-type(1)').textContent = artistData.bio || 'No biography provided. Click Edit Profile to add one.';
        
        const contactLink = document.querySelector('.profile-info a');
        contactLink.textContent = artistData.email || '';
        contactLink.href = `mailto:${artistData.email || ''}`;

        document.querySelector('.profile-avatar').src = artistData.avatar || '';

        // Populate modal form fields
        document.getElementById('artistName').value = artistData.name || '';
        document.getElementById('artistBio').value = artistData.bio || '';
        document.getElementById('artistEmail').value = artistData.email || '';
        editProfileForm.dataset.userId = artistData.id || '';
    }

    function renderArtworks(stats = { total: 0, approved: 0, pending: 0 }, artworksList = []) {
        artworkTableBody.innerHTML = '';

        // Update Stats
        document.getElementById('totalSubmissions').textContent = stats.total;
        document.getElementById('approvedSubmissions').textContent = stats.approved;
        document.getElementById('pendingSubmissions').textContent = stats.pending;

        // Render Artworks
        if (!artworksList || artworksList.length === 0) {
            artworkTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px; color: #777;">You have no artwork submissions yet.</td></tr>';
            return;
        }

        artworksList.forEach(artwork => {
            const row = artworkTableBody.insertRow();
            const statusText = artwork.status ? (artwork.status.charAt(0).toUpperCase() + artwork.status.slice(1)) : 'Unknown';
            const statusClass = `status-${(artwork.status || 'unknown').toLowerCase()}`;
            const imageUrl = Array.isArray(artwork.image_url) ? artwork.image_url[0] : artwork.image_url;
            
            row.innerHTML = `
                <td><img src="${imageUrl || ''}" onerror="this.onerror=null;this.src='https://placehold.co/40x40/adb5bd/ffffff?text=ART'" alt="${artwork.title || ''}" class="artwork-thumbnail"></td>
                <td>${artwork.title || ''}</td>
                <td>${artwork.type || ''}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>${artwork.created_at ? new Date(artwork.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</td>
                <td class="artwork-actions">
                    <button class="btn btn-primary btn-sm edit-artwork-btn" data-id="${artwork.id}">Edit</button>
                    <button class="btn btn-delete btn-sm delete-artwork-btn" data-id="${artwork.id}">Delete</button>
                </td>
            `;
        });
        
        // Attach Edit/Delete Listeners
        document.querySelectorAll('.edit-artwork-btn').forEach(button => {
            button.addEventListener('click', handleEditButtonClick);
        });

        document.querySelectorAll('.delete-artwork-btn').forEach(button => {
            button.addEventListener('click', handleDeleteButtonClick);
        });
    }

    // --- Data Fetching and Saving ---

    async function loadProfileData() {
        try {
            const response = await fetchWithRetry('api/artist.php'); 
            const data = await response.json();
            console.log(data);
            
            artistData = data.profile || {};
            artworks = data.artworks || [];

            renderProfile();
            renderArtworks(data.stats || { total: 0, approved: 0, pending: 0 }, data.artworks || []);
        } catch (error) {
            console.error("Could not fetch artist data:", error);
            document.querySelector('.profile-info h2').textContent = 'Error Loading Profile';
            document.querySelector('.profile-info p:nth-of-type(1)').textContent = error.message;
            showCustomAlert(`Failed to load profile data. See console for details: ${error.message}`);
        }
    }

    // --- Artwork Action Handlers ---

    function handleEditButtonClick(event) {
        const submissionId = parseInt(event.target.dataset.id);
        const submission = artworks.find(art => art.id === submissionId);

        if (submission) {
            // Populate the modal form with ALL fields
            document.getElementById('artworkTitle').value = submission.title || '';
            document.getElementById('artworkType').value = submission.type || '';
            document.getElementById('artworkDescription').value = submission.description || '';
            document.getElementById('artworkArtistName').value = submission.artist_name || '';
            document.getElementById('artworkPeriod').value = submission.period || '';
            document.getElementById('artworkLocation').value = submission.location || '';
            document.getElementById('artworkLocationNotes').value = submission.location_notes || '';
            document.getElementById('artworkConditionNote').value = submission.condition_note || '';
            document.getElementById('artworkStatus').value = submission.status ? submission.status.charAt(0).toUpperCase() + submission.status.slice(1) : 'Unknown';
            
            const isSensitive = submission.location_sensitive === true || submission.location_sensitive === 'true';
            document.getElementById('artworkLocationSensitive').checked = isSensitive;

            const existingImages = Array.isArray(submission.image_url) ? submission.image_url : [submission.image_url];
            allImages = existingImages.filter(url => url).map(url => ({
                url: url,
                file: null, // No file object for existing images
                isNew: false
            }));
            
            updateAllImagesPreview();

            // Set the IDs and display
            document.getElementById('artworkUserId').value = submission.user_id; 
            editArtworkForm.dataset.submissionId = submissionId; 
            editArtworkModal.style.display = 'flex';
        } else {
            showCustomAlert('Submission data not found.');
        }
    }

    async function handleDeleteButtonClick(event) {
        const submissionId = parseInt(event.target.dataset.id);

        if (confirm(`Are you sure you want to delete submission ID: ${submissionId}? This action cannot be undone.`)) {
            try {
                const response = await fetchWithRetry('api/delete_submission.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: submissionId }),
                });

                const result = await response.json();
                showCustomAlert(result.message);
                refreshData(); 
            } catch (error) {
                console.error('Error deleting submission:', error);
                showCustomAlert(`Failed to delete submission: ${error.message}`);
            }
        }
    }

    // --- Event Listeners ---

    // Image upload event listeners
    const uploadArea = document.getElementById('upload-area');
    const artworkImages = document.getElementById('artworkImages');

 uploadArea?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    artworkImages?.click();
});

    uploadArea?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#666';
        uploadArea.style.background = '#f0f0f0';
    });

    uploadArea?.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.background = '#f9f9f9';
    });

    uploadArea?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.background = '#f9f9f9';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files);
        }
    });

    artworkImages?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files);
        setTimeout(() => {
            e.target.value = '';
        }, 100);
    }
});

    // Profile Modal Open
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        renderProfile(); 
        editProfileModal.style.display = 'flex'; 
    });

    // Profile Modal Submit
    editProfileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const updateData = {
            id: parseInt(event.currentTarget.dataset.userId),
            name: document.getElementById('artistName').value,
            bio: document.getElementById('artistBio').value,
            email: document.getElementById('artistEmail').value,
        };

        try {
            const response = await fetchWithRetry('api/profile.php', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            const result = await response.json();
            
            // Update the global state with new data
            artistData.name = result.user.username;
            artistData.bio = result.user.bio;
            artistData.email = result.user.email;
            
            renderProfile();
            editProfileModal.style.display = 'none';
            showCustomAlert(result.message);
        } catch (error) {
            console.error('Error saving profile:', error);
            showCustomAlert(`Failed to update profile: ${error.message}`);
        }
    });

    // Artwork Modal Submit
    editArtworkForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const submissionId = parseInt(event.currentTarget.dataset.submissionId);
        const formData = new FormData();

        formData.append('id', submissionId);
        formData.append('title', document.getElementById('artworkTitle').value);
        formData.append('type', document.getElementById('artworkType').value);
        formData.append('description', document.getElementById('artworkDescription').value);
        formData.append('artist_name', document.getElementById('artworkArtistName').value);
        formData.append('period', document.getElementById('artworkPeriod').value);
        formData.append('location', document.getElementById('artworkLocation').value);
        formData.append('location_notes', document.getElementById('artworkLocationNotes').value);
        formData.append('location_sensitive', document.getElementById('artworkLocationSensitive').checked);
        formData.append('condition_note', document.getElementById('artworkConditionNote').value);
        formData.append('status', document.getElementById('artworkStatus').value.toLowerCase());
        
        // Add final images array
        formData.append('final_images', document.getElementById('finalImages').value);

        // Add new image files for upload
        allImages.forEach((image, index) => {
            if (image.file) { // Only upload new files
                formData.append('images[]', image.file, image.file.name);
            }
        });

        try {
            const response = await fetchWithRetry('api/edit_submission.php', { 
                method: 'POST',
                body: formData, 
            });

            const result = await response.json();
            
            if (response.ok) {
                showCustomAlert(result.message || 'Artwork updated successfully!');
                editArtworkModal.style.display = 'none';
                allImages = []; // Reset all images
                refreshData();
            } else {
                throw new Error(result.error || 'Failed to update artwork');
            }
        } catch (error) {
            console.error('Error saving artwork:', error);
            showCustomAlert(`Failed to update artwork: ${error.message}`);
        }
    });
    
    // "Submit New Artwork" button
    document.getElementById('submitNewArtworkBtn').addEventListener('click', () => {
        showCustomAlert('Redirecting to new artwork submission form...');
    });

    // Close Modals on close button click
    closeProfileModal.addEventListener('click', () => { editProfileModal.style.display = 'none'; });
    closeArtworkModal.addEventListener('click', () => { editArtworkModal.style.display = 'none'; });

    // Close Modals on outside click
    window.addEventListener('click', (event) => {
        if (event.target === editProfileModal) {
            editProfileModal.style.display = 'none';
        }
        if (event.target === editArtworkModal) {
            editArtworkModal.style.display = 'none';
        }
    });

    // Initial load
    loadProfileData();
});