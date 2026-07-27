window.initFireworks = function() {
    const canvas = document.getElementById('fireworks-canvas');
    if(!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    let w, h, rafId, isVisible = false;

    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize();

    const fwColors = ['#D4AF37', '#FFC0CB', '#800080', '#FFFFFF', '#FFD700'];
    let fwParticles = [];

    class FWParticle {
        constructor(x, y, color) {
            this.x = x; this.y = y; this.color = color;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 10 + 2;
            this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
            this.friction = 0.95; this.gravity = 0.15;
            this.alpha = 1; this.decay = Math.random() * 0.015 + 0.01;
        }
        update() {
            this.vx *= this.friction; this.vy *= this.friction; this.vy += this.gravity;
            this.x += this.vx; this.y += this.vy; this.alpha -= this.decay;
        }
        draw(ctx) {
            ctx.save(); ctx.globalAlpha = this.alpha;
            ctx.beginPath(); ctx.arc(this.x, this.y, 1.5, 0, Math.PI*2);
            ctx.fillStyle = this.color; ctx.shadowBlur = 8; ctx.shadowColor = this.color;
            ctx.fill(); ctx.restore();
        }
    }

    const drawLogic = () => {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        
        if(Math.random() < 0.04) {
            const cx = Math.random() * w; const cy = Math.random() * (h*0.6);
            const color = fwColors[Math.floor(Math.random()*fwColors.length)];
            for(let i=0; i<60; i++) fwParticles.push(new FWParticle(cx, cy, color));
        }

        for(let i = fwParticles.length - 1; i >= 0; i--) {
            let p = fwParticles[i]; p.update(); p.draw(ctx);
            if(p.alpha <= 0) fwParticles.splice(i, 1);
        }
    };

    const loop = () => { if (!isVisible) return; drawLogic(); rafId = requestAnimationFrame(loop); };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
            if (isVisible) loop(); else cancelAnimationFrame(rafId);
        });
    }, { threshold: 0 });
    
    observer.observe(canvas.parentElement);
};

