/**
 * js/fireworks.js - Ultra-High Performance Fireworks Engine
 * Features: Object Pooling, Pre-rendered Sprites, Mobile Quality Capping, Bounds Culling
 */
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('fireworks-canvas');
    if (!canvas) return;
    
    // alpha: false optimizes the canvas backing store for solid backgrounds (better GPU performance)
    const ctx = canvas.getContext('2d', { alpha: true });
    
    let w, h;
    let rafId;
    let isVisible = false;
    let lastLaunchTime = 0;
    
    // Performance metrics
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap pixel ratio at 2x
    const isMobile = window.innerWidth < 768;
    
    // Dynamic Limits
    const BURST_SIZE = isMobile ? 30 : 50; 
    const MAX_POOL_SIZE = isMobile ? 90 : 150; // Caps simultaneous fireworks to ~3
    const LAUNCH_COOLDOWN = isMobile ? 800 : 500; // Minimum ms between launches
    
    // 1. PRE-RENDER SPRITES (Removes expensive shadowBlur and arc paths)
    const fwColors = ['#D4AF37', '#FFC0CB', '#800080', '#FFFFFF', '#FFD700'];
    const sprites = fwColors.map(color => {
        const offCanvas = document.createElement('canvas');
        const spriteSize = 8;
        offCanvas.width = spriteSize;
        offCanvas.height = spriteSize;
        const oCtx = offCanvas.getContext('2d');
        
        // Draw once to memory
        oCtx.fillStyle = color;
        oCtx.beginPath();
        oCtx.arc(spriteSize/2, spriteSize/2, 2.5, 0, Math.PI * 2);
        oCtx.fill();
        return offCanvas;
    });

    const resize = () => {
        // Set actual CSS display size
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        
        // Set internal rendering resolution capped at 2x
        w = canvas.width = window.innerWidth * dpr;
        h = canvas.height = window.innerHeight * dpr;
        
        // Normalize coordinates for the internal resolution
        ctx.scale(dpr, dpr);
        // Reset w, h to logical pixels for the physics math
        w = window.innerWidth;
        h = window.innerHeight;
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();

    // 2. OBJECT POOLING (Zero Garbage Collection during animation)
    class PooledParticle {
        constructor() {
            this.active = false;
        }
        
        spawn(x, y, spriteIndex) {
            this.active = true;
            this.x = x;
            this.y = y;
            this.spriteIndex = spriteIndex;
            
            // Pre-calculate math (removing Math.PI * 2 from update loop)
            const angle = Math.random() * 6.283185; 
            const speed = Math.random() * 7 + 2; 
            
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.friction = 0.95;
            this.gravity = 0.15;
            this.alpha = 1;
            
            // Mobile decays faster to clear screen quicker
            this.decay = Math.random() * 0.02 + (isMobile ? 0.02 : 0.015);
        }
        
        update() {
            if (!this.active) return;
            
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
            
            // Bounds checking (Stop processing if off-screen or invisible)
            if (this.alpha <= 0 || this.x < 0 || this.x > w || this.y > h) {
                this.active = false;
            }
        }
        
        draw(ctx) {
            if (!this.active) return;
            ctx.globalAlpha = this.alpha;
            // Hardware accelerated image rendering instead of drawing paths
            ctx.drawImage(sprites[this.spriteIndex], this.x - 4, this.y - 4);
        }
    }

    // Initialize the fixed memory pool
    const particlePool = Array.from({ length: MAX_POOL_SIZE }, () => new PooledParticle());

    // 3. LAUNCH LOGIC (Reuses dead particles)
    const launchFirework = () => {
        const now = Date.now();
        if (now - lastLaunchTime < LAUNCH_COOLDOWN) return; // Enforce max simultaneous fireworks
        
        const cx = Math.random() * (w * 0.8) + (w * 0.1);
        const cy = Math.random() * (h * 0.5) + (h * 0.1);
        const spriteIndex = Math.floor(Math.random() * sprites.length);
        
        let spawned = 0;
        
        // Find inactive particles in the pool and awaken them
        for (let i = 0; i < particlePool.length; i++) {
            if (!particlePool[i].active) {
                particlePool[i].spawn(cx, cy, spriteIndex);
                spawned++;
            }
            if (spawned >= BURST_SIZE) break;
        }
        
        if (spawned > 0) lastLaunchTime = now;
    };

    // 4. MAIN RENDER LOOP (Single rAF)
    const render = () => {
        if (!isVisible) return; // Strict pause when off-screen

        // Optimized Trail Clearing (Matches `--bg-deep` CSS variable)
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.25; // Controls trail length
        ctx.fillStyle = '#030508'; 
        ctx.fillRect(0, 0, w, h);

        // Additive blending for natural glow without expensive shadowBlur
        ctx.globalCompositeOperation = 'lighter';

        // Auto launch based on probability
        if (Math.random() < 0.03) {
            launchFirework();
        }

        // Process pool
        for (let i = 0; i < particlePool.length; i++) {
            if (particlePool[i].active) {
                particlePool[i].update();
                particlePool[i].draw(ctx);
            }
        }

        rafId = requestAnimationFrame(render);
    };

    // 5. INTERSECTION OBSERVER (Pauses engine completely when not visible)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
            if (isVisible) {
                // Resume
                lastLaunchTime = Date.now(); // Prevent immediate burst spam on enter
                render();
            } else {
                // Pause and clear memory
                cancelAnimationFrame(rafId);
                
                // Reset pool to prevent sudden burst of old particles when scrolling back
                for (let i = 0; i < particlePool.length; i++) {
                    particlePool[i].active = false;
                }
                
                ctx.clearRect(0, 0, w, h);
            }
        });
    }, { threshold: 0 }); // Triggers the moment even 1 pixel leaves/enters
    
    observer.observe(canvas.parentElement);
});
