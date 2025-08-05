const express = require("express");
const router = express.Router();
const admin = require("../firebaseAdmin"); // Firebase Admin SDK
const User = require("../models/User"); // User Model

// ✅ Register New User (Save to MongoDB)
router.post("/register", async (req, res) => {
    try {
        console.log("✅ Registration Request Received:", req.body);

        const { uid, fullname, username, phone, email, securityQuestion, securityAnswer } = req.body;

        if (!uid || !fullname || !username || !phone || !email || !securityQuestion || !securityAnswer) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // ✅ Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // ✅ Create new user
        const newUser = new User({
            uid,
            fullname,
            username,
            phone,
            email,
            securityQuestion,
            securityAnswer
        });

        await newUser.save();
        console.log("✅ User registered in MongoDB:", newUser);

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        console.error("❌ Registration Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Verify Firebase Token & Authenticate User
router.post("/login", async (req, res) => {
    try {
        const { token } = req.body; // Token from frontend
        console.log("✅ Login Request Received:", req.body);

        if (!token) {
            return res.status(400).json({ error: "Token is required" });
        }

        // ✅ Verify Firebase ID Token
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log("✅ Decoded Token:", decodedToken);

        const { uid, email } = decodedToken;

        // ✅ Check if user exists in MongoDB
        let user = await User.findOne({ uid });

        if (!user) {
            console.log("ℹ️ New user detected, creating in DB...");

            user = new User({
                uid,
                email,
                username: email.split("@")[0], // Default username
                fullname: "New User",
                phone: "",
                createdAt: new Date()
            });

            await user.save();
        }

        res.json({ message: "User authenticated successfully", uid, user });
    } catch (error) {
        console.error("❌ Authentication Error:", error.message);
        res.status(401).json({ error: "Invalid or expired token" });
    }
});

// ✅ Get User Data from MongoDB
router.get("/user/:uid", async (req, res) => {
    try {
        console.log("🔍 Fetching User Data for UID:", req.params.uid);

        const user = await User.findOne({ uid: req.params.uid });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("❌ Fetch User Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
