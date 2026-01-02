
document.addEventListener('DOMContentLoaded', function() {
    
    
    const postIdeaForm = document.getElementById('post-idea-form');
    const successMessage = document.getElementById('success-message');
    
    
    postIdeaForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        
        const ideaTitle = document.getElementById('idea-title').value.trim();
        const ideaDescription = document.getElementById('idea-description').value.trim();
        const teamSize = document.getElementById('team-size').value;
        const contactInfo = document.getElementById('contact-info').value.trim();
        
        
        const skillCheckboxes = document.querySelectorAll('.skill-checkbox:checked');
        const selectedSkills = Array.from(skillCheckboxes).map(checkbox => checkbox.value);
        
        
        if (selectedSkills.length === 0) {
            alert('Please select at least one required skill');
            return;
        }
        
        
        const newIdeaData = {
            title: ideaTitle,
            description: ideaDescription,
            skills: selectedSkills,
            teamSize: teamSize,
            contact: contactInfo
        };
        
       
        HackMateData.addIdea(newIdeaData);
        
       
        postIdeaForm.style.display = 'none';
        successMessage.classList.remove('hidden');
        
        
        successMessage.scrollIntoView({ behavior: 'smooth' });
        
        
        setTimeout(function() {
            postIdeaForm.reset();
            postIdeaForm.style.display = 'flex';
            successMessage.classList.add('hidden');
        }, 3000);
    });  
    
    const skillCheckboxes = document.querySelectorAll('.skill-checkbox');
    skillCheckboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            const badge = this.nextElementSibling;
            if (this.checked) {
                badge.style.transform = 'scale(1.05)';
            } else {
                badge.style.transform = 'scale(1)';
            }
        });
    });
});