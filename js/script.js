/**
 * js/script.js - GUARANTEED SCROLLING & VISUAL FEATURES
 * Merged logic for 100% fail-safe execution. No Lenis dependencies.
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
            
            // Sync Canvas Engines ONLY
            if (this.renderUniverse && typeof this.universeTask === 'function') {
                try { this.universeTask(timeScale); } catch(e) {}
            }
            if (this.renderFireworks && typeof this.fireworksTask === 'function') {
                try { this.fireworksTask(timeScale); } catch(e) {}
            }

            this.rafId = requestAnimationFrame(this.masterLoop.bind(this));
        }
    };


    // ==========================================
    // 2. PRELOADER - PLAIN JS FALLBACK GUARANTEE
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
                
                // CRITICAL FIX: Unlock native scroll securely
                if (document.body) document.body.classList.remove('scroll-locked');

                // CRITICAL FIX: Use pure plain Javascript CSS transitions to fade out
                // Completely bypasses GSAP to guarantee dismissal even if GSAP crashes
                if (preloader) {
                    preloader.style.transition = 'opacity 1.5s ease';
                    preloader.style.opacity = '0';
                    
                    const forceHidePreloader = setTimeout(() => {
                        preloader.style.display = 'none';
                        try {
                            if (typeof window.initStoryAnimations === 'function') window.initStoryAnimations();
                        } catch(e) { console.warn("[SafeFallback] GSAP Animations skipped.", e); }
                    }, 1500);
                } else {
                    try {
                        if (typeof window.initStoryAnimations === 'function') window.initStoryAnimations();
                    } catch(e) {}
                }

                // Initialize Master Loop securely
                try {
                    window.AnimationManager.init();
                } catch(e) { console.warn("[AnimationManager] Init failed:", e); }
                
                // Audio Engine kickstart
                try {
                    const firstScene = document.getElementById('scene-1');
                    if (firstScene && window.AudioEngine) {
                        window.AudioEngine.playTrack(firstScene.getAttribute('data-audio'), false);
                    }
                } catch(e) {}
            });
        }
    };
    
    // Safely attempt preloader init
    try {
        initPreloader();
    } catch(e) {
        console.error("[Preloader] Critical Failure", e);
        if (document.body) document.body.classList.remove('scroll-locked');
    }


    // ==========================================
    // 3. GSAP & NATIVE SCROLL PROGRESS
    // ==========================================
    try {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
    } catch(e) {}

    try {
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
                    try {
                        if (entry.isIntersecting && window.AudioEngine) {
                            const trackId = entry.target.getAttribute('data-audio');
                            const shouldDuck = entry.target.getAttribute('data-duck-audio') === 'true';
                            if (trackId) window.AudioEngine.playTrack(trackId, shouldDuck);
                        }
                    } catch(e) {}
                });
            }, { threshold: 0.5 });
            document.querySelectorAll('.scene[data-audio]').forEach(sec => sceneObserver.observe(sec));

            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    try {
                        const video = entry.target;
                        if (entry.isIntersecting) {
                            if (!video.src && video.dataset.src) { video.src = video.dataset.src; video.load(); }
                            if (typeof gsap !== 'undefined') { gsap.to(video, { opacity: 0.7, duration: 2 }); }
                            let playPromise = video.play();
                            if (playPromise !== undefined) playPromise.catch(e => {});
                        } else {
                            video.pause();
                        }
                    } catch(e) {}
                });
            }, { threshold: 0.1 });
            document.querySelectorAll('.story-video').forEach(vid => videoObserver.observe(vid));

            const canvasObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    try {
                        if (entry.isIntersecting) {
                            if(window.AnimationManager) {
                                window.AnimationManager.renderFireworks = true;
                                window.AnimationManager.renderUniverse = false;
                            }
                        } else {
                            if(window.AnimationManager) {
                                window.AnimationManager.renderFireworks = false;
                                window.AnimationManager.renderUniverse = true;
                            }
                        }
                    } catch(e) {}
                });
            }, { threshold: 0.1 });
            const scene9 = document.getElementById('scene-9');
            if(scene9) canvasObserver.observe(scene9);
        }
    } catch(e) {}


    // ==========================================
    // 6. UNIVERSE PARTICLES ENGINE
    // ==========================================
    try {
        const uCanvas = document.getElementById('universe-canvas');
        if (uCanvas) {
            const uCtx = uCanvas.getContext('2d', { alpha: false });
            let uw, uh;
            const MAX_STARS = 150;
            const stars = [];

            const uResize = () => {
                uw = uCanvas.width = window.innerWidth;
                uh = uCanvas.height = window.innerHeight;
            };
            window.addEventListener('resize', uResize, { passive: true });
            uResize();

            class Star {
                constructor() { this.reset(); }
                reset() {
                    this.x = Math.random() * uw;
                    this.y = Math.random() * uh;
                    this.size = Math.random() * 1.5 + 0.5;
                    this.baseAlpha = Math.random() * 0.5 + 0.2;
                    this.twinkleSpeed = Math.random() * 0.02 + 0.01;
                    this.twinklePhase = Math.random() * Math.PI * 2;
                    this.driftX = (Math.random() - 0.5) * 0.1;
                    this.driftY = (Math.random() - 0.5) * 0.1;
                    this.isGold = Math.random() > 0.85; 
                }
                update(timeScale) {
                    this.twinklePhase += this.twinkleSpeed * timeScale;
                    this.x += this.driftX * timeScale;
                    this.y += this.driftY * timeScale;
                    if (this.x > uw) this.x = 0; if (this.x < 0) this.x = uw;
                    if (this.y > uh) this.y = 0; if (this.y < 0) this.y = uh;
                }
                draw(ctx) {
                    const currentAlpha = Math.max(0, this.baseAlpha + Math.sin(this.twinklePhase) * 0.3);
                    ctx.fillStyle = this.isGold ? `rgba(212, 175, 55, ${currentAlpha})` : `rgba(255, 255, 255, ${currentAlpha})`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            class ShootingStar {
                constructor() { this.active = false; }
                spawn() {
                    this.active = true;
                    this.x = Math.random() * uw;
                    this.y = Math.random() * (uh * 0.3);
                    this.length = Math.random() * 80 + 50;
                    this.speed = Math.random() * 10 + 15;
                    this.angle = (Math.random() * 20 + 25) * (Math.PI / 180);
                    this.alpha = 1;
                }
                update(timeScale) {
                    if (!this.active) return;
                    this.x -= Math.cos(this.angle) * this.speed * timeScale;
                    this.y += Math.sin(this.angle) * this.speed * timeScale;
                    this.alpha -= 0.015 * timeScale;
                    if (this.alpha <= 0) this.active = false;
                }
                draw(ctx) {
                    if (!this.active) return;
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, this.alpha);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + Math.cos(this.angle) * this.length, this.y - Math.sin(this.angle) * this.length);
                    ctx.stroke();
                    ctx.restore();
                }
            }

            for (let i = 0; i < MAX_STARS; i++) stars.push(new Star());
            const shootingStar = new ShootingStar();

            if (window.AnimationManager) {
                window.AnimationManager.universeTask = (timeScale) => {
                    uCtx.fillStyle = '#030508'; 
                    uCtx.fillRect(0, 0, uw, uh);

                    const activeStarLimit = window.AnimationManager.lowQualityMode ? Math.floor(MAX_STARS / 2) : MAX_STARS;

                    for (let i = 0; i < activeStarLimit; i++) {
                        stars[i].update(timeScale);
                        stars[i].draw(uCtx);
                    }

                    if (!shootingStar.active && Math.random() < (0.001 * timeScale)) {
                        shootingStar.spawn();
                    }

                    shootingStar.update(timeScale);
                    shootingStar.draw(uCtx);
                };
            }
        }
    } catch(e) { console.warn("[Particles] Failed:", e); }


    // ==========================================
    // 7. FIREWORKS ENGINE
    // ==========================================
    try {
        const fCanvas = document.getElementById('fireworks-canvas');
        if (fCanvas) {
            const fCtx = fCanvas.getContext('2d', { alpha: true });
            let fw, fh;
            let lastLaunchTime = 0;
            const dpr = Math.min(window.devicePixelRatio || 1, 2); 
            const MAX_POOL_SIZE = 120;
            
            const fwColors = ['#D4AF37', '#FFC0CB', '#800080', '#FFFFFF', '#FFD700'];
            const sprites = fwColors.map(color => {
                const off = document.createElement('canvas');
                off.width = 8; off.height = 8;
                const oCtx = off.getContext('2d');
                oCtx.fillStyle = color;
                oCtx.beginPath();
                oCtx.arc(4, 4, 2.5, 0, Math.PI * 2);
                oCtx.fill();
                return off;
            });

            const fResize = () => {
                fCanvas.style.width = window.innerWidth + 'px';
                fCanvas.style.height = window.innerHeight + 'px';
                fw = fCanvas.width = window.innerWidth * dpr;
                fh = fCanvas.height = window.innerHeight * dpr;
                fCtx.scale(dpr, dpr);
                fw = window.innerWidth;
                fh = window.innerHeight;
            };
            window.addEventListener('resize', fResize, { passive: true });
            fResize();

            class PooledParticle {
                constructor() { this.active = false; }
                spawn(x, y, spriteIndex) {
                    this.active = true;
                    this.x = x; this.y = y;
                    this.spriteIndex = spriteIndex;
                    const angle = Math.random() * 6.283185; 
                    const speed = Math.random() * 7 + 2; 
                    this.vx = Math.cos(angle) * speed;
                    this.vy = Math.sin(angle) * speed;
                    this.friction = 0.95;
                    this.gravity = 0.15;
                    this.alpha = 1;
                    this.decay = Math.random() * 0.02 + 0.015;
                }
                update(timeScale) {
                    if (!this.active) return;
                    this.vx *= Math.pow(this.friction, timeScale);
                    this.vy *= Math.pow(this.friction, timeScale);
                    this.vy += this.gravity * timeScale;
                    this.x += this.vx * timeScale;
                    this.y += this.vy * timeScale;
                    this.alpha -= this.decay * timeScale;
                    if (this.alpha <= 0 || this.x < 0 || this.x > fw || this.y > fh) {
                        this.active = false;
                    }
                }
                draw(ctx) {
                    if (!this.active) return;
                    ctx.globalAlpha = Math.max(0, this.alpha);
                    ctx.drawImage(sprites[this.spriteIndex], this.x - 4, this.y - 4);
                }
            }

            const particlePool = Array.from({ length: MAX_POOL_SIZE }, () => new PooledParticle());

            const launchFirework = () => {
                const now = Date.now();
                const isLowQ = window.AnimationManager && window.AnimationManager.lowQualityMode;
                const cooldown = isLowQ ? 800 : 400;
                const burstSize = isLowQ ? 25 : 50;

                if (now - lastLaunchTime < cooldown) return; 
                
                const cx = Math.random() * (fw * 0.8) + (fw * 0.1);
                const cy = Math.random() * (fh * 0.5) + (fh * 0.1);
                const spriteIndex = Math.floor(Math.random() * sprites.length);
                
                let spawned = 0;
                for (let i = 0; i < particlePool.length; i++) {
                    if (!particlePool[i].active) {
                        particlePool[i].spawn(cx, cy, spriteIndex);
                        spawned++;
                    }
                    if (spawned >= burstSize) break;
                }
                if (spawned > 0) lastLaunchTime = now;
            };

            if (window.AnimationManager) {
                window.AnimationManager.fireworksTask = (timeScale) => {
                    fCtx.globalCompositeOperation = 'source-over';
                    fCtx.globalAlpha = 0.25; 
                    fCtx.fillStyle = '#030508'; 
                    fCtx.fillRect(0, 0, fw, fh);
                    fCtx.globalCompositeOperation = 'lighter';

                    if (Math.random() < (0.03 * timeScale)) launchFirework();

                    for (let i = 0; i < particlePool.length; i++) {
                        if (particlePool[i].active) {
                            particlePool[i].update(timeScale);
                            particlePool[i].draw(fCtx);
                        }
                    }
                };
            }
        }
    } catch(e) { console.warn("[Fireworks] Failed:", e); }


    // ==========================================
    // 8. GSAP STORY ANIMATIONS (Visual Features)
    // ==========================================
    window.initStoryAnimations = function() {
        // Accessibility Guard
        try {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                if (typeof gsap !== 'undefined') {
                    gsap.set('.reveal-text, .memory-card, .typewriter-target span', { opacity: 1, y: 0 });
                }
                return;
            }
        } catch(e) {}

        // Reveal Texts
        try {
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                gsap.utils.toArray('.reveal-text').forEach(text => {
                    let startDelay = text.classList.contains('delay-2') ? 1.0 : (text.classList.contains('delay-1') ? 0.5 : 0);
                    gsap.from(text, {
                        scrollTrigger: { trigger: text, start: "top 85%", toggleActions: "play none none reverse" },
                        y: 40, opacity: 0, duration: 1.5, ease: "power3.out", delay: startDelay
                    });
                });
            }
        } catch(e) { console.warn("[Animations] Reveal text failed", e); }

        // Hero Parallax
        try {
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                if (document.querySelector('.hero-img')) {
                    gsap.to('.hero-img', {
                        scrollTrigger: { trigger: '#scene-3', start: 'top bottom', end: 'bottom top', scrub: true },
                        yPercent: 15, scale: 1.05, ease: "none"
                    });
                }
            }
        } catch(e) { console.warn("[Animations] Hero parallax failed", e); }

        // Memory Gallery
        try {
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
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
            }
        } catch(e) { console.warn("[Animations] Memory gallery failed", e); }

        // Typewriter
        try {
            const letter = document.querySelector('.typewriter-target');
            if (letter && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
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
                gsap.to(letter.querySelectorAll('span'), {
                    scrollTrigger: { trigger: '#scene-6', start: 'top 75%' },
                    opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: "power1.out"
                });
            }
        } catch(e) { console.warn("[Animations] Typewriter failed", e); }

        // Gift
        try {
            const giftTrigger = document.getElementById('gift-trigger');
            const giftBox = document.querySelector('.gift-box');
            if (giftTrigger && giftBox) {
                if (typeof gsap !== 'undefined') {
                    gsap.to(giftBox, { y: -15, repeat: -1, yoyo: true, duration: 2.5, ease: "sine.inOut" });
                    
                    giftTrigger.addEventListener('click', () => {
                        giftTrigger.style.pointerEvents = 'none';
                        const tl = gsap.timeline();
                        tl.to(giftBox, { scale: 1.1, rotation: 5, duration: 0.1, yoyo: true, repeat: 3, ease: "none" })
                          .to(giftBox, { scale: 1.5, opacity: 0, filter: "brightness(2)", duration: 0.4, ease: "power2.in" })
                          .to(giftTrigger.querySelector('p'), { opacity: 0, duration: 0.3 }, "<")
                          .add(() => {
                              // Native scroll down to Fireworks Scene
                              const scene9 = document.getElementById('scene-9');
                              if (scene9) scene9.scrollIntoView({ behavior: 'smooth' });
                          });
                    });
                } else {
                    // Fallback if GSAP is missing: pure native scroll
                    giftTrigger.addEventListener('click', () => {
                        const scene9 = document.getElementById('scene-9');
                        if (scene9) scene9.scrollIntoView({ behavior: 'smooth' });
                    });
                }
            }
        } catch(e) { console.warn("[Animations] Gift interaction failed", e); }

        // Title
        try {
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                const grandTitle = document.querySelector('.grand-title');
                if (grandTitle) {
                    gsap.from(grandTitle, {
                        scrollTrigger: { trigger: '#scene-9', start: "top 60%" },
                        scale: 0.8, opacity: 0, duration: 2, ease: "elastic.out(1, 0.3)"
                    });
                }
            }
        } catch(e) { console.warn("[Animations] Title animation failed", e); }
    };
});
