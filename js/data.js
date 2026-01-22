// js/data.js
// We use full URLs so this works in the browser without a bundler
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
    getFirestore, collection, addDoc, getDocs, doc, updateDoc, increment 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// YOUR SPECIFIC CONFIGURATION
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
const analytics = getAnalytics(app); // Analytics is now active!
const db = getFirestore(app);
const ideasCollection = collection(db, "ideas");

const HackMateData = {
    // 1. GET ALL IDEAS (Async)
    getAllIdeas: async function() {
        try {
            const querySnapshot = await getDocs(ideasCollection);
            let ideas = [];
            querySnapshot.forEach((doc) => {
                ideas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return ideas;
        } catch (error) {
            console.error("Error fetching ideas:", error);
            // Fallback for empty state or network error
            return [];
        }
    },

    // 2. ADD IDEA (Async)
    addIdea: async function(ideaData) {
        try {
            const docRef = await addDoc(ideasCollection, {
                title: ideaData.title,
                description: ideaData.description,
                skills: ideaData.skills,
                teamSize: ideaData.teamSize,
                contact: ideaData.contact,
                interested: 0,
                // Add timestamp so we can sort by newest later
                createdAt: new Date().toISOString()
            });
            console.log("Idea posted with ID: ", docRef.id);
            return docRef.id;
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e; // Let the form handle the error
        }
    },

    // 3. FILTER BY SKILL
    filterBySkill: async function(skill) {
        // Efficiency: We fetch all and filter in memory to save "Read" quotas
        const allIdeas = await this.getAllIdeas();
        if (skill === 'all') {
            return allIdeas;
        }
        return allIdeas.filter(idea => idea.skills.includes(skill));
    },

    // 4. INCREMENT INTEREST
    incrementInterested: async function(ideaId) {
        const ideaRef = doc(db, "ideas", ideaId);
        await updateDoc(ideaRef, {
            interested: increment(1)
        });
        return true; 
    },

    // 5. GET SINGLE IDEA
    getIdeaById: async function(ideaId) {
        // In a larger app, we would fetch just one doc. 
        // For now, re-using getAllIdeas is simpler for your code structure.
        const all = await this.getAllIdeas();
        return all.find(i => i.id === ideaId);
    }
};

// Export globally so other scripts can use it
window.HackMateData = HackMateData;