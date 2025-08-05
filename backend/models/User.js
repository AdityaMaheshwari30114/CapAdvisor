const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    securityQuestion: { type: String, required: true },
    securityAnswer: { type: String, required: true },

    // ✅ Add Idle Capital Field (Default: 0)
    idleCapital: { type: Number, default: 0 }, // Tracks available cash for investments/expenses

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
