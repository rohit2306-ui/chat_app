import { auth, db } from "./firebase-config.js";
import { ref, set, get, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const userList = document.getElementById("users-list");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

let currentUser = null;
let selectedChatUser = null;
let friendsList = {}; // ✅ Store friends for quick lookup

// ✅ Authentication Check
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        console.log("Logged in as:", user.uid);

        // ✅ Fetch user details
        get(ref(db, `users/${currentUser.uid}`)).then(snapshot => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                currentUser.phone = userData.phone;
                document.getElementById("current-user-name").innerText = userData.name || "User";
                console.log("User Name Loaded:", userData.name);

                loadFriends(); // ✅ Load Friends List
                listenForIncomingMessages(); // ✅ Listen for new messages from unknown users
            } else {
                console.error("User data not found");
            }
        });

    } else {
        window.location.href = "login.html";
    }
});

// ✅ Send Message
sendBtn.addEventListener("click", () => {
    if (!selectedChatUser) {
        alert("Select a friend to chat!");
        return;
    }

    const message = messageInput.value.trim();
    if (message === "") return;

    const chatKey = getChatKey(currentUser.phone, selectedChatUser);
    const messageData = {
        sender: currentUser.phone,
        text: message,
        timestamp: Date.now()
    };

    // ✅ Store Message in Firebase
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

// ✅ Open Chat & Fetch Messages
function openChat(phone, name) {
    selectedChatUser = phone;
    document.getElementById("chat-user-name").innerText = `${name}`;
    messagesDiv.innerHTML = "";

    const chatKey = getChatKey(currentUser.phone, selectedChatUser);
    const chatRef = ref(db, `chats/${chatKey}`);

    console.log(`Listening to chat: ${chatKey}`);

    messagesDiv.innerHTML = "";

    // ✅ Real-time message fetching
    onChildAdded(chatRef, (snapshot) => {
        const message = snapshot.val();
        displayMessage(message);
    });
}

// ✅ Generate Unique Chat Key
function getChatKey(phone1, phone2) {
    return phone1 < phone2 ? `${phone1}_${phone2}` : `${phone2}_${phone1}`;
}

// ✅ Display Messages in Chat UI
function displayMessage(message) {
    const div = document.createElement("div");
    div.innerText = message.text;
    div.classList.add("message");

    if (message.sender === currentUser.phone) {
        div.classList.add("sent");
    } else {
        div.classList.add("received");
    }

    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // ✅ Auto-scroll
}

// ✅ Load Friends List & Store in `friendsList`
function loadFriends() {
    get(ref(db, `users/${currentUser.uid}/friends`)).then(snapshot => {
        if (snapshot.exists()) {
            userList.innerHTML = "";
            friendsList = snapshot.val(); // ✅ Store friends for lookup

            Object.keys(friendsList).forEach(friendId => {
                const li = document.createElement("li");
                li.innerText = friendsList[friendId].name;
                li.dataset.phone = friendsList[friendId].phone;
                li.addEventListener("click", () => openChat(friendsList[friendId].phone, friendsList[friendId].name));
                userList.appendChild(li);
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
