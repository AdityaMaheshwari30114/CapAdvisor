document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Loan Page Loaded!");

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

    // ✅ Ensure Firebase Auth is Loaded Before Proceeding
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            console.warn("⚠️ No user logged in, redirecting to login.");
            window.location.href = "login.html";
            return;
        }

        console.log("✅ User is logged in:", user.email);
        fetchIdleCapital(user.uid);
        window.loggedInUser = user; // Store user globally
    });

    // ✅ Handle Loan Form Submission
    const loanForm = document.getElementById("addLoanForm");
    if (loanForm) {
        loanForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            // ✅ Fetch Form Elements
            const loanAmountInput = document.getElementById("loanAmount");
            const loanTypeInput = document.getElementById("loanType");
            const startDateInput = document.getElementById("loanStartDate");
            const interestRateInput = document.getElementById("interestRate");
            const interestTypeInput = document.getElementById("interestType");
            const loanTermInput = document.getElementById("loanTerm");

            if (!loanAmountInput || !loanTypeInput || !startDateInput || !interestRateInput || !interestTypeInput || !loanTermInput) {
                console.error("❌ One or more loan form elements not found!");
                return;
            }

            const uid = window.loggedInUser.uid;
            const amount = parseFloat(loanAmountInput.value);
            const loanType = loanTypeInput.value.trim();
            const startDate = new Date(startDateInput.value);
            const interestRate = parseFloat(interestRateInput.value);
            const interestType = interestTypeInput.value;
            const loanTerm = parseInt(loanTermInput.value);

            if (!amount || !loanType || !startDate || !interestRate || !interestType || !loanTerm) {
                alert("❌ Please fill in all loan details correctly.");
                return;
            }

            // ✅ Ensure start date is not in the past
            const today = new Date();
            if (startDate < today) {
                alert("❌ Start date cannot be in the past.");
                return;
            }

            // ✅ Show EMI Calculation Before Submission
            const emiAmount = calculateEMI(amount, loanTerm, interestRate, interestType);
            if (emiAmount <= 0) {
                alert("❌ Error calculating EMI. Please check input values.");
                return;
            }

            if (!confirm(`📢 Your calculated EMI is ₹${emiAmount.toFixed(2)} per month. Proceed?`)) {
                return;
            }

            // ✅ Send Data to Backend
            try {
                const response = await fetch("http://localhost:5001/api/loan/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid, amount, loanType, startDate, interestRate, interestType, loanTerm, emiAmount })
                });

                const data = await response.json();

                if (response.ok) {
                    console.log("✅ Loan Added:", data);
                    alert(`🎉 Loan Successfully Logged! Your Loan ID: ${data.loan.loanID}`);

                    // ✅ Show Loan ID in Popup
                    document.getElementById("generatedLoanId").textContent = data.loan.loanID;
                    document.getElementById("loanIdPopup").style.display = "block";

                    loanForm.reset();
                    fetchIdleCapital(uid);
                } else {
                    alert(`❌ Error: ${data.error}`);
                }
            } catch (error) {
                console.error("❌ Loan Error:", error);
                alert("❌ Failed to add loan. Try again later.");
            }
        });
    } else {
        console.error("❌ Loan form not found!");
    }

    // ✅ Handle Loan ID Fetch Form
    const fetchLoanForm = document.getElementById("fetchLoanForm");
    if (fetchLoanForm) {
        fetchLoanForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            fetchLoanDetails();
        });
    } else {
        console.error("❌ Loan ID Fetch Form Not Found!");
    }

    // ✅ Real-time EMI Calculation
    document.querySelectorAll("#loanAmount, #loanTerm, #interestRate, #interestType").forEach((input) => {
        input.addEventListener("input", updateEMI);
    });
});

// ✅ Close Loan ID Popup
function closePopup() {
    document.getElementById("loanIdPopup").style.display = "none";
}

