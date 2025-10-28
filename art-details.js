document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const artworkId = urlParams.get("id")

  if (!artworkId) {
    console.error("No artwork ID provided")
    return
  }

  try {
    const response = await fetch(`api/artworks.php?action=get&id=${artworkId}`)
    const data = await response.json()
    console.log(data);

    if (data.success && data.artwork) {
      const art = data.artwork

      // Update artwork info
      document.querySelector(".info h1").textContent = art.title
      document.querySelector(".info p:nth-child(2)").innerHTML = `<b>Type:</b> ${art.type}`
      document.querySelector(".info p:nth-child(3)").innerHTML = `<b>Estimated Period:</b> ${art.period}`
      document.querySelector(".info p:nth-child(4)").innerHTML = `<b>Artist Name:</b> ${art.artist_name}`
      document.querySelector(".info p:nth-child(5)").innerHTML = `<b>Description:</b> ${art.description}`
      document.querySelector(".info p:nth-child(6)").innerHTML = `<b>Condition Note:</b> ${art.condition_note || "N/A"}`

      // Initialize image slider
      initializeImageSlider(art)

      initializeMiniMap(art)
    }

    // Load similar artworks
    const similarResponse = await fetch(`api/artworks.php?action=similar&id=${artworkId}&limit=6`)
    const similarData = await similarResponse.json()

    if (similarData.success && similarData.artworks) {
      const grid = document.querySelector(".grid")
      if (grid) {
        grid.innerHTML = ""

        similarData.artworks.slice(0, 6).forEach((similarArt, index) => {
          const card = document.createElement("div")
          card.className = index < 6 ? "Card" : "Card hidden"
          
          // Get image for similar artwork
          const similarImageUrl = Array.isArray(similarArt.image_url) ? similarArt.image_url[0] : similarArt.image_url;
          
          card.innerHTML = `
            <a href="${similarImageUrl}" target="_blank" rel="noopener">
              <img src="${similarImageUrl}" alt="${similarArt.title}">
            </a>
            <div class="Card-info">
              <h5 class="Art_Title">${similarArt.title}</h5>
              <a href="Art_Details.html?id=${similarArt.id}" class="art-detail-link">View Details</a>
            </div>
          `
          grid.appendChild(card)
        })
      }
    }
  } catch (error) {
    console.error("Failed to load artwork details:", error)
  }
})

// Image Slider Function
function initializeImageSlider(artwork) {
    const slidesContainer = document.querySelector('.slides');
    const thumbnailsContainer = document.querySelector('.thumbnails');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const currentImageSpan = document.getElementById('current-image');
    const totalImagesSpan = document.getElementById('total-images');
    
    let currentSlide = 0;
    let images = [];
    
    // Get images from artwork data
    if (artwork.image_url && Array.isArray(artwork.image_url)) {
        images = artwork.image_url;
    } else if (artwork.image_url) {
        images = [artwork.image_url]; // Single image as array
    } else {
        // No images - show placeholder
        images = ['https://via.placeholder.com/600x400/cccccc/969696?text=No+Image+Available'];
    }
    
    // Update total images counter
    totalImagesSpan.textContent = images.length;
    
    // Clear existing content
    slidesContainer.innerHTML = '';
    thumbnailsContainer.innerHTML = '';
    
    // Create slides and thumbnails
    images.forEach((image, index) => {
        // Create main slide
        const slide = document.createElement('img');
        slide.src = image;
        slide.alt = `${artwork.title} - Image ${index + 1}`;
        slide.className = 'slide';
        slidesContainer.appendChild(slide);
        
        // Create thumbnail
        const thumbnail = document.createElement('img');
        thumbnail.src = image;
        thumbnail.alt = `Thumbnail ${index + 1}`;
        thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        thumbnail.addEventListener('click', () => goToSlide(index));
        thumbnailsContainer.appendChild(thumbnail);
    });
    
    // Navigation functions
    function goToSlide(slideIndex) {
        currentSlide = slideIndex;
        slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
        currentImageSpan.textContent = currentSlide + 1;
        
        // Update active thumbnail
        document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
            thumb.classList.toggle('active', index === currentSlide);
        });
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % images.length;
        goToSlide(currentSlide);
    }
    
    function prevSlide() {
        currentSlide = (currentSlide - 1 + images.length) % images.length;
        goToSlide(currentSlide);
    }
    
    // Add event listeners for navigation
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', prevSlide);
        nextBtn.addEventListener('click', nextSlide);
    }
    
    // Hide navigation if only one image
    if (images.length <= 1) {
        document.querySelector('.image-slider').classList.add('single-image');
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
    });
    
    // Initialize first slide
    goToSlide(0);
}

// Mini Map Function for Art Details
function initializeMiniMap(artwork) {
  const mapContainer = document.getElementById('miniMap');
  
  if (!artwork.location || artwork.location_sensitive || artwork.location.trim() === "") {
    console.log("No location data available for this artwork");
    mapContainer.style.display = 'none';
    return;
  }

  try {
    const [lat, lng] = artwork.location.split(',').map(coord => parseFloat(coord.trim()));
    
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid coordinates');
    }

    const map = L.map('miniMap').setView([lat, lng], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.marker([lat, lng]).addTo(map);

  } catch (error) {
    console.error('Error initializing map:', error);
    mapContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">Unable to display location map</p>';
  }
}

document.addEventListener("DOMContentLoaded", function() {
  const reportBtn = document.getElementById('reportBtn')
  const reportForm = document.getElementById('reportForm')
  
  if (!reportBtn) return
  
  reportBtn.addEventListener('click', () => {
    reportForm.classList.toggle('hidden')
  })
})

// Keep the submit function
async function submitReport(event) {
  event.preventDefault()

  const reason = document.getElementById('reason').value
  const details = document.getElementById('details').value
  const artworkId = new URLSearchParams(window.location.search).get('id')

  if (!reason || !details) {
    alert("Please fill out all fields.")
    return
  }

  try {
    const response = await fetch('api/reports.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artwork_id: artworkId,
        reason: reason,
        details: details
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      alert("Report submitted to admin. Thank you!")
      document.getElementById('reportForm').reset()
      document.getElementById('reportForm').classList.add('hidden')
    } else {
      alert("Failed to submit report: " + (result.error || "Unknown error"))
    }
  } catch (error) {
    alert("Failed to submit report. Please try again.")
  }
}