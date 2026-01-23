// js/data.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    increment, 
    query, 
    where,
    setDoc,  // Essential for User Profiles
    getDoc   // Essential for checking if user exists
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
    
    login: async function() {
        const provider = new GoogleAuthProvider();
        try {
            console.log("Attempting login...");
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // 1. Domain Check
            if (ENFORCE_NITP_EMAIL && !user.email.endsWith('@nitp.ac.in')) {
                console.warn("Restricted email detected:", user.email);
                await signOut(auth);
                throw new Error("Access Restricted: Please use your @nitp.ac.in email.");
            }
            
            // 2. Profile Creation Logic (The Startup Upgrade)
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Create new profile for first-time login
                await setDoc(userRef, { 
                    uid: user.uid,
                    name: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    bio: "Ready to hack!",
                    skills: [],
                    github: "",
                    linkedin: "",
                    createdAt: new Date().toISOString()
                });
                console.log("New user profile created in Firestore.");
            } else {
                console.log("Existing user logged in.");
            }
            
            return user;
        } catch (error) {
            console.error("Login Error in data.js:", error.message);
            throw error;
        }
    },

    // Retrieve User Profile
    getUserProfile: async function(uid) {
        if (!uid) return null;
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);
        return snap.exists() ? snap.data() : null;
    },

    // Update User Profile
    updateUserProfile: async function(uid, data) {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, data); 
    },

    logout: async function() {
        await signOut(auth);
        window.location.reload(); 
    },

    // Check Current User (Observer)
    onUserChange: function(callback) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Double-check domain on refresh
                if (ENFORCE_NITP_EMAIL && !user.email.endsWith('@nitp.ac.in')) {
                    console.log("User has invalid domain. Forcing logout.");
                    signOut(auth);
                    callback(null);
                } else {
                    callback(user);
                }
            } else {
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
                authorUid: auth.currentUser.uid, // <--- Required for Security Rules
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
    },

    // --- REQUEST SYSTEM (NEW) ---

    // 1. Send a Request to Join
    sendJoinRequest: async function(ideaId, ownerUid) {
        if (!auth.currentUser) throw new Error("Must be logged in");
        
        // Prevent requesting your own project
        if (auth.currentUser.uid === ownerUid) {
            throw new Error("You cannot join your own project.");
        }

        const requestsRef = collection(db, "requests");
        
        // Check if request already exists (Prevent duplicate spam)
        const q = query(
            requestsRef, 
            where("ideaId", "==", ideaId),
            where("requesterUid", "==", auth.currentUser.uid)
        );
        const existing = await getDocs(q);
        if (!existing.empty) {
            throw new Error("You have already requested to join this team.");
        }

        // Create the request
        await addDoc(requestsRef, {
            ideaId: ideaId,
            ownerUid: ownerUid,
            requesterUid: auth.currentUser.uid,
            requesterName: auth.currentUser.displayName || "Anonymous",
            requesterEmail: auth.currentUser.email, // Contact info for the owner
            status: "pending", // pending | accepted | rejected
            timestamp: new Date().toISOString()
        });
    },

    // 2. Check if I already requested (for UI styling)
    checkRequestStatus: async function(ideaId) {
        if (!auth.currentUser) return null;
        
        const q = query(
            collection(db, "requests"), 
            where("ideaId", "==", ideaId),
            where("requesterUid", "==", auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        
        // Return the status of the first request found
        return snapshot.docs[0].data().status; 
    }
};

// Make it global so other scripts can see it
window.HackMateData = HackMateData;