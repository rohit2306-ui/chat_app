import { auth, db } from "./firebase-config.js";
import { ref, set, get, push, onChildAdded, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const userList = document.getElementById("users-list");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const menuBtn = document.querySelector(".menu-btn");
const menuDropdown = document.querySelector(".menu-dropdown");
const chatUserName = document.getElementById("chat-user-name");

let currentUser = null;
let selectedChatUser = null;
let lastMessageTimestamp = 0;
let friendsList = {};

// ✅ Check Authentication & Load User Data
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        console.log("Logged in as:", user.uid);

        // ✅ Fetch user name & phone
        get(ref(db, `users/${currentUser.uid}`)).then(snapshot => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                currentUser.phone = userData.phone;
                document.getElementById("current-user-name").innerText = userData.name || "User";
                console.log("User Name Loaded:", userData.name);
                loadFriends();
                listenForIncomingMessages();
            } else {
                console.error("User data not found");
            }
        });

    } else {
        window.location.href = "index.html";
    }
});

// ✅ Send Message & Store in Chat Room
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

    const messageRef = push(ref(db, `chats/${chatKey}`));
    set(messageRef, messageData)
        .then(() => {
            console.log("Message Sent:", message);
            messageInput.value = "";
        })
        .catch(error => console.error("Error sending message:", error));
});

// ✅ Open Chat & Fetch Messages
function openChat(phone) {
    selectedChatUser = phone;

    // ✅ Fetch Friend's Name
    get(ref(db, `users`)).then(snapshot => {
        if (snapshot.exists()) {
            let friendName = phone;
            snapshot.forEach(childSnapshot => {
                const userData = childSnapshot.val();
                if (userData.phone === phone) {
                    friendName = userData.name || phone;
                }
            });
            chatUserName.innerText = friendName;
        }
    });

    messagesDiv.innerHTML = "";
    lastMessageTimestamp = 0;

    const chatKey = getChatKey(currentUser.phone, selectedChatUser);
    const chatRef = ref(db, `chats/${chatKey}`);

    console.log(`Listening to chat: ${chatKey}`);

    messagesDiv.innerHTML = "";

    onChildAdded(chatRef, (snapshot) => {
        const message = snapshot.val();
        if (message.timestamp > lastMessageTimestamp) {
            console.log("Received message:", message);
            displayMessage(message);
            lastMessageTimestamp = message.timestamp;
        }
    });
}

// ✅ Generate Unique Chat Key
function getChatKey(phone1, phone2) {
    return phone1 < phone2 ? `${phone1}_${phone2}` : `${phone2}_${phone1}`;
}

