const form = document.getElementById("art-form")
const saveBtn = document.getElementById("save-draft")
const statusEl = document.getElementById("status")
const titleEl = document.getElementById("title")
const artistNameEl = document.getElementById("artistname")

// Image upload elements
const imageUpload = document.getElementById("image-upload")
const uploadArea = document.getElementById("upload-area")
const imagePreview = document.getElementById("image-preview")

// description + counter
const descEl = document.getElementById("description")
const descCountEl = document.getElementById("desc-count")
const DESC_MAX = 150

const DRAFT_KEY = "art_draft"
let selectedFiles = []

// Leaflet Map Picker Initialization
const mapEl = document.getElementById('map-picker');
const locationInput = document.getElementById('location');
let map, marker;

if (mapEl && locationInput) {
    // Initialize map centered on Australia
    map = L.map('map-picker').setView([-25.2744, 133.7751], 4); 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    function onMapClick(e) {
        if (marker) {
            map.removeLayer(marker);
        }
        marker = L.marker(e.latlng).addTo(map);
        const lat = e.latlng.lat.toFixed(4);
        const lng = e.latlng.lng.toFixed(4);
        locationInput.value = `${lat},${lng}`;
    }

    map.on('click', onMapClick);
}

// Status helper
function showStatus(message, type = "info") {
  if (!statusEl) return
  statusEl.textContent = message
  statusEl.style.color = type === "error" ? "#b91c1c" : "#14532d"
}

// Live character counter
function updateDescCount() {
  if (!descEl || !descCountEl) return
  const len = Math.min(descEl.value.length, DESC_MAX)
  descCountEl.textContent = String(len)
}
descEl?.addEventListener("input", updateDescCount)

// ========== MULTIPLE IMAGE UPLOAD FUNCTIONALITY ==========

// Handle file selection
function handleFileSelect(files) {
    const MAX_FILES = 10;
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    
    if (selectedFiles.length + files.length > MAX_FILES) {
        showStatus(`Maximum ${MAX_FILES} images allowed.`, "error");
        return;
    }

    const validFiles = Array.from(files).filter(file => {
        if (file.size > MAX_SIZE) {
            showStatus(`File ${file.name} is too large. Max size is 5MB.`, "error");
            return false;
        }
        if (!file.type.startsWith('image/')) {
            showStatus(`File ${file.name} is not an image.`, "error");
            return false;
        }
        return true;
    });

    selectedFiles = [...selectedFiles, ...validFiles];
    updateImagePreview();
    showStatus(`Added ${validFiles.length} image(s). Total: ${selectedFiles.length}`, "success");
}

// Update image preview
function updateImagePreview() {
    if (!imagePreview) return;
    
    imagePreview.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${file.name}">
                <button type="button" class="remove-btn" data-index="${index}">×</button>
                ${index === 0 ? '<span class="primary-badge">Primary</span>' : ''}
            `;
            
            imagePreview.appendChild(previewItem);
            
            // Add remove button event
            const removeBtn = previewItem.querySelector('.remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                removeImage(index);
            });
        };
        
        reader.readAsDataURL(file);
    });
}

// Remove image from selection
function removeImage(index) {
    selectedFiles.splice(index, 1);
    updateImagePreview();
    showStatus(`Image removed. ${selectedFiles.length} image(s) remaining.`, "success");
}

// Event listeners for image upload
uploadArea?.addEventListener('click', () => {
    e.preventDefault();
    e.stopPropagation();
    imageUpload?.click();
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

imageUpload?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files);
        e.target.value = ''; 
   }
});






// Save Draft
saveBtn?.addEventListener("click", () => {
  if (!form) return
  const data = Object.fromEntries(new FormData(form).entries())
  if (form.location_sensitive) data.location_sensitive = form.location_sensitive.checked ? "true" : "false"
  
  data.fileNames = selectedFiles.map(file => file.name)
  
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  showStatus("Draft saved locally (images will need to be re-selected).", "success")
})

window.addEventListener("DOMContentLoaded", () => {
  updateDescCount()
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw || !form) return

  try {
    const data = JSON.parse(raw)
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'fileNames') return // Skip file names for now
      
      const el = form.elements[key]
      if (!el) return
      if (el.type === "checkbox") {
        el.checked = value === "true"
      } else {
        el.value = value
      }

      // Update map marker if location is loaded from draft
      if (key === 'location' && value && map) {
          const coords = value.split(',').map(c => parseFloat(c.trim()));
          if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              const latlng = L.latLng(coords[0], coords[1]);
              if (marker) {
                  map.removeLayer(marker);
              }
              marker = L.marker(latlng).addTo(map);
              map.setView(latlng, 8); 
          }
      }
    })
    
    // ensure counter reflects loaded text
    updateDescCount()
    showStatus("Draft loaded from your device. Note: Images need to be re-selected.", "success")
  } catch (e) {
    // ignore parse errors
  }
})

// Submit for Review
form?.addEventListener("submit", async (e) => {
  e.preventDefault()


  // Client-side validation
  if (!titleEl?.value.trim()) {
    showStatus("Please enter a Title before submitting.", "error")
    titleEl?.focus()
    return
  }


  if (!artistNameEl?.value.trim()) {
    showStatus("Please enter the Artist Name before submitting.", "error")
    artistNameEl?.focus()
    return
  }


  // Image validation
  if (selectedFiles.length === 0) {
    showStatus("Please select at least one image.", "error")
    uploadArea?.focus()
    return
  }

  if (locationInput.value.trim() && !/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(locationInput.value.trim())) {
      showStatus("Location coordinates must be a valid Lat,Long pair (e.g., -33.8688,151.2093).", "error");
      locationInput?.focus();
      return;
  }

  const formData = new FormData(form)

  formData.delete('images[]');
  selectedFiles.forEach((file, index) => {
    formData.append('images[]', file, file.name);
  });

  const submitBtn = form.querySelector('.btn-primary');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Uploading...';
  submitBtn.disabled = true;

  try {
    const response = await fetch("api/artworks.php?action=submit", {
      method: "POST",
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      showStatus("Submission sent for admin review!", "success")
      localStorage.removeItem(DRAFT_KEY)
      form.reset()
      selectedFiles = []
      updateImagePreview()
      updateDescCount()
      
      if (marker) {
          map.removeLayer(marker);
          marker = null;
      }
      locationInput.value = ''; 
    } else {
      showStatus(result.error || "Submission failed. Please try again.", "error")
    }
  } catch (error) {
    console.error('Submission error:', error);
    showStatus("Submission failed. Please try again.", "error")
  } finally {
    // Restore button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
})