document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("api/artworks.php?action=latest&limit=6")
    const data = await response.json()
    const artworks = data.artworks || []

 

    const collectionGrid = document.querySelector(".collection-grid")
    if (collectionGrid && artworks.length > 0) {
      collectionGrid.innerHTML = ""

      artworks.slice(0, 3).forEach((art) => {
        const imageUrl = Array.isArray(art.image_url) ? art.image_url[0] : art.image_url;

        const card = document.createElement("article")
        card.className = "art-card"
        card.innerHTML = `
          <a href="Art_Details.html?id=${art.id}">
            <img src="${imageUrl}" alt="${art.title}" class="art-image">
            <div class="art-info">
              <h3 class="art-title">${art.title}</h3>
              <p class="art-description">${art.type}</p>
            </div>
          </a>
        `
        collectionGrid.appendChild(card)
      })
    }

    const extraCards = document.querySelector(".extra-cards")
    if (extraCards && artworks.length > 3) {
      extraCards.innerHTML = ""

      artworks.slice(3, 6).forEach((art) => {

        const imageUrl = Array.isArray(art.image_url) ? art.image_url[0] : art.image_url;
        const card = document.createElement("article")
        card.className = "art-card"
        card.innerHTML = `
          <a href="Art_Details.html?id=${art.id}">
            <img src="${imageUrl}" alt="${art.title}" class="art-image">
            <div class="art-info">
              <h3 class="art-title">${art.title}</h3>
              <p class="art-description">${art.type}</p>
            </div>
          </a>
        `
        extraCards.appendChild(card)
      })
    }
  } catch (error) {
    console.error("Failed to load artworks:", error)
  }
})