// ✅ Fetch Idle Capital & Update UI
async function fetchIdleCapital(uid) {
    try {
        const response = await fetch(`http://localhost:5001/api/finance/idle-capital/${uid}`);
        const data = await response.json();

        if (response.ok && data.idleCapital !== undefined) {
            console.log("✅ Updated Idle Capital:", data.idleCapital);
            document.getElementById("currentIdleCapital").textContent = `💰 Your Current Idle Capital: ₹${data.idleCapital}`;
            document.getElementById("updatedIdleCapital").textContent = `💰 Your Updated Idle Capital: ₹${data.idleCapital}`;
            document.getElementById("updatedIdleCapital").style.display = "block";
        } else {
            console.error("❌ Error Fetching Idle Capital:", data.error);
            document.getElementById("currentIdleCapital").textContent = "⚠️ Unable to fetch idle capital.";
        }
    } catch (error) {
        console.error("❌ Idle Capital Fetch Error:", error);
        document.getElementById("currentIdleCapital").textContent = "⚠️ Unable to fetch idle capital.";
    }
}

// ✅ Fetch Loan Details Based on Loan ID
async function fetchLoanDetails() {
    const loanID = document.getElementById("loanID").value.trim();
    if (!loanID) {
        alert("❌ Please enter a valid Loan ID.");
        return;
    }

    try {
        console.log(`🔍 Fetching Loan Details for ID: ${loanID}`);

        const response = await fetch(`http://localhost:5001/api/loan/details/${loanID}`);
        const data = await response.json();

        if (!response.ok) {
            alert(`❌ Error: ${data.error}`);
            return;
        }

        console.log("✅ Loan Details Fetched:", data);

        const loanDetailsSection = document.getElementById("loanDetails");
if (!loanDetailsSection) {
    console.error("❌ Loan Details Section Not Found in HTML!");
    return;
}

// ✅ Check each element before updating to prevent errors
const updateElement = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value || "N/A";
    } else {
        console.error(`❌ Element with ID '${id}' not found in HTML!`);
    }
};

updateElement("displayLoanType", data.loanType);
updateElement("displayLoanAmount", `${data.amount}`);
const formattedDate = new Date(data.startDate).toLocaleDateString("en-IN");
document.getElementById("displayLoanStartDate").textContent = formattedDate || "N/A";

// ✅ Ensure EMI is correctly displayed
const calculatedEMI = calculateEMI(data.amount, data.loanTerm, data.interestRate, data.interestType);
document.getElementById("displayEMIAmount").textContent = `${calculatedEMI}`;

updateElement("displayRemainingLoan", `${data.remainingLoan}`);

// ✅ Show Loan Details Section
loanDetailsSection.style.display = "block";


    } catch (error) {
        console.error("❌ Loan Fetch Error:", error);
        alert("❌ Failed to fetch loan details. Try again later.");
    }
}

// ✅ Calculate EMI Function
function calculateEMI(amount, loanTerm, interestRate, interestType) {
    if (interestType === "yearly") {
        interestRate = interestRate / 12; // Convert yearly to monthly rate
    }

    const monthlyInterest = interestRate / 100;
    const emi = (amount / loanTerm) + (amount * monthlyInterest);
    return Math.round(emi);
}


// ✅ Update EMI Display on Input Change
function updateEMI() {
    const amount = parseFloat(document.getElementById("loanAmount").value) || 0;
    const loanTerm = parseInt(document.getElementById("loanTerm").value) || 1;
    const interestRate = parseFloat(document.getElementById("interestRate").value) || 0;
    const interestType = document.getElementById("interestType").value;

    if (amount > 0 && loanTerm > 0 && interestRate >= 0) {
        const emi = calculateEMI(amount, loanTerm, interestRate, interestType);
        document.getElementById("calculatedEMI").innerHTML = `📢 Your calculated EMI is <strong>₹${emi.toFixed(2)}</strong> per month.`;
    }
}
