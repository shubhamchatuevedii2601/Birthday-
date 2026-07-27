/**
 * js/animations.js - Handles GSAP ScrollTriggers and Scene Logic
 */
window.initAnimations = function() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const typeTexts = gsap.utils.toArray('#scene-1 .typewriter-text');
    const tl1 = gsap.timeline({ scrollTrigger: { trigger: '#scene-1', start: 'top top', end: '+=100%', pin: true, scrub: false } });
    typeTexts.forEach((text, i) => {
        tl1.to(text, { opacity: 1, y: -20, duration: 2, ease: "power2.out" }, `+=${i === 0 ? 0 : 1}`);
        if(i < typeTexts.length - 1) tl1.to(text, { opacity: 0, duration: 1, delay: 1 });
    });

    gsap.from('#scene-2 .glass-panel', { scrollTrigger: { trigger: '#scene-2', start: 'top 80%', end: 'center center', scrub: 1 }, opacity: 0, y: 50, scale: 0.95 });

    gsap.utils.toArray('.polaroid').forEach(el => {
        gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 90%', end: 'center center', scrub: 1 }, opacity: 0, y: 100, rotation: gsap.utils.random(-15, 15) });
    });

    gsap.from('#scene-4 .cinematic-text', { scrollTrigger: { trigger: '#scene-4', start: 'top 80%', end: 'center center', scrub: 1 }, y: 50, opacity: 0 });

    gsap.utils.toArray('.img-3d').forEach((img, i) => {
        gsap.to(img, { scrollTrigger: { trigger: '#scene-5', start: 'top 80%', end: 'center center', scrub: 1 }, opacity: 1, y: 0, z: 0, duration: 1, delay: i * 0.1 });
    });

    gsap.utils.toArray('.wish-item').forEach(wish => {
        gsap.fromTo(wish, { opacity: 0, y: 50 }, { scrollTrigger: { trigger: wish, start: 'top 85%', end: 'top 50%', scrub: 1 }, opacity: 1, y: 0 });
    });

    gsap.from('#scene-7 .cinematic-text', { scrollTrigger: { trigger: '#scene-7', start: 'top 75%', end: 'center center', scrub: 1 }, opacity: 0, filter: 'blur(10px)', scale: 1.05 });
    gsap.utils.toArray('.glass-card').forEach((card, i) => {
        gsap.to(card, { scrollTrigger: { trigger: '#scene-8', start: 'top 80%', end: 'center center', scrub: 1 }, opacity: 1, y: -20, duration: 1, delay: i * 0.2 });
    });

    gsap.to('.letter-content', { scrollTrigger: { trigger: '#scene-11', start: 'top center' }, opacity: 1, duration: 2 });
    gsap.utils.toArray('.letter-content p').forEach((line) => {
        gsap.fromTo(line, { opacity: 0, y: 15 }, { scrollTrigger: { trigger: line, start: 'top 90%', end: 'top 70%', scrub: 1 }, opacity: 1, y: 0 });
    });

    setupGiftReveal();
};

function setupGiftReveal() {
    const giftContainer = document.getElementById('gift-reveal-container');
    const giftBox = document.getElementById('luxury-gift');
    const video4 = document.getElementById('video-4');

    if(!giftContainer || !giftBox) return;

    const triggerReveal = () => {
        giftContainer.style.pointerEvents = 'none';
        giftBox.classList.remove('shake-anim');
        
        const rect = giftBox.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        if(window.createGiftBurst) window.createGiftBurst(x, y);

        gsap.to(giftBox, { scale: 1.2, rotation: 15, opacity: 0, duration: 0.6, ease: "power2.in" });
        gsap.to(giftContainer, { opacity: 0, duration: 1, delay: 0.4, onComplete: () => {
            giftContainer.style.display = 'none';
            video4.classList.remove('hidden');
            if(!video4.src && video4.dataset.src) video4.src = video4.dataset.src;
            if(window.videoObserver) window.videoObserver.observe(video4);
            gsap.to(video4, { opacity: 0.6, duration: 2 });
            video4.play().catch(()=>{});
        }});
    };

    giftContainer.addEventListener('click', triggerReveal);
    giftContainer.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') triggerReveal(); });
}

