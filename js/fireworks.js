/**
 * js/fireworks.js - Celebration Engine (DeltaTime Optimized)
 */
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('fireworks-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    
    let w, h;
    let lastLaunchTime = 0;
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2); 
    const MAX_POOL_SIZE = 120;
    
    // Pre-rendered Sprites
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

    const resize = () => {
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        w = canvas.width = window.innerWidth * dpr;
        h = canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
        w = window.innerWidth;
        h = window.innerHeight;
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();

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
            
            // Euler integration with timeScale mapping
            this.vx *= Math.pow(this.friction, timeScale);
            this.vy *= Math.pow(this.friction, timeScale);
            this.vy += this.gravity * timeScale;
            this.x += this.vx * timeScale;
            this.y += this.vy * timeScale;
            this.alpha -= this.decay * timeScale;
            
            if (this.alpha <= 0 || this.x < 0 || this.x > w || this.y > h) {
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
        // Dynamic limits based on AnimationManager FPS status
        const isLowQ = window.AnimationManager.lowQualityMode;
        const cooldown = isLowQ ? 800 : 400;
        const burstSize = isLowQ ? 25 : 50;

        if (now - lastLaunchTime < cooldown) return; 
        
        const cx = Math.random() * (w * 0.8) + (w * 0.1);
        const cy = Math.random() * (h * 0.5) + (h * 0.1);
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

    // Export Task to AnimationManager
    window.AnimationManager.fireworksTask = (timeScale) => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.25; 
        ctx.fillStyle = '#030508'; 
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = 'lighter';

        if (Math.random() < (0.03 * timeScale)) launchFirework();

        for (let i = 0; i < particlePool.length; i++) {
            if (particlePool[i].active) {
                particlePool[i].update(timeScale);
                particlePool[i].draw(ctx);
            }
        }
    };
});
