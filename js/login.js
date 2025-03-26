import { auth, provider } from "./firebase-config.js";
import { signInWithEmailAndPassword, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Login with Email and Password
document.getElementById("login-btn").addEventListener("click", function () {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            alert("Login Successful!");
            window.location.href = "chat.html";
        })
        .catch(error => {
            alert("Login Error: " + error.message);
        });
});

// ✅ Google Sign-In
document.getElementById("google-login-btn")?.addEventListener("click", function () {
    signInWithPopup(auth, provider)
        .then(() => {
            alert("Google Login Successful!");
            window.location.href = "chat.html";
        })
        .catch(error => {
            alert("Google Login Error: " + error.message);
        });
});
