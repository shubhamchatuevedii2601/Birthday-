/**
 * js/particles.js - The Universe Canvas Engine
 * Optimized for 60 FPS, mobile-friendly, and mathematically smooth.
 */
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('universe-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // alpha: false optimizes rendering for solid backgrounds
    let w, h;
    let stars = [];
    let shootingStar = null;

    // Performance resizing
    const resize = () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();

    // --- STAR CLASS ---
    class Star {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.size = Math.random() * 1.5 + 0.5;
            this.baseAlpha = Math.random() * 0.5 + 0.2;
            this.twinkleSpeed = Math.random() * 0.02 + 0.01;
            this.twinklePhase = Math.random() * Math.PI * 2;
            this.driftX = (Math.random() - 0.5) * 0.1;
            this.driftY = (Math.random() - 0.5) * 0.1;
            this.isGold = Math.random() > 0.85; // 15% chance to be a golden star
        }
        update() {
            this.twinklePhase += this.twinkleSpeed;
            this.x += this.driftX;
            this.y += this.driftY;

            // Wrap around screen
            if (this.x > w) this.x = 0;
            if (this.x < 0) this.x = w;
            if (this.y > h) this.y = 0;
            if (this.y < 0) this.y = h;
        }
        draw(ctx) {
            const currentAlpha = this.baseAlpha + Math.sin(this.twinklePhase) * 0.3;
            ctx.fillStyle = this.isGold ? `rgba(212, 175, 55, ${currentAlpha})` : `rgba(255, 255, 255, ${currentAlpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- SHOOTING STAR CLASS ---
    class ShootingStar {
        constructor() {
            this.active = false;
        }
        spawn() {
            this.active = true;
            this.x = Math.random() * w;
            this.y = Math.random() * (h * 0.3); // Spawn in top 30% of screen
            this.length = Math.random() * 80 + 50;
            this.speed = Math.random() * 10 + 15;
            this.angle = (Math.random() * 20 + 25) * (Math.PI / 180); // Diagonal angle
            this.alpha = 1;
        }
        update() {
            if (!this.active) return;
            this.x -= Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            this.alpha -= 0.015;
            if (this.alpha <= 0) this.active = false;
        }
        draw(ctx) {
            if (!this.active) return;
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(this.angle) * this.length, this.y - Math.sin(this.angle) * this.length);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Initialize Pool (150 stars is optimal for mobile & desktop)
    for (let i = 0; i < 150; i++) stars.push(new Star());
    shootingStar = new ShootingStar();

    // --- RENDER LOOP ---
    const render = () => {
        // Deep background color
        ctx.fillStyle = '#030508'; 
        ctx.fillRect(0, 0, w, h);

        // Update and draw stars
        for (let i = 0; i < stars.length; i++) {
            stars[i].update();
            stars[i].draw(ctx);
        }

        // Randomly spawn shooting star (approx every 10-15 seconds at 60fps)
        if (!shootingStar.active && Math.random() < 0.001) {
            shootingStar.spawn();
        }

        shootingStar.update();
        shootingStar.draw(ctx);

        requestAnimationFrame(render);
    };

    // Start engine
    requestAnimationFrame(render);
});
