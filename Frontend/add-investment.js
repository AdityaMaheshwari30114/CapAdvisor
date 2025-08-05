document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Investment Page Loaded!");

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

    // ✅ Get Firebase Auth Instance
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            console.warn("⚠️ No user logged in, redirecting to login.");
            window.location.href = "login.html";
            return;
        }

        console.log("✅ User is logged in:", user.email);
        fetchIdleCapital(user.uid);
    });

    // ✅ Handle Add Investment Form Submission
    const addInvestmentForm = document.getElementById("addInvestmentForm");
    if (addInvestmentForm) {
        addInvestmentForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const user = firebase.auth().currentUser;
            if (!user) {
                alert("You must be logged in to add an investment!");
                return;
            }

            const uid = user.uid;
            const amountInput = document.getElementById("investmentAmount");
            const typeInput = document.getElementById("investmentType");

            if (!amountInput || !typeInput) {
                console.error("❌ Missing input fields in DOM.");
                return;
            }

            const amount = parseFloat(amountInput.value);
            const investmentType = typeInput.value.trim();

            if (amount <= 0 || !investmentType) {
                alert("❌ Please enter valid investment details.");
                return;
            }

            try {
                const response = await fetch("http://localhost:5001/api/investment/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid, amount, investmentType })
                });

                const data = await response.json();

                if (response.ok) {
                    console.log("✅ Investment Added:", data);

                    // ✅ Show Unique Investment ID in Prompt
                    alert(`🎉 Investment Successful! Your Investment ID: ${data.investment.investmentID}\n\nSave this ID for future settlement.`);

                    // ✅ Show Success Message
                    const messageElement = document.getElementById("investmentMessage");
                    if (messageElement) {
                        messageElement.innerHTML = 
                            `✅ Investment of ₹${amount} in <strong>${investmentType}</strong> added successfully!`;
                    }

                    // ✅ Clear Form
                    addInvestmentForm.reset();

                    // ✅ Refresh Idle Capital
                    fetchIdleCapital(uid);
                } else {
                    alert(`❌ Error: ${data.error}`);
                }
            } catch (error) {
                console.error("❌ Investment Error:", error);
                alert("❌ Failed to process investment. Try again later.");
            }
        });
    }

    // ✅ Handle Fetch Investment for Settlement
    const fetchInvestmentForm = document.getElementById("fetchInvestmentForm");
    if (fetchInvestmentForm) {
        fetchInvestmentForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const investmentIDInput = document.getElementById("investmentID");
            if (!investmentIDInput) {
                console.error("❌ Investment ID input field is missing.");
                return;
            }

            const investmentID = investmentIDInput.value.trim();
            if (!investmentID) {
                alert("❌ Please enter a valid Investment ID.");
                return;
            }

            try {
                const user = firebase.auth().currentUser;
                if (!user) {
                    alert("You must be logged in to fetch investments!");
                    return;
                }

                const response = await fetch(`http://localhost:5001/api/investment/user/${user.uid}`);
                const investments = await response.json();

                if (response.ok) {
                    const investment = investments.find(inv => inv.investmentID === investmentID);

                    if (investment) {
                        console.log("✅ Investment Found:", investment);

                        // ✅ Populate Investment Details
                        document.getElementById("displayInvestmentType").textContent = investment.investmentType;
                        document.getElementById("displayInvestmentAmount").textContent = investment.amount;
                        document.getElementById("displayInvestmentDate").textContent = new Date(investment.date).toLocaleDateString();

                        // ✅ Show Investment Details Section
                        document.getElementById("investmentDetails").style.display = "block";
                        document.getElementById("settleMessage").textContent = "";
                    } else {
                        alert("❌ No investment found with this ID.");
                        document.getElementById("investmentDetails").style.display = "none";
                    }
                } else {
                    alert("❌ Error fetching investments.");
                }
            } catch (error) {
                console.error("❌ Fetch Investment Error:", error);
                alert("❌ Failed to fetch investment details.");
            }
        });
    }

    // ✅ Handle Settle Investment Form Submission
    const settleInvestmentForm = document.getElementById("settleInvestmentForm");
    if (settleInvestmentForm) {
        settleInvestmentForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const user = firebase.auth().currentUser;
            if (!user) {
                alert("You must be logged in to settle an investment!");
                return;
            }

            const investmentIDInput = document.getElementById("investmentID");
            const returnAmountInput = document.getElementById("returnAmount");

            if (!investmentIDInput || !returnAmountInput) {
                console.error("❌ Missing required fields in DOM.");
                return;
            }

            const investmentID = investmentIDInput.value.trim();
            const returnAmount = parseFloat(returnAmountInput.value);

            if (!investmentID || isNaN(returnAmount) || returnAmount <= 0) {
                alert("❌ Please enter a valid return amount.");
                return;
            }

            try {
                const response = await fetch("http://localhost:5001/api/investment/settle", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid: user.uid, investmentID, returnAmount })
                });

                const data = await response.json();

                if (response.ok) {
                    console.log("✅ Investment Settled:", data);

                    // ✅ Show Profit/Loss Message
                    document.getElementById("settleMessage").innerHTML = 
                        `✅ Investment Settled! <br> Return: ₹${returnAmount} <br> Profit/Loss: ₹${data.profitOrLoss}`;

                    // ✅ Hide Investment Details
                    document.getElementById("investmentDetails").style.display = "none";

                    // ✅ Refresh Idle Capital
                    fetchIdleCapital(user.uid);
                } else {
                    alert(`❌ Error: ${data.error}`);
                }
            } catch (error) {
                console.error("❌ Settle Investment Error:", error);
                alert("❌ Failed to settle investment.");
            }
        });
    }
});

// ✅ Fetch Idle Capital & Update UI
async function fetchIdleCapital(uid) {
    try {
        const response = await fetch(`http://localhost:5001/api/finance/idle-capital/${uid}`);
        const data = await response.json();

        if (response.ok) {
            console.log("✅ Updated Idle Capital:", data.idleCapital);

            // ✅ Show current idle capital before adding investment
            document.getElementById("currentIdleCapital").textContent = 
                `💰 Your Current Idle Capital: ₹${data.idleCapital}`;
            document.getElementById("currentIdleCapitalSettle").textContent = 
                `💰 Your Current Idle Capital: ₹${data.idleCapital}`;

        } else {
            console.error("❌ Error Fetching Idle Capital:", data.error);
        }
    } catch (error) {
        console.error("❌ Idle Capital Fetch Error:", error);
    }
}
