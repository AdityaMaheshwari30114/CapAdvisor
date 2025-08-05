const mongoose = require("mongoose");

// ✅ Define Loan Schema
const loanSchema = new mongoose.Schema({
    uid: { type: String, required: true }, // User ID (Firebase UID)
    loanID: { type: String, required: true, unique: true }, // Unique Loan ID (LOANXXXX)
    amount: { type: Number, required: true, min: 1 }, // Loan Amount (Min: ₹1)
    loanType: { type: String, required: true }, // Type of Loan (e.g., Personal, Home)
    interestRate: { type: Number, required: true, min: 0 }, // Interest Rate (%)
    interestType: { 
        type: String, 
        enum: ["monthly", "yearly"], // ✅ Allowed values: 'monthly' or 'yearly'
        required: true 
    },
    loanTerm: { type: Number, required: true, min: 1 }, // Loan Term (in months, min 1)
    startDate: { type: Date, required: true }, // Loan Start Date
    endDate: { type: Date, required: true }, // ✅ Loan End Date
    emiAmount: { type: Number, required: true, min: 1 }, // ✅ EMI Amount (Auto-calculated)
    remainingLoan: { type: Number, required: true, min: 0 }, // ✅ Remaining Loan Amount
}, { timestamps: true });

// ✅ Generate a Unique Loan ID (Format: LOANXXXX)
loanSchema.pre("save", async function (next) {
    if (!this.loanID) {
        let randomNum;
        let existingLoan;
        do {
            randomNum = Math.floor(1000 + Math.random() * 9000); // Generate Random 4-digit number
            existingLoan = await mongoose.model("Loan").findOne({ loanID: `LOAN${randomNum}` });
        } while (existingLoan); // Repeat if Loan ID already exists

        this.loanID = `LOAN${randomNum}`;
    }
    next();
});

// ✅ Create & Export Loan Model
module.exports = mongoose.model("Loan", loanSchema);
