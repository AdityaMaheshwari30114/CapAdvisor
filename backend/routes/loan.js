const express = require("express");
const router = express.Router();
const Loan = require("../models/Loan");
const User = require("../models/User");

router.post("/add", async (req, res) => {
    try {
        console.log("✅ Add Loan Request Received:", req.body);

        const { uid, amount, loanType, interestRate, interestType, loanTerm, startDate } = req.body;

        // ✅ Log incoming values
        console.log(`🔹 UID: ${uid}`);
        console.log(`🔹 Amount: ${amount}`);
        console.log(`🔹 Loan Type: ${loanType}`);
        console.log(`🔹 Interest Rate: ${interestRate}`);
        console.log(`🔹 Interest Type: ${interestType}`);
        console.log(`🔹 Loan Term: ${loanTerm} months`);
        console.log(`🔹 Start Date: ${startDate}`);

        if (!uid || !amount || !loanType || !interestRate || !interestType || !loanTerm || !startDate) {
            console.error("❌ Missing required fields.");
            return res.status(400).json({ error: "Missing required fields" });
        }

        // ✅ Validate Interest Type Enum
        const validInterestTypes = ["monthly", "yearly"];
        if (!validInterestTypes.includes(interestType)) {
            console.error("❌ Invalid interest type.");
            return res.status(400).json({ error: "Invalid interest type. Use 'monthly' or 'yearly'." });
        }

        // ✅ Convert startDate to Date format
        const parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate)) {
            console.error("❌ Invalid start date format.");
            return res.status(400).json({ error: "Invalid start date format" });
        }

        // ✅ Calculate EMI (Equated Monthly Installment)
        const emi = Math.round(amount / loanTerm);
        console.log(`🔹 Calculated EMI: ₹${emi}`);

        // ✅ Calculate End Date
        const endDate = new Date(parsedStartDate);
        endDate.setMonth(endDate.getMonth() + loanTerm);
        console.log(`🔹 Loan End Date: ${endDate}`);

        const newLoan = new Loan({
            uid,
            loanID: `LOAN${Math.floor(1000 + Math.random() * 9000)}`,  // ✅ Manually Generate Loan ID
            amount,
            loanType,
            interestRate,
            interestType,
            loanTerm,
            startDate: parsedStartDate,
            endDate,
            emiAmount: emi,
            remainingLoan: amount
        });
        

        await newLoan.save();

        console.log("✅ Loan Added Successfully:", newLoan);
        res.status(201).json({ message: "Loan added successfully", loan: newLoan });

    } catch (error) {
        console.error("❌ Loan Addition Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Deduct EMI on Due Date
router.post("/deduct-emi/:uid", async (req, res) => {
    try {
        const { uid } = req.params;

        // ✅ Fetch User & Active Loans
        const user = await User.findOne({ uid });
        const loans = await Loan.find({ uid, remainingLoan: { $gt: 0 } });

        if (!user) return res.status(404).json({ error: "User not found" });
        if (!loans.length) return res.json({ message: "No active loans for EMI deduction." });

        let totalDeduction = 0;
        let updatedLoans = [];

        // ✅ Today's Date
        const today = new Date();
        const todayDate = today.getDate();

        for (const loan of loans) {
            const loanStartDate = new Date(loan.startDate);
            const loanDueDate = loanStartDate.getDate(); // EMI due on this date

            if (todayDate !== loanDueDate) continue; // ✅ Skip if it's not EMI due date

            // ✅ Calculate Interest
            let interestAmount = (loan.interestRate / 100) * loan.remainingLoan;
            let totalEMI = loan.emiAmount + interestAmount;

            // ✅ Check if User Has Enough Idle Capital
            if (user.idleCapital < totalEMI) {
                return res.status(400).json({ error: `❌ Insufficient Idle Capital. EMI due: ₹${totalEMI}` });
            }

            // ✅ Deduct EMI + Interest
            user.idleCapital -= totalEMI;
            loan.remainingLoan -= loan.emiAmount;
            loan.updatedAt = new Date();

            // ✅ If Loan is Fully Paid, Mark as Complete
            if (loan.remainingLoan <= 0) {
                loan.remainingLoan = 0;
            }

            await loan.save();
            updatedLoans.push(loan);
            totalDeduction += totalEMI;
        }

        // ✅ Save Updated User Data
        await user.save();

        res.json({
            message: "✅ EMI deducted successfully",
            totalDeduction,
            updatedIdleCapital: user.idleCapital,
            updatedLoans,
        });

    } catch (error) {
        console.error("❌ EMI Deduction Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Fetch All Loans of a User
router.get("/user/:uid", async (req, res) => {
    try {
        console.log("🔍 Fetching Loans for UID:", req.params.uid);

        const loans = await Loan.find({ uid: req.params.uid });

        if (!loans.length) {
            return res.status(404).json({ error: "No active loans found" });
        }

        res.json(loans);
    } catch (error) {
        console.error("❌ Fetch Loans Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/details/:loanID", async (req, res) => {
    try {
        const { loanID } = req.params;
        console.log("🔍 Fetching Loan for ID:", loanID);

        const loan = await Loan.findOne({ loanID });
        if (!loan) {
            return res.status(404).json({ error: "Loan not found!" });
        }

        res.json(loan);
    } catch (error) {
        console.error("❌ Error Fetching Loan:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



module.exports = router;
