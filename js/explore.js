// js/explore.js

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Get DOM elements
    const ideasContainer = document.getElementById('ideas-container');
    const skillFilter = document.getElementById('skill-filter');
    const noIdeasMessage = document.getElementById('no-ideas-message');
    
    // --- FIX 1: Wait for Auth before loading ideas ---
    // This ensures we know WHO the user is before we render the buttons
    HackMateData.onUserChange((user) => {
        const currentFilter = skillFilter ? skillFilter.value : 'all';
        displayIdeas(currentFilter);
    });
    
    // 3. Filter change handler
    if (skillFilter) {
        skillFilter.addEventListener('change', function() {
            const selectedSkill = this.value;
            displayIdeas(selectedSkill);
        });
    }
    
    // --- CORE FUNCTIONS ---
    
    // Function to display ideas (Async)
    async function displayIdeas(filterSkill) {
        // Clear container and show loading state
        ideasContainer.innerHTML = ''; 
        const loadingMsg = document.createElement('p');
        loadingMsg.style.textAlign = 'center';
        loadingMsg.style.color = '#b0b0b0';
        loadingMsg.style.gridColumn = '1/-1';
        loadingMsg.textContent = 'Loading ideas from cloud...';
        ideasContainer.appendChild(loadingMsg);

        // Fetch data from Firebase (via data.js global object)
        const ideas = await HackMateData.filterBySkill(filterSkill);
        
        // Clear loading message
        ideasContainer.innerHTML = '';
        
        // Check if there are ideas
        if (ideas.length === 0) {
            noIdeasMessage.classList.remove('hidden');
            ideasContainer.classList.add('hidden');
            return;
        } else {
            noIdeasMessage.classList.add('hidden');
            ideasContainer.classList.remove('hidden');
        }
        
        // Create and append idea cards using a loop that supports await
        for (const idea of ideas) {
            const ideaCard = await createIdeaCard(idea);
            ideasContainer.appendChild(ideaCard);
        }
    }
    
    // ASYNC Function to create an idea card
    async function createIdeaCard(idea) {
        // 1. Create the main card container
        const card = document.createElement('div');
        card.className = 'idea-card';
        
        // 2. Create Header & Title
        const headerDiv = document.createElement('div');
        headerDiv.className = 'idea-card-header';
        
        const title = document.createElement('h3');
        title.className = 'idea-title';
        title.textContent = idea.title; 
        
        headerDiv.appendChild(title);
        card.appendChild(headerDiv);
        
        // 3. Create Description
        const description = document.createElement('p');
        description.className = 'idea-description';
        description.textContent = idea.description; 
        card.appendChild(description);
        
        // 4. Create Skills Container
        const skillsContainer = document.createElement('div');
        skillsContainer.className = 'idea-skills';
        
        if (idea.skills && Array.isArray(idea.skills)) {
            idea.skills.forEach(skill => {
                const badge = document.createElement('span');
                badge.classList.add('skill-badge');
                badge.classList.add('skill-' + skill.toLowerCase());
                badge.textContent = skill;
                skillsContainer.appendChild(badge);
            });
        }
        card.appendChild(skillsContainer);
        
        // 5. Create Info Row
        const infoDiv = document.createElement('div');
        infoDiv.className = 'idea-info';
        
        // -- Team Size
        const teamSpan = document.createElement('span');
        teamSpan.className = 'team-size-info';
        teamSpan.innerHTML = `<span>👥</span> Team: ${idea.teamSize}`;
        
        // -- Interest Count
        const interestSpan = document.createElement('span');
        interestSpan.className = 'interest-count';
        interestSpan.innerHTML = `<span>🔥</span> <span id="interest-count-${idea.id}">${idea.interested}</span>`;
        
        infoDiv.appendChild(teamSpan);
        infoDiv.appendChild(interestSpan);
        card.appendChild(infoDiv);
        
        // 6. Create REQUEST Button (The Startup Logic)
        const joinButton = document.createElement('button');
        joinButton.className = 'join-button';
        joinButton.dataset.ideaId = idea.id;
        
        // Check Status: Have I already requested this?
        try {
            const myStatus = await HackMateData.checkRequestStatus(idea.id);
            
            if (myStatus === 'pending') {
                joinButton.textContent = 'Pending 🕒';
                joinButton.style.background = '#f59e0b'; // Orange
                joinButton.disabled = true;
            } else if (myStatus === 'accepted') {
                joinButton.textContent = 'Accepted! ✅';
                joinButton.style.background = '#22c55e'; // Green
                joinButton.disabled = true;
            } else {
                joinButton.textContent = 'Request to Join';
            }
        } catch (e) {
            joinButton.textContent = 'Request to Join';
        }

        // Attach Event Listener
        joinButton.addEventListener('click', function() {
            handleRequestJoin(idea, joinButton);
        });
        
        card.appendChild(joinButton);
        return card;
    }
    
    // NEW: Async Handler for Sending Requests
    async function handleRequestJoin(idea, buttonElement) {
        // 1. UI Loading State
        const originalText = buttonElement.textContent;
        buttonElement.textContent = "Sending... ⏳";
        buttonElement.disabled = true;

        try {
            // 2. Send Request via Data Layer
            await HackMateData.sendJoinRequest(idea.id, idea.authorUid);
            
            // 3. Success UI
            buttonElement.textContent = "Request Sent! ✅";
            buttonElement.style.background = "#22c55e"; 
            
            // Update interest count visually
            const countEl = document.getElementById(`interest-count-${idea.id}`);
            if(countEl) {
                let current = parseInt(countEl.textContent) || 0;
                countEl.textContent = current + 1;
                countEl.style.color = '#f093fb';
            }
            
            // Background update of interest count
            await HackMateData.incrementInterested(idea.id);

        } catch (error) {
            console.error(error);
            
            // 4. Handle Specific Errors
            if (error.message.includes("already requested")) {
                buttonElement.textContent = "Pending 🕒";
                buttonElement.style.background = "#f59e0b";
            } else if (error.message.includes("own project")) {
                buttonElement.textContent = "Your Project 👤";
                buttonElement.style.background = "#64748b"; 
            } else if (error.message.includes("Must be logged in")) {
                 alert("Please log in first!");
                 const loginOverlay = document.getElementById('login-overlay');
                 if(loginOverlay) loginOverlay.classList.remove('hidden');
                 buttonElement.textContent = originalText;
                 buttonElement.disabled = false;
            } else {
                alert("Error: " + error.message);
                buttonElement.textContent = originalText;
                buttonElement.disabled = false;
            }
        }
    }
});