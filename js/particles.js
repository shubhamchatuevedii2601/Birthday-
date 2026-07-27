window.initParticles = function() {
    const globalCanvas = document.getElementById('global-effects-canvas');
    if(globalCanvas) {
        const gCtx = globalCanvas.getContext('2d');
        let gW, gH;
        let fireflies = [];
        let burstParticles = [];

        const resizeGlobal = () => {
            gW = globalCanvas.width = window.innerWidth;
            gH = globalCanvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeGlobal);
        resizeGlobal();

        class Firefly {
            constructor() { this.reset(); this.y = Math.random() * gH; }
            reset() {
                this.x = Math.random() * gW; this.y = gH + 10;
                this.size = Math.random() * 1.5 + 0.5; this.speedY = Math.random() * 0.5 + 0.1;
                this.speedX = (Math.random() - 0.5) * 0.5; this.alpha = Math.random() * 0.5 + 0.2;
                this.color = Math.random() > 0.5 ? '#D4AF37' : '#F3E5AB';
            }
            update() {
                this.y -= this.speedY; this.x += this.speedX + Math.sin(this.y * 0.01) * 0.5;
                if (this.y < -10) this.reset();
            }
            draw(ctx) {
                ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color;
                ctx.shadowBlur = 8; ctx.shadowColor = this.color;
                ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }
        for (let i = 0; i < 40; i++) fireflies.push(new Firefly());

        class BurstParticle {
            constructor(x, y, isHeart) {
                this.x = x; this.y = y; this.isHeart = isHeart;
                const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 8 + 3;
                this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed - 2;
                this.alpha = 1; this.friction = 0.95; this.gravity = 0.1;
                this.size = isHeart ? Math.random() * 10 + 10 : Math.random() * 3 + 2;
                this.color = isHeart ? ['#FFC0CB', '#FF69B4', '#ff3366'][Math.floor(Math.random()*3)] : '#D4AF37';
            }
            update() {
                this.vx *= this.friction; this.vy *= this.friction; this.vy += this.gravity;
                this.x += this.vx; this.y += this.vy; this.alpha -= 0.015;
            }
            draw(ctx) {
                ctx.save(); ctx.globalAlpha = this.alpha;
                if (this.isHeart) {
                    ctx.font = `${this.size}px Arial`; ctx.fillStyle = this.color;
                    ctx.fillText("❤️", this.x, this.y);
                } else {
                    ctx.fillStyle = this.color; ctx.shadowBlur = 10; ctx.shadowColor = this.color;
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
                }
                ctx.restore();
            }
        }

        window.createGiftBurst = (x, y) => {
            for(let i=0; i<30; i++) burstParticles.push(new BurstParticle(x, y, true));
            for(let i=0; i<60; i++) burstParticles.push(new BurstParticle(x, y, false));
        };

        const animateGlobal = () => {
            gCtx.clearRect(0, 0, gW, gH);
            fireflies.forEach(f => { f.update(); f.draw(gCtx); });
            for(let i = burstParticles.length - 1; i >= 0; i--) {
                let p = burstParticles[i]; p.update(); p.draw(gCtx);
                if(p.alpha <= 0) burstParticles.splice(i, 1);
            }
            requestAnimationFrame(animateGlobal);
        };
        requestAnimationFrame(animateGlobal);
    }

    const setupSectionCanvas = (id, drawLogic) => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        let w, h, rafId, isVisible = false;

        const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize); resize();

        const loop = () => { if (!isVisible) return; drawLogic(ctx, w, h); rafId = requestAnimationFrame(loop); };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (isVisible) loop(); else cancelAnimationFrame(rafId);
            });
        }, { threshold: 0 });
        observer.observe(canvas.parentElement);
    };

    class Star {
        constructor(w, h) {
            this.x = Math.random() * w; this.y = Math.random() * h;
            this.r = Math.random() * 1.5; this.a = Math.random() * Math.PI * 2;
            this.speed = Math.random() * 0.02 + 0.01;
        }
        draw(ctx, h) {
            ctx.globalAlpha = 0.3 + Math.abs(Math.sin(this.a)) * 0.7;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill();
            this.a += this.speed; this.y -= 0.1;
            if (this.y < 0) this.y = h;
        }
    }
    
    class ShootingStar {
        constructor(w, h) { this.reset(w, h); this.active = false; }
        reset(w, h) {
            this.x = Math.random() * w; this.y = Math.random() * (h/2);
            this.len = Math.random() * 80 + 40; this.speed = Math.random() * 15 + 10;
            this.angle = (Math.random() * 20 + 30) * (Math.PI/180); this.alpha = 1;
        }
        update(w, h) {
            this.x -= Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
            this.alpha -= 0.02;
            if(this.alpha <= 0) { this.active = false; this.reset(w, h); }
        }
        draw(ctx) {
            ctx.save(); ctx.globalAlpha = this.alpha; ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(this.angle)*this.len, this.y - Math.sin(this.angle)*this.len);
            ctx.stroke(); ctx.restore();
        }
    }

    const initStarsCanvas = (id) => {
        let stars = [], shootingStar = null;
        setupSectionCanvas(id, (ctx, w, h) => {
            if(stars.length === 0) {
                for(let i=0; i<100; i++) stars.push(new Star(w, h));
                shootingStar = new ShootingStar(w, h);
            }
            ctx.clearRect(0,0,w,h); ctx.fillStyle = '#FFF';
            stars.forEach(s => s.draw(ctx, h));
            if(!shootingStar.active && Math.random() < 0.005) shootingStar.active = true;
            if(shootingStar.active) { shootingStar.update(w,h); shootingStar.draw(ctx); }
        });
    };

    initStarsCanvas('stars-canvas');
    initStarsCanvas('shooting-stars-canvas');
};

