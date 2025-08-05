const mongoose = require("mongoose");

const DailyExpenseSchema = new mongoose.Schema({
    uid: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String },
    date: { type: String, required: true } // Store date as YYYY-MM-DD
});

module.exports = mongoose.model("DailyExpense", DailyExpenseSchema);
