document.addEventListener("DOMContentLoaded", async () => {
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                await firebase.auth().signOut();
                localStorage.removeItem("isLoggedIn"); // Remove session storage
                window.location.href = "login.html"; // Redirect to login page after logout
            } catch (error) {
                console.error("❌ Logout Failed:", error.message);
            }
        });
    }

    // 🛑 Prevent Back Button Navigation After Login
    function preventBackNavigation() {
        history.pushState(null, null, location.href);
        window.onpopstate = function () {
            history.pushState(null, null, location.href);
        };
    }

    // 🔄 Check if user is authenticated
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            console.warn("⚠️ No user logged in, redirecting to login page.");
            window.location.href = "login.html";
            return;
        }

        console.log("✅ User is logged in:", user.email);
        localStorage.setItem("isLoggedIn", "true"); // Store session

        try {
            // ✅ Fetch user data
            const response = await fetch(`http://localhost:5001/api/auth/user/${user.uid}`);
            const userData = await response.json();

            if (response.ok) {
                console.log("✅ User data retrieved:", userData);
                
                document.getElementById("displayUsername").textContent = userData.username || "User";
                document.getElementById("displayFullName").textContent = userData.fullname || "Full Name";
                
                await fetchFinancialSummary(user.uid);
            } else {
                console.error("❌ Error fetching user data:", userData.error);
            }
        } catch (error) {
            console.error("❌ Fetching User Data Failed:", error);
        }

        // 🔒 Prevent Back Navigation
        preventBackNavigation();
    });
});

// ✅ Fetch Financial Summary including Daily Expenses
async function fetchFinancialSummary(uid) {
    try {
        const idleCapitalRes = await fetch(`http://localhost:5001/api/dailyExpense/get-idle-capital/${uid}`);
        const idleCapitalData = await idleCapitalRes.json();
        document.getElementById("idleCapitalAmount").textContent = `₹${idleCapitalData.idleCapital || 0}`;

        // ✅ Fetch Total Investment
        const investmentRes = await fetch(`http://localhost:5001/api/investment/user/${uid}`);
        const investments = await investmentRes.json();
        let totalInvestment = 0;
        let investmentTypes = new Set();

        if (Array.isArray(investments)) {
            investments.forEach(inv => {
                totalInvestment += inv.amount;
                investmentTypes.add(inv.investmentType);
            });
        }
        document.getElementById("totalInvestment").textContent = `₹${totalInvestment}`;
        document.getElementById("investmentTypes").textContent = Array.from(investmentTypes).join(", ") || "N/A";

        // ✅ Fetch Total Loan
        const loanRes = await fetch(`http://localhost:5001/api/loan/user/${uid}`);
        const loans = await loanRes.json();
        let totalLoan = 0;
        let loanCategories = new Set();

        if (Array.isArray(loans)) {
            loans.forEach(loan => {
                totalLoan += loan.remainingLoan;
                loanCategories.add(loan.loanType);
            });
        }
        document.getElementById("totalLoanAmount").textContent = `₹${totalLoan}`;
        document.getElementById("loanTypes").textContent = Array.from(loanCategories).join(", ") || "N/A";

        // ✅ Fetch Today's Expense
        const expenseRes = await fetch(`http://localhost:5001/api/dailyExpense/today/${uid}`);
        const expenses = await expenseRes.json();
        let totalExpense = 0;
        
        if (Array.isArray(expenses)) {
            expenses.forEach(exp => {
                totalExpense += exp.amount;
            });
        }
        document.getElementById("todaysExpense").textContent = `₹${totalExpense}`;

        // ✅ Disable buttons if Idle Capital is 0
        const disableButtons = idleCapitalData.idleCapital === 0;
        document.querySelectorAll(".add-btn").forEach(btn => {
            btn.disabled = disableButtons;
            btn.style.opacity = disableButtons ? "0.6" : "1";
            btn.style.cursor = disableButtons ? "not-allowed" : "pointer";
            btn.title = disableButtons ? "❌ Idle Capital is 0. Add Capital First!" : "";
        });

    } catch (error) {
        console.error("❌ Error Fetching Financial Summary:", error);
    }
}

// ✅ Fetch and Display Financial Summary (Ensures No Data is Overwritten)
async function fetchInvestmentDetails(uid) {
    try {
        const investmentRes = await fetch(`http://localhost:5001/api/investment/user/${uid}`);
        const investments = await investmentRes.json();
        let totalInvestment = 0;
        let investmentTypes = new Set();

        if (Array.isArray(investments)) {
            investments.forEach(inv => {
                totalInvestment += inv.amount;
                investmentTypes.add(inv.investmentType);
            });
        }

        document.getElementById("totalInvestment").textContent = `₹${totalInvestment}`;
        document.getElementById("investmentTypes").textContent = Array.from(investmentTypes).join(", ") || "N/A";

    } catch (error) {
        console.error("❌ Error Fetching Investment Details:", error);
    }
}

// ✅ Fetch Loan Data Separately
async function fetchLoanDetails(uid) {
    try {
        const loanRes = await fetch(`http://localhost:5001/api/loan/user/${uid}`);
        const loans = await loanRes.json();
        let totalLoan = 0;
        let loanCategories = new Set();

        if (Array.isArray(loans)) {
            loans.forEach(loan => {
                totalLoan += loan.remainingLoan;
                loanCategories.add(loan.loanType);
            });
        }

        document.getElementById("totalLoanAmount").textContent = `₹${totalLoan}`;
        document.getElementById("loanTypes").textContent = Array.from(loanCategories).join(", ") || "N/A";

    } catch (error) {
        console.error("❌ Error Fetching Loan Details:", error);
    }
}
