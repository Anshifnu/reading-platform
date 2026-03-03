importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyCH36ruv5K39PjQihSPpZZv_7wzzIUhiE0",
  authDomain: "booksphere-68fad.firebaseapp.com",
  projectId: "booksphere-68fad",
  storageBucket: "booksphere-68fad.firebasestorage.app",
  messagingSenderId: "47478402774",
  appId: "1:47478402774:web:8d33fdc05111b52a0c2377",
  measurementId: "G-ML4VGGT39Y"
});

const messaging = firebase.messaging();