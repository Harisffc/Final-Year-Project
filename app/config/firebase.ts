import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAwvPOnnvxHrelkEeERgstlZmDP-8syzAc",
  authDomain: "sustainapp10.firebaseapp.com",
  projectId: "sustainapp10",
  storageBucket: "sustainapp10.firebasestorage.app",
  messagingSenderId: "746538084391",
  appId: "1:746538084391:web:49b0cf3139db5cb08e0602",
  measurementId: "G-J1YJ64LHRR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db, analytics }; 