let searchTimeout;

function initializeSearch() {
    const searchInputs = document.querySelectorAll('.search input[type="text"], .search-box input[type="text"], .Search-bar input[type="text"]');
    const searchButtons = document.querySelectorAll('.search button, .search-btn');

    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 300);
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch(e.target.value);
            }
        });
    });

    searchButtons.forEach(button => {
        if (!button.classList.contains('search-btn')) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const input = button.parentElement.querySelector('input[type="text"]');
                if (input) {
                    performSearch(input.value);
                }
            });
        }
    });
}

async function performSearch(keyword) {
    if (!keyword || keyword.trim() === '') {
        if (window.location.pathname.includes('Art_Collection.html')) {
            loadArtworks();
        }
        return;
    }

    try {
        const response = await fetch(`api/artworks.php?action=search&keyword=${encodeURIComponent(keyword)}`);
        const data = await response.json();

        if (data.success) {
            if (window.location.pathname.includes('Art_Collection.html')) {
                displaySearchResults(data.artworks);
            } else {
                window.location.href = `Art_Collection.html?search=${encodeURIComponent(keyword)}`;
            }
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults(artworks) {
    const gridContainer = document.querySelector('.grid');

    if (!gridContainer) return;

    if (!artworks || artworks.length === 0) {
        gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No artworks found matching your search.</p>';
        return;
    }

    gridContainer.innerHTML = artworks.map(artwork => `
        <div class="Card">
            <img src="${artwork.images && artwork.images.length > 0 ? artwork.images[0] : 'imgs/placeholder.jpg'}"
                 alt="${artwork.title}"
                 onerror="this.src='imgs/placeholder.jpg'">
            <div class="Card-info">
                <h3 class="Art_Title">${artwork.title}</h3>
                <p>${artwork.description ? artwork.description.substring(0, 100) + '...' : ''}</p>
                <a href="Art_Details.html?id=${artwork.id}" class="art-detail-link">View Details</a>
            </div>
        </div>
    `).join('');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearch);
} else {
    initializeSearch();
}

if (window.location.pathname.includes('Art_Collection.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const searchKeyword = urlParams.get('search');
    if (searchKeyword) {
        const searchInput = document.querySelector('.Search-bar input[type="text"]');
        if (searchInput) {
            searchInput.value = searchKeyword;
        }
        performSearch(searchKeyword);
    }
}
