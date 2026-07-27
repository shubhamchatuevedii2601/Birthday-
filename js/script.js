/**
 * js/script.js - Core Bootstrapping, Cinematic Audio Engine, and Scroll Observer
 * Handles the preloader, Lenis smooth scrolling, and seamless audio crossfading.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. REGISTER GSAP PLUGINS
    gsap.registerPlugin(ScrollTrigger);

    // 2. INITIALIZE LENIS SMOOTH SCROLL (Optimized for both Desktop & Mobile)
    const lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        smoothTouch: true, // Forces smooth momentum scrolling on mobile
        touchMultiplier: 2.5,
        infinite: false
    });

    lenis.stop(); // Lock scrolling while preloader is active

    // Connect Lenis to GSAP Ticker for synchronized animations
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.lenis = lenis; // Expose globally for other modules

    // Scroll Progress Bar Logic
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    
    // Inject missing styles dynamically to prevent layout shifts without touching style.css
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
            progressBar.style.width = `${progress * 100}%`;
        });
    }

    // 3. CINEMATIC AUDIO ENGINE (Dual-Player Pool)
    window.AudioEngine = {
        playerA: new Audio(),
        playerB: new Audio(),
        activePlayer: null,
        isUserMuted: false, 
        currentTrackId: null,
        baseVolume: 0.4,
        duckVolume: 0.1, // Drastically lower volume when characters/videos speak
        fadeDuration: 2.5, 
        
        // Map data-audio attributes to local files
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
            const src = this.tracks[trackId];
            if (!src) return;

            const targetVol = shouldDuck ? this.duckVolume : this.baseVolume;
            
            // If the same track is playing, just gracefully adjust the volume (duck/unduck)
            if (this.currentTrackId === trackId) {
                if (!this.isUserMuted) {
                    gsap.to(this.activePlayer, { volume: targetVol, duration: this.fadeDuration, overwrite: true });
                }
                this.activePlayer.targetVol = targetVol;
                return;
            }
            
            // Crossfade to new track
            this.currentTrackId = trackId;
            const nextPlayer = this.activePlayer === this.playerA ? this.playerB : this.playerA;
            const oldPlayer = this.activePlayer;
            
            nextPlayer.src = src;
            nextPlayer.volume = 0;
            
            if (!this.isUserMuted) {
                nextPlayer.play().catch(() => {}); // Catch prevents iOS unhandled promise errors
                gsap.to(nextPlayer, { volume: targetVol, duration: this.fadeDuration, overwrite: true });
                
                // Fade out old track then pause to save memory
                gsap.to(oldPlayer, { volume: 0, duration: this.fadeDuration, overwrite: true, onComplete: () => {
                    oldPlayer.pause();
                }});
            } else {
                nextPlayer.volume = 0;
                oldPlayer.pause();
            }
            
            this.activePlayer = nextPlayer;
            this.activePlayer.targetVol = targetVol;
        }
    };
    window.AudioEngine.init();

    // 4. SCENE OBSERVER (Triggers audio changes automatically)
    const sceneObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const trackId = entry.target.getAttribute('data-audio');
                const shouldDuck = entry.target.getAttribute('data-duck-audio') === 'true';
                if (trackId) {
                    window.AudioEngine.playTrack(trackId, shouldDuck);
                }
            }
        });
    }, { threshold: 0.5 }); // Fire when a scene takes over 50% of the screen

    document.querySelectorAll('.scene[data-audio]').forEach(sec => sceneObserver.observe(sec));

    // 5. VIDEO OBSERVER (Lazy load & auto-pause videos for performance)
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                if (!video.src && video.dataset.src) {
                    video.src = video.dataset.src;
                    video.load();
                }
                gsap.to(video, { opacity: 0.7, duration: 2 });
                video.play().catch(()=>{});
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.story-video').forEach(vid => videoObserver.observe(vid));

    // 6. PRELOADER & BYPASS AUTOPLAY RESTRICTIONS
    const initPreloader = () => {
        let progress = 0;
        const loaderFill = document.querySelector('.loader-fill');
        const loadText = document.getElementById('load-text');
        const enterBtn = document.getElementById('enter-btn');
        const preloader = document.getElementById('preloader');
        
        // Simulate asset loading
        const simInterval = setInterval(() => {
            if (progress < 100) {
                progress += Math.random() * 12;
                if (progress > 100) progress = 100;
                if (loaderFill) loaderFill.style.width = `${progress}%`;
                if (loadText) loadText.innerText = `Igniting stars... ${Math.floor(progress)}%`;
            } else {
                clearInterval(simInterval);
                if (loadText) loadText.style.display = 'none';
                if (enterBtn) enterBtn.classList.remove('hidden');
            }
        }, 150);

        if (enterBtn) {
            enterBtn.addEventListener('click', () => {
                // Fade out preloader
                gsap.to(preloader, { opacity: 0, duration: 1.5, ease: "power2.inOut", onComplete: () => {
                    preloader.style.display = 'none';
                    lenis.start(); // Unlock scrolling
                    
                    // Trigger animations module (Will be built in Phase 4)
                    if(window.initStoryAnimations) window.initStoryAnimations();
                }});
                
                // Audio context requires a user click to start on modern browsers
                const firstScene = document.getElementById('scene-1');
                if (firstScene) {
                    window.AudioEngine.playTrack(firstScene.getAttribute('data-audio'), false);
                }
            });
        }
    };

    // Ensure DOM is fully painted before initiating
    if (document.readyState === 'complete') {
        setTimeout(initPreloader, 500);
    } else {
        window.addEventListener('load', () => setTimeout(initPreloader, 500));
    }
});
