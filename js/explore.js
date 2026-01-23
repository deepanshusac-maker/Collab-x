// js/explore.js - Enhanced with Join Request System

document.addEventListener('DOMContentLoaded', function() {
    
    // DOM elements
    const ideasContainer = document.getElementById('ideas-container');
    const skillFilter = document.getElementById('skill-filter');
    const noIdeasMessage = document.getElementById('no-ideas-message');
    const contactModal = document.getElementById('contact-modal');
    const modalContactInfo = document.getElementById('modal-contact-info');
    const closeModalButton = document.getElementById('close-modal');
    
    // Join Request Modal Elements
    const joinRequestModal = document.getElementById('join-request-modal');
    const closeJoinModal = document.getElementById('close-join-modal');
    const joinRequestForm = document.getElementById('join-request-form');
    const joinRequestMessage = document.getElementById('join-request-message');
    const joinIdeaTitle = document.getElementById('join-idea-title');
    
    let currentIdeaId = null;
    
    // Ensure modals are hidden on page load
    if (contactModal) contactModal.classList.add('hidden');
    if (joinRequestModal) joinRequestModal.classList.add('hidden');
    
    // Load ideas
    displayIdeas('all');
    
    // Filter change handler
    if (skillFilter) {
        skillFilter.addEventListener('change', function() {
            displayIdeas(this.value);
        });
    }
    
    // Contact Modal handlers
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeContactModal);
    }
    
    if (contactModal) {
        contactModal.addEventListener('click', function(event) {
            if (event.target === contactModal) closeContactModal();
        });
    }
    
    // Join Request Modal handlers
    if (closeJoinModal) {
        closeJoinModal.addEventListener('click', closeJoinRequestModal);
    }
    
    if (joinRequestModal) {
        joinRequestModal.addEventListener('click', function(event) {
            if (event.target === joinRequestModal) closeJoinRequestModal();
        });
    }
    
    // Join Request Form submission
    if (joinRequestForm) {
        joinRequestForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            await handleSendJoinRequest();
        });
    }
    
    // Keyboard handlers
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeContactModal();
            closeJoinRequestModal();
        }
    });
    
    // --- CORE FUNCTIONS ---
    
    async function displayIdeas(filterSkill) {
        ideasContainer.innerHTML = ''; 
        const loadingMsg = document.createElement('p');
        loadingMsg.style.textAlign = 'center';
        loadingMsg.style.color = '#b0b0b0';
        loadingMsg.style.gridColumn = '1/-1';
        loadingMsg.textContent = 'Loading ideas from cloud...';
        ideasContainer.appendChild(loadingMsg);

        const ideas = await HackMateData.filterBySkill(filterSkill);
        ideasContainer.innerHTML = '';
        
        if (ideas.length === 0) {
            noIdeasMessage.classList.remove('hidden');
            ideasContainer.classList.add('hidden');
            return;
        } else {
            noIdeasMessage.classList.add('hidden');
            ideasContainer.classList.remove('hidden');
        }
        
        ideas.forEach(function(idea) {
            const ideaCard = createIdeaCard(idea);
            ideasContainer.appendChild(ideaCard);
        });
    }
    
    function createIdeaCard(idea) {
        const card = document.createElement('div');
        card.className = 'idea-card';
        
        // Header & Title
        const headerDiv = document.createElement('div');
        headerDiv.className = 'idea-card-header';
        
        const title = document.createElement('h3');
        title.className = 'idea-title';
        title.textContent = idea.title;
        
        headerDiv.appendChild(title);
        card.appendChild(headerDiv);
        
        // Description
        const description = document.createElement('p');
        description.className = 'idea-description';
        description.textContent = idea.description;
        card.appendChild(description);
        
        // Skills Container
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
        
        // Info Row
        const infoDiv = document.createElement('div');
        infoDiv.className = 'idea-info';
        
        // Team Size Section with Progress
        const teamSpan = document.createElement('span');
        teamSpan.className = 'team-size-info';
        
        const teamIcon = document.createElement('span');
        teamIcon.textContent = '👥 ';
        
        const currentMembers = idea.teamMembers ? idea.teamMembers.length : 1;
        const maxMembers = idea.maxTeamSize || idea.teamSize;
        
        const teamText = document.createElement('span');
        teamText.textContent = `${currentMembers}/${maxMembers}`;
        
        // Add visual indicator if team is full
        if (currentMembers >= maxMembers) {
            teamText.style.color = '#ff6b6b';
            teamText.style.fontWeight = 'bold';
        }
        
        teamSpan.appendChild(teamIcon);
        teamSpan.appendChild(teamText);
        
        // Interest Count
        const interestSpan = document.createElement('span');
        interestSpan.className = 'interest-count';
        
        const fireIcon = document.createElement('span');
        fireIcon.textContent = '🔥 ';
        
        const countNumber = document.createElement('span');
        countNumber.id = `interest-count-${idea.id}`;
        countNumber.textContent = idea.interested || 0;
        
        interestSpan.appendChild(fireIcon);
        interestSpan.appendChild(countNumber);
        
        infoDiv.appendChild(teamSpan);
        infoDiv.appendChild(interestSpan);
        card.appendChild(infoDiv);
        
        // Action Buttons Container
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'idea-actions';
        
        // Join/Request Button
        createActionButton(actionsContainer, idea);
        
        card.appendChild(actionsContainer);
        
        return card;
    }
    
    async function createActionButton(container, idea) {
        const currentUser = HackMateData.auth?.currentUser;
        if (!currentUser) return;
        
        const currentMembers = idea.teamMembers ? idea.teamMembers.length : 1;
        const maxMembers = idea.maxTeamSize || idea.teamSize;
        const isOwner = idea.authorEmail === currentUser.email;
        const isMember = idea.teamMembers && idea.teamMembers.includes(currentUser.email);
        const isFull = currentMembers >= maxMembers;
        
        // Check if user has sent a request
        const hasRequest = await HackMateData.hasUserSentRequest(idea.id);
        
        if (isOwner) {
            // Owner sees "View Team" button
            const viewTeamBtn = document.createElement('button');
            viewTeamBtn.className = 'join-button owner-btn';
            viewTeamBtn.textContent = '👑 Your Idea - Manage Team';
            viewTeamBtn.addEventListener('click', () => {
                window.location.href = `my-ideas.html?id=${idea.id}`;
            });
            container.appendChild(viewTeamBtn);
            
        } else if (isMember) {
            // Already a team member
            const memberBtn = document.createElement('button');
            memberBtn.className = 'join-button member-btn';
            memberBtn.textContent = '✅ Team Member';
            memberBtn.disabled = true;
            container.appendChild(memberBtn);
            
            // View Contact button
            const contactBtn = document.createElement('button');
            contactBtn.className = 'contact-button';
            contactBtn.textContent = '📧 View Contact';
            contactBtn.addEventListener('click', () => {
                showContactModal(idea.contact);
            });
            container.appendChild(contactBtn);
            
        } else if (hasRequest) {
            // Request already sent
            const requestRef = await HackMateData.getJoinRequest(idea.id, currentUser.email);
            const statusBtn = document.createElement('button');
            statusBtn.className = 'join-button';
            
            if (requestRef.status === 'pending') {
                statusBtn.classList.add('pending-btn');
                statusBtn.textContent = '⏳ Request Pending';
                statusBtn.disabled = true;
            } else if (requestRef.status === 'rejected') {
                statusBtn.classList.add('rejected-btn');
                statusBtn.textContent = '❌ Request Rejected';
                statusBtn.disabled = true;
            }
            container.appendChild(statusBtn);
            
        } else if (isFull) {
            // Team is full
            const fullBtn = document.createElement('button');
            fullBtn.className = 'join-button full-btn';
            fullBtn.textContent = '🚫 Team Full';
            fullBtn.disabled = true;
            container.appendChild(fullBtn);
            
        } else {
            // Can send join request
            const joinBtn = document.createElement('button');
            joinBtn.className = 'join-button';
            joinBtn.textContent = '🚀 Request to Join';
            joinBtn.addEventListener('click', () => {
                openJoinRequestModal(idea);
            });
            container.appendChild(joinBtn);
        }
    }
    
    function openJoinRequestModal(idea) {
        currentIdeaId = idea.id;
        if (joinIdeaTitle) {
            joinIdeaTitle.textContent = idea.title;
        }
        if (joinRequestMessage) {
            joinRequestMessage.value = '';
        }
        if (joinRequestModal) {
            joinRequestModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeJoinRequestModal() {
        if (joinRequestModal) {
            joinRequestModal.classList.add('hidden');
            document.body.style.overflow = '';
        }
        currentIdeaId = null;
    }
    
    async function handleSendJoinRequest() {
        if (!currentIdeaId) return;
        
        const message = joinRequestMessage.value.trim();
        const submitBtn = joinRequestForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            await HackMateData.sendJoinRequest(currentIdeaId, message);
            
            // Show success
            alert('✅ Join request sent successfully! The idea owner will review your request.');
            
            closeJoinRequestModal();
            
            // Refresh the ideas display
            const filterSkill = skillFilter ? skillFilter.value : 'all';
            displayIdeas(filterSkill);
            
        } catch (error) {
            console.error('Error sending join request:', error);
            alert('❌ ' + error.message);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    function showContactModal(contact) {
        if (modalContactInfo && contactModal) {
            modalContactInfo.textContent = contact;
            contactModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeContactModal() {
        if (contactModal) {
            contactModal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
});