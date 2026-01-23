

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Get DOM elements
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
    
    // 2. Load and display all ideas initially
    displayIdeas('all');
    
    // 3. Filter change handler
    if (skillFilter) {
        skillFilter.addEventListener('change', function() {
            const selectedSkill = this.value;
            displayIdeas(selectedSkill);
        });
    }
    
    // 4. Close modal handlers
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
        
        // Create and append idea cards
        ideas.forEach(function(idea) {
            const ideaCard = createIdeaCard(idea);
            ideasContainer.appendChild(ideaCard);
        });
    }
    
    // SECURE Function to create an idea card (Replaced innerHTML with DOM methods)
    function createIdeaCard(idea) {
        // 1. Create the main card container
        const card = document.createElement('div');
        card.className = 'idea-card';
        
        // 2. Create Header & Title
        const headerDiv = document.createElement('div');
        headerDiv.className = 'idea-card-header';
        
        const title = document.createElement('h3');
        title.className = 'idea-title';
        title.textContent = idea.title; // SECURITY: Sanitizes input
        
        headerDiv.appendChild(title);
        card.appendChild(headerDiv);
        
        // 3. Create Description
        const description = document.createElement('p');
        description.className = 'idea-description';
        description.textContent = idea.description; // SECURITY: Sanitizes input
        card.appendChild(description);
        
        // 4. Create Skills Container
        const skillsContainer = document.createElement('div');
        skillsContainer.className = 'idea-skills';
        
        // Safely create badges for each skill
        if (idea.skills && Array.isArray(idea.skills)) {
            idea.skills.forEach(skill => {
                const badge = document.createElement('span');
                // Add base class and dynamic color class
                badge.classList.add('skill-badge');
                badge.classList.add('skill-' + skill.toLowerCase());
                badge.textContent = skill;
                skillsContainer.appendChild(badge);
            });
        }
        card.appendChild(skillsContainer);
        
        // 5. Create Info Row (Team Size & Interest)
        const infoDiv = document.createElement('div');
        infoDiv.className = 'idea-info';
        
        // -- Team Size Section
        const teamSpan = document.createElement('span');
        teamSpan.className = 'team-size-info';
        
        const teamIcon = document.createElement('span');
        teamIcon.textContent = '👥 '; 
        
        const teamText = document.createElement('span');
        teamText.textContent = `Team: ${idea.teamSize}`;
        
        teamSpan.appendChild(teamIcon);
        teamSpan.appendChild(teamText);
        
        // -- Interest Count Section
        const interestSpan = document.createElement('span');
        interestSpan.className = 'interest-count';
        
        const fireIcon = document.createElement('span');
        fireIcon.textContent = '🔥 ';
        
        const countNumber = document.createElement('span');
        countNumber.id = `interest-count-${idea.id}`;
        countNumber.textContent = idea.interested;
        
        interestSpan.appendChild(fireIcon);
        interestSpan.appendChild(countNumber);
        
        // Append both sections to infoDiv
        infoDiv.appendChild(teamSpan);
        infoDiv.appendChild(interestSpan);
        card.appendChild(infoDiv);
        
        // 6. Create Join Button
        const joinButton = document.createElement('button');
        joinButton.className = 'join-button';
        joinButton.dataset.ideaId = idea.id;
        joinButton.textContent = 'Join Team';
        
        // Attach Event Listener directly
        joinButton.addEventListener('click', function() {
            handleJoinTeam(idea.id);
        });
        
        card.appendChild(joinButton);
        
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
            // SECURITY: textContent is safe for emails/phones
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

