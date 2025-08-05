console.log("✅ dashboard.js loaded!");

// ✅ Ensure Firebase SDK is loaded
if (typeof firebase === "undefined") {
    console.error("❌ ERROR: Firebase SDK not loaded!");
} else {
    console.log("🔥 Firebase SDK is ready!");
}

// ✅ Wait for DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM fully loaded!");

    // ✅ Check if user is logged in
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            console.log("✅ User is logged in:", user.email);

            // ✅ Fetch user details from MongoDB
            try {
                const response = await fetch(`http://localhost:5001/api/auth/user/${user.uid}`);
                const userData = await response.json();

                if (response.ok) {
                    console.log("✅ User Data:", userData);

                    // ✅ Display user data on dashboard
                    document.getElementById("username").textContent = userData.username || "No username";
                    document.getElementById("email").textContent = userData.email;
                    document.getElementById("fullname").textContent = userData.fullname || "No Name";
                    document.getElementById("phone").textContent = userData.phone || "No Phone";
                } else {
                    console.error("❌ Error Fetching User Data:", userData.error);
                }
            } catch (error) {
                console.error("❌ API Error:", error);
            }

        } else {
            console.log("❌ No user logged in, redirecting to login page...");
            window.location.href = "login.html"; // Redirect if not logged in
        }
    });

    // ✅ Logout Button
    const logoutButton = document.getElementById("logout");
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            await firebase.auth().signOut();
            window.location.href = "login.html"; // Redirect after logout
        });
    }
});
