/**
 * js/script.js - Master Engine
 * Single GSAP Ticker controls Lenis, Particles, and Fireworks safely.
 */

// Global State
window.userInteracted = false;
window.renderUniverse = null;
window.renderFireworks = null;

document.addEventListener('DOMContentLoaded', () => {

    // 1. SAFE LENIS INIT (No touch hijacking on Android)
    let lenis;
    try {
        if (typeof Lenis !== 'undefined') {
            lenis = new Lenis({
                duration: 1.5, 
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true, 
                smoothTouch: false, // Critical Android fix
                touchMultiplier: 2.5
            });
            window.lenis = lenis;
        }
    } catch(e) { console.warn("[Lenis] Native scroll active."); }

    // 2. THE ONE LOOP (GSAP Ticker syncs everything)
    try {
        if (typeof gsap !== 'undefined') {
            if (typeof ScrollTrigger !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger);
                if (lenis) {
                    lenis.on('scroll', ScrollTrigger.update);
                    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
                    gsap.ticker.lagSmoothing(0);
                }
            }
            // Sync Canvas Engines to GSAP Master Loop
            gsap.ticker.add((time, deltaTime) => {
                const timeScale = Math.min(deltaTime, 50) / 16.666;
                if (window.renderUniverse) window.renderUniverse(timeScale);
                if (window.renderFireworks) window.renderFireworks(timeScale);
            });
        }
    } catch(e) { console.error("[MasterLoop] Init Failed:", e); }

    // Scroll Progress Bar
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    if (progressContainer && progressBar) {
        Object.assign(progressContainer.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '3px',
            backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 10000, pointerEvents: 'none'
        });
        Object.assign(progressBar.style, {
            height: '100%', width: '0%', transformOrigin: 'left',
            background: 'linear-gradient(90deg, #D4AF37, #F3E5AB)',
            boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)'
        });
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            progressBar.style.width = scrollHeight > 0 ? `${(scrollTop / scrollHeight) * 100}%` : '0%';
        }, { passive: true });
    }

    // 3. BULLETPROOF PRELOADER
    const initPreloader = () => {
        const preloader = document.getElementById('preloader');
        const enterBtn = document.getElementById('enter-btn');
        const loaderFill = document.querySelector('.loader-fill');
        const loadText = document.getElementById('load-text');
        
        let progress = 0;
        let isReady = false;

        const showEntry = () => {
            if (isReady) return;
            isReady = true;
            if (loadText) loadText.style.display = 'none';
            if (loaderFill) loaderFill.style.width = '100%';
            if (enterBtn) {
                enterBtn.classList.remove('hidden');
                enterBtn.style.opacity = '1';
                enterBtn.style.pointerEvents = 'auto';
            }
        };

        const failsafeTimer = setTimeout(() => { showEntry(); }, 3000);

        const simInterval = setInterval(() => {
            try {
                progress += Math.random() * 12;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(simInterval);
                    clearTimeout(failsafeTimer);
                    showEntry();
                }
                if (loaderFill) loaderFill.style.width = `${progress}%`;
                if (loadText) loadText.innerText = `Igniting stars... ${Math.floor(progress)}%`;
            } catch (e) {
                clearInterval(simInterval); showEntry();
            }
        }, 150);

        if (enterBtn) {
            enterBtn.addEventListener('click', () => {
                enterBtn.style.pointerEvents = 'none';
                window.userInteracted = true; // Unlocks Audio

                // REMOVE SCROLL LOCK IMMIDIATELY
                document.body.classList.remove('scroll-locked');

                // FADE OUT PRELOADER (Native CSS, completely independent of GSAP)
                if (preloader) {
                    preloader.style.transition = 'opacity 1s ease';
                    preloader.style.opacity = '0';
                    setTimeout(() => {
                        preloader.style.display = 'none';
                        // Refresh ScrollTriggers now that the DOM layout is fully unlocked
                        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
                    }, 1000);
                }

                // Kickstart Audio
                if (window.AudioEngine) window.AudioEngine.checkCurrentScene();
            });
        }
    };
    
    try { initPreloader(); } catch(e) { document.body.classList.remove('scroll-locked'); }

    // 4. VIDEO OBSERVER
    try {
        if ('IntersectionObserver' in window) {
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const video = entry.target;
                    if (entry.isIntersecting) {
                        if (!video.src && video.dataset.src) { video.src = video.dataset.src; video.load(); }
                        if (typeof gsap !== 'undefined') { gsap.to(video, { opacity: 0.7, duration: 2 }); }
                        let playPromise = video.play();
                        if (playPromise !== undefined) playPromise.catch(e => {});
                    } else {
                        video.pause();
                    }
                });
            }, { threshold: 0.1 });
            document.querySelectorAll('.story-video').forEach(vid => videoObserver.observe(vid));
        }
    } catch(e) {}
});
