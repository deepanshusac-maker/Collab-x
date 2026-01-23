// js/data.js - Enhanced with Team Join Request System
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
    getFirestore, collection, addDoc, getDocs, doc, updateDoc, increment, 
    query, where, orderBy, deleteDoc, arrayUnion, arrayRemove, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- CONFIGURATION ---
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
const joinRequestsCollection = collection(db, "joinRequests");

const HackMateData = {
    // --- AUTHENTICATION ---
    
    login: async function() {
        const provider = new GoogleAuthProvider();
        try {
            console.log("Attempting login...");
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            if (ENFORCE_NITP_EMAIL && !user.email.endsWith('@nitp.ac.in')) {
                console.warn("Restricted email detected:", user.email);
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

    logout: async function() {
        await signOut(auth);
        window.location.reload(); 
    },

    onUserChange: function(callback) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
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

    // --- IDEA MANAGEMENT ---

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
                teamMembers: [auth.currentUser.email], // Owner is first member
                maxTeamSize: parseInt(ideaData.teamSize),
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
        try {
            const ideaRef = doc(db, "ideas", ideaId);
            const ideaDoc = await getDoc(ideaRef);
            if (ideaDoc.exists()) {
                return { id: ideaDoc.id, ...ideaDoc.data() };
            }
            return null;
        } catch (error) {
            console.error("Error fetching idea:", error);
            return null;
        }
    },

    // --- JOIN REQUEST SYSTEM ---

    // Send a join request to team owner
    sendJoinRequest: async function(ideaId, message = "") {
        if (!auth.currentUser) throw new Error("Must be logged in to send request");
        
        try {
            const idea = await this.getIdeaById(ideaId);
            if (!idea) throw new Error("Idea not found");

            // Check if team is full
            if (idea.teamMembers && idea.teamMembers.length >= idea.maxTeamSize) {
                throw new Error("Team is already full");
            }

            // Check if already a member
            if (idea.teamMembers && idea.teamMembers.includes(auth.currentUser.email)) {
                throw new Error("You are already a team member");
            }

            // Check if request already exists
            const existingRequest = await this.getJoinRequest(ideaId, auth.currentUser.email);
            if (existingRequest) {
                throw new Error("You have already sent a request for this team");
            }

            // Create join request
            const requestData = {
                ideaId: ideaId,
                ideaTitle: idea.title,
                requesterEmail: auth.currentUser.email,
                requesterName: auth.currentUser.email.split('@')[0],
                ownerEmail: idea.authorEmail,
                message: message,
                status: "pending", // pending, approved, rejected
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(joinRequestsCollection, requestData);
            
            // Increment interested count
            await this.incrementInterested(ideaId);
            
            return { success: true, requestId: docRef.id };
        } catch (error) {
            console.error("Error sending join request:", error);
            throw error;
        }
    },

    // Get a specific join request
    getJoinRequest: async function(ideaId, requesterEmail) {
        try {
            const q = query(
                joinRequestsCollection, 
                where("ideaId", "==", ideaId),
                where("requesterEmail", "==", requesterEmail)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error("Error getting join request:", error);
            return null;
        }
    },

    // Get all join requests for ideas owned by current user
    getMyJoinRequests: async function() {
        if (!auth.currentUser) return [];
        
        try {
            const q = query(
                joinRequestsCollection,
                where("ownerEmail", "==", auth.currentUser.email),
                where("status", "==", "pending"),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            let requests = [];
            snapshot.forEach((doc) => {
                requests.push({ id: doc.id, ...doc.data() });
            });
            return requests;
        } catch (error) {
            console.error("Error fetching join requests:", error);
            return [];
        }
    },

    // Get join requests sent by current user
    getMySentRequests: async function() {
        if (!auth.currentUser) return [];
        
        try {
            const q = query(
                joinRequestsCollection,
                where("requesterEmail", "==", auth.currentUser.email),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            let requests = [];
            snapshot.forEach((doc) => {
                requests.push({ id: doc.id, ...doc.data() });
            });
            return requests;
        } catch (error) {
            console.error("Error fetching sent requests:", error);
            return [];
        }
    },

    // Approve a join request
    approveJoinRequest: async function(requestId) {
        if (!auth.currentUser) throw new Error("Must be logged in");
        
        try {
            // Get request details
            const requestRef = doc(db, "joinRequests", requestId);
            const requestDoc = await getDoc(requestRef);
            
            if (!requestDoc.exists()) throw new Error("Request not found");
            
            const requestData = requestDoc.data();
            
            // Verify current user is the owner
            if (requestData.ownerEmail !== auth.currentUser.email) {
                throw new Error("Only idea owner can approve requests");
            }

            // Get idea
            const idea = await this.getIdeaById(requestData.ideaId);
            if (!idea) throw new Error("Idea not found");

            // Check if team is full
            if (idea.teamMembers && idea.teamMembers.length >= idea.maxTeamSize) {
                throw new Error("Team is already full");
            }

            // Add requester to team members
            const ideaRef = doc(db, "ideas", requestData.ideaId);
            await updateDoc(ideaRef, {
                teamMembers: arrayUnion(requestData.requesterEmail)
            });

            // Update request status
            await updateDoc(requestRef, {
                status: "approved",
                approvedAt: new Date().toISOString()
            });

            return { success: true };
        } catch (error) {
            console.error("Error approving request:", error);
            throw error;
        }
    },

    // Reject a join request
    rejectJoinRequest: async function(requestId) {
        if (!auth.currentUser) throw new Error("Must be logged in");
        
        try {
            const requestRef = doc(db, "joinRequests", requestId);
            const requestDoc = await getDoc(requestRef);
            
            if (!requestDoc.exists()) throw new Error("Request not found");
            
            const requestData = requestDoc.data();
            
            // Verify current user is the owner
            if (requestData.ownerEmail !== auth.currentUser.email) {
                throw new Error("Only idea owner can reject requests");
            }

            // Update request status
            await updateDoc(requestRef, {
                status: "rejected",
                rejectedAt: new Date().toISOString()
            });

            return { success: true };
        } catch (error) {
            console.error("Error rejecting request:", error);
            throw error;
        }
    },

    // Remove member from team (owner only)
    removeMemberFromTeam: async function(ideaId, memberEmail) {
        if (!auth.currentUser) throw new Error("Must be logged in");
        
        try {
            const idea = await this.getIdeaById(ideaId);
            if (!idea) throw new Error("Idea not found");

            // Verify current user is the owner
            if (idea.authorEmail !== auth.currentUser.email) {
                throw new Error("Only idea owner can remove members");
            }

            // Cannot remove the owner
            if (memberEmail === idea.authorEmail) {
                throw new Error("Cannot remove the idea owner");
            }

            const ideaRef = doc(db, "ideas", ideaId);
            await updateDoc(ideaRef, {
                teamMembers: arrayRemove(memberEmail)
            });

            return { success: true };
        } catch (error) {
            console.error("Error removing member:", error);
            throw error;
        }
    },

    // Check if user has already sent a request
    hasUserSentRequest: async function(ideaId) {
        if (!auth.currentUser) return false;
        const request = await this.getJoinRequest(ideaId, auth.currentUser.email);
        return request !== null;
    },

    // Check if user is team member
    isUserTeamMember: async function(ideaId) {
        if (!auth.currentUser) return false;
        const idea = await this.getIdeaById(ideaId);
        return idea && idea.teamMembers && idea.teamMembers.includes(auth.currentUser.email);
    }
};

// Make it global
window.HackMateData = HackMateData;