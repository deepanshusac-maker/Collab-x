// explore.js - Updated for Firebase

document.addEventListener('DOMContentLoaded', function() {
    
    // Get DOM elements
    const ideasContainer = document.getElementById('ideas-container');
    const skillFilter = document.getElementById('skill-filter');
    const noIdeasMessage = document.getElementById('no-ideas-message');
    const contactModal = document.getElementById('contact-modal');
    const modalContactInfo = document.getElementById('modal-contact-info');
    const closeModalButton = document.getElementById('close-modal');
    
    // Ensure modal is hidden on page load
    if (contactModal) {
        contactModal.classList.add('hidden');
    }
    
    // Load and display all ideas initially
    displayIdeas('all');
    
    // Filter change handler
    skillFilter.addEventListener('change', function() {
        const selectedSkill = this.value;
        displayIdeas(selectedSkill);
    });
    
    // Close modal handlers
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }
    
    if (contactModal) {
        contactModal.addEventListener('click', function(event) {
            if (event.target === contactModal) {
                closeModal();
            }
        });
    }
    
    // --- ASYNC UPDATE STARTS HERE ---
    
    // Function to display ideas
    async function displayIdeas(filterSkill) {
        // Optional: Add a loading state here
        ideasContainer.innerHTML = '<p style="text-align:center; color:#b0b0b0; grid-column: 1/-1;">Loading ideas from cloud...</p>';

        // WE USE AWAIT HERE BECAUSE FIREBASE IS ASYNC
        const ideas = await HackMateData.filterBySkill(filterSkill);
        
        // Clear container
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
        
        // Create idea cards
        ideas.forEach(function(idea) {
            const ideaCard = createIdeaCard(idea);
            ideasContainer.appendChild(ideaCard);
        });
    }
    
    // Function to create an idea card
    function createIdeaCard(idea) {
        const card = document.createElement('div');
        card.className = 'idea-card';
        
        // Create skills badges HTML
        const skillsBadgesHTML = idea.skills.map(function(skill) {
            const skillClass = 'skill-' + skill.toLowerCase();
            return '<span class="skill-badge ' + skillClass + '">' + skill + '</span>';
        }).join('');
        
        // Build card HTML using safe text insertion is better, but this template literal is fine for MVP
        card.innerHTML = `
            <div class="idea-card-header">
                <h3 class="idea-title">${idea.title}</h3>
            </div>
            <p class="idea-description">${idea.description}</p>
            <div class="idea-skills">
                ${skillsBadgesHTML}
            </div>
            <div class="idea-info">
                <span class="team-size-info">
                    <span>👥</span>
                    <span>Team: ${idea.teamSize}</span>
                </span>
                <span class="interest-count">
                    <span>🔥</span>
                    <span id="interest-count-${idea.id}">${idea.interested}</span>
                </span>
            </div>
            <button class="join-button" data-idea-id="${idea.id}">
                Join Team
            </button>
        `;
        
        const joinButton = card.querySelector('.join-button');
        joinButton.addEventListener('click', function() {
            handleJoinTeam(idea.id);
        });
        
        return card;
    }
    
    // Async Handler for Joining
    async function handleJoinTeam(ideaId) {
        // 1. Get idea details (Await)
        const idea = await HackMateData.getIdeaById(ideaId);
        
        if (idea) {
            // 2. Increment in Database (Await)
            await HackMateData.incrementInterested(ideaId);
            
            // 3. Update UI immediately (Optimistic UI)
            const countElement = document.getElementById('interest-count-' + ideaId);
            if (countElement) {
                // If the element exists, parse current, add 1
                let current = parseInt(countElement.textContent) || 0;
                countElement.textContent = current + 1;
                countElement.style.color = '#f093fb';
                setTimeout(function() {
                    countElement.style.color = '';
                }, 500);
            }
                     
            showContactModal(idea.contact);
        }
    }
    
    function showContactModal(contact) {
        if (modalContactInfo && contactModal) {
            modalContactInfo.textContent = contact;
            contactModal.classList.remove('hidden');           
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeModal() {
        if (contactModal) {
            contactModal.classList.add('hidden');           
            document.body.style.overflow = '';
        }
    }
       
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
});