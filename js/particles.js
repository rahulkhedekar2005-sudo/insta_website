/* ══════════════════════════════════════════════
   PARTICLES.JS — Live animated canvas background
══════════════════════════════════════════════ */

(function () {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], lines = [], mouse = { x: -1000, y: -1000 };
  const COUNT = 80;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x   = Math.random() * W;
      this.y   = initial ? Math.random() * H : H + 20;
      this.r   = Math.random() * 2 + 0.5;
      this.vx  = (Math.random() - 0.5) * 0.4;
      this.vy  = -(Math.random() * 0.5 + 0.1);
      this.alpha = Math.random() * 0.5 + 0.1;
      this.pulse = Math.random() * Math.PI * 2;
      this.gold  = Math.random() > 0.75;
    }

    update() {
      this.pulse += 0.02;
      this.x += this.vx;
      this.y += this.vy;
      // mouse attraction (subtle)
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        this.vx += dx / dist * 0.012;
        this.vy += dy / dist * 0.012;
      }
      this.vx *= 0.995;
      this.vy *= 0.995;
      if (this.y < -10 || this.x < -10 || this.x > W + 10) this.reset();
    }

    draw() {
      const a = this.alpha * (0.7 + Math.sin(this.pulse) * 0.3);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.gold
        ? `rgba(200,169,110,${a})`
        : `rgba(180,180,220,${a * 0.6})`;
      ctx.fill();
    }
  }

  /* Occasional shooting line */
  class Line {
    constructor() {
      this.x1 = Math.random() * W;
      this.y1 = Math.random() * H;
      const angle = Math.random() * Math.PI * 2;
      const len   = Math.random() * 100 + 40;
      this.x2 = this.x1 + Math.cos(angle) * len;
      this.y2 = this.y1 + Math.sin(angle) * len;
      this.alpha = 0;
      this.maxAlpha = Math.random() * 0.15 + 0.05;
      this.life = 0;
      this.maxLife = Math.random() * 120 + 60;
    }
    update() { this.life++; }
    draw() {
      const t = this.life / this.maxLife;
      this.alpha = t < 0.3 ? (t / 0.3) * this.maxAlpha
                 : t > 0.7 ? ((1 - t) / 0.3) * this.maxAlpha
                 : this.maxAlpha;
      ctx.beginPath();
      ctx.moveTo(this.x1, this.y1);
      ctx.lineTo(this.x2, this.y2);
      ctx.strokeStyle = `rgba(200,169,110,${this.alpha})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    get done() { return this.life >= this.maxLife; }
  }

  function init() {
    particles = Array.from({ length: COUNT }, () => new Particle());
  }

  let frameCount = 0;

  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.7);
    grad.addColorStop(0,   'rgba(22,18,35,0.98)');
    grad.addColorStop(0.5, 'rgba(10,10,15,0.99)');
    grad.addColorStop(1,   'rgba(5,5,8,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    frameCount++;

    // Spawn new line occasionally
    if (frameCount % 90 === 0 && Math.random() > 0.5) {
      lines.push(new Line());
    }

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(200,169,110,${(1 - d / 100) * 0.06})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => { p.update(); p.draw(); });

    // Lines
    lines = lines.filter(l => !l.done);
    lines.forEach(l => { l.update(); l.draw(); });
  }

  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('resize', () => { resize(); init(); });

  resize();
  init();
  animate();
})();