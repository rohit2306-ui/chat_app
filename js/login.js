import { auth, provider } from "./firebase-config.js";
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ✅ Check if user is already logged in, then redirect to chat page
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is already logged in:", user.email);
        window.location.href = "chat.html";  // ✅ Directly chat page pe le jao
    }
});

// ✅ Login with Email and Password
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
