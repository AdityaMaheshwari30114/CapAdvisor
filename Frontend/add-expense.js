document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Expense Page Loaded!");

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
                const idleCapitalDisplay = document.getElementById("currentIdleCapital"); // ✅ Corrected ID
                if (idleCapitalDisplay) {
                    idleCapitalDisplay.innerHTML = `💰 Your Idle Capital: ₹${data.idleCapital.toFixed(2)}`;
                } else {
                    console.error("❌ currentIdleCapital element NOT found in DOM.");
                }
            } else {
                console.warn("⚠️ No Idle Capital data found.");
            }
        } catch (error) {
            console.error("❌ Error fetching idle capital:", error);
        }
    }
     
    // ✅ Ensure Firebase Auth is ready before accessing user ID
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            console.warn("⚠️ No user logged in, redirecting to login.");
            window.location.href = "login.html";
            return;
        }

        console.log("✅ User is logged in:", user.email);

        // ✅ Fetch the idle capital using user UID
        await fetchIdleCapital(user.uid);

        // ✅ Attach event listener to form after confirming user login
        const addExpenseForm = document.getElementById("addExpenseForm");
        if (addExpenseForm) {
            addExpenseForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                const uid = user.uid; // Now we are sure user is logged in
                const amountInput = document.getElementById("expenseAmount");
                const categoryInput = document.getElementById("expenseCategory");

                if (!amountInput || !categoryInput) {
                    console.error("❌ Missing input fields in DOM.");
                    return;
                }

                const amount = parseFloat(amountInput.value);
                const category = categoryInput.value.trim();

                if (amount <= 0 || !category) {
                    alert("❌ Please enter valid expense details.");
                    return;
                }

                try {
                    const response = await fetch("http://localhost:5001/api/dailyExpense/add", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ uid, amount, category })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        console.log("✅ Expense Added:", data);
                        alert(`✅ Expense of ₹${amount} in category '${category}' added successfully!`);
                        addExpenseForm.reset();
                        fetchIdleCapital(uid); // ✅ Refresh idle capital
                    } else {
                        alert(`❌ Error: ${data.error}`);
                    }
                } catch (error) {
                    console.error("❌ Expense Error:", error);
                    alert("❌ Failed to process expense. Try again later.");
                }
            });
        }
    });
});
