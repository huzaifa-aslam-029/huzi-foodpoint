import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, updateDoc, deleteDoc, where } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB_j7TFzGpeYbZk_YOrrbD8XtLL1cwAH18",
    authDomain: "e-commerce-6ba77.firebaseapp.com",
    projectId: "e-commerce-6ba77",
    storageBucket: "e-commerce-6ba77.firebasestorage.app",
    messagingSenderId: "130064601408",
    appId: "1:130064601408:web:eedabaea945162fde8aaa5",
    measurementId: "G-8CFSVVQP0P"
  };
  
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, db, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, updateDoc, deleteDoc, where };