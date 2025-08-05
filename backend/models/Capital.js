const mongoose = require("mongoose");

const capitalSchema = new mongoose.Schema({
    uid: { type: String, required: true }, // User ID
    amount: { type: Number, required: true, min: 1 }, // Amount Added
    category: { type: String, required: true }, // Source of Capital
    date: { type: Date, default: Date.now } // Date of Transaction
}, { timestamps: true });

module.exports = mongoose.model("Capital", capitalSchema);
