import { auth, db } from "./firebase-config.js";
import { ref, set, get, push, onChildAdded, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const userList = document.getElementById("users-list");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

const chatUserName = document.getElementById("chat-user-name");
const menuBtn = document.querySelector(".menu-btn");
const menuDropdown = document.querySelector(".menu-dropdown");
const editNameBtn = document.getElementById("edit-name");
const deleteChatBtn = document.getElementById("delete-chat");
const blockUserBtn = document.getElementById("block-user");

let currentUser = null;
let selectedChatUser = null;
let lastMessageTimestamp = 0; // ✅ Track last message to avoid duplicates
let friendsList = {}; // ✅ Store friends for quick lookup

// ✅ Toggle 3-dot Menu
menuBtn.addEventListener("click", () => {
    menuDropdown.style.display = menuDropdown.style.display === "block" ? "none" : "block";
});

// ✅ Close menu when clicking outside
document.addEventListener("click", (event) => {
    if (!menuBtn.contains(event.target) && !menuDropdown.contains(event.target)) {
        menuDropdown.style.display = "none";
    }
});

// ✅ Check Authentication
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        console.log("Logged in as:", user.uid);

        // ✅ Fetch user name and phone number
        get(ref(db, `users/${currentUser.uid}`)).then(snapshot => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                currentUser.phone = userData.phone;
                document.getElementById("current-user-name").innerText = userData.name || "User";
                console.log("User Name Loaded:", userData.name);
                loadFriends(); // ✅ Load friends list
                listenForIncomingMessages(); // ✅ Listen for unknown messages
            } else {
                console.error("User data not found");
            }
        });

    } else {
        window.location.href = "login.html";
    }
});

// ✅ Send Message & Store in Common Chat Room
sendBtn.addEventListener("click", () => {
    if (!selectedChatUser) return alert("Select a friend to chat!");

    const message = messageInput.value.trim();
    if (message === "") return;

    const chatKey = getChatKey(currentUser.phone, selectedChatUser);
    const messageData = {
        sender: currentUser.phone,
        text: message,
        timestamp: Date.now()
    };

    // ✅ Store Message
    const messageRef = push(ref(db, `chats/${chatKey}`));

    set(messageRef, messageData)
        .then(() => {
            console.log("Message Sent:", message);
            messageInput.value = ""; // ✅ Clear input field
        })
        .catch(error => {
            console.error("Error sending message:", error);
        });
});

// ✅ Open Chat & Fetch Messages (including unknown users)
function openChat(phone, name) {
    selectedChatUser = phone;
    chatUserName.innerHTML = `${name} <button class="menu-btn"></button>`;

    messagesDiv.innerHTML = "";
    lastMessageTimestamp = 0;

    const chatKey = getChatKey(currentUser.phone, selectedChatUser);
    const chatRef = ref(db, `chats/${chatKey}`);

    console.log(`Listening to chat: ${chatKey}`);

    messagesDiv.innerHTML = "";

    // ✅ Real-time message fetching (avoid duplicates)
    onChildAdded(chatRef, (snapshot) => {
        const message = snapshot.val();

        // ✅ Check if message is already displayed
        if (message.timestamp > lastMessageTimestamp) {
            console.log("Received message:", message);
            displayMessage(message);
            lastMessageTimestamp = message.timestamp;
        }
    });

    // ✅ Attach Menu Button Event Again (Since chat title is updated)
    document.querySelector(".menu-btn").addEventListener("click", () => {
        menuDropdown.style.display = menuDropdown.style.display === "block" ? "none" : "block";
    });
}

// ✅ Generate Unique Chat Key
function getChatKey(phone1, phone2) {
    return phone1 < phone2 ? `${phone1}_${phone2}` : `${phone2}_${phone1}`;
}

// ✅ Display Messages in Chat UI
// function displayMessage(message) {
//     const div = document.createElement("div");
//     div.innerText = message.text;
//     div.classList.add("message");

//     if (message.sender === currentUser.phone) {
//         div.classList.add("sent");
//     } else {
//         div.classList.add("received");
//     }

//     messagesDiv.appendChild(div);
//     messagesDiv.scrollTop = messagesDiv.scrollHeight;
// }

// ✅ Load Friends List & Store in `friendsList`
function loadFriends() {
    get(ref(db, `users/${currentUser.uid}/friends`)).then(snapshot => {
        if (snapshot.exists()) {
            userList.innerHTML = "";
            friendsList = snapshot.val();
    
            Object.keys(friendsList).forEach(friendId => {
                get(ref(db, `users/${currentUser.uid}/chats/${friendId}`)).then(chatSnapshot => {
                    if (!chatSnapshot.exists() || !chatSnapshot.val().hidden) {  // ✅ Show only non-hidden chats
                        const li = document.createElement("li");
                        li.innerText = friendsList[friendId].name;
                        li.dataset.phone = friendsList[friendId].phone;
                        li.addEventListener("click", () => openChat(friendsList[friendId].phone, friendsList[friendId].name));
                        userList.appendChild(li);
                    }
                });
            });
        }
    });
    
}

