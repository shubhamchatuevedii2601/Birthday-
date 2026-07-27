/**
 * js/script.js - THE MONOLITHIC ENGINE
 * Contains everything safely routed to avoid race conditions.
 */
document.addEventListener('DOMContentLoaded', () => {

    // 1. GLOBAL STATE
    window.userInteracted = false;
    window.renderUniverse = null;
    window.renderFireworks = null;

    // 2. SAFE LENIS INIT
    let lenis;
    try {
        if (typeof Lenis !== 'undefined') {
            lenis = new Lenis({
                duration: 1.5,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
                smoothTouch: false, // Prevents Android scroll freeze
                touchMultiplier: 2.5
            });
            lenis.stop(); // Stop completely during load
            window.lenis = lenis;
        }
    } catch(e) { console.warn("[Lenis] Native scroll fallback active."); }

    // 3. MASTER GSAP TICKER
    try {
        if (typeof gsap !== 'undefined') {
            if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
            
            if (lenis) {
                if (typeof ScrollTrigger !== 'undefined') lenis.on('scroll', ScrollTrigger.update);
                gsap.ticker.add((time) => { lenis.raf(time * 1000); });
                gsap.ticker.lagSmoothing(0);
            }

            gsap.ticker.add((time, deltaTime) => {
                const timeScale = Math.min(deltaTime, 50) / 16.666;
                if (window.renderUniverse) window.renderUniverse(timeScale);
                if (window.renderFireworks) window.renderFireworks(timeScale);
            });
        } else {
            // Fallback Engine if GSAP fails entirely
            let lastTime = performance.now();
            const fallbackLoop = (time) => {
                const dt = time - lastTime; lastTime = time;
                const timeScale = Math.min(dt, 50) / 16.666;
                if (lenis) lenis.raf(time);
                if (window.renderUniverse) window.renderUniverse(timeScale);
                if (window.renderFireworks) window.renderFireworks(timeScale);
                requestAnimationFrame(fallbackLoop);
            };
            requestAnimationFrame(fallbackLoop);
        }
    } catch(e) {}

    // Scroll Progress Tracker
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
                progressBar.style.width = scrollHeight > 0 ? `${(scrollTop / scrollHeight) * 100}%` : '0%';
            }, { passive: true });
        }
    } catch(e) {}

    // 4. AUDIO ENGINE
    try {
        window.AudioEngine = {
            playerA: new Audio(), playerB: new Audio(),
            activePlayer: null, currentTrackId: null,
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
                if (!window.userInteracted) return; 
                try {
                    const src = this.tracks[trackId];
                    if (!src) return;
                    const targetVol = shouldDuck ? this.duckVolume : this.baseVolume;
                    if (this.currentTrackId === trackId) {
                        if (typeof gsap !== 'undefined') gsap.to(this.activePlayer, { volume: targetVol, duration: this.fadeDuration, overwrite: true });
                        return;
                    }
                    this.currentTrackId = trackId;
                    const nextPlayer = this.activePlayer === this.playerA ? this.playerB : this.playerA;
                    const oldPlayer = this.activePlayer;
                    nextPlayer.src = src; nextPlayer.volume = 0;
                    
                    let playPromise = nextPlayer.play();
                    if (playPromise !== undefined) playPromise.catch(e => {});
                    
                    if (typeof gsap !== 'undefined') {
                        gsap.to(nextPlayer, { volume: targetVol, duration: this.fadeDuration, overwrite: true });
                        gsap.to(oldPlayer, { volume: 0, duration: this.fadeDuration, overwrite: true, onComplete: () => oldPlayer.pause() });
                    } else {
                        nextPlayer.volume = targetVol; oldPlayer.pause();
                    }
                    this.activePlayer = nextPlayer;
                } catch(e) {}
            },
            checkCurrentScene() {
                document.querySelectorAll('.scene[data-audio]').forEach(sec => {
                    const rect = sec.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom >= 0) {
                        this.playTrack(sec.getAttribute('data-audio'), sec.getAttribute('data-duck-audio') === 'true');
                    }
                });
            }
        };
        window.AudioEngine.init();
    } catch(e) {}

    // 5. OBSERVERS
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
                        if (typeof gsap !== 'undefined') gsap.to(video, { opacity: 0.7, duration: 2 });
                        let playPromise = video.play();
                        if (playPromise !== undefined) playPromise.catch(e => {});
                    } else {
                        video.pause();
                    }
                });
            }, { threshold: 0.1 });
            document.querySelectorAll('.story-video').forEach(vid => videoObserver.observe(vid));
            
            // Protect CPU by disabling universe during fireworks
            const canvasObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    window.renderFireworks = entry.isIntersecting ? window._fwTask : null;
                    window.renderUniverse = entry.isIntersecting ? null : window._uniTask;
                });
            }, { threshold: 0.1 });
            const scene9 = document.getElementById('scene-9');
            if (scene9) canvasObserver.observe(scene9);
        }
    } catch(e) {}

    // 6. UNIVERSE ENGINE
    try {
        const canvas = document.getElementById('universe-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d', { alpha: false });
            let w, h;
            const MAX_STARS = 150;
            const stars = [];

            const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
            window.addEventListener('resize', resize, { passive: true }); resize();

            class Star {
                constructor() { this.reset(); }
                reset() {
                    this.x = Math.random() * w; this.y = Math.random() * h;
                    this.size = Math.random() * 1.5 + 0.5; this.baseAlpha = Math.random() * 0.5 + 0.2;
                    this.twinkleSpeed = Math.random() * 0.02 + 0.01; this.twinklePhase = Math.random() * Math.PI * 2;
                    this.driftX = (Math.random() - 0.5) * 0.1; this.driftY = (Math.random() - 0.5) * 0.1;
                    this.isGold = Math.random() > 0.85; 
                }
                update(ts) {
                    this.twinklePhase += this.twinkleSpeed * ts; this.x += this.driftX * ts; this.y += this.driftY * ts;
                    if (this.x > w) this.x = 0; if (this.x < 0) this.x = w;
                    if (this.y > h) this.y = 0; if (this.y < 0) this.y = h;
                }
                draw(ctx) {
                    const currentAlpha = Math.max(0, this.baseAlpha + Math.sin(this.twinklePhase) * 0.3);
                    ctx.fillStyle = this.isGold ? `rgba(212, 175, 55, ${currentAlpha})` : `rgba(255, 255, 255, ${currentAlpha})`;
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
                }
            }

            class ShootingStar {
                constructor() { this.active = false; }
                spawn() {
                    this.active = true; this.x = Math.random() * w; this.y = Math.random() * (h * 0.3);
                    this.length = Math.random() * 80 + 50; this.speed = Math.random() * 10 + 15;
                    this.angle = (Math.random() * 20 + 25) * (Math.PI / 180); this.alpha = 1;
                }
                update(ts) {
                    if (!this.active) return;
                    this.x -= Math.cos(this.angle) * this.speed * ts; this.y += Math.sin(this.angle) * this.speed * ts;
                    this.alpha -= 0.015 * ts; if (this.alpha <= 0) this.active = false;
                }
                draw(ctx) {
                    if (!this.active) return;
                    ctx.save(); ctx.globalAlpha = Math.max(0, this.alpha);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + Math.cos(this.angle) * this.length, this.y - Math.sin(this.angle) * this.length);
                    ctx.stroke(); ctx.restore();
                }
            }

            for (let i = 0; i < MAX_STARS; i++) stars.push(new Star());
            const sStar = new ShootingStar();

            window._uniTask = (ts) => {
                ctx.fillStyle = '#030508'; ctx.fillRect(0, 0, w, h);
                for (let i = 0; i < MAX_STARS; i++) { stars[i].update(ts); stars[i].draw(ctx); }
                if (!sStar.active && Math.random() < (0.001 * ts)) sStar.spawn();
                sStar.update(ts); sStar.draw(ctx);
            };
            window.renderUniverse = window._uniTask; // Default On
        }
    } catch(e) {}

    // 7. FIREWORKS ENGINE
    try {
        const canvas = document.getElementById('fireworks-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d', { alpha: true });
            let w, h; let lastLaunchTime = 0;
            const dpr = Math.min(window.devicePixelRatio || 1, 2); 
            
            const fwColors = ['#D4AF37', '#FFC0CB', '#800080', '#FFFFFF', '#FFD700'];
            const sprites = fwColors.map(color => {
                const off = document.createElement('canvas'); off.width = 8; off.height = 8;
                const oCtx = off.getContext('2d');
                oCtx.fillStyle = color; oCtx.beginPath(); oCtx.arc(4, 4, 2.5, 0, Math.PI * 2); oCtx.fill();
                return off;
            });

            const resize = () => {
                canvas.style.width = window.innerWidth + 'px'; canvas.style.height = window.innerHeight + 'px';
                w = canvas.width = window.innerWidth * dpr; h = canvas.height = window.innerHeight * dpr;
                ctx.scale(dpr, dpr); w = window.innerWidth; h = window.innerHeight;
            };
            window.addEventListener('resize', resize, { passive: true }); resize();

            class Particle {
                constructor() { this.active = false; }
                spawn(x, y, sIdx) {
                    this.active = true; this.x = x; this.y = y; this.sIdx = sIdx;
                    const a = Math.random() * 6.283185; const s = Math.random() * 7 + 2; 
                    this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
                    this.friction = 0.95; this.gravity = 0.15; this.alpha = 1; this.decay = Math.random() * 0.02 + 0.015;
                }
                update(ts) {
                    if (!this.active) return;
                    this.vx *= Math.pow(this.friction, ts); this.vy *= Math.pow(this.friction, ts);
                    this.vy += this.gravity * ts; this.x += this.vx * ts; this.y += this.vy * ts;
                    this.alpha -= this.decay * ts;
                    if (this.alpha <= 0 || this.x < 0 || this.x > w || this.y > h) this.active = false;
                }
                draw(ctx) {
                    if (!this.active) return;
                    ctx.globalAlpha = Math.max(0, this.alpha);
                    ctx.drawImage(sprites[this.sIdx], this.x - 4, this.y - 4);
                }
            }

            const pool = Array.from({ length: 120 }, () => new Particle());

            window._fwTask = (ts) => {
                ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.25; 
                ctx.fillStyle = '#030508'; ctx.fillRect(0, 0, w, h);
                ctx.globalCompositeOperation = 'lighter';

                const now = Date.now();
                if (Math.random() < (0.03 * ts) && (now - lastLaunchTime > 400)) {
                    const cx = Math.random() * (w * 0.8) + (w * 0.1); const cy = Math.random() * (h * 0.5) + (h * 0.1);
                    const sIdx = Math.floor(Math.random() * sprites.length);
                    let spawned = 0;
                    for (let i = 0; i < pool.length; i++) {
                        if (!pool[i].active) { pool[i].spawn(cx, cy, sIdx); spawned++; }
                        if (spawned >= 40) break;
                    }
                    if (spawned > 0) lastLaunchTime = now;
                }
                for (let i = 0; i < pool.length; i++) {
                    if (pool[i].active) { pool[i].update(ts); pool[i].draw(ctx); }
                }
            };
        }
    } catch(e) {}

    // 8. GSAP STORY ANIMATIONS
    window.initStoryAnimations = function() {
        try {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                if (typeof gsap !== 'undefined') gsap.set('.reveal-text, .memory-card, .typewriter-target span', { opacity: 1, y: 0 });
                return;
            }
        } catch(e) {}

        try {
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                gsap.utils.toArray('.reveal-text').forEach(text => {
                    let d = text.classList.contains('delay-2') ? 1.0 : (text.classList.contains('delay-1') ? 0.5 : 0);
                    gsap.from(text, { scrollTrigger: { trigger: text, start: "top 85%", toggleActions: "play none none reverse" }, y: 40, opacity: 0, duration: 1.5, ease: "power3.out", delay: d });
                });

                if (document.querySelector('.hero-img')) {
                    gsap.to('.hero-img', { scrollTrigger: { trigger: '#scene-3', start: 'top bottom', end: 'bottom top', scrub: true }, yPercent: 15, scale: 1.05, ease: "none" });
                }

                const mCards = gsap.utils.toArray('.memory-card');
                if (mCards.length > 0) {
                    gsap.set(mCards, { opacity: 0, y: 100, rotationZ: () => gsap.utils.random(-8, 8), rotationX: 15 });
                    ScrollTrigger.batch(mCards, {
                        start: "top 80%", onEnter: (els) => { gsap.to(els, { opacity: 1, y: 0, rotationX: 0, stagger: 0.2, duration: 1.2, ease: "power2.out", overwrite: true }); }
                    });
                }

                const letter = document.querySelector('.typewriter-target');
                if (letter) {
                    const words = letter.innerText.split(' '); letter.innerHTML = '';
                    words.forEach(word => {
                        const span = document.createElement('span'); span.innerText = word + ' ';
                        span.style.opacity = 0; span.style.display = 'inline-block'; span.style.transform = 'translateY(10px)'; letter.appendChild(span);
                    });
                    gsap.to(letter.querySelectorAll('span'), { scrollTrigger: { trigger: '#scene-6', start: 'top 75%' }, opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: "power1.out" });
                }

                const gTitle = document.querySelector('.grand-title');
                if (gTitle) {
                    gsap.from(gTitle, { scrollTrigger: { trigger: '#scene-9', start: "top 60%" }, scale: 0.8, opacity: 0, duration: 2, ease: "elastic.out(1, 0.3)" });
                }

                const giftBtn = document.getElementById('gift-trigger');
                const giftBox = document.querySelector('.gift-box');
                if (giftBtn && giftBox) {
                    gsap.to(giftBox, { y: -15, repeat: -1, yoyo: true, duration: 2.5, ease: "sine.inOut" });
                    giftBtn.addEventListener('click', () => {
                        giftBtn.style.pointerEvents = 'none';
                        const tl = gsap.timeline();
                        tl.to(giftBox, { scale: 1.1, rotation: 5, duration: 0.1, yoyo: true, repeat: 3, ease: "none" })
                          .to(giftBox, { scale: 1.5, opacity: 0, filter: "brightness(2)", duration: 0.4, ease: "power2.in" })
                          .to(giftBtn.querySelector('p'), { opacity: 0, duration: 0.3 }, "<")
                          .add(() => {
                              const s9 = document.getElementById('scene-9');
                              if (s9) {
                                  if (window.lenis) window.lenis.scrollTo('#scene-9', { duration: 2.5, ease: "power3.inOut" });
                                  else s9.scrollIntoView({ behavior: 'smooth' });
                              }
                          });
                    });
                }
            }
        } catch(e) {}
    };

    // 9. PRELOADER & SECURE DISMISSAL
    const initPreloader = () => {
        const preloader = document.getElementById('preloader');
        const enterBtn = document.getElementById('enter-btn');
        const loaderFill = document.querySelector('.loader-fill');
        const loadText = document.getElementById('load-text');
        
        let progress = 0; let isReady = false;

        const showEntry = () => {
            if (isReady) return;
            isReady = true;
            if (loadText) loadText.style.display = 'none';
            if (loaderFill) loaderFill.style.width = '100%';
  
