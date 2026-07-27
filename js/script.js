/**
 * js/script.js - Scroll-Lock Fixed & Native Fallback Enabled
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Execution] DOMContentLoaded");

    // ==========================================
    // 1. THE SINGLE MASTER ANIMATION MANAGER
    // ==========================================
    window.AnimationManager = {
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
            console.log("[Execution] AnimationManager.init()");
            
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

            // SAFE LENIS RAF (Won't crash engine if it fails)
            if (window.lenis) {
                try { window.lenis.raf(timestamp); } catch (e) {}
            }
            
            if (typeof gsap !== 'undefined') {
                try { gsap.ticker.tick(timestamp); } catch (e) {}
            }

            if (this.renderUniverse && this.universeTask) this.universeTask(timeScale);
            if (this.renderFireworks && this.fireworksTask) this.fireworksTask(timeScale);

            this.rafId = requestAnimationFrame(this.masterLoop.bind(this));
        }
    };


    // ==========================================
    // 2. PRELOADER & SCROLL UNLOCKER
    // ==========================================
    const initPreloader = () => {
        console.log("[Execution] initPreloader()");
        
        const preloader = document.getElementById('preloader');
        const enterBtn = document.getElementById('enter-btn');
        const loaderFill = document.querySelector('.loader-fill');
        const loadText = document.getElementById('load-text');
        
        let progress = 0;
        let isReady = false;

        const showEntry = () => {
            if (isReady) return;
            isReady = true;
            console.log("[Execution] showEntry()");
            
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
                console.log("[Execution] Enter button click");
                
                // CRITICAL: UNCONDITIONALLY UNLOCK NATIVE SCROLLING IMMEDIATELY
                document.documentElement.style.overflowY = 'auto';
                document.body.style.overflowY = 'auto';
                
                // ATTEMPT TO UNLOCK LENIS
                if (window.lenis) {
                    try { window.lenis.start(); } catch(e) { console.warn("[Lenis] Start Failed"); }
                }

                try {
                    if (typeof gsap !== 'undefined') {
                        gsap.to(preloader, { 
                            opacity: 0, 
                            duration: 1.5, 
                            onComplete: () => {
                                console.log("[Execution] hide preloader");
                                if (preloader) preloader.style.display = 'none';
                                
                                window.AnimationManager.init();
                                if (typeof window.initStoryAnimations === 'function') window.initStoryAnimations();
                            }
                        });
                    } else {
                        console.log("[Execution] hide preloader (GSAP fallback)");
                        if (preloader) preloader.style.display = 'none';
                        window.AnimationManager.init();
                    }
                } catch(e) { 
                    console.error("[Loader] Fade error:", e); 
                    if (preloader) preloader.style.display = 'none';
                    window.AnimationManager.init();
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
    // 3. GSAP & LENIS SETUP WITH NATIVE FALLBACK
    // ==========================================
    try {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
    } catch(e) {}

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
            
            // Stop initially for preloader
            lenis.stop(); 
            
            if (typeof ScrollTrigger !== 'undefined') {
                lenis.on('scroll', ScrollTrigger.update);
            }
            window.lenis = lenis;

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
        }
    } catch(e) {
        console.warn("[Lenis] Init Failed. Guaranteeing native fallback.");
        document.documentElement.style.overflowY = 'auto';
        document.body.style.overflowY = 'auto';
    }


    // ==========================================
    // 4. AUDIO ENGINE (Unchanged, completely safe)
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
                            
