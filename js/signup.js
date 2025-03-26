import { app, auth, db } from "./firebase-config.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

document.getElementById("signup-btn").addEventListener("click", function () {
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const phone = document.getElementById("signup-phone").value; // ✅ Phone input
    const name = document.getElementById("signup-name").value; // ✅ Name input

    if (!email || !password || !phone || !name) {
        alert("Please fill all fields.");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // ✅ Store User Data in Realtime Database
            set(ref(db, "users/" + user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                phone: phone,
            }).then(() => {
                alert("Signup Successful! Redirecting to login...");
                window.location.href = "index.html";
            });

        }).catch((error) => {
            alert(error.message);
        });
});
