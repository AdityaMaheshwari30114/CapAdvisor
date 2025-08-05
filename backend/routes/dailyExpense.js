const express = require("express");
const router = express.Router();
const DailyExpense = require("../models/DailyExpense");
const User = require("../models/User");
const moment = require("moment-timezone");

// ✅ Add Daily Expense
router.post("/add", async (req, res) => {
    try {
        const { uid, amount, category, description } = req.body;

        if (!uid || !amount || !category) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // ✅ Fetch User
        const user = await User.findOne({ uid });
        if (!user) return res.status(404).json({ error: "User not found" });

        // ✅ Check if User has enough Idle Capital
        if (user.idleCapital < amount) {
            return res.status(400).json({ error: "Insufficient Idle Capital" });
        }

        // ✅ Deduct Amount from Idle Capital
        user.idleCapital -= amount;
        await user.save();

        // ✅ Store Expense with IST Date & Time
        const newExpense = new DailyExpense({
            uid,
            amount,
            category,
            description,
            date: moment().tz("Asia/Kolkata").format("YYYY-MM-DD") // Store today's date
        });

        await newExpense.save();
        res.status(201).json({ message: "Expense added successfully", expense: newExpense });

    } catch (error) {
        console.error("❌ Add Expense Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Fetch Today's Expenses
router.get("/today/:uid", async (req, res) => {
    try {
        const { uid } = req.params;
        const todayDate = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

        // ✅ Fetch Expenses for Today
        const expenses = await DailyExpense.find({ uid, date: todayDate });

        res.json(expenses);
    } catch (error) {
        console.error("❌ Fetch Expenses Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Delete an Expense (Restore Idle Capital)
router.delete("/delete/:expenseId", async (req, res) => {
    try {
        const { expenseId } = req.params;

        // ✅ Find Expense
        const expense = await DailyExpense.findById(expenseId);
        if (!expense) return res.status(404).json({ error: "Expense not found" });

        // ✅ Find User & Restore Idle Capital
        const user = await User.findOne({ uid: expense.uid });
        if (user) {
            user.idleCapital += expense.amount;
            await user.save();
        }

        // ✅ Delete Expense
        await DailyExpense.findByIdAndDelete(expenseId);
        res.json({ message: "Expense deleted successfully" });

    } catch (error) {
        console.error("❌ Delete Expense Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Fetch User's Idle Capital
router.get("/get-idle-capital/:uid", async (req, res) => {
    const { uid } = req.params;
    try {
        const user = await User.findOne({ uid });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ success: true, idleCapital: user.idleCapital || 0 });
    } catch (error) {
        console.error("❌ Error fetching idle capital:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




const PreviousExpense = require("../models/PreviousExpense"); // Import the new model

const resetExpenses = async () => {
    try {
        const yesterday = moment().tz("Asia/Kolkata").subtract(1, "day").format("YYYY-MM-DD");

        console.log(`🔄 Resetting expenses for: ${yesterday}`);

        // ✅ Fetch expenses of yesterday
        const previousExpenses = await DailyExpense.find({ date: yesterday });

        // ✅ Store them in PreviousExpense collection
        if (previousExpenses.length > 0) {
            await PreviousExpense.insertMany(previousExpenses);
        }

        // ✅ Delete from DailyExpense after storing
        await DailyExpense.deleteMany({ date: yesterday });

        console.log("✅ Expenses Reset & Stored Successfully!");
    } catch (error) {
        console.error("❌ Expense Reset Error:", error);
    }
};


const scheduleMidnightReset = () => {
    const now = moment().tz("Asia/Kolkata");
    const nextMidnight = moment().tz("Asia/Kolkata").startOf("day").add(1, "day");
    const timeUntilMidnight = nextMidnight.diff(now);

    setTimeout(() => {
        resetExpenses();
        scheduleMidnightReset(); // Schedule next reset
    }, timeUntilMidnight);
};

// ✅ Start the Midnight Reset Scheduler
scheduleMidnightReset();


module.exports = router;
