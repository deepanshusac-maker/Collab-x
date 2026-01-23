// js/animations.js
document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    // --- 1. LOGIN OVERLAY ANIMATIONS ---
    // Only run if the overlay exists and is visible
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay && !loginOverlay.classList.contains('hidden')) {
        
        const tl = gsap.timeline();

        // Animate the Card Pop-in
        tl.from(".login-card", {
            duration: 0.8,
            scale: 0.8,
            opacity: 0,
            ease: "back.out(1.7)", // Elastic bounce effect
            delay: 0.2
        })
        // Stagger the Header elements (Icon, Title, Badge)
        .from(".login-header > *", {
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out"
        }, "-=0.4")
        // Stagger the Body elements (Inputs, Buttons)
        .from(".login-body > *, .email-login-form > *", {
            x: -20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.05,
            ease: "power2.out"
        }, "-=0.4");
    }

    // --- 2. LANDING PAGE HERO (Index.html) ---
    if (document.querySelector('.hero-section')) {
        const heroTl = gsap.timeline();

        heroTl.from(".hero-title", {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        })
        .from(".hero-subtitle", {
            y: 30,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        }, "-=0.6")
        .from(".action-buttons a", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.2,
            ease: "back.out(1.7)"
        }, "-=0.6");

        // ScrollTrigger for Feature Cards
        gsap.from(".feature-card", {
            scrollTrigger: {
                trigger: ".features-section",
                start: "top 80%", // Starts when top of section hits 80% of viewport
                toggleActions: "play none none reverse"
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2, // Cards appear one after another
            ease: "power2.out"
        });
    }

    // --- 3. POST IDEA FORM (Post.html) ---
    if (document.querySelector('.form-container')) {
        gsap.from(".form-container", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        });

        gsap.from(".form-group", {
            x: -20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.3,
            ease: "power2.out"
        });
    }

    // --- 4. DYNAMIC IDEA CARDS (Explore.html) ---
    // Since cards are loaded from Firebase, we watch for them to appear
    const ideasContainer = document.getElementById('ideas-container');
    if (ideasContainer) {
        // Create an observer to watch for new cards being added
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // If nodes were added
                if (mutation.addedNodes.length > 0) {
                    // Filter for only elements (ignore text nodes)
                    const newCards = Array.from(mutation.addedNodes).filter(node => node.nodeType === 1);
                    
                    if (newCards.length > 0) {
                        gsap.from(newCards, {
                            y: 30,
                            opacity: 0,
                            duration: 0.5,
                            stagger: 0.1, // Cascade effect
                            ease: "power2.out",
                            clearProps: "all" // Clean up after animation
                        });
                    }
                }
            });
        });

        // Start observing the container
        observer.observe(ideasContainer, { childList: true });
    }
});