let allArtworks = []
let filteredArtworks = []
const currentPage = 1
const itemsPerPage = 12

async function loadArtworks() {
  try {
    const response = await fetch("api/artworks.php?action=list")
    const data = await response.json()
    allArtworks = data.artworks || []
    filteredArtworks = [...allArtworks]
    renderArtworks()
  } catch (error) {
    console.error("Failed to load artworks:", error)
  }
}

function renderArtworks() {
  const grid = document.querySelector(".grid")
  if (!grid) return

  grid.innerHTML = ""

  const start = 0
  const end = Math.min(6, filteredArtworks.length)
  const visibleArtworks = filteredArtworks.slice(start, end)

  // First 6 artworks
  visibleArtworks.forEach((art) => {
    const imageUrl = Array.isArray(art.image_url) ? art.image_url[0] : art.image_url;
    
    const card = document.createElement("div")
    card.className = "Card"
    card.innerHTML = `
      <a href="${imageUrl}" target="_blank" rel="noopener">
        <img src="${imageUrl}" alt="${art.title}">
      </a>
      <div class="Card-info">
        <h5 class="Art_Title">${art.title}</h5>
        <a href="Art_Details.html?id=${art.id}" class="art-detail-link">View Details</a>
      </div>
    `
    grid.appendChild(card)
  })

  for (let i = 6; i < filteredArtworks.length && i < 12; i++) {
    const art = filteredArtworks[i]
    const imageUrl = Array.isArray(art.image_url) ? art.image_url[0] : art.image_url; // ← THIS MUST BE HERE
    
    const card = document.createElement("div")
    card.className = "Card hidden"
    card.innerHTML = `
      <a href="${imageUrl}" target="_blank" rel="noopener">
        <img src="${imageUrl}" alt="${art.title}">
      </a>
      <div class="Card-info">
        <h5 class="Art_Title">${art.title}</h5>
        <a href="Art_Details.html?id=${art.id}" class="art-detail-link">View Details</a>
      </div>
    `
    grid.appendChild(card)
  }
}

function applyFilters() {
  const typeSelect = document.querySelector(".filters select:nth-child(1)")
  const periodSelect = document.querySelector(".filters select:nth-child(2)")
  const sortSelect = document.querySelector(".filters select:nth-child(4)")
  const searchInput = document.querySelector(".Search-bar input")

  let filtered = [...allArtworks]

  if (searchInput && searchInput.value.trim()) {
    const search = searchInput.value.toLowerCase()
    filtered = filtered.filter(
      (art) => art.title.toLowerCase().includes(search) || art.description.toLowerCase().includes(search),
    )
  }

  if (typeSelect && typeSelect.value && typeSelect.value !== "Type") {
    filtered = filtered.filter((art) => art.type.toLowerCase() === typeSelect.value.toLowerCase())
  }

  if (periodSelect && periodSelect.value && periodSelect.value !== "Periods") {
    filtered = filtered.filter((art) => art.period.toLowerCase() === periodSelect.value.toLowerCase())
  }

  if (sortSelect && sortSelect.value) {
    if (sortSelect.value === "title-asc") {
      filtered.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortSelect.value === "title-desc") {
      filtered.sort((a, b) => b.title.localeCompare(a.title))
    }
  }

  filteredArtworks = filtered
  renderArtworks()
}

document.addEventListener("DOMContentLoaded", () => {
  loadArtworks()

  const applyBtn = document.querySelector(".apply")
  if (applyBtn) {
    applyBtn.addEventListener("click", applyFilters)
  }

  const clearBtn = document.querySelector(".Clear")
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      document.querySelectorAll(".filters select").forEach((select) => {
        select.selectedIndex = 0
      })
      const searchInput = document.querySelector(".Search-bar input")
      if (searchInput) searchInput.value = ""
      filteredArtworks = [...allArtworks]
      renderArtworks()
    })
  }

  const searchInput = document.querySelector(".Search-bar input")
  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        applyFilters()
      }
    })
  }
})