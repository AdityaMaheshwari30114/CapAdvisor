document.addEventListener("DOMContentLoaded", async () => {
    const addCapitalForm = document.getElementById("addCapitalForm");
    const updatedCapitalDisplay = document.getElementById("updatedCapital");

    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                await firebase.auth().signOut();
                window.location.href = "login.html"; // Redirect to login page after logout
            } catch (error) {
                console.error("❌ Logout Failed:", error.message);
            }
        });
    }

    // 🔄 Check if user is authenticated
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            console.warn("⚠️ No user logged in, redirecting to login page.");
            window.location.href = "login.html"; // Redirect if not logged in
            return;
        }

        console.log("✅ User is logged in:", user.email);

        // ✅ Fetch and display current Idle Capital
        await fetchIdleCapital(user.uid);
    });

    // ✅ Handle Form Submission
    addCapitalForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent page reload

        const user = firebase.auth().currentUser;
        if (!user) {
            alert("User not authenticated. Please log in.");
            return;
        }

        const uid = user.uid;
        const amount = document.getElementById("amount").value.trim();
        const category = document.getElementById("category").value.trim();
        const date = document.getElementById("date").value.trim();
        const description = document.getElementById("description").value.trim();

        // ✅ Form Validation
        if (!amount || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        if (!category) {
            alert("Please enter the capital source.");
            return;
        }
        if (!date) {
            alert("Please select a date.");
            return;
        }

        // ✅ Prepare data for API
        const capitalData = { uid, amount, category, date, description };

        try {
            const response = await fetch("http://localhost:5001/api/finance/add-capital", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(capitalData),
            });

            const result = await response.json();

            if (response.ok) {
                console.log("✅ Capital added successfully:", result);
                updatedCapitalDisplay.textContent = `Your Updated Idle Capital is ₹${result.updatedIdleCapital}`;
                updatedCapitalDisplay.style.color = "green";

                // ✅ Reset form fields after successful submission
                addCapitalForm.reset();
            } else {
                console.error("❌ Error:", result.error);
                alert(result.error || "Failed to add capital.");
            }
        } catch (error) {
            console.error("❌ Network Error:", error);
            alert("Something went wrong. Please try again later.");
        }
    });

    // ✅ Function to Fetch Idle Capital
    async function fetchIdleCapital(uid) {
        if (!uid) {
            console.error("❌ User ID not found! Ensure user is logged in.");
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:5001/api/dailyExpense/get-idle-capital/${uid}`, {
                method: "GET",
            });
    
            if (!response.ok) {
                throw new Error("❌ Failed to fetch idle capital!");
            }
    
            const data = await response.json();
            if (data.success) {
                const idleCapitalDisplay = document.getElementById("currentIdleCapital"); // ✅ FIXED ID
                if (idleCapitalDisplay) {
                    idleCapitalDisplay.innerHTML = `💰 Your Idle Capital: ₹${data.idleCapital.toFixed(2)}`;
                } else {
                    console.error("❌ currentIdleCapital element not found in DOM.");
                }
            } else {
                console.warn("⚠️ No Idle Capital data found.");
            }
        } catch (error) {
            console.error("❌ Error fetching idle capital:", error);
        }
    }
    
});
