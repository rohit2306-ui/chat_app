import { auth, db } from "./firebase-config.js";
import { ref, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

document.getElementById("update-name-btn").addEventListener("click", async () => {
    const newName = document.getElementById("username").value.trim();
    if (newName === "") return alert("Enter a valid name!");

    const user = auth.currentUser;
    if (!user) return alert("You must be logged in!");

    await update(ref(db, `users/${user.uid}`), { name: newName });

    alert("Name Updated Successfully!");
    window.location.href = "chat.html";
});

document.getElementById("logout-btn").addEventListener("click", () => {
    auth.signOut().then(() => {
        window.location.href = "login.html";
    }).catch(error => {
        alert("Error logging out: " + error.message);
    });
});

document.getElementById("back-btn").addEventListener("click", () => {
    window.location.href = "chat.html";
});
