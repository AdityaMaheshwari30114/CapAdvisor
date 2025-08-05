console.log("✅ register.js loaded!");

// ✅ Ensure Firebase SDK is loaded first
if (typeof firebase === "undefined") {
    console.error("❌ ERROR: Firebase SDK not loaded!");
} else {
    console.log("🔥 Firebase SDK is ready!");
}

// ✅ Wait for DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM fully loaded!");

    const registerForm = document.getElementById("signupForm");
    const successMessage = document.getElementById("successMessage");

    if (!registerForm) {
        console.error("❌ ERROR: Register form not found!");
        return;
    }

    // ✅ Shortened Validation Rules
const validationRules = {
    fullname: (value) => /^[A-Za-z\s]{3,}$/.test(value) || "Only letters allowed & min 3 character required",
    username: (value) => /^[A-Za-z0-9]{4,}$/.test(value) || "No spaces allowed & min 4 character required.",
    phone: (value) => /^\d{10}$/.test(value) || "Enter 10 digits.",
    email: (value) => /\S+@\S+\.\S+/.test(value) || "Invalid email format.",
    password: (value) => /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(value) || "Min 8 characters required, Atleast 1 uppercase, 1 lowercase & 1 Digit.",
    "security-answer": (value) => value.trim().length > 0 || "Required field.",
    "termsCheckbox": (checked) => checked || "Accept the terms."
};

    // ✅ Validate Field & Show Red/Green Effect
    function validateField(field) {
        const value = field.type === "checkbox" ? field.checked : field.value.trim();
        const errorMessage = field.parentElement.querySelector(".error-message");

        if (!validationRules[field.id]) return; // Skip if no validation rule

        const validationResult = validationRules[field.id](value);
        if (validationResult !== true) {
            field.classList.add("error-border");
            field.classList.remove("valid-border");
            errorMessage.textContent = validationResult;
            return false;
        } else {
            field.classList.add("valid-border");
            field.classList.remove("error-border");
            errorMessage.textContent = "";
            return true;
        }
    }

    // ✅ Attach validation event listeners
    Object.keys(validationRules).forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener("input", () => validateField(field));
            field.addEventListener("blur", () => validateField(field)); // Validate on blur
        }
    });

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent form reload

        let valid = true;
        Object.keys(validationRules).forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            if (field && !validateField(field)) {
                valid = false;
            }
        });

        if (!valid) return; // Stop if validation fails

        console.log("🔹 Attempting to register...");

        try {
            // ✅ Register user in Firebase
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // ✅ Send verification email
            await user.sendEmailVerification();
            console.log("✅ Verification email sent to:", user.email);

            // ✅ Send user details to backend (MongoDB)
            const response = await fetch("http://localhost:5001/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: user.uid, // Firebase UID
                    fullname: document.getElementById("fullname").value.trim(),
                    username: document.getElementById("username").value.trim(),
                    phone: document.getElementById("phone").value.trim(),
                    email: email.trim(),
                    securityQuestion: document.getElementById("security-question").value,
                    securityAnswer: document.getElementById("security-answer").value.trim(),
                }),
            });

            let result;
            try {
                result = await response.json();
            } catch (error) {
                console.error("❌ ERROR: Response is not valid JSON:", error);
                successMessage.textContent = "❌ Unexpected server response. Please try again later.";
                successMessage.style.color = "red";
                return;
            }

            if (response.ok) {
                console.log("✅ User saved in MongoDB:", result);
                successMessage.textContent = "✅ Registration successful! Please verify your email before logging in.";
                successMessage.style.color = "green";

                // ✅ Log user out to prevent login before email verification
                firebase.auth().signOut();

                setTimeout(() => window.location.href = "login.html", 3000);
            } else {
                console.error("❌ MongoDB Error:", result.error);
                successMessage.textContent = `❌ Error: ${result.error}`;
                successMessage.style.color = "red";
            }
        } catch (error) {
            console.error("❌ Registration Error:", error.message);
            successMessage.textContent = `❌ ${error.message}`;
            successMessage.style.color = "red";
        }
    });
});
