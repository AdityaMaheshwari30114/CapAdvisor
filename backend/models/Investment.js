const mongoose = require("mongoose");

// ✅ Define Investment Schema
const investmentSchema = new mongoose.Schema({
    uid: { type: String, required: true }, // User ID (To link investments to users)
    amount: { type: Number, required: true }, // Amount Invested
    investmentType: { type: String, required: true }, // Stocks, Bonds, Gold, etc.
    date: { type: Date, default: Date.now }, // Date of Investment
    investmentID: { type: String, required: true, unique: true }, // Unique ID for investment
    settled: { type: Boolean, default: false }, // To check if the investment is settled
    returnAmount: { type: Number, default: 0 } // The amount returned after settlement
});

// ✅ Generate a Unique Investment ID (Format: INVXXXX)
investmentSchema.pre("save", function (next) {
    if (!this.investmentID) {
        const randomNum = Math.floor(1000 + Math.random() * 9000); // Random 4-digit number
        this.investmentID = `INV${randomNum}`;
    }
    next();
});

// ✅ Create Investment Model
module.exports = mongoose.model("Investment", investmentSchema);
