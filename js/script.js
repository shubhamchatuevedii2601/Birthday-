/**
 * js/script.js - Core Bootstrapping & Fallbacks
 * 100% Non-blocking execution trace.
 */
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. HOISTED PRELOADER WITH 3-SECOND FAILSAFE
    // ==========================================
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

        // STRICT 3-SECOND TIMEOUT: Always unblock the user, no matter what fails.
        const failsafeTimer = setTimeout(() => {
            console.warn("[Failsafe] 3-second limit reached. Forcing website entry.");
            showEntry();
        }, 3000);

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
                clearInterval(simInterval);
                showEntry();
            }
        }, 150);

        if (enterBtn) {
            enterBtn.addEventListener('click', () => {
                // Remove preloader
                try {
                    if (typeof gsap !== 'undefined') {
                        gsap.to(preloader, { opacity: 0, duration: 1.5, onComplete: () => {
                            if (preloader) preloader.style.display = 'none';
                            if (window.lenis) window.lenis.start();
                            if (typeof window.initStoryAnimations === 'function') window.initStoryAnimations();
                        }});
                    } else {
                        // Fallback if GSAP failed to load
                        if (preloader) preloader.style.display = 'none';
                        if (window.lenis) window.lenis.start();
                    }
                } catch(e) { console.error("[Loader] Fade error:", e); }
                
                // Kickstart Audio
                try {
                    const firstScene = document.getElementById('scene-1');
                    if (firstScene && window.AudioEngine) {
                        window.AudioEngine.playTrack(firstScene.getAttribute('data-audio'), false);
                    }
                } catch(e) { console.warn("[Audio] Engine skip:", e); }
            });
        }
    };

    // Execute immediately before anything else can crash
    initPreloader();


    // ==========================================
    // 2. PROTECTED LIBRARY INITIALIZATIONS
    // ==========================================
    
    // GSAP
    try {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        } else {
            console.error("[GSAP] ReferenceError bypassed. GSAP library is missing.");
        }
    } catch(e) { console.error("[GSAP] Init Error:", e); }

    // LENIS
    try {
        if (typeof Lenis !== 'undefined') {
            const lenis = new Lenis({
                duration: 1.5,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true, smoothTouch: true, touchMultiplier: 2.5, infinite: false
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
            console.error("[Lenis] ReferenceError bypassed. Lenis library is missing.");
        }
    } catch(e) { console.error("[Lenis] Init Error:", e); }


    // ==========================================
    // 3. PROTECTED AUDIO ENGINE
    // ==========================================
    try {
        window.AudioEngine = {
            playerA: new Audio(), playerB: new Audio(),
            activePlayer: null, isUserMuted: false, currentTrackId: null,
            baseVolume: 0.4, duckVolume: 0.1, fadeDuration: 2.5, 
            tracks: {
                'ambient-space': 'media/music1.mp3',
                'soft-piano': 'media/music2.mp3',
                'warm-acoustic': 'media/music3.mp3',
                'emotional-build': 'media/music4.mp3',
                'epic-celebration': 'media/music5.mp3',
                'ending-piano': 'media/music6.mp3'
            },
            init() {
                this.playerA.loop = true; this.playerB.loop = true;
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
                    
                    nextPlayer.src = src; nextPlayer.volume = 0;
                    
                    if (!this.isUserMuted) {
                        // Catch Promise rejections for missing files or strict autoplay blocks
                        let playPromise = nextPlayer.play();
                        if (playPromise !== undefined) playPromise.catch(e => console.warn("[Audio] Missing/Blocked:", e));
                        
                        if (typeof gsap !== 'undefined') {
                            gsap.to(nextPlayer, { volume: targetVol, duration: this.fadeDuration, overwrite: true });
                            gsap.to(oldPlayer, { volume: 0, duration: this.fadeDuration, overwrite: true, onComplete: () => oldPlayer.pause() });
                        } else {
                            nextPlayer.volume = targetVol; oldPlayer.pause();
                        }
                    } else {
                        nextPlayer.volume = 0; oldPlayer.pause();
                    }
                    
                    this.activePlayer = nextPlayer; this.activePlayer.targetVol = targetVol;
                } catch(e) { console.error("[Audio] Playback Error:", e); }
            }
        };
        window.AudioEngine.init();
    } catch(e) { console.error("[Audio] Engine Error:", e); }


    // ==========================================
    // 4. PROTECTED OBSERVERS (Audio & Video)
    // ==========================================
    try {
        if ('IntersectionObserver' in window) {
            
            // Scene Observer
            const sceneObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && window.AudioEngine) {
                        const trackId = entry.target.getAttribute('data-audio');
                        const shouldDuck = entry.target.getAttribute('data-duck-audio') === 'true';
                        if (trackId) window.AudioEngine.playTrack(trackId, shouldDuck);
                    }
                });
            }, { threshold: 0.5 });
            document.querySelectorAll('.scene[data-audio]').forEach(sec => sceneObserver.observe(sec));

            // Video Observer
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
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
                        
                        // Catch Promise rejections for missing video assets
                        let playPromise = video.play();
                        if (playPromise !== undefined) playPromise.catch(e => console.warn(`[Video] Playback skipped for ${video.dataset.src}`, e));
                    } else {
                        video.pause();
                    }
                });
            }, { threshold: 0.1 });
            document.querySelectorAll('.story-video').forEach(vid => videoObserver.observe(vid));
        }
    } catch(e) { console.error("[Observers] Observer Error:", e); }

});
                            
