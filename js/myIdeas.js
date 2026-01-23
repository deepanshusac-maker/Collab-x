// js/myIdeas.js - Manage join requests and team members

document.addEventListener('DOMContentLoaded', function() {
    
    const requestsContainer = document.getElementById('requests-container');
    const myIdeasContainer = document.getElementById('my-ideas-container');
    const sentRequestsContainer = document.getElementById('sent-requests-container');
    const requestsBadge = document.getElementById('requests-badge');
    
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
    
    // Load all data
    loadJoinRequests();
    loadMyIdeas();
    loadSentRequests();
    
    // --- LOAD JOIN REQUESTS ---
    async function loadJoinRequests() {
        requestsContainer.innerHTML = '<p style="text-align:center; color:#b0b0b0;">Loading requests...</p>';
        
        try {
            const requests = await HackMateData.getMyJoinRequests();
            
            // Update badge count
            if (requestsBadge) {
                requestsBadge.textContent = requests.length;
            }
            
            requestsContainer.innerHTML = '';
            
            if (requests.length === 0) {
                requestsContainer.innerHTML = `
                    <div class="no-requests">
                        <div class="empty-state-icon">📭</div>
                        <h3 style="color: #667eea; margin-bottom: 10px;">No Pending Requests</h3>
                        <p>When someone wants to join your team, their request will appear here.</p>
                    </div>
                `;
                return;
            }
            
            requests.forEach(request => {
                const requestCard = createRequestCard(request);
                requestsContainer.appendChild(requestCard);
            });
            
        } catch (error) {
            console.error('Error loading requests:', error);
            requestsContainer.innerHTML = '<p style="text-align:center; color:#ff6b6b;">Error loading requests</p>';
        }
    }
    
    function createRequestCard(request) {
        const card = document.createElement('div');
        card.className = 'request-card';
        card.id = `request-${request.id}`;
        
        // Header
        const header = document.createElement('div');
        header.className = 'request-header';
        
        const info = document.createElement('div');
        info.className = 'request-info';
        
        const ideaTitle = document.createElement('h3');
        ideaTitle.textContent = request.ideaTitle;
        
        const requesterName = document.createElement('div');
        requesterName.className = 'requester-name';
        requesterName.textContent = `From: ${request.requesterName}`;
        
        const requesterEmail = document.createElement('div');
        requesterEmail.className = 'requester-email';
        requesterEmail.textContent = request.requesterEmail;
        
        info.appendChild(ideaTitle);
        info.appendChild(requesterName);
        info.appendChild(requesterEmail);
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'request-time';
        timeDiv.textContent = formatTimeAgo(request.createdAt);
        
        header.appendChild(info);
        header.appendChild(timeDiv);
        card.appendChild(header);
        
        // Message
        if (request.message && request.message.trim()) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'request-message';
            messageDiv.textContent = `"${request.message}"`;
            card.appendChild(messageDiv);
        }
        
        // Actions
        const actions = document.createElement('div');
        actions.className = 'request-actions';
        
        const approveBtn = document.createElement('button');
        approveBtn.className = 'approve-btn';
        approveBtn.textContent = '✅ Approve';
        approveBtn.addEventListener('click', () => handleApprove(request.id));
        
        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'reject-btn';
        rejectBtn.textContent = '❌ Reject';
        rejectBtn.addEventListener('click', () => handleReject(request.id));
        
        actions.appendChild(approveBtn);
        actions.appendChild(rejectBtn);
        card.appendChild(actions);
        
        return card;
    }
    
    async function handleApprove(requestId) {
        if (!confirm('Are you sure you want to approve this request?')) return;
        
        try {
            await HackMateData.approveJoinRequest(requestId);
            alert('✅ Request approved! The user has been added to your team.');
            
            // Remove the card with animation
            const card = document.getElementById(`request-${requestId}`);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'translateX(100px)';
                setTimeout(() => {
                    loadJoinRequests();
                    loadMyIdeas(); // Refresh to show updated team
                }, 300);
            }
        } catch (error) {
            console.error('Error approving request:', error);
            alert('❌ ' + error.message);
        }
    }
    
    async function handleReject(requestId) {
        if (!confirm('Are you sure you want to reject this request?')) return;
        
        try {
            await HackMateData.rejectJoinRequest(requestId);
            alert('Request rejected.');
            
            // Remove the card
            const card = document.getElementById(`request-${requestId}`);
            if (card) {
                card.style.opacity = '0';
                setTimeout(() => loadJoinRequests(), 300);
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('❌ ' + error.message);
        }
    }
    
    // --- LOAD MY IDEAS ---
    async function loadMyIdeas() {
        myIdeasContainer.innerHTML = '<p style="text-align:center; color:#b0b0b0;">Loading your ideas...</p>';
        
        try {
            const allIdeas = await HackMateData.getAllIdeas();
            const currentUser = HackMateData.auth?.currentUser;
            
            if (!currentUser) return;
            
            const myIdeas = allIdeas.filter(idea => idea.authorEmail === currentUser.email);
            
            myIdeasContainer.innerHTML = '';
            
            if (myIdeas.length === 0) {
                myIdeasContainer.innerHTML = `
                    <div class="no-requests" style="grid-column: 1/-1;">
                        <div class="empty-state-icon">💡</div>
                        <h3 style="color: #667eea; margin-bottom: 10px;">No Ideas Posted Yet</h3>
                        <p>Share your hackathon vision! <a href="post.html" style="color: #667eea;">Post an idea</a></p>
                    </div>
                `;
                return;
            }
            
            myIdeas.forEach(idea => {
                const ideaCard = createMyIdeaCard(idea);
                myIdeasContainer.appendChild(ideaCard);
            });
            
        } catch (error) {
            console.error('Error loading my ideas:', error);
            myIdeasContainer.innerHTML = '<p style="text-align:center; color:#ff6b6b;">Error loading ideas</p>';
        }
    }
    
    function createMyIdeaCard(idea) {
        const card = document.createElement('div');
        card.className = 'idea-card';
        
        // Title
        const title = document.createElement('h3');
        title.className = 'idea-title';
        title.textContent = idea.title;
        card.appendChild(title);
        
        // Description
        const description = document.createElement('p');
        description.className = 'idea-description';
        description.textContent = idea.description;
        card.appendChild(description);
        
        // Skills
        const skillsContainer = document.createElement('div');
        skillsContainer.className = 'idea-skills';
        
        if (idea.skills) {
            idea.skills.forEach(skill => {
                const badge = document.createElement('span');
                badge.classList.add('skill-badge', `skill-${skill.toLowerCase()}`);
                badge.textContent = skill;
                skillsContainer.appendChild(badge);
            });
        }
        card.appendChild(skillsContainer);
        
        // Team Members Section
        const teamSection = document.createElement('div');
        teamSection.className = 'team-members-section';
        
        const teamTitle = document.createElement('div');
        teamTitle.className = 'team-members-title';
        const currentMembers = idea.teamMembers ? idea.teamMembers.length : 1;
        const maxMembers = idea.maxTeamSize || idea.teamSize;
        teamTitle.innerHTML = `<span>👥 Team Members (${currentMembers}/${maxMembers})</span>`;
        teamSection.appendChild(teamTitle);
        
        const membersList = document.createElement('div');
        membersList.className = 'members-list';
        
        if (idea.teamMembers && idea.teamMembers.length > 0) {
            idea.teamMembers.forEach(memberEmail => {
                const memberItem = document.createElement('div');
                memberItem.className = 'member-item';
                
                const emailSpan = document.createElement('span');
                emailSpan.className = 'member-email';
                emailSpan.textContent = memberEmail;
                
                memberItem.appendChild(emailSpan);
                
                if (memberEmail === idea.authorEmail) {
                    const ownerBadge = document.createElement('span');
                    ownerBadge.className = 'owner-badge';
                    ownerBadge.textContent = '👑 Owner';
                    memberItem.appendChild(ownerBadge);
                } else {
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-member-btn';
                    removeBtn.textContent = '❌ Remove';
                    removeBtn.addEventListener('click', () => handleRemoveMember(idea.id, memberEmail));
                    memberItem.appendChild(removeBtn);
                }
                
                membersList.appendChild(memberItem);
            });
        }
        
        teamSection.appendChild(membersList);
        card.appendChild(teamSection);
        
        return card;
    }
    
    async function handleRemoveMember(ideaId, memberEmail) {
        if (!confirm(`Remove ${memberEmail} from the team?`)) return;
        
        try {
            await HackMateData.removeMemberFromTeam(ideaId, memberEmail);
            alert('Member removed from team.');
            loadMyIdeas(); // Refresh
        } catch (error) {
            console.error('Error removing member:', error);
            alert('❌ ' + error.message);
        }
    }
    
    // --- LOAD SENT REQUESTS ---
    async function loadSentRequests() {
        sentRequestsContainer.innerHTML = '<p style="text-align:center; color:#b0b0b0;">Loading your requests...</p>';
        
        try {
            const requests = await HackMateData.getMySentRequests();
            
            sentRequestsContainer.innerHTML = '';
            
            if (requests.length === 0) {
                sentRequestsContainer.innerHTML = `
                    <div class="no-requests">
                        <div class="empty-state-icon">📤</div>
                        <h3 style="color: #667eea; margin-bottom: 10px;">No Requests Sent</h3>
                        <p>Browse ideas and send join requests to teams you'd like to join.</p>
                        <a href="explore.html" style="color: #667eea; text-decoration: underline;">Explore Ideas</a>
                    </div>
                `;
                return;
            }
            
            requests.forEach(request => {
                const requestCard = createSentRequestCard(request);
                sentRequestsContainer.appendChild(requestCard);
            });
            
        } catch (error) {
            console.error('Error loading sent requests:', error);
            sentRequestsContainer.innerHTML = '<p style="text-align:center; color:#ff6b6b;">Error loading requests</p>';
        }
    }
    
    function createSentRequestCard(request) {
        const card = document.createElement('div');
        card.className = 'request-card';
        
        // Header
        const header = document.createElement('div');
        header.className = 'request-header';
        
        const info = document.createElement('div');
        info.className = 'request-info';
        
        const ideaTitle = document.createElement('h3');
        ideaTitle.textContent = request.ideaTitle;
        
        const ownerEmail = document.createElement('div');
        ownerEmail.className = 'requester-email';
        ownerEmail.textContent = `To: ${request.ownerEmail}`;
        
        info.appendChild(ideaTitle);
        info.appendChild(ownerEmail);
        
        // Status badge
        const statusBadge = document.createElement('div');
        statusBadge.style.padding = '6px 16px';
        statusBadge.style.borderRadius = '12px';
        statusBadge.style.fontSize = '0.85rem';
        statusBadge.style.fontWeight = '600';
        
        if (request.status === 'pending') {
            statusBadge.style.background = 'rgba(59, 130, 246, 0.2)';
            statusBadge.style.color = '#3b82f6';
            statusBadge.textContent = '⏳ Pending';
        } else if (request.status === 'approved') {
            statusBadge.style.background = 'rgba(34, 197, 94, 0.2)';
            statusBadge.style.color = '#22c55e';
            statusBadge.textContent = '✅ Approved';
        } else if (request.status === 'rejected') {
            statusBadge.style.background = 'rgba(239, 68, 68, 0.2)';
            statusBadge.style.color = '#ef4444';
            statusBadge.textContent = '❌ Rejected';
        }
        
        header.appendChild(info);
        header.appendChild(statusBadge);
        card.appendChild(header);
        
        // Message
        if (request.message && request.message.trim()) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'request-message';
            messageDiv.textContent = `Your message: "${request.message}"`;
            card.appendChild(messageDiv);
        }
        
        // Time
        const timeDiv = document.createElement('div');
        timeDiv.className = 'request-time';
        timeDiv.style.marginTop = '10px';
        timeDiv.textContent = `Sent ${formatTimeAgo(request.createdAt)}`;
        card.appendChild(timeDiv);
        
        return card;
    }
    
    // --- UTILITY FUNCTIONS ---
    function formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        
        for (const [name, secondsInInterval] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInInterval);
            if (interval >= 1) {
                return `${interval} ${name}${interval === 1 ? '' : 's'} ago`;
            }
        }
        
        return 'Just now';
    }
});