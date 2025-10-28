const loginForm = document.getElementById("loginForm")
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = document.getElementById("name").value.trim()
    const password = document.getElementById("password").value.trim()

    if (!name || !password) {
      alert("Please fill in both fields.")
      return
    }

    try {
      const response = await fetch("api/auth.php?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: name, password: password }),
      })
      console.log(response)

      const result = await response.json()

      if (result.success) {
        sessionStorage.setItem("user", JSON.stringify(result.user))

        if (result.user.role === "admin") {
          window.location.href = "Admin_Dashboard.html"
        } else if (result.user.role === "artist") {
          window.location.href = "artist.html"
        } else {
          window.location.href = "Home-Page.html"
        }
      } else {
        alert(result.message || "Invalid credentials")
      }
    } catch (error) {
      alert("Login failed. Please try again.")
    }
  })
}

const registerForm = document.getElementById("registerForm")
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = document.getElementById("name").value.trim()
    const email = document.getElementById("email").value.trim()
    const password = document.getElementById("password").value.trim()
    const confirmPassword = document.getElementById("confirmPassword").value.trim()
    const accountType = document.getElementById("accountType").value

    if (!name || !email || !password || !confirmPassword || !accountType) {
      alert("All fields are required!")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!")
      return
    }

    try {
      const response = await fetch("api/auth.php?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          email: email,
          password: password,
          account_type: accountType,
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert("Registration successful! Please login.")
        window.location.href = "Login.html"
      } else {
        alert(result.message || "Registration failed")
      }
    } catch (error) {
      alert("Registration failed. Please try again.")
    }
  })
}
