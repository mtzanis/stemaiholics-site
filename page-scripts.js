(() => {
  const canvas = document.querySelector('.nodes-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0, H = 0;
  const nodes = [];
  const NODE_COUNT_BASE = 70;       // ~70 nodes at 1440x900
  const LINK_DIST = 140;            // px (CSS) between connected nodes
  const SPEED = 0.18;               // px / frame at 60fps
  const NODE_COLOR = 'rgba(40, 60, 110, 0.85)';
  const LINK_COLOR = 'rgba(40, 60, 110, ';   // alpha appended per-pair

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // re-seed node count to viewport area
    const area = W * H;
    const target = Math.round(NODE_COUNT_BASE * (area / (1440 * 900)));
    while (nodes.length < target) nodes.push(spawn());
    while (nodes.length > target) nodes.pop();
  }

  function spawn() {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
      r: 1.4 + Math.random() * 1.6,
    };
  }

  function step() {
    ctx.clearRect(0, 0, W, H);

    // update positions
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -10) n.x = W + 10;
      else if (n.x > W + 10) n.x = -10;
      if (n.y < -10) n.y = H + 10;
      else if (n.y > H + 10) n.y = -10;
    }

    // draw links
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const d = Math.sqrt(d2);
          const alpha = (1 - d / LINK_DIST) * 0.5;
          ctx.strokeStyle = LINK_COLOR + alpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // draw nodes
    ctx.fillStyle = NODE_COLOR;
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(step);
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;
  resize();
  window.addEventListener('resize', resize);
  if (!reduced) step();
  else {
    // draw one static frame
    for (const n of nodes) { n.vx = 0; n.vy = 0; }
    step();
    cancelAnimationFrame(raf);
  }
})();

// success toast after form redirect
if (new URLSearchParams(location.search).get('sent') === '1') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = '<span class="dot"></span><span>Message sent — you\'ll hear back soon.</span><button aria-label="dismiss">×</button>';
  document.body.appendChild(t);
  t.querySelector('button').onclick = () => t.remove();
  setTimeout(() => t.remove(), 8000);
}

// reveal on scroll
const io = new IntersectionObserver((es) => {
  es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.05 });
document.querySelectorAll('section').forEach(s => { s.classList.add('reveal'); io.observe(s); });

// failsafe: never leave content invisible if the observer doesn't fire
// (blocked JS engines, old browsers, embedded webviews, print)
setTimeout(() => {
  document.querySelectorAll('section.reveal:not(.in)').forEach(s => s.classList.add('in'));
}, 2000);
