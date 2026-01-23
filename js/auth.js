// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginOverlay = document.getElementById('login-overlay');
    const appContent = document.getElementById('app-content');
    const bigLoginBtn = document.getElementById('big-login-btn');
    const loginError = document.getElementById('login-error');
    
    // Nav Elements
    const navEmail = document.getElementById('nav-email');
    const navLogout = document.getElementById('nav-logout');

    // 1. The Gatekeeper: Watch Auth State
    HackMateData.onUserChange((user) => {
        if (user) {
            // --- ACCESS GRANTED ---
            console.log("User authorized:", user.email);
            
            // Hide Login Wall / Show App
            if(loginOverlay) loginOverlay.classList.add('hidden');
            if(appContent) appContent.classList.remove('hidden');

            // Update Nav Profile
            if(navEmail) navEmail.textContent = user.email.split('@')[0];
            
        } else {
            // --- ACCESS DENIED ---
            console.log("User not logged in");
            
            // Show Login Wall / Hide App
            if(loginOverlay) loginOverlay.classList.remove('hidden');
            if(appContent) appContent.classList.add('hidden');
        }
    });

    // 2. Handle Login Button Click (on the Wall)
    if (bigLoginBtn) {
        bigLoginBtn.addEventListener('click', async () => {
            try {
                loginError.textContent = "";
                bigLoginBtn.textContent = "Verifying...";
                bigLoginBtn.disabled = true;
                
                await HackMateData.login(); // This triggers the popup
                
                // Note: The onUserChange listener above will handle the UI switch
                // automatically once login succeeds.
                
            } catch (error) {
                console.error(error);
                bigLoginBtn.textContent = "Sign in with NITP Email";
                bigLoginBtn.disabled = false;
                
                // Show friendly error message
                if (error.message.includes("Access Restricted")) {
                    loginError.textContent = "🚫 Only @nitp.ac.in emails are allowed.";
                } else {
                    loginError.textContent = "Login failed. Please try again.";
                }
            }
        });
    }

    // 3. Handle Logout
    if (navLogout) {
        navLogout.addEventListener('click', async () => {
            await HackMateData.logout();
        });
    }
});