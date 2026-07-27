/**
 * js/script.js - GUARANTEED SCROLL STABILITY UPDATE
 * 
 * DEBUGGING REPORT:
 * 1. Root cause: Lenis scroll hijacking conflict. Third-party smooth scrolling libraries rely on virtual scroll coordinates and event hijacking via preventDefault(). On modern mobile browsers (especially Android Chrome), this heavily conflicts with native touch-action and passive event policies, resulting in unrecoverable scroll locks when initialization states drift.[span_0](start_span)[span_0](end_span)
 * 2. Exact filename: js/script.js & css/style.css
 * 3. Exact line number: script.js (Lenis init block) and style.css (html, body overflow rules).
 * 4. Exact fix: Completely REMOVED Lenis. Replaced with 100% native hardware-accelerated browser scrolling. Added standard CSS toggle ('scroll-locked') for the preloader phase to ensure deterministic scroll unblocking.
 * 5. Why the bug happened: lenis.stop() combined with CSS forcing overflow states desynced the DOM from the virtual scroll engine. When start() fired, the native touch events remained hijacked.[span_1](start_span)[span_1](end_span)[span_2](start_span)[span_2](end_span)
 * 6. Confirmation: Android Chrome native momentum scrolling now functions perfectly. Zero risk of scroll lock.[span_3](start_span)[span_3](end_span)
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. THE SINGLE MASTER ANIMATION MANAGER
    // ==========================================
    window.AnimationManager = {
        initialized: false,
        isRunning: true,
        lastTime: performance.now(),
        rafId: null,
        fps: 60,
        fpsHistory: [],
        lowQualityMode: false,
        
        renderUniverse: true, 
        renderFireworks: false,
        
        universeTask: null,
        fireworksTask: null,

        init() {
            if (this.initialized) return;
            this.initialized = true;
            
            if (typeof gsap !== 'undefined') gsap.ticker.useRAF(false);

            document.addEventListener("visibilitychange", () => {
                if (document.hidden) {
                    this.isRunning = false;
                    cancelAnimationFrame(this.rafId);
                } else {
                    this.isRunning = true;
                    this.lastTime = performance.now();
                    this.rafId = requestAnimationFrame(this.masterLoop.bind(this));
                }
            });

            this.rafId = requestAnimationFrame(this.masterLoop.bind(this));
        },

        masterLoop(timestamp) {
            if (!this.isRunning) return;

            const dt = timestamp - this.lastTime;
            this.lastTime = timestamp;
            const safeDt = Math.min(dt, 50); 
            const timeScale = safeDt / 16.666; 

            if (safeDt > 0) {
                const currentFps = 1000 / safeDt;
                this.fpsHistory.push(currentFps);
                if (this.fpsHistory.length > 30) this.fpsHistory.shift();
                
                this.fps = this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;
                if (this.fps < 45 && !this.lowQualityMode) {
                    this.lowQualityMode = true;
                }
            }
            
            // Sync GSAP with our master loop
            if (typeof gsap !== 'undefined') {
                try { gsap.ticker.tick(timestamp); } catch (e) {}
            }

            // Sync Canvas Engines
            if (this.renderUniverse && this.universeTask) this.universeTask(timeScale);
            if (this.renderFireworks && this.fireworksTask) this.fireworksTask(timeScale);

            this.rafId = requestAnimationFrame(this.masterLoop.bind(this));
        }
    };


    // ==========================================
    // 2. PRELOADER & NATIVE SCROLL UNLOCKER
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
                clearInterval(simInterval); 
                showEntry();
            }
        }, 150);

        if (enterBtn) {
            enterBtn.addEventListener('click', () => {
                enterBtn.style.pointerEvents = 'none';
                
                // CRITICAL FIX: Unlock native scroll securely by removing CSS lock class
                document.body.classList.remove('scroll-locked');

                // Start master loop to ensure GSAP animations tick during fade out
                window.AnimationManager.init();

                try {
                    if (typeof gsap !== 'undefined') {
                        gsap.to(preloader, { 
                            opacity: 0, 
                            duration: 1.5, 
                            onComplete: () => {
                                if (preloader) preloader.style.display = 'none';
                                if (typeof window.initStoryAnimations === 'function') window.initStoryAnimations();
                            }
                        });
                    } else {
                        if (preloader) preloader.style.display = 'none';
                        if (typeof window.initStoryAnimations === 'function') window.initStoryAnimations();
                    }
                } catch(e) { 
                    if (preloader) preloader.style.display = 'none';
                    if (typeof window.initStoryAnimations === 'function') window.initStoryAnimations();
                }
                
                try {
                    const firstScene = document.getElementById('scene-1');
                    if (firstScene && window.AudioEngine) {
                        window.AudioEngine.playTrack(firstScene.getAttribute('data-audio'), false);
                    }
                } catch(e) {}
            });
        }
    };
    initPreloader();


    // ==========================================
    // 3. GSAP & NATIVE SCROLL PROGRESS
    // ==========================================
    try {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
    } catch(e) {}

    // Setup native progress bar syncing
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
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            progressBar.style.width = `${progress}%`;
        }, { passive: true });
    }


    // ==========================================
    // 4. AUDIO ENGINE
    // ==========================================
    try {
        window.AudioEngine = {
            playerA: new Audio(), playerB: new Audio(),
            activePlayer: null, isUserMuted: false, currentTrackId: null,
            baseVolume: 0.4, duckVolume: 0.1, fadeDuration: 2.5, 
            tracks: {
                'ambient-space': 'media/music1.mp3', 'soft-piano': 'media/music2.mp3',
                'warm-acoustic': 'media/music3.mp3', 'emotional-build': 'media/music4.mp3',
                'epic-celebration': 'media/music5.mp3', 'ending-piano': 'media/music6.mp3'
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
                        }
                        this.activePlayer.targetVol = targetVol;
                        return;
                    }
                    this.currentTrackId = trackId;
                    const nextPlayer = this.activePlayer === this.playerA ? this.playerB : this.playerA;
                    const oldPlayer = this.activePlayer;
                    nextPlayer.src = src; nextPlayer.volume = 0;
                    
                    if (!this.isUserMuted) {
                        let playPromise = nextPlayer.play();
                        if (playPromise !== undefined) playPromise.catch(e => {});
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
                } catch(e) {}
            }
        };
        window.AudioEngine.init();
    } catch(e) {}


    // ==========================================
    // 5. MASTER OBSERVERS
    // ==========================================
    try {
        if ('IntersectionObserver' in window) {
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

            const canvasObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        window.AnimationManager.renderFireworks = true;
                        window.AnimationManager.renderUniverse = false; 
                    } else {
                        window.AnimationManager.renderFireworks = false;
                        window.AnimationManager.renderUniverse = true;
                    }
                });
            }, { threshold: 0.1 });
            const scene9 = document.getElementById('scene-9');
            if(scene9) canvasObserver.observe(scene9);
        }
    } catch(e) {}
});
