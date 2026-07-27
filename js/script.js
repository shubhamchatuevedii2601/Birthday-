/**
 * js/script.js - Core Bootstrapping, Audio Engine, Scroll & Observers
 */
document.addEventListener('DOMContentLoaded', () => {
    
    gsap.registerPlugin(ScrollTrigger);

    // --- LENIS SMOOTH SCROLL ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        direction: 'vertical',
        gestureDirection: 'vertical',
        smoothTouch: false,
        touchMultiplier: 2
    });

    lenis.stop(); // Pause until loading is complete
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    lenis.on('scroll', ({ progress }) => {
        document.getElementById('scroll-progress').style.width = `${progress * 100}%`;
    });
    window.lenis = lenis;

    // --- CUSTOM CURSOR ---
    const customCursor = document.getElementById('custom-cursor');
    if (window.matchMedia("(pointer: fine)").matches && customCursor) {
        window.addEventListener('mousemove', (e) => {
            gsap.to(customCursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: "power2.out", overwrite: "auto" });
        }, { passive: true });
        
        const interactables = document.querySelectorAll('button, .polaroid, .img-3d, .glass-card, #luxury-gift');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => gsap.to(customCursor, { scale: 1.5, backgroundColor: 'rgba(212,175,55,0.2)' }));
            el.addEventListener('mouseleave', () => gsap.to(customCursor, { scale: 1, backgroundColor: 'transparent' }));
        });
    }

    // --- CINEMATIC AUDIO ENGINE ---
    window.AudioEngine = {
        playerA: new Audio(),
        playerB: new Audio(),
        activePlayer: null,
        isUserMuted: false, 
        currentSrc: null,
        baseVolume: 0.5,
        duckVolume: 0.15, // Volume ducks when a video is playing
        fadeDuration: 2.5, // Smooth 2.5s crossfade transition
        
        init() {
            this.playerA.loop = true;
            this.playerB.loop = true;
            this.activePlayer = this.playerA;
        },
        
        playTrack(src, isVideo) {
            const targetVol = isVideo ? this.duckVolume : this.baseVolume;
            
            // If same track, simply adjust volume via crossfade (for video ducking)
            if (this.currentSrc === src) {
                if (!this.isUserMuted) {
                    gsap.to(this.activePlayer, { volume: targetVol, duration: this.fadeDuration, overwrite: true });
                }
                this.activePlayer.targetVol = targetVol;
                return;
            }
            
            this.currentSrc = src;
            const nextPlayer = this.activePlayer === this.playerA ? this.playerB : this.playerA;
            const oldPlayer = this.activePlayer;
            
            nextPlayer.src = src;
            nextPlayer.volume = 0;
            
            if (!this.isUserMuted) {
                nextPlayer.play().catch(()=>{});
                gsap.to(nextPlayer, { volume: targetVol, duration: this.fadeDuration, overwrite: true });
                gsap.to(oldPlayer, { volume: 0, duration: this.fadeDuration, overwrite: true, onComplete: () => {
                    oldPlayer.pause();
                }});
            } else {
                nextPlayer.volume = 0;
                oldPlayer.pause();
            }
            
            this.activePlayer = nextPlayer;
            this.activePlayer.targetVol = targetVol;
        },
        
        toggleMute() {
            this.isUserMuted = !this.isUserMuted;
            if (this.isUserMuted) {
                gsap.to(this.activePlayer, { volume: 0, duration: 1, overwrite: true, onComplete: () => {
                    this.activePlayer.pause();
                }});
            } else {
                this.activePlayer.play().catch(()=>{});
                gsap.to(this.activePlayer, { volume: this.activePlayer.targetVol || this.baseVolume, duration: 1, overwrite: true });
            }
        }
    };
    window.AudioEngine.init();

    // Scene Audio Observer (Detects current scene and triggers correct soundtrack)
    const audioObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const src = entry.target.dataset.bgm;
                const isVideo = entry.target.dataset.sceneType === 'video';
                if (src) window.AudioEngine.playTrack(src, isVideo);
            }
        });
    }, { threshold: 0.5 }); // Triggers when 50% of the section is visible

    document.querySelectorAll('section[data-bgm]').forEach(sec => audioObserver.observe(sec));

    // Audio UI Toggle
    const audioBtn = document.getElementById('audio-btn');
    audioBtn.addEventListener('click', () => {
        window.AudioEngine.toggleMute();
        audioBtn.innerHTML = window.AudioEngine.isUserMuted ? '🔇' : '🔊';
    });


    // --- VIDEO INTERSECTION OBSERVER ---
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                if (!video.src && video.dataset.src) {
                    video.src = video.dataset.src;
                    video.load();
                }
                gsap.to(video, { opacity: 0.5, duration: 2 });
                video.play().catch(()=>{});
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.smart-video').forEach(video => {
        if(!video.classList.contains('hidden')) {
            videoObserver.observe(video);
        }
    });
    window.videoObserver = videoObserver;


    // --- PRELOADER ---
    const initPreloader = () => {
        let progress = 0;
        const progressFill = document.getElementById('progress-bar-fill');
        const progressText = document.getElementById('progress-text');
        const enterBtn = document.getElementById('enter-btn');
        const loadingScreen = document.getElementById('loading-screen');
        
        const simInterval = setInterval(() => {
            if (progress < 90) {
                progress += Math.random() * 8;
                if (progress > 90) progress = 90;
                progressFill.style.width = `${progress}%`;
                progressText.innerText = `${Math.floor(progress)}%`;
            }
        }, 150);

        const loadComplete = () => {
            clearInterval(simInterval);
            progressFill.style.width = `100%`;
            progressText.innerText = `100%`;
            setTimeout(() => {
                progressText.style.display = 'none';
                document.querySelector('.progress-container').style.display = 'none';
                document.querySelector('#loading-screen h1').innerText = "An Elegant Journey";
                
                const spinner = document.querySelector('.loading-spinner');
                if(spinner) spinner.style.display = 'none';

                enterBtn.classList.remove('hidden');
                enterBtn.classList.add('visible');
            }, 500);
        };

        if (document.readyState === 'complete') {
            setTimeout(loadComplete, 1000);
        } else {
            window.addEventListener('load', () => setTimeout(loadComplete, 500));
        }

        enterBtn.addEventListener('click', () => {
            gsap.to(loadingScreen, { opacity: 0, duration: 1, ease: "power2.inOut", onComplete: () => {
                loadingScreen.style.display = 'none';
                lenis.start();
                
                // Initialize modules
                if(window.initParticles) window.initParticles();
                if(window.initFireworks) window.initFireworks();
                if(window.initAnimations) window.initAnimations();
            }});
            
            // Kickstart AudioEngine with user gesture payload on Scene 1
            const firstScene = document.getElementById('scene-1');
            window.AudioEngine.playTrack(firstScene.dataset.bgm, false);
        });
    };

    initPreloader();
});

