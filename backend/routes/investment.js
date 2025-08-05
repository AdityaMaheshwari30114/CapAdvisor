const express = require("express");
const router = express.Router();
const Investment = require("../models/Investment"); // Investment Model
const User = require("../models/User"); // User Model

// ✅ Add New Investment
router.post("/add", async (req, res) => {
    try {
        console.log("✅ Add Investment Request:", req.body);
        const { uid, amount, investmentType } = req.body;

        if (!uid || !amount || !investmentType) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // ✅ Check if the user exists
        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // ✅ Check if user has enough idle capital to invest
        if (user.idleCapital < amount) {
            return res.status(400).json({ error: "Insufficient idle capital. Try adding capital first." });
        }

        // ✅ Deduct amount from Idle Capital
        user.idleCapital -= amount;
        await user.save();

        // ✅ Generate Unique Investment ID
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const investmentID = `INV${randomNum}`;

        // ✅ Create new Investment with investmentID
        const newInvestment = new Investment({ uid, amount, investmentType, investmentID });
        await newInvestment.save();

        console.log("✅ Investment Added:", newInvestment);
        res.status(201).json({ message: "Investment added successfully", investment: newInvestment });
    } catch (error) {
        console.error("❌ Investment Error:", error);
        res.status(500).json({ error: `Failed to make investment: ${error.message}` });
    }
});

// ✅ Fetch All Investments of a User
router.get("/user/:uid", async (req, res) => {
    try {
        console.log("🔍 Fetching Investments for UID:", req.params.uid);

        const investments = await Investment.find({ uid: req.params.uid });

        if (!investments.length) {
            return res.status(404).json({ error: "No investments found" });
        }

        res.json(investments);
    } catch (error) {
        console.error("❌ Fetch Investments Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Settle an Investment
router.post("/settle", async (req, res) => {
    try {
        console.log("✅ Settle Investment Request:", req.body);
        const { uid, investmentID, returnAmount } = req.body;

        if (!uid || !investmentID || returnAmount === undefined) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // ✅ Find the investment
        const investment = await Investment.findOne({ uid, investmentID });

        if (!investment) {
            return res.status(404).json({ error: "Investment not found" });
        }

        // ✅ Check if already settled
        if (investment.settled) {
            return res.status(400).json({ error: "Investment already settled" });
        }

        // ✅ Find User
        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // ✅ Calculate Profit or Loss
        const profitOrLoss = returnAmount - investment.amount;

        // ✅ Update Investment as Settled
        investment.settled = true;
        investment.returnAmount = returnAmount;
        await investment.save().catch(err => {
            console.error("❌ Error updating investment:", err.message);
            return res.status(500).json({ error: "Failed to update investment" });
        });

        // ✅ Update User's Idle Capital
        user.idleCapital += returnAmount;
        await user.save().catch(err => {
            console.error("❌ Error updating idle capital:", err.message);
            return res.status(500).json({ error: "Failed to update idle capital" });
        });

        console.log("✅ Investment Settled:", investment);
        res.json({ message: "Investment settled successfully", profitOrLoss, updatedIdleCapital: user.idleCapital });

    } catch (error) {
        console.error("❌ Settle Investment Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
