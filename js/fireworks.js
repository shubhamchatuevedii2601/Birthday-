/**
 * js/fireworks.js - Cinematic Fireworks Engine
 * Dormant until Scene 9 is visible. Uses physics for realistic bursts.
 */
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('fireworks-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let w, h;
    let particles = [];
    let isCelebrationActive = false;
    let animationFrameId;

    const resize = () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();

    // Premium Color Palette
    const colors = ['#D4AF37', '#FFC0CB', '#800080', '#FFFFFF', '#FFD700'];

    // --- FIREWORK PARTICLE CLASS ---
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 8 + 2; // Explosive force
            this.vx = Math.cos(angle) * velocity;
            this.vy = Math.sin(angle) * velocity;
            this.friction = 0.96; // Air resistance
            this.gravity = 0.15;  // Fall weight
            this.alpha = 1;
            this.decay = Math.random() * 0.015 + 0.01; // Fade out speed
        }
        update() {
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // --- RENDER LOOP ---
    const render = () => {
        if (!isCelebrationActive) return;

        // Trail effect using semi-transparent clear
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';

        // Randomly launch fireworks (throttle based on performance/aesthetics)
        if (Math.random() < 0.05) {
            const originX = Math.random() * (w * 0.8) + (w * 0.1);
            const originY = Math.random() * (h * 0.5) + (h * 0.1);
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Spawn burst
            for (let i = 0; i < 60; i++) {
                particles.push(new Particle(originX, originY, color));
            }
        }

        // Update & Draw
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.update();
            p.draw(ctx);
            if (p.alpha <= 0) {
                particles.splice(i, 1); // Remove dead particles
            }
        }

        animationFrameId = requestAnimationFrame(render);
    };

    // --- INTERSECTION OBSERVER (Performance Guardian) ---
    // Only run the fireworks engine when Scene 9 is on screen
    const scene9 = document.getElementById('scene-9');
    if (scene9) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!isCelebrationActive) {
                        isCelebrationActive = true;
                        particles = []; // Clear old particles
                        render();
                    }
                } else {
                    isCelebrationActive = false;
                    cancelAnimationFrame(animationFrameId);
                    ctx.clearRect(0, 0, w, h); // Clear canvas to free memory
                }
            });
        }, { threshold: 0.1 }); // Trigger when 10% visible

        observer.observe(scene9);
    }
});
                
