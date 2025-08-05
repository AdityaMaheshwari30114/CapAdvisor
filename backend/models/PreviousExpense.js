const mongoose = require("mongoose");

const PreviousExpenseSchema = new mongoose.Schema({
    uid: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String },
    description: { type: String },
    date: { type: String, required: true } // Store as YYYY-MM-DD
});

module.exports = mongoose.model("PreviousExpense", PreviousExpenseSchema);
