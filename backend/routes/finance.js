const express = require("express");
const router = express.Router();
const Capital = require("../models/Capital");
const User = require("../models/User");

// ✅ Add Capital API
router.post("/add-capital", async (req, res) => {
    try {
        const { uid, amount, category } = req.body;

        if (!uid || !amount || !category) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: "Amount must be greater than 0" });
        }

        // ✅ Find User
        const user = await User.findOne({ uid });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // ✅ Save Capital Transaction
        const newCapital = new Capital({ uid, amount, category });
        await newCapital.save();

        // ✅ Update Idle Capital in User Schema
      // ✅ Convert amount to a number before adding
        user.idleCapital = (user.idleCapital || 0) + Number(amount);
        await user.save();


        console.log(`✅ Capital Added: ₹${amount} to user ${uid}`);

        res.status(201).json({
            message: "Capital added successfully",
            updatedIdleCapital: user.idleCapital
        });
    } catch (error) {
        console.error("❌ Add Capital Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Get User's Idle Capital API
router.get("/idle-capital/:uid", async (req, res) => {
    try {
        const { uid } = req.params;

        // ✅ Find the user
        const user = await User.findOne({ uid });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log(`✅ Fetching Idle Capital for user ${uid}: ₹${user.idleCapital}`);

        res.json({ idleCapital: user.idleCapital });
    } catch (error) {
        console.error("❌ Fetch Idle Capital Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
