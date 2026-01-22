// postIdea.js - Updated for Firebase

document.addEventListener('DOMContentLoaded', function() {
    
    const postIdeaForm = document.getElementById('post-idea-form');
    const successMessage = document.getElementById('success-message');
    
    // We make the callback ASYNC
    postIdeaForm.addEventListener('submit', async function(event) {
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
        
        // UX: Change button text so user knows it's processing
        const submitBtn = document.querySelector('.submit-button');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Posting... ⏳';
        submitBtn.disabled = true;

        try {
            // AWAIT the database operation
            await HackMateData.addIdea(newIdeaData);
            
            // Success Handling
            postIdeaForm.style.display = 'none';
            successMessage.classList.remove('hidden');
            successMessage.scrollIntoView({ behavior: 'smooth' });
            
            // Reset form after 3 seconds
            setTimeout(function() {
                postIdeaForm.reset();
                postIdeaForm.style.display = 'flex';
                successMessage.classList.add('hidden');
                
                // Reset button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }, 3000);
            
        } catch (error) {
            console.error("Error posting idea:", error);
            alert("Something went wrong. Check console.");
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });  
    
    // Animation logic (unchanged)
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