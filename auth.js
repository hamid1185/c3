const AUTH = {
  isLoggedIn() {
    return sessionStorage.getItem("user") !== null
  },

  getUser() {
    const user = sessionStorage.getItem("user")
    return user ? JSON.parse(user) : null
  },

  // Set user session
  setUser(userData) {
    sessionStorage.setItem("user", JSON.stringify(userData))
  },

  clearUser() {
    sessionStorage.removeItem("user")
  },

  isAdmin() {
    const user = this.getUser()
    return user && user.role === "admin"
  },

  // Logout function
  async logout() {
    try {
      const response = await fetch("api/auth.php?action=logout", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        this.clearUser()
        window.location.href = "Home-Page.html"
      }
    } catch (error) {
      console.error("Logout error:", error)
      this.clearUser()
      window.location.href = "Home-Page.html"
    }
  },

  // Update navigation based on auth status
  updateNav() {
    const user = this.getUser()
    const signupLinks = document.querySelectorAll('a[href*="Login"], a[href*="SignUp"], a[href*="Signin"]')

    signupLinks.forEach((link) => {
      if (user) {
        const parent = link.parentElement
        if (parent.tagName === "NAV" || parent.classList.contains("nav")) {
          link.style.display = "none"

          // Add user info and logout button if not exists
          if (!document.getElementById("user-nav-section")) {
            const userSection = document.createElement("div")
            userSection.id = "user-nav-section"
            userSection.style.cssText = "display: flex; align-items: center; gap: 15px;"

            // const userName = document.createElement("span")
            const userName = document.createElement("a")
            userName.textContent = user.username
            userName.style.cssText = "color: #000000ff;text-decoration:none; font-weight: 500;"
            if (user.role === 'admin') {
              userName.href = "Admin_Dashboard.html"
            } else if (user.role === 'artist') {
              userName.href = "artist.html"
            } else {
              userName.href = "Home-Page.html" 
            }

            const logoutBtn = document.createElement("button")
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout'
            logoutBtn.style.cssText =
              "background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px;"
            logoutBtn.onclick = () => this.logout()

            userSection.appendChild(userName)
            userSection.appendChild(logoutBtn)
            parent.appendChild(userSection)
          }
        }
      }
    })
  },
}

// Initialize auth on page load
document.addEventListener("DOMContentLoaded", () => {
  AUTH.updateNav()
})
