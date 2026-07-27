/**
 * js/particles.js - Universe Engine (DeltaTime Optimized)
 */
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('universe-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    let w, h;
    const MAX_STARS = 150;
    const stars = [];

    const resize = () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();

    class Star {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
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

            if (this.x > w) this.x = 0; if (this.x < 0) this.x = w;
            if (this.y > h) this.y = 0; if (this.y < 0) this.y = h;
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
            this.x = Math.random() * w;
            this.y = Math.random() * (h * 0.3);
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

    // Export Task to AnimationManager
    window.AnimationManager.universeTask = (timeScale) => {
        ctx.fillStyle = '#030508'; 
        ctx.fillRect(0, 0, w, h);

        // Dynamic Density (Cuts particle loop in half if FPS is low)
        const activeStarLimit = window.AnimationManager.lowQualityMode ? Math.floor(MAX_STARS / 2) : MAX_STARS;

        for (let i = 0; i < activeStarLimit; i++) {
            stars[i].update(timeScale);
            stars[i].draw(ctx);
        }

        // TimeScale adjustment for probability
        if (!shootingStar.active && Math.random() < (0.001 * timeScale)) {
            shootingStar.spawn();
        }

        shootingStar.update(timeScale);
        shootingStar.draw(ctx);
    };
});