// ✅ Listen for Unknown Messages & Add to Chat List
function listenForIncomingMessages() {
    const chatRef = ref(db, `chats`);

    onChildAdded(chatRef, (snapshot) => {
        const chatRoomKey = snapshot.key;
        const messages = snapshot.val();

        // ✅ Extract sender and receiver from chat key
        const [phone1, phone2] = chatRoomKey.split("_");

        let otherUserPhone = (phone1 === currentUser.phone) ? phone2 : phone1;

        // ✅ Ignore if it's the current user's own messages
        if (phone1 !== currentUser.phone && phone2 !== currentUser.phone) return;

        if (!friendsList[otherUserPhone]) {
            // ✅ Add unknown user to chat list
            const li = document.createElement("li");
            li.innerText = otherUserPhone;
            li.dataset.phone = otherUserPhone;
            li.addEventListener("click", () => openChat(otherUserPhone, otherUserPhone));
            userList.appendChild(li);

            console.log("Added unknown user to chat list:", otherUserPhone);
        }
    });
}

// ✅ Edit Friend's Name
editNameBtn.addEventListener("click", () => {
    if (!selectedChatUser) return alert("Select a friend first!");

    const newName = prompt("Enter new name:");
    if (newName) {
        // ✅ Update name in Firebase
        update(ref(db, `users/${currentUser.uid}/friends/${selectedChatUser}`), {
            name: newName
        }).then(() => {
            chatUserName.innerText = newName;
            alert("Name updated!");
        }).catch(err => console.error("Error updating name:", err));
    }
});

// ✅ Delete Chat
deleteChatBtn.addEventListener("click", () => {
    if (!selectedChatUser) return alert("Select a friend first!");

    const chatKey = getChatKey(currentUser.phone, selectedChatUser);

    if (confirm("Are you sure you want to delete this chat?")) {
        remove(ref(db, `chats/${chatKey}`))
            .then(() => {
                messagesDiv.innerHTML = "";
                alert("Chat deleted!");
            })
            .catch(err => console.error("Error deleting chat:", err));
    }
});

// ✅ Block User
blockUserBtn.addEventListener("click", () => {
    if (!selectedChatUser) return alert("Select a friend first!");

    if (confirm(`Are you sure you want to block ${selectedChatUser}?`)) {
        set(ref(db, `users/${currentUser.uid}/blocked/${selectedChatUser}`), {
            blocked: true
        }).then(() => {
            alert("User blocked!");
        }).catch(err => console.error("Error blocking user:", err));
    }
});

// Add this code inside chat.js
document.querySelector(".menu-btn").addEventListener("click", () => {
    document.querySelector(".sidebar").classList.toggle("open");
});
document.addEventListener("click", (event) => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar.contains(event.target) && !event.target.classList.contains("menu-btn")) {
        sidebar.classList.remove("open");
    }
});

// 📱 Sidebar Toggle
document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.createElement("button");
    toggleBtn.classList.add("toggle-sidebar");
    toggleBtn.innerHTML = "☰"; // Hamburger Icon
    document.body.appendChild(toggleBtn);

    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("active");
    });
});

// ✅ Display Messages in Chat UI with Timestamp
function displayMessage(message) {
    const div = document.createElement("div");
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    div.innerHTML = `<span class="message-text">${message.text}</span> <span class="message-time">${time}</span>`;
    div.classList.add("message");

    if (message.sender === currentUser.phone) {
        div.classList.add("sent");
    } else {
        div.classList.add("received");
    }

    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

deleteChatBtn.addEventListener("click", () => {
    if (!selectedChatUser) return alert("Select a friend first!");

    const userChatRef = ref(db, `users/${currentUser.uid}/chats/${selectedChatUser}`);

    if (confirm("Are you sure you want to delete this chat for yourself?")) {
        set(userChatRef, { hidden: true }) // ✅ Mark chat as hidden instead of deleting
            .then(() => {
                messagesDiv.innerHTML = "";
                alert("Chat deleted for you!");
            })
            .catch(err => console.error("Error hiding chat:", err));
    }
});


const logoutBtn = document.getElementById("logout-btn");

logoutBtn.addEventListener("click", () => {
    auth.signOut()
        .then(() => {
            window.location.href = "index.html"; // ✅ Redirect to login page after logout
        })
        .catch(error => {
            console.error("Logout failed:", error);
        });
});

const addFriendBtn = document.getElementById("add-friend-btn");
const friendNumberInput = document.getElementById("friend-number");

addFriendBtn.addEventListener("click", async () => {
    const friendPhone = friendNumberInput.value.trim();

    if (friendPhone === "") {
        alert("Enter a valid phone number.");
        return;
    }

    if (!auth.currentUser) {
        alert("You must be logged in to add friends.");
        return;
    }

    const currentUser = auth.currentUser;
    const currentUserPhoneRef = ref(db, `users/${currentUser.uid}`);

    // ✅ Check if Friend Exists in Users Database
    const usersRef = ref(db, "users");
    const usersSnapshot = await get(usersRef);

    if (usersSnapshot.exists()) {
        let friendUid = null;
        usersSnapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            if (userData.phone === friendPhone) {
                friendUid = childSnapshot.key; // Found User UID
            }
        });

        if (!friendUid) {
            alert("User not found. Make sure they have registered.");
            return;
        }

        // ✅ Add Friend in Both Users' Friends List
        const friendRef = ref(db, `users/${currentUser.uid}/friends/${friendUid}`);
        const reverseFriendRef = ref(db, `users/${friendUid}/friends/${currentUser.uid}`);

        await update(friendRef, {
            phone: friendPhone,
            name: "Friend" // Default name, can be edited later
        });

        await update(reverseFriendRef, {
            phone: currentUser.phone,
            name: "Friend" // Default name, can be edited later
        });

        alert("Friend added successfully!");
        friendNumberInput.value = ""; // ✅ Clear Input Field
        loadFriends(); // ✅ Reload Friends List
    } else {
        alert("Database error! Please try again later.");
    }
});