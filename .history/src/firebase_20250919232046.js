// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBthp72Gfy30LBs4yCqNK94SDe8lWJBD9c",
  authDomain: "mytodoapp-35776.firebaseapp.com",
  projectId: "mytodoapp-35776",
  storageBucket: "mytodoapp-35776.firebasestorage.app",
  messagingSenderId: "853167411582",
  appId: "1:853167411582:web:6827989d0a932aca52e32f",
  measurementId: "G-PVTCXNGP1S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);