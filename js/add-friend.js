import { auth, db } from "./firebase-config.js";
import { ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

document.getElementById("add-friend-btn").addEventListener("click", async () => {
    const friendPhone = document.getElementById("friend-number").value.trim();
    if (friendPhone === "") return alert("Enter a valid phone number!");

    const user = auth.currentUser;
    if (!user) return alert("You must be logged in!");

    const userRef = ref(db, `users/${user.uid}/friends/${friendPhone}`);
    await set(userRef, { phone: friendPhone, name: "Friend" });

    alert("Friend Added Successfully!");
    window.location.href = "chat.html";
});

document.getElementById("back-btn").addEventListener("click", () => {
    window.location.href = "chat.html";
});
