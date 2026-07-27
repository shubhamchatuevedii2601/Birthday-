/**
 * js/animations.js - The GSAP Motion Engine
 * Handles cinematic typography reveals, 3D gallery physics, parallax imagery, and interactivity.
 */
window.initStoryAnimations = function() {
    
    // 1. ACCESSIBILITY GUARD
    // Respect system-level reduced motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set('.reveal-text, .memory-card, .typewriter-target span', { opacity: 1, y: 0 });
        return;
    }

    // 2. CINEMATIC TEXT REVEALS
    // Fades and floats text up elegantly as it enters the viewport
    gsap.utils.toArray('.reveal-text').forEach(text => {
        // Calculate delay based on utility classes applied in HTML
        let startDelay = 0;
        if (text.classList.contains('delay-1')) startDelay = 0.5;
        if (text.classList.contains('delay-2')) startDelay = 1.0;

        gsap.from(text, {
            scrollTrigger: {
                trigger: text,
                start: "top 85%", // Triggers when the top of the element hits 85% of the viewport height
                toggleActions: "play none none reverse"
            },
            y: 40,
            opacity: 0,
            duration: 1.5,
            ease: "power3.out",
            delay: startDelay
        });
    });

    // 3. PARALLAX HERO IMAGE (Scene 3)
    // Creates depth by moving the image slightly slower than the scroll speed
    if (document.querySelector('.hero-img')) {
        gsap.to('.hero-img', {
            scrollTrigger: {
                trigger: '#scene-3',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true // Ties animation strictly to scroll position
            },
            yPercent: 15, // Moves the image down 15% of its height
            scale: 1.05,  // Slight zoom for cinematic feel
            ease: "none"
        });
    }

    // 4. 3D MEMORY GALLERY (Scene 5)
    // Randomizes rotation for a natural "scattered polaroids" look
    const memoryCards = gsap.utils.toArray('.memory-card');
    if (memoryCards.length > 0) {
        // Initial state: hidden, pushed down, and randomly tilted
        gsap.set(memoryCards, { 
            opacity: 0, 
            y: 100, 
            rotationZ: () => gsap.utils.random(-8, 8),
            rotationX: 15
        });

        // Batch trigger them so they stagger beautifully
        ScrollTrigger.batch(memoryCards, {
            start: "top 80%",
            onEnter: (elements) => {
                gsap.to(elements, {
                    opacity: 1,
                    y: 0,
                    rotationX: 0,
                    stagger: 0.2, // 0.2 seconds between each card reveal
                    duration: 1.2,
                    ease: "power2.out",
                    overwrite: true
                });
            }
        });

        // Add subtle floating hover effect for desktop
        if (window.matchMedia("(pointer: fine)").matches) {
            memoryCards.forEach(card => {
                card.addEventListener('mouseenter', () => gsap.to(card, { scale: 1.05, rotationZ: 0, duration: 0.4, ease: "back.out(1.5)", zIndex: 10 }));
                card.addEventListener('mouseleave', () => gsap.to(card, { scale: 1, rotationZ: gsap.utils.random(-8, 8), duration: 0.4, ease: "power2.out", zIndex: 1 }));
            });
        }
    }

    // 5. CUSTOM TYPEWRITER EFFECT (Scene 6)
    // Lightweight word-by-word reveal without external plugins
    const letter = document.querySelector('.typewriter-target');
    if (letter) {
        // Split text into words safely
        const words = letter.innerText.split(' ');
        letter.innerHTML = '';
        words.forEach(word => {
            const span = document.createElement('span');
            span.innerText = word + ' ';
            span.style.opacity = 0;
            span.style.display = 'inline-block';
            span.style.transform = 'translateY(10px)';
            letter.appendChild(span);
        });

        // Animate the spans
        gsap.to(letter.querySelectorAll('span'), {
            scrollTrigger: {
                trigger: '#scene-6',
                start: 'top 75%'
            },
            opacity: 1,
            y: 0,
            stagger: 0.08,
            duration: 0.4,
            ease: "power1.out"
        });
    }

    // 6. THE GIFT INTERACTION (Scene 8 to 9)
    const giftTrigger = document.getElementById('gift-trigger');
    const giftBox = document.querySelector('.gift-box');
    
    if (giftTrigger && giftBox) {
        // Idle animation: Soft floating
        gsap.to(giftBox, {
            y: -15,
            repeat: -1,
            yoyo: true,
            duration: 2.5,
            ease: "sine.inOut"
        });

        // Click Event: Open Gift and Launch Celebration
        giftTrigger.addEventListener('click', () => {
            giftTrigger.style.pointerEvents = 'none'; // Lock interaction
            
            // Interaction Timeline
            const tl = gsap.timeline();
            
            // Anticipation shake
            tl.to(giftBox, { scale: 1.1, rotation: 5, duration: 0.1, yoyo: true, repeat: 3, ease: "none" })
              // Pop open/vanish
              .to(giftBox, { scale: 1.5, opacity: 0, filter: "brightness(2)", duration: 0.4, ease: "power2.in" })
              // Fade out instructions
              .to(giftTrigger.querySelector('p'), { opacity: 0, duration: 0.3 }, "<")
              .add(() => {
                  // Scroll beautifully into the Celebration Fireworks Scene
                  if (window.lenis) {
                      window.lenis.scrollTo('#scene-9', { 
                          duration: 2.5, 
                          ease: "power3.inOut" 
                      });
                  }
              });
        });
    }

    // 7. CELEBRATION TITLE (Scene 9)
    const grandTitle = document.querySelector('.grand-title');
    if (grandTitle) {
        gsap.from(grandTitle, {
            scrollTrigger: {
                trigger: '#scene-9',
                start: "top 60%"
            },
            scale: 0.8,
            opacity: 0,
            duration: 2,
            ease: "elastic.out(1, 0.3)"
        });
    }
};
