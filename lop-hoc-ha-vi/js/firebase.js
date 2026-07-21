
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDbCF0pFsdXqD14Y-wjWLFoNCGfP1LBlD8",
  authDomain: "tienganhhavi-12b54.firebaseapp.com",
  projectId: "tienganhhavi-12b54",
  storageBucket: "tienganhhavi-12b54.firebasestorage.app",
  messagingSenderId: "208059039650",
  appId: "1:208059039650:web:d272318418e01d0f50fcfb",
  measurementId: "G-XPHJWRWSLZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
