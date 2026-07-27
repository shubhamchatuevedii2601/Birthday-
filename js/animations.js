/**
 * js/animations.js - GSAP Story Motion & Gift Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            if (typeof gsap !== 'undefined') gsap.set('.reveal-text, .memory-card, .typewriter-target span', { opacity: 1, y: 0 });
            return;
        }
    } catch(e) {}

    try {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            
            // Reveal Texts
            gsap.utils.toArray('.reveal-text').forEach(text => {
                let startDelay = text.classList.contains('delay-2') ? 1.0 : (text.classList.contains('delay-1') ? 0.5 : 0);
                gsap.from(text, {
                    scrollTrigger: { trigger: text, start: "top 85%", toggleActions: "play none none reverse" },
                    y: 40, opacity: 0, duration: 1.5, ease: "power3.out", delay: startDelay
                });
            });

            // Hero Parallax
            if (document.querySelector('.hero-img')) {
                gsap.to('.hero-img', {
                    scrollTrigger: { trigger: '#scene-3', start: 'top bottom', end: 'bottom top', scrub: true },
                    yPercent: 15, scale: 1.05, ease: "none"
                });
            }

            // Memory Gallery
            const memoryCards = gsap.utils.toArray('.memory-card');
            if (memoryCards.length > 0) {
                gsap.set(memoryCards, { opacity: 0, y: 100, rotationZ: () => gsap.utils.random(-8, 8), rotationX: 15 });
                ScrollTrigger.batch(memoryCards, {
                    start: "top 80%",
                    onEnter: (elements) => {
                        gsap.to(elements, { opacity: 1, y: 0, rotationX: 0, stagger: 0.2, duration: 1.2, ease: "power2.out", overwrite: true });
                    }
                });
            }

            // Typewriter
            const letter = document.querySelector('.typewriter-target');
            if (letter) {
                const words = letter.innerText.split(' ');
                letter.innerHTML = '';
                words.forEach(word => {
                    const span = document.createElement('span');
                    span.innerText = word + ' ';
                    span.style.opacity = 0; span.style.display = 'inline-block'; span.style.transform = 'translateY(10px)';
                    letter.appendChild(span);
                });
                gsap.to(letter.querySelectorAll('span'), {
                    scrollTrigger: { trigger: '#scene-6', start: 'top 75%' },
                    opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: "power1.out"
                });
            }

            // Title
            const grandTitle = document.querySelector('.grand-title');
            if (grandTitle) {
                gsap.from(grandTitle, {
                    scrollTrigger: { trigger: '#scene-9', start: "top 60%" },
                    scale: 0.8, opacity: 0, duration: 2, ease: "elastic.out(1, 0.3)"
                });
            }

            // Gift Interaction
            const giftTrigger = document.getElementById('gift-trigger');
            const giftBox = document.querySelector('.gift-box');
            if (giftTrigger && giftBox) {
                gsap.to(giftBox, { y: -15, repeat: -1, yoyo: true, duration: 2.5, ease: "sine.inOut" });
                
                giftTrigger.addEventListener('click', () => {
                    giftTrigger.style.pointerEvents = 'none';
                    const tl = gsap.timeline();
                    tl.to(giftBox, { scale: 1.1, rotation: 5, duration: 0.1, yoyo: true, repeat: 3, ease: "none" })
                      .to(giftBox, { scale: 1.5, opacity: 0, filter: "brightness(2)", duration: 0.4, ease: "power2.in" })
                      .to(giftTrigger.querySelector('p'), { opacity: 0, duration: 0.3 }, "<")
                      .add(() => {
                          const scene9 = document.getElementById('scene-9');
                          if (scene9) {
                              if (window.lenis) window.lenis.scrollTo('#scene-9', { duration: 2.5, ease: "power3.inOut" });
                              else scene9.scrollIntoView({ behavior: 'smooth' });
                          }
                      });
                });
            }
        }
    } catch(e) {}
});
