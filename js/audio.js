/**
 * js/audio.js - Crossfade Audio Engine
 */
document.addEventListener('DOMContentLoaded', () => {
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
                if (!window.userInteracted) return; // Prevent autoplay crash

                try {
                    const src = this.tracks[trackId];
                    if (!src) return;
                    const targetVol = shouldDuck ? this.duckVolume : this.baseVolume;
                    
                    if (this.currentTrackId === trackId) {
                        if (typeof gsap !== 'undefined') {
                            gsap.to(this.activePlayer, { volume: targetVol, duration: this.fadeDuration, overwrite: true });
                        }
                        return;
                    }
                    
                    this.currentTrackId = trackId;
                    const nextPlayer = this.activePlayer === this.playerA ? this.playerB : this.playerA;
                    const oldPlayer = this.activePlayer;
                    
                    nextPlayer.src = src; 
                    nextPlayer.volume = 0;
                    
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
                // Manually trigger the first visible scene after user clicks Enter
                document.querySelectorAll('.scene[data-audio]').forEach(sec => {
                    const rect = sec.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom >= 0) {
                        this.playTrack(sec.getAttribute('data-audio'), sec.getAttribute('data-duck-audio') === 'true');
                    }
                });
            }
        };
        window.AudioEngine.init();

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
        }
    } catch(e) {}
});

