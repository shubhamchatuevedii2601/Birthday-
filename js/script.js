/* js/script.js */

// ==========================================
// CONFIGURATION & STATE
// ==========================================
const CONFIG = {
    totalAssets: 8, // 6 photos + 2 videos
    messageText: "Happy Birthday to the most amazing person in the world. May your days be filled with endless joy, beautiful moments, and all the love you deserve. You make every day brighter.",
    particlesCount: {
        stars: 200,
        fireflies: 50,
        petals: 30
    }
};

const state = {
    loadedAssets: 0,
    isAudioPlaying: false,
    introPlayed: false,
    candlesBlown: 0,
    totalCandles: 3
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const DOM = {
    loader: document.getElementById('loader'),
    progressText: document.getElementById('progress-percentage'),
    storyContainer: document.getElementById('story-container'),
    bgMusic: document.getElementById('bg-music'),
    canvas: document.getElementById('magic-canvas'),
    ctx: document.getElementById('magic-canvas').getContext('2d'),
    videos: document.querySelectorAll('video'),
    lazyImages: document.querySelectorAll('.lazy-load'),
    scenes: document.querySelectorAll('.scene'),
    typingText: document.getElementById('typing-text'),
    candlesContainer: document.getElementById('candles-container'),
    surpriseBtn: document.getElementById('surprise-btn'),
    envelopeModal: document.getElementById('envelope-modal'),
    closeModalBtn: document.getElementById('close-modal'),
    envelope: document.querySelector('.envelope')
};

// ==========================================
// ASSET PRELOADING & LAZY LOADING
// ==========================================
function updateProgress() {
    state.loadedAssets++;
    const progress = Math.min(100, Math.floor((state.loadedAssets / CONFIG.totalAssets) * 100));
    DOM.progressText.innerText = progress;

    if (progress === 100) {
        setTimeout(() => {
            DOM.loader.querySelector('.loader-text').innerText = "Tap to Begin Magic ✨";
            DOM.loader.style.cursor = "pointer";
            DOM.loader.addEventListener('click', startExperience, { once: true });
        }, 500);
    }
}

// Simulate asset loading for smooth loader
const loadInterval = setInterval(() => {
    if (state.loadedAssets < CONFIG.totalAssets) {
        updateProgress();
    } else {
        clearInterval(loadInterval);
    }
}, 200);

const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
            }
            observer.unobserve(img);
        }
    });
}, { rootMargin: "0px 0px 50px 0px" });

DOM.lazyImages.forEach(img => imageObserver.observe(img));

// ==========================================
// SCROLL & INTERSECTION OBSERVER
// ==========================================
const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            
            // Video auto-play/pause
            const video = entry.target.querySelector('video');
            if (video) {
                video.play().catch(e => console.log("Autoplay prevented", e));
            }

            // Trigger specific scene actions
            if (entry.target.id === 'scene-4' && !entry.target.dataset.typed) {
                typeWriterEffect();
                entry.target.dataset.typed = "true";
            }
            if (entry.target.id === 'scene-8') {
                DOM.surpriseBtn.classList.remove('hidden');
            }
        } else {
            const video = entry.target.querySelector('video');
            if (video) {
                video.pause();
            }
        }
    });
}, { threshold: 0.3 });

