/**
 * js/script.js - Core Bootstrapping & Single-Loop Master Animation Engine
 * DeltaTime synced. Strictly 1 rAF loop. Auto-throttling on FPS drop.
 */
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. THE SINGLE MASTER ANIMATION MANAGER
    // ==========================================
    window.AnimationManager = {
        isRunning: true,
        lastTime: performance.now(),
        fps: 60,
        fpsHistory: [],
        lowQualityMode: false,
        
        // Scene visibility states
        renderUniverse: true, 
        renderFireworks: false,
        
        // Callbacks from canvas engines
        universeTask: null,
        fireworksTask: null,

        init() {
            // Disable GSAP's native rAF. We own the loop now.
            if (typeof gsap !== 'undefined') gsap.ticker.useRAF(false);

            // Pause ALL rendering when tab is hidden (Saves 100% battery)
            document.addEventListener("visibilitychange", () => {
                if (document.hidden) {
                    this.isRunning = false;
                } else {
                    this.isRunning = true;
                    this.lastTime = performance.now();
                    requestAnimationFrame(this.masterLoop.bind(this));
                }
            });

            // Start Master Loop
            requestAnimationFrame(this.masterLoop.bind(this));
        },

        masterLoop(timestamp) {
            if (!this.isRunning) return;

            // Calculate DeltaTime (dt)
            const dt = timestamp - this.lastTime;
            this.lastTime = timestamp;

            // Cap dt at 50ms to prevent massive jumps if tab lags
            const safeDt = Math.min(dt, 50); 
            const timeScale = safeDt / 16.666; // 1.0 at 60FPS

            // FPS Monitor & Dynamic Throttling
            if (safeDt > 0) {
                const currentFps = 1000 / safeDt;
                this.fpsHistory.push(currentFps);
                if (this.fpsHistory.length > 30) this.fpsHistory.shift();
                
                this.fps = this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;

                // If average FPS drops below 50, permanently enable low quality mode
                if (this.fps < 50 && !this.lowQualityMode) {
                    this.lowQualityMode = true;
                    console.warn("[AnimationManager] FPS dropped. Activating Low Quality Mode.");
                }
            }

            // A. UPDATE LENIS (Smooth Scroll)
            if (window.lenis) window.lenis.raf(timestamp);

            // B. UPDATE GSAP (Animations & ScrollTriggers)
            if (typeof gsap !== 'undefined') gsap.ticker.tick(timestamp);

            // C. UPDATE CANVAS ENGINES (Time-scaled)
            if (this.renderUniverse && this.universeTask) {
                this.universeTask(timeScale);
            }
            if (this.renderFireworks && this.fireworksTask) {
                this.fireworksTask(timeScale);
            }

            // Loop
            requestAnimationFrame(this.masterLoop.bind(this));
        }
    };

    // Initialize the Master Engine immediately
    window.AnimationManager.init();


    // ==========================================
    // 2. PRELOADER WITH 3-SECOND FAILSAFE
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
                clearInterval(simInterval); showEntry();
            }
        }, 150);

        if (enterBtn) {
            enterBtn.addEventListener('click', () => {
                try {
                    if (typeof gsap !== 'undefined') {
                        gsap.to(preloader, { opacity: 0, duration: 1.5, onComplete: () => {
                            if (preloader) preloader.style.display = 'none';
                            if (window.lenis) window.lenis.start();
                            if (typeof window.initStoryAnimations === 'function') window.initStoryAnimations();
                        }});
                    } else {
                        if (preloader) preloader.style.display = 'none';
                        if (window.lenis) window.lenis.start();
                    }
                } catch(e) { console.error("[Loader] Fade error:", e); }
                
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
    // 3. GSAP & LENIS SETUP
    // ==========================================
    try {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
    } catch(e) {}

    try {
        if (typeof Lenis !== 'undefined') {
            const lenis = new Lenis({
                duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true, smoothTouch: true, touchMultiplier: 2.5, infinite: false
            });
            lenis.stop(); 
            if (typeof ScrollTrigger !== 'undefined') lenis.on('scroll', ScrollTrigger.update);
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
    } catch(e) {}


    // ==========================================
    // 4. AUDIO ENGINE
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
    // 5. MASTER OBSERVERS (Audio, Video, Canvas)
    // ==========================================
    try {
        if ('IntersectionObserver' in window) {
            
            // Audio Scene Observer
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

            // Canvas Engine Router (Pauses Universe during Fireworks)
            const canvasObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        window.AnimationManager.renderFireworks = true;
                        window.AnimationManager.renderUniverse = false; // Turn off universe logic to save CPU
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
