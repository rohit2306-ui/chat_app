import { auth, db } from "./firebase-config.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const userList = document.getElementById("users-list");

let currentUser = null;

// ✅ Check Authentication
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        console.log("Logged in as:", user.uid);
        document.getElementById("current-user-name").innerText = user.displayName || "User";
        loadFriends();
    } else {
        window.location.href = "login.html";
    }
});

// ✅ Load Friends List
function loadFriends() {
    get(ref(db, `users/${currentUser.uid}/friends`)).then(snapshot => {
        if (snapshot.exists()) {
            userList.innerHTML = "";
            const friends = snapshot.val();
            Object.keys(friends).forEach(friendId => {
                const friend = friends[friendId];

                const li = document.createElement("li");
                li.innerText = friend.name;
                li.dataset.phone = friend.phone;
                li.classList.add("friend-item");

                // ✅ Click pe "Chat with Friend" Page pe Redirect
                li.addEventListener("click", () => {
                    window.location.href = `chat-with-friend.html?phone=${friend.phone}&name=${friend.name}`;
                });

                userList.appendChild(li);
            });
        } else {
            userList.innerHTML = "<p>No friends added yet.</p>";
        }
    });
}