// ==========================================
// MAGIC CANVAS SYSTEM
// ==========================================
let particles = [];
let width, height;

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    DOM.canvas.width = width;
    DOM.canvas.height = height;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor(type) {
        this.type = type; // 'star', 'firefly', 'petal', 'confetti'
        this.reset();
    }

    reset(forceType = null) {
        if (forceType) this.type = forceType;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.opacity = Math.random() * 0.8 + 0.2;

        if (this.type === 'star') {
            this.size = Math.random() * 2;
            this.vx = 0;
            this.vy = Math.random() * -0.2;
            this.color = '#ffffff';
        } else if (this.type === 'firefly') {
            this.size = Math.random() * 3 + 1;
            this.vx = (Math.random() - 0.5) * 1;
            this.vy = (Math.random() - 0.5) * 1;
            this.color = '#D4AF37';
        } else if (this.type === 'petal') {
            this.size = Math.random() * 8 + 4;
            this.vx = (Math.random() - 0.5) * 2 + 1;
            this.vy = Math.random() * 2 + 1;
            this.color = Math.random() > 0.5 ? '#FFB6C1' : '#ffc0cb';
            this.angle = Math.random() * 360;
            this.spin = (Math.random() - 0.5) * 5;
            this.y = -20; // Start at top
        } else if (this.type === 'confetti') {
            this.size = Math.random() * 6 + 4;
            this.vx = (Math.random() - 0.5) * 10;
            this.vy = (Math.random() - 0.5) * 10 - 5;
            const colors = ['#D4AF37', '#ff3366', '#ffffff', '#FFB6C1'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.gravity = 0.1;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.type === 'firefly') {
            this.opacity += (Math.random() - 0.5) * 0.1;
            this.opacity = Math.max(0.1, Math.min(1, this.opacity));
            if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.reset();
        } else if (this.type === 'star') {
            if (this.y < 0) this.y = height;
        } else if (this.type === 'petal') {
            this.angle += this.spin;
            if (this.y > height || this.x > width || this.x < 0) this.reset();
        } else if (this.type === 'confetti') {
            this.vy += this.gravity;
            if (this.y > height) this.reset('star'); // Recycle confetti into stars
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        if (this.type === 'petal') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'confetti') {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.size, this.size);
        } else {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = this.type === 'firefly' ? 15 : 5;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

function initCanvas() {
    for (let i = 0; i < CONFIG.particlesCount.stars; i++) particles.push(new Particle('star'));
    for (let i = 0; i < CONFIG.particlesCount.fireflies; i++) particles.push(new Particle('firefly'));
    
    requestAnimationFrame(animateCanvas);
}

function animateCanvas() {
    DOM.ctx.clearRect(0, 0, width, height);
    
    // Draw Moon Glow
    DOM.ctx.globalAlpha = 0.2;
    DOM.ctx.fillStyle = '#ffffff';
    DOM.ctx.shadowBlur = 100;
    DOM.ctx.shadowColor = '#ffffff';
    DOM.ctx.beginPath();
    DOM.ctx.arc(width * 0.8, height * 0.2, 80, 0, Math.PI * 2);
    DOM.ctx.fill();
    DOM.ctx.shadowBlur = 0; // reset

    particles.forEach(p => {
        p.update();
        p.draw(DOM.ctx);
    });
    
    requestAnimationFrame(animateCanvas);
}

function triggerConfetti() {
    for (let i = 0; i < 150; i++) {
        const p = new Particle('confetti');
        p.x = width / 2;
        p.y = height / 2;
        particles.push(p);
    }
}

// ==========================================
// SCENE 1: CINEMATIC INTRO
// ==========================================
function startExperience() {
    if (state.introPlayed) return;
    state.introPlayed = true;

    // Start Audio
    DOM.bgMusic.volume = 0.5;
    DOM.bgMusic.play().catch(e => console.log("Audio play failed:", e));
    
    // Hide Loader
    DOM.loader.style.opacity = 0;
    setTimeout(() => {
        DOM.loader.style.display = 'none';
        DOM.storyContainer.classList.remove('hidden');
        playIntroSequence();
    }, 1500);
}

function playIntroSequence() {
    const particle = document.getElementById('intro-particle');
    const text1 = document.getElementById('intro-text-1');
    const text2 = document.getElementById('intro-text-2');
    const title = document.getElementById('intro-title');
    const hint = document.getElementById('scroll-hint');

    // 1. Particle Appears
    setTimeout(() => { particle.style.opacity = 1; }, 500);
    
    // 2. Particle rises
    setTimeout(() => { 
        particle.style.transform = `translate(-50%, -200px) scale(2)`; 
        particle.style.transition = 'all 3s ease-in-out';
    }, 2000);

    // 3. Explode into stars and init canvas
    setTimeout(() => {
        particle.style.opacity = 0;
        initCanvas();
        document.getElementById('scene-1').classList.add('active');
    }, 4500);

    // 4. Sequence Texts
    setTimeout(() => { text1.style.opacity = 1; text1.style.transform = 'translateY(0)'; }, 6000);
    setTimeout(() => { text1.style.opacity = 0; text1.style.transform = 'translateY(-20px)'; }, 9000);
    
    setTimeout(() => { text2.style.opacity = 1; text2.style.transform = 'translateY(0)'; }, 10000);
    setTimeout(() => { text2.style.opacity = 0; text2.style.transform = 'translateY(-20px)'; }, 13000);
    
    setTimeout(() => { 
        title.style.opacity = 1; 
        title.style.transform = 'translateY(0)';
        hint.style.opacity = 1;
        
        // Start observing other scenes once intro finishes
        DOM.scenes.forEach(scene => sceneObserver.observe(scene));
    }, 14500);
}

// ==========================================
// SCENE 4: TYPING EFFECT
// ==========================================
function typeWriterEffect() {
    let i = 0;
    DOM.typingText.innerHTML = '';
    
    function type() {
        if (i < CONFIG.messageText.length) {
            DOM.typingText.innerHTML += CONFIG.messageText.charAt(i);
            i++;
            setTimeout(type, 50);
        } else {
            DOM.typingText.classList.add('finished');
        }
    }
    type();
}

// ==========================================
// SCENE 7: INTERACTIVE CAKE
// ==========================================
function setupCake() {
    for (let i = 0; i < state.totalCandles; i++) {
        const candle = document.createElement('div');
        candle.className = 'candle';
        const flame = document.createElement('div');
        flame.className = 'flame';
        
        // Click to blow out fallback
        candle.addEventListener('click', () => blowOutCandle(flame));
        
        candle.appendChild(flame);
        DOM.candlesContainer.appendChild(candle);
    }
    
    setupMicrophone();
}

function blowOutCandle(flame) {
    if (!flame.classList.contains('blown-out')) {
        flame.classList.add('blown-out');
        state.candlesBlown++;
        
        if (state.candlesBlown === state.totalCandles) {
            triggerConfetti();
            document.querySelector('.cake-instruction').innerText = "Make a wish!";
            
            // Add petals
            for (let i = 0; i < CONFIG.particlesCount.petals; i++) {
                particles.push(new Particle('petal'));
            }
        }
    }
}

async function setupMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        function checkBlow() {
            if (state.candlesBlown >= state.totalCandles) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }
            
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            let average = sum / bufferLength;
            
            // Threshold for blowing (adjust as needed based on sensitivity)
            if (average > 80) {
                const flames = document.querySelectorAll('.flame:not(.blown-out)');
                if (flames.length > 0) {
                    blowOutCandle(flames[0]);
                }
            }
            
            requestAnimationFrame(checkBlow);
        }
        checkBlow();
    } catch (err) {
        console.warn("Microphone access denied or unavailable. Tap to blow candles enabled.", err);
    }
}

