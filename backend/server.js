require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ✅ Firebase Admin SDK for authentication
const admin = require("./firebaseAdmin");

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Middleware (Placed Before Routes)
app.use(cors());
app.use(express.json()); // ✅ Enable JSON parsing
app.use(express.urlencoded({ extended: true })); // ✅ Enable form data parsing

// ✅ Routes (Placed After Middleware)
const authRoutes = require("./routes/auth");
const financeRoutes = require("./routes/finance"); // ✅ Finance-related routes
const investmentRoutes = require("./routes/investment"); // ✅ Investment routes
const loanRoutes = require("./routes/loan"); // ✅ Loan routes
const dailyExpenseRoutes = require("./routes/dailyExpense"); // ✅ Daily Expense routes (NEW)

app.use("/api/auth", authRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/investment", investmentRoutes);
app.use("/api/loan", loanRoutes);
app.use("/api/dailyExpense", dailyExpenseRoutes); // ✅ Added this line for Daily Expenses
app.use("/api/daily-expense", require("./routes/dailyExpense"));


// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Default Route
app.get("/", (req, res) => {
    res.send("CapAdvisor Backend is Running...");
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
