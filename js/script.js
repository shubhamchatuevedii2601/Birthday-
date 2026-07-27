/**
 * js/script.js - Fixed & Hardened Architecture
 * Zero infinite-loading. Fallbacks for missing assets and libraries.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. PRELOADER (Moved to top to guarantee execution) ---
    const initPreloader = () => {
        const preloader = document.getElementById('preloader');
        const enterBtn = document.getElementById('enter-btn');
        const loaderFill = document.querySelector('.loader-fill');
        const loadText = document.getElementById('load-text');
        
        let progress = 0;
        let preloaderFinished = false;

        const revealEnterButton = () => {
            if (preloaderFinished) return;
            preloaderFinished = true;
            
            try {
                if (loadText) loadText.style.display = 'none';
                if (loaderFill) loaderFill.style.width = '100%';
                if (enterBtn) {
                    enterBtn.classList.remove('hidden');
                    enterBtn.style.display = 'inline-block';
                    enterBtn.style.opacity = '1';
                    enterBtn.style.pointerEvents = 'auto';
                }
            } catch(e) { console.error("[Loader] Error showing button:", e); }
        };

        // STRICT 3-SECOND FAILSAFE: Forces entry even if assets/scripts fail.
        const failsafeTimer = setTimeout(() => {
            console.warn("[Failsafe] Loader exceeded 3 seconds. Forcing entry.");
            revealEnterButton();
        }, 3000);

        // Normal Progress Simulation
        const simInterval = setInterval(() => {
            try {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(simInterval);
                    clearTimeout(failsafeTimer);
                    revealEnterButton();
                }
                if (loaderFill && progress <= 100) loaderFill.style.width = `${progress}%`;
                if (loadText && progress <= 100) loadText.innerText = `Igniting stars... ${Math.floor(progress)}%`;
            } catch(e) {
                console.error("[Loader] Interval error:", e);
                clearInterval(simInterval);
                revealEnterButton(); // Force reveal on error
            }
        }, 150);

        // Button Click Handler (Transition to Site)
        if (enterBtn) {
            enterBtn.addEventListener('click', () => {
                try {
                    // Attempt GSAP fade, fallback to instant hide if GSAP is missing
                    if (typeof gsap !== 'undefined') {
                        gsap.to(preloader, { opacity: 0, duration: 1.5, onComplete: () => {
                            if(preloader) preloader.style.display = 'none';
                            if(window.lenis) window.lenis.start();
                            if(typeof window.initStoryAnimations === 'function') {
                                try { window.initStoryAnimations(); } catch(e) { console.error("[Animations] Error:", e); }
                            }
                        }});
                    } else {
                        if(preloader) preloader.style.display = 'none';
                        if(window.lenis) window.lenis.start();
                    }
                } catch(e) {
                    console.error("[Loader] Transition error:", e);
                    if(preloader) preloader.style.display = 'none';
                }
                
                // Audio Engine Kickstart
                try {
                    const firstScene = document.getElementById('scene-1');
                    if (firstScene && window.AudioEngine) {
                        window.AudioEngine.playTrack(firstScene.getAttribute('data-audio'), false);
                    }
                } catch(e) { console.warn("[Audio] Failed to start on enter:", e); }
            });
        }
    };

    // Initialize preloader immediately
    try { initPreloader(); } catch(e) { console.error("[Loader] Init failed:", e); }


    // --- 2. GSAP INITIALIZATION ---
    try {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        } else {
            console.warn("[GSAP] Library not loaded. Visual animations will fallback gracefully.");
        }
    } catch(e) { console.error("[GSAP] Init Error:", e); }


    // --- 3. LENIS SCROLL INITIALIZATION ---
    try {
        if (typeof Lenis !== 'undefined') {
            const lenis = new Lenis({
                duration: 1.5,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
                smoothTouch: true,
                touchMultiplier: 2.5,
                infinite: false
            });

            lenis.stop(); 
            if (typeof ScrollTrigger !== 'undefined') lenis.on('scroll', ScrollTrigger.update);
            if (typeof gsap !== 'undefined') {
                gsap.ticker.add((time) => { lenis.raf(time * 1000); });
                gsap.ticker.lagSmoothing(0);
            }
            window.lenis = lenis;

            // Scroll Progress Indicator
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
                lenis.on('scroll', ({ progress }) => {
                    if (progressBar) progressBar.style.width = `${progress * 100}%`;
                });
            }
        } else {
            console.warn("[Lenis] Library not found. Reverting to native browser scroll.");
        }
    } catch(e) { console.error("[Lenis] Init Error:", e); }


    // --- 4. CINEMATIC AUDIO ENGINE ---
    try {
        window.AudioEngine = {
            playerA: new Audio(),
            playerB: new Audio(),
            activePlayer: null,
            isUserMuted: false, 
            currentTrackId: null,
            baseVolume: 0.4,
            duckVolume: 0.1,
            fadeDuration: 2.5, 
            tracks: {
                'ambient-space': 'media/music1.mp3',
                'soft-piano': 'media/music2.mp3',
                'warm-acoustic': 'media/music3.mp3',
                'emotional-build': 'media/music4.mp3',
                'epic-celebration': 'media/music5.mp3',
                'ending-piano': 'media/music6.mp3'
            },
            init() {
                this.playerA.loop = true;
                this.playerB.loop = true;
                this.activePlayer = this.playerA;
            },
            playTrack(trackId, shouldDuck) {
                try {
                    const src = this.tracks[trackId];
                    if (!src) return;

                    const targetVol = shouldDuck ? this.duckVolume : this.baseVolume;
                    
                    if (this.currentTrackId === trackId) {
                        if (!this.isUserMuted && typeof gsap !== 'undefined') {
                            gsap.to(this.activePlayer, { volume: targetVol, duration: this.fadeDuration, overwrite: true });
                        } else if (!this.isUserMuted) {
                            this.activePlayer.volume = targetVol;
                        }
                        this.activePlayer.targetVol = targetVol;
                        return;
                    }
                    
                    this.currentTrackId = trackId;
                    const nextPlayer = this.activePlayer === this.playerA ? this.playerB : this.playerA;
                    const oldPlayer = this.activePlayer;
                    
                    nextPlayer.src = src;
                    nextPlayer.volume = 0;
                    
                    if (!this.isUserMuted) {
                        let playPromise = nextPlayer.play();
                        // Handle browser autoplay policies & 404 missing files safely
                        if (playPromise !== undefined) {
                            playPromise.catch(e => console.warn("[Audio] File missing or autoplay blocked:", e));
                        }
                        
                        if (typeof gsap !== 'undefined') {
                            gsap.to(nextPlayer, { volume: targetVol, duration: this.fadeDuration, overwrite: true });
                            gsap.to(oldPlayer, { volume: 0, duration: this.fadeDuration, overwrite: true, onComplete: () => oldPlayer.pause() });
                        } else {
                            nextPlayer.volume = targetVol;
                            oldPlayer.pause();
                        }
                    } else {
                        nextPlayer.volume = 0;
                        oldPlayer.pause();
                    }
                    
                    this.activePlayer = nextPlayer;
                    this.activePlayer.targetVol = targetVol;
                } catch(e) { console.error("[Audio] Playback Engine Error:", e); }
            }
        };
        window.AudioEngine.init();
    } catch(e) { console.error("[Audio] Engine Init Error:", e); }


    // --- 5. SCENE OBSERVER ---
    try {
        if ('IntersectionObserver' in window) {
            const sceneObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    try {
                        if (entry.isIntersecting && window.AudioEngine) {
                            const trackId = entry.target.getAttribute('data-audio');
                            const shouldDuck = entry.target.getAttribute('data-duck-audio') === 'true';
                            if (trackId) window.AudioEngine.playTrack(trackId, shouldDuck);
                        }
                    } catch(e) { console.error("[Observer] Scene tracking error:", e); }
                });
            }, { threshold: 0.5 });
            document.querySelectorAll('.scene[data-audio]').forEach(sec => sceneObserver.observe(sec));
        }
    } catch(e) { console.error("[Observer] Scene Init Error:", e); }


    // --- 6. VIDEO OBSERVER ---
    try {
        if ('IntersectionObserver' in window) {
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    try {
                        const video = entry.target;
                        if (entry.isIntersecting) {
                            if (!video.src && video.dataset.src) {
                                video.src = video.dataset.src;
                                video.load();
                            }
                            if (typeof gsap !== 'undefined') {
                                gsap.to(video, { opacity: 0.7, duration: 2 });
                            } else {
                                video.style.opacity = 0.7;
                            }
                            
                            // Prevent unhandled promise rejection if video is missing
                            let playPromise = video.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(e => console.warn(`[Video] Missing asset or block on ${video.dataset.src}:`, e));
                            }
                        } else {
                            video.pause();
                        }
                    } catch(e) { console.error("[Observer] Video tracking error:", e); }
                });
            }, { threshold: 0.1 });
            document.querySelectorAll('.story-video').forEach(vid => videoObserver.observe(vid));
        }
    } catch(e) { console.error("[Observer] Video Init Error:", e); }

});