setupCake();

// ==========================================
// SCENE 8: HEART FORMATION FINALE
// ==========================================
function formHeart() {
    const heartContainer = document.getElementById('heart-formation');
    if (heartContainer.children.length > 0) return; // already formed

    // Create a heart shape from available photos
    const photos = Array.from(DOM.lazyImages).map(img => img.src || img.dataset.src);
    const numPoints = 12; // Form heart with 12 points
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const scale = Math.min(window.innerWidth, window.innerHeight) / 30; // Scale based on screen size

    for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * Math.PI * 2;
        // Heart Math Equation
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
        
        const img = document.createElement('img');
        img.src = photos[i % photos.length];
        img.className = 'flying-photo';
        
        // Start randomly scattered
        img.style.left = `${Math.random() * 100}vw`;
        img.style.top = `${Math.random() * 100}vh`;
        
        heartContainer.appendChild(img);

        // Animate to heart shape
        setTimeout(() => {
            img.style.opacity = 1;
            img.style.left = `calc(50% + ${x * scale}px - 30px)`; // -30px to center the 60px image
            img.style.top = `calc(50% + ${y * scale}px - 30px)`;
        }, 100 + (i * 100));
    }
}

// Observe finale to trigger heart formation
const finaleObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        setTimeout(formHeart, 1000);
    }
}, { threshold: 0.5 });
finaleObserver.observe(document.getElementById('scene-8'));


// ==========================================
// SCENE 9: ENVELOPE MODAL
// ==========================================
DOM.surpriseBtn.addEventListener('click', () => {
    DOM.envelopeModal.classList.remove('hidden');
    // small timeout to allow display:block to render before opacity transition
    setTimeout(() => {
        DOM.envelopeModal.classList.add('active');
    }, 50);
});

DOM.envelopeContainer = document.querySelector('.envelope-container');
DOM.envelopeContainer.addEventListener('click', () => {
    DOM.envelope.classList.add('open');
    triggerConfetti();
}, { once: true });

DOM.closeModalBtn.addEventListener('click', () => {
    DOM.envelopeModal.classList.remove('active');
    setTimeout(() => {
        DOM.envelopeModal.classList.add('hidden');
    }, 1000);
});

// Parallax effect on mouse move for the magic background
document.addEventListener('mousemove', (e) => {
    if (!state.introPlayed) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    DOM.canvas.style.transform = `translate(${x}px, ${y}px)`;
});
