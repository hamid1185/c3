// --- Updated Art_Collection_pagination.js for Server-Side Pagination ---
document.addEventListener("DOMContentLoaded", () => {
  // Select all elements
  const grid = document.querySelector(".grid");
  const paginationContainer = document.querySelector(".Pagination");

  // Filter/Search elements
  const searchInputMain = document.querySelector(".Search-bar input"); 
  const applyFilterBtn = document.querySelector(".apply");
  const clearFilterBtn = document.querySelector(".Clear");
  const typeSelect = document.querySelector(".filters select:nth-child(1)");
  const periodSelect = document.querySelector(".filters select:nth-child(2)");
  const locationSelect = document.querySelector(".filters select:nth-child(3)");
  const sortSelect = document.querySelector(".filters select:nth-child(4)");
  const limitSelect = document.getElementById("limit-select");

  // State to hold current filters and pagination
  let currentFilters = {
    search: "",
    type: "",
    period: "",
    location: "",
    sort: "",
    page: 1, // Start at page 1
    limit: 8, // Default limit
  };

  // --- Core Functions ---

  // Function to load artworks from the API based on current filters and pagination state
  async function loadArtworks() {
    try {
      // 1. Build query parameters from the currentFilters state
      const params = new URLSearchParams();
      if (currentFilters.search) params.append("search", currentFilters.search);
      if (currentFilters.type) params.append("type", currentFilters.type);
      if (currentFilters.period) params.append("period", currentFilters.period);
      if (currentFilters.location) params.append("location", currentFilters.location);
      if (currentFilters.sort) params.append("sort", currentFilters.sort);
      
      // Add pagination parameters
      params.append("page", currentFilters.page);
      params.append("limit", currentFilters.limit);

      // 2. Fetch data (IMPORTANT: Adjust API path if necessary)
      const response = await fetch(`api/art_collection.php?${params.toString()}`); 
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // 3. Display Artworks and Pagination
      displayArtworks(data.artworks);
      renderPagination(data.total_pages, data.current_page);

    } catch (error) {
      console.error("Failed to load artworks:", error);
      if (grid) grid.innerHTML = "<p>Failed to load artworks. Please ensure 'art_collection.php' is running and accessible.</p>";
      if (paginationContainer) paginationContainer.innerHTML = "";
    }
  }

  // Function to render the cards in the grid
  function displayArtworks(artworks) {
    if (!grid) return;
    grid.innerHTML = ""; // Clear existing content

    if (artworks.length === 0) {
        grid.innerHTML = "<p>No artworks found matching your criteria.</p>";
        return;
    }

    artworks.forEach((artwork) => {
      const card = document.createElement("div");
      const imageUrl = Array.isArray(artwork.image_url) ? artwork.image_url[0] : artwork.image_url;

      card.className = "Card"; 
      card.innerHTML = `
        <a href="${imageUrl}" target="_blank" rel="noopener">
          <img src="${imageUrl}" alt="${artwork.title}">
        </a>
        <div class="Card-info">
          <h5 class="Art_Title">${artwork.title}</h5>
          <a href="Art_Details.html?id=${artwork.id}" class="art-detail-link">View Details</a>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // Function to dynamically render the pagination controls
  function renderPagination(totalPages, currentPage) {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = ""; // Clear existing pagination

    if (totalPages <= 1) return; // Don't show if only one page

    const maxButtons = 5; // Max number of page buttons to display

    // Calculate start and end pages for the visible buttons
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    // Previous button
    const prevBtn = createPageButton('<', currentPage > 1, currentPage - 1);
    paginationContainer.appendChild(prevBtn);

    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = createPageButton(i, true, i);
      if (i === currentPage) {
        pageBtn.classList.add('active');
      }
      paginationContainer.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = createPageButton('>', currentPage < totalPages, currentPage + 1);
    paginationContainer.appendChild(nextBtn);
  }

  // Helper function to create a pagination button
  function createPageButton(text, isEnabled, pageNumber) {
    const button = document.createElement('button');
    button.textContent = text;
    button.disabled = !isEnabled;
    if (isEnabled) {
      button.setAttribute('data-page', pageNumber);
      // Attach click handler to change page
      button.addEventListener('click', () => {
          currentFilters.page = pageNumber;
          loadArtworks();
      });
    }
    return button;
  }

  // Function to update filters and trigger loadArtworks
  function updateAndLoadArtworks() {
    // Reset page to 1 whenever filters change
    currentFilters.page = 1; 

    // Get filter values and update state
    currentFilters.search = searchInputMain ? searchInputMain.value.trim() : "";
    
    // **FIXED FILTERING LOGIC**: Check against the lowercase placeholder text
    const selectedType = typeSelect.value.toLowerCase();
    currentFilters.type = selectedType !== "type" ? selectedType : "";
    
    const selectedPeriod = periodSelect.value.toLowerCase();
    currentFilters.period = selectedPeriod !== "periods" ? selectedPeriod : "";
    
    const selectedLocation = locationSelect.value.toLowerCase();
    currentFilters.location = selectedLocation !== "location" ? selectedLocation : "";

    currentFilters.sort = sortSelect.value !== "Sort" ? sortSelect.value : "";
    currentFilters.limit = parseInt(limitSelect.value) || 8; // Update limit

    loadArtworks();
  }

  // --- Event Listeners ---

  // 1. Apply Filter Button
  if (applyFilterBtn) {
    applyFilterBtn.addEventListener("click", updateAndLoadArtworks);
  }

  // 2. Clear All Button
  if (clearFilterBtn) {
    clearFilterBtn.addEventListener("click", () => {
      // Reset Selects to the first option (which is the disabled placeholder)
      [typeSelect, periodSelect, locationSelect, sortSelect].forEach(select => {
          if(select) select.selectedIndex = 0;
      });
      // Reset limit select to default '8'
      if (limitSelect) limitSelect.value = "8";

      // Clear Search
      if (searchInputMain) searchInputMain.value = "";

      // Reset filter state
      currentFilters = { 
        search: "", 
        type: "", 
        period: "", 
        location: "", 
        sort: "", 
        page: 1, 
        limit: 8 
      };

      loadArtworks();
    });
  }

  // 3. Main Search Bar (on Enter key)
  if (searchInputMain) {
    searchInputMain.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        updateAndLoadArtworks();
      }
    });
  }

  // 4. Limit Select (Update when page limit is changed)
  if (limitSelect) {
    limitSelect.addEventListener("change", updateAndLoadArtworks);
  }
  
  // 5. Initial load of artworks
  loadArtworks();
});