// ✅ Display Messages in Chat UI with Timestamp
function displayMessage(message) {
    const div = document.createElement("div");
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    get(ref(db, `users`)).then(snapshot => {
        if (snapshot.exists()) {
            let senderName = message.sender;

            snapshot.forEach(childSnapshot => {
                const userData = childSnapshot.val();
                if (userData.phone === message.sender) {
                    senderName = userData.name || message.sender;
                }
            });

            div.innerHTML = `<strong></strong> <span class="message-text">${message.text}</span> <span class="message-time">${time}</span>`;
            div.classList.add("message");

            if (message.sender === currentUser.phone) {
                div.classList.add("sent");
            } else {
                div.classList.add("received");
            }

            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    });
}

// ✅ Load Friends List & Store in `friendsList`

function loadFriends() {
    const friendsRef = ref(db, `users/${currentUser.uid}/friends`);
    
    onChildAdded(friendsRef, (snapshot) => {
        const friendData = snapshot.val();
        if (!friendData) return;

        const friendPhone = friendData.phone;

        get(ref(db, `users`)).then(userSnapshot => {
            if (userSnapshot.exists()) {
                let friendName = friendPhone;

                userSnapshot.forEach(childSnapshot => {
                    const userData = childSnapshot.val();
                    if (userData.phone === friendPhone) {
                        friendName = userData.name || friendPhone;
                    }
                });

                const li = document.createElement("li");
                li.innerText = friendName;
                li.dataset.phone = friendPhone;
                li.addEventListener("click", () => openChat(friendPhone));
                userList.appendChild(li);
                
                console.log("Friend added to UI:", friendName);
            }
        });
    });
}


// ✅ Listen for Unknown Messages & Add to Chat List
function listenForIncomingMessages() {
    const chatRef = ref(db, `chats`);

    onChildAdded(chatRef, (snapshot) => {
        const chatRoomKey = snapshot.key;
        const [phone1, phone2] = chatRoomKey.split("_");

        let otherUserPhone = (phone1 === currentUser.phone) ? phone2 : phone1;
        if (phone1 !== currentUser.phone && phone2 !== currentUser.phone) return;

        if (!friendsList[otherUserPhone]) {
            get(ref(db, `users`)).then(snapshot => {
                if (snapshot.exists()) {
                    let friendName = otherUserPhone;
                    snapshot.forEach(childSnapshot => {
                        const userData = childSnapshot.val();
                        if (userData.phone === otherUserPhone) {
                            friendName = userData.name || otherUserPhone;
                        }
                    });

                    const li = document.createElement("li");
                    li.innerText = friendName;
                    li.dataset.phone = otherUserPhone;
                    li.addEventListener("click", () => openChat(otherUserPhone));
                    userList.appendChild(li);

                    console.log("Added unknown user to chat list:", friendName);
                }
            });
        }
    });
}


document.addEventListener("click", (event) => {
    if (event.target.classList.contains("menu-btn")) {
        menuDropdown.style.display = menuDropdown.style.display === "block" ? "none" : "block";
    } else if (!menuDropdown.contains(event.target)) {
        menuDropdown.style.display = "none";
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const menuBtn = document.getElementById("menu-btn");
    const sidebar = document.getElementById("sidebar");

    menuBtn.addEventListener("click", function () {
        sidebar.classList.toggle("active");
    });
});
const logoutBtn = document.getElementById("logout-btn");

logoutBtn.addEventListener("click", () => {
    auth.signOut()
        .then(() => {
            console.log("User logged out successfully");
            window.location.href = "index.html"; // Redirect to login page
        })
        .catch(error => {
            console.error("Error logging out:", error);
        });
});


document.addEventListener("DOMContentLoaded", function () {
    const addFriendBtn = document.getElementById("add-friend-btn");

    addFriendBtn.addEventListener("click", function () {
        const friendPhoneInput = document.getElementById("friend-number");
        const friendPhone = friendPhoneInput.value.trim();

        if (!friendPhone) {
            alert("Please enter a phone number!");
            return;
        }

        if (!auth.currentUser) {
            alert("You need to log in first!");
            return;
        }

        const currentUserUID = auth.currentUser.uid;
        const userRef = ref(db, `users/${currentUserUID}/friends/${friendPhone}`);

        // ✅ Check if friend exists in database
        get(ref(db, `users`)).then(snapshot => {
            let friendExists = false;
            let friendUID = null;

            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const userData = childSnapshot.val();
                    if (userData.phone === friendPhone) {
                        friendExists = true;
                        friendUID = childSnapshot.key;
                    }
                });

                if (!friendExists) {
                    alert("User not found! Please enter a valid phone number.");
                    return;
                }

                // ✅ Add friend to current user's friend list
                set(userRef, { phone: friendPhone, uid: friendUID })
                    .then(() => {
                        console.log(`Friend ${friendPhone} added successfully.`);
                        alert("Friend added successfully!");
                        friendPhoneInput.value = "";

                        // ✅ Auto-update UI (no need to refresh)
                        loadFriends();
                    })
                    .catch(error => console.error("Error adding friend:", error));

                // ✅ Add current user in friend's friend list
                const friendRef = ref(db, `users/${friendUID}/friends/${auth.currentUser.phone}`);
                set(friendRef, { phone: auth.currentUser.phone, uid: currentUserUID })
                    .then(() => console.log(`Added mutual friendship with ${friendPhone}`))
                    .catch(error => console.error("Error adding mutual friend:", error));
            } else {
                alert("User not found in database!");
            }
        });
    });
});
