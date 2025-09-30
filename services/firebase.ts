
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAMghujncGAU2U04aG7kEI2BSh2YmEJVKw",
    authDomain: "budapest-tennis-league-app.firebaseapp.com",
    projectId: "budapest-tennis-league-app",
    storageBucket: "budapest-tennis-league-app.firebasestorage.app",
    messagingSenderId: "1016266790911",
    appId: "1:1016266790911:web:d31cf354fb078cb566b9ca",
    measurementId: "G-GLPW7E7M4D"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
