// // Import Firebase modules
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// // Firebase configuration
// const firebaseConfig = {
//     apiKey: "AIzaSyCOE1uN3NEOM2eXwQePUmGKaxZTmlg1Flc",
//     authDomain: "chatapplication2306.firebaseapp.com",
//     projectId: "chatapplication2306",
//     storageBucket: "chatapplication2306.appspot.com",
//     messagingSenderId: "10028032035",
//     appId: "1:10028032035:web:2ed16a3b36d531738c1196",
//     measurementId: "G-240Q4FYFGN",
//     databaseURL: "https://chatapplication2306-default-rtdb.firebaseio.com/" // ✅ Add this line
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getDatabase(app);

// // ✅ Export app, auth, and db
// export { app, auth, db };


// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCOE1uN3NEOM2eXwQePUmGKaxZTmlg1Flc",
    authDomain: "chatapplication2306.firebaseapp.com",
    projectId: "chatapplication2306",
    storageBucket: "chatapplication2306.appspot.com",
    messagingSenderId: "10028032035",
    appId: "1:10028032035:web:2ed16a3b36d531738c1196",
    measurementId: "G-240Q4FYFGN",
    databaseURL: "https://chatapplication2306-default-rtdb.firebaseio.com/" // ✅ Add this line
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

export { app, auth, db, provider };
