// login.js  – email/password + Google sign-in
console.log("✅ login.js loaded!");

// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded!");

  // ─────────────────────────────────────────────────────────
  // ELEMENT REFERENCES
  // ─────────────────────────────────────────────────────────
  const loginForm              = document.getElementById("loginForm");
  const loginButton            = document.querySelector(".login-btn");
  const googleLoginBtn         = document.getElementById("googleLoginBtn");
  const forgotPasswordLink     = document.getElementById("forgotPasswordLink");
  const forgotPasswordSection  = document.getElementById("forgotPasswordSection");
  const sendResetEmailButton   = document.getElementById("sendResetEmail");
  const backToLoginButton      = document.getElementById("backToLogin");
  const forgotEmailInput       = document.getElementById("forgotEmail");
  const forgotPasswordMessage  = document.getElementById("forgotPasswordMessage");

  // Error message placeholder
  const errorMessage = document.createElement("p");
  errorMessage.style.color = "red";
  errorMessage.style.textAlign = "center";
  errorMessage.style.marginTop = "10px";
  errorMessage.id = "login-error";
  loginForm.appendChild(errorMessage);

  // ─────────────────────────────────────────────────────────
  // FIREBASE AUTH PROVIDERS
  // ─────────────────────────────────────────────────────────
  const auth          = firebase.auth();
  const googleProvider = new firebase.auth.GoogleAuthProvider();

  // ─────────────────────────────────────────────────────────
  // GOOGLE LOGIN
  // ─────────────────────────────────────────────────────────
  googleLoginBtn.addEventListener("click", async () => {
    // UI feedback
    googleLoginBtn.disabled = true;
    googleLoginBtn.innerHTML = `<div class="spinner"></div> Signing in...`;

    try {
      const result = await auth.signInWithPopup(googleProvider);
      const user   = result.user;

      console.log("✅ Google login successful!", user);

      // Store basic info (adjust as needed)
      sessionStorage.setItem("username",  user.displayName || "User");
      sessionStorage.setItem("fullName",  user.displayName || "User");

      // To pass the ID token to a backend, uncomment below:
      // const token = await user.getIdToken();
      // await fetch("http://localhost:5000/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      //   body: JSON.stringify({ idToken: token })
      // });

      // Redirect
      window.location.href = "main_dashboard.html";
    } catch (error) {
      console.error("❌ Google login failed:", error);
      errorMessage.textContent = "⚠️ Google login failed. Please try again!";
    } finally {
      googleLoginBtn.innerHTML = `<img src="google-logo.png" alt="Google"> Login with Google`;
      googleLoginBtn.disabled = false;
    }
  });

  // ─────────────────────────────────────────────────────────
  // FORGOT PASSWORD FLOW
  // ─────────────────────────────────────────────────────────
  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    forgotPasswordSection.style.display = "block";
  });

  backToLoginButton.addEventListener("click", () => {
    forgotPasswordSection.style.display = "none";
    loginForm.style.display = "block";
  });

  sendResetEmailButton.addEventListener("click", async () => {
    const email = forgotEmailInput.value.trim();
    if (!email) {
      forgotPasswordMessage.textContent = "⚠️ Please enter your email.";
      forgotPasswordMessage.style.color = "red";
      return;
    }

    sendResetEmailButton.disabled = true;
    sendResetEmailButton.innerHTML = `<div class="spinner"></div> Sending...`;

    try {
      await auth.sendPasswordResetEmail(email);
      forgotPasswordMessage.textContent = "✅ Reset link sent! Check your inbox.";
      forgotPasswordMessage.style.color = "green";
    } catch (error) {
      console.error("❌ Reset error:", error);
      forgotPasswordMessage.textContent =
        error.code === "auth/user-not-found"
          ? "⚠️ Email not registered with CapAdvisor."
          : "⚠️ Failed to send reset email. Try again.";
      forgotPasswordMessage.style.color = "red";
    } finally {
      setTimeout(() => {
        sendResetEmailButton.innerHTML = "Send";
        sendResetEmailButton.disabled = false;
      }, 2000);
    }
  });

  // ─────────────────────────────────────────────────────────
  // EMAIL/PASSWORD LOGIN
  // ─────────────────────────────────────────────────────────
  loginButton.addEventListener("click", async (e) => {
    e.preventDefault();

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      errorMessage.textContent = "⚠️ Email or Password cannot be empty!";
      return;
    }

    loginButton.disabled = true;
    loginButton.innerHTML = `<div class="spinner"></div> Logging in...`;

    try {
      const { user } = await auth.signInWithEmailAndPassword(email, password);

      // Require email verification
      if (!user.emailVerified) {
        errorMessage.textContent = "⚠️ Please verify your email before logging in!";
        await auth.signOut();
        return;
      }

      console.log("✅ Email/password login successful!", user);

      sessionStorage.setItem("username",  user.displayName || "User");
      sessionStorage.setItem("fullName",  "Full Name");

      window.location.href = "main_dashboard.html";
    } catch (error) {
      console.error("❌ Email/password login error:", error);

      if (error.code === "auth/user-not-found")       errorMessage.textContent = "⚠️ No user found with this email!";
      else if (error.code === "auth/wrong-password")  errorMessage.textContent = "⚠️ Incorrect password!";
      else if (error.code === "auth/too-many-requests") errorMessage.textContent = "⚠️ Too many failed attempts. Try again later!";
      else                                            errorMessage.textContent = "⚠️ Login failed. Please try again!";
    } finally {
      loginButton.innerHTML = "Login";
      loginButton.disabled  = false;
    }
  });
});
