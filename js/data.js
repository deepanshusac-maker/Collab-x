// js/data.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
    getFirestore, collection, addDoc, getDocs, doc, updateDoc, increment, 
    query, where 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- CONFIGURATION ---
// 🔴 Set this to 'true' when you are ready to restrict to NIT Patna emails only.
// 🟢 Set this to 'false' for testing with personal Gmails.
const ENFORCE_NITP_EMAIL = true; 

const firebaseConfig = {
  apiKey: "AIzaSyCp874kPRZJ7Kp5_zvaSU5QbvLLIUxaG9c",
  authDomain: "collab-x-startup.firebaseapp.com",
  projectId: "collab-x-startup",
  storageBucket: "collab-x-startup.firebasestorage.app",
  messagingSenderId: "1073438604450",
  appId: "1:1073438604450:web:6f97db4b6909d332ee6bfb",
  measurementId: "G-E07PSVJW3L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const ideasCollection = collection(db, "ideas");

const HackMateData = {
    // --- AUTHENTICATION ---
    
    // 1. Login with Popup
    login: async function() {
        const provider = new GoogleAuthProvider();
        try {
            console.log("Attempting login...");
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // THE GATEKEEPER 🔒
            if (ENFORCE_NITP_EMAIL && !user.email.endsWith('@nitp.ac.in')) {
                console.warn("Restricted email detected:", user.email);
                // If not NITP, log them out immediately
                await signOut(auth);
                throw new Error("Access Restricted: Please use your @nitp.ac.in email.");
            }
            
            console.log("Login success:", user.email);
            return user;
        } catch (error) {
            console.error("Login Error in data.js:", error.message);
            throw error;
        }
    },

    // 2. Logout
    logout: async function() {
        await signOut(auth);
        window.location.reload(); 
    },

    // 3. Check Current User (Observer)
    onUserChange: function(callback) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // If we are enforcing domain, check it again here
                if (ENFORCE_NITP_EMAIL && !user.email.endsWith('@nitp.ac.in')) {
                    console.log("User has invalid domain. Forcing logout.");
                    signOut(auth); // Kick them out
                    callback(null);
                } else {
                    // Valid user
                    callback(user);
                }
            } else {
                // No user logged in
                callback(null);
            }
        });
    },

    // --- DATA FUNCTIONS ---

    getAllIdeas: async function() {
        try {
            const querySnapshot = await getDocs(ideasCollection);
            let ideas = [];
            querySnapshot.forEach((doc) => {
                ideas.push({ id: doc.id, ...doc.data() });
            });
            return ideas;
        } catch (error) {
            console.error("Error fetching ideas:", error);
            return [];
        }
    },

    addIdea: async function(ideaData) {
        if (!auth.currentUser) throw new Error("Must be logged in to post");
        
        try {
            const docRef = await addDoc(ideasCollection, {
                ...ideaData,
                authorEmail: auth.currentUser.email,
                interested: 0,
                createdAt: new Date().toISOString()
            });
            return docRef.id;
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    },

    filterBySkill: async function(skill) {
        try {
            if (skill === 'all') return await this.getAllIdeas();
            const q = query(ideasCollection, where("skills", "array-contains", skill));
            const querySnapshot = await getDocs(q);
            let filteredIdeas = [];
            querySnapshot.forEach((doc) => {
                filteredIdeas.push({ id: doc.id, ...doc.data() });
            });
            return filteredIdeas;
        } catch (error) {
            console.error("Error filtering ideas:", error);
            return [];
        }
    },

    incrementInterested: async function(ideaId) {
        const ideaRef = doc(db, "ideas", ideaId);
        await updateDoc(ideaRef, { interested: increment(1) });
        return true; 
    },

    getIdeaById: async function(ideaId) {
        const all = await this.getAllIdeas();
        return all.find(i => i.id === ideaId);
    }
};

// Make it global so other scripts can see it
window.HackMateData = HackMateData;