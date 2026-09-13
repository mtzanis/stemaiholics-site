(() => {
  const canvas = document.querySelector('.nodes-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0, H = 0;
  const nodes = [];
  const NODE_COUNT_BASE = 70;       // ~70 nodes at 1440x900
  const LINK_DIST = 140;            // px (CSS) between connected nodes
  const SPEED = 0.032;              // very slow drift — fast motion under text is distracting (Tim Venchus feedback, 2026-08-03)
  const NODE_COLOR = 'rgba(40, 60, 110, 0.45)';
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
          const alpha = (1 - d / LINK_DIST) * 0.28;
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
(() => {
  const q = new URLSearchParams(location.search);
  let msg = '';
  if (q.get('sent') === '1') msg = 'Message sent. You will hear back soon.';
  if (q.get('subscribed') === '1') msg = 'You are on the list. The first letter comes from a classroom.';
  if (!msg) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = '<span class="dot"></span><span></span><button aria-label="dismiss">×</button>';
  t.children[1].textContent = msg;
  document.body.appendChild(t);
  t.querySelector('button').onclick = () => t.remove();
  setTimeout(() => t.remove(), 9000);
})();

// Greece tour popup: one visit, dismissable, time-limited, never on /greece/ itself.
// Uses localStorage only to remember "already shown". No cookies, nothing sent anywhere.
(() => {
  const LAST_DAY = new Date('2026-10-23T23:59:59+03:00');
  if (Date.now() > LAST_DAY.getTime()) return;
  if (location.pathname.startsWith('/greece') || location.pathname.startsWith('/privacy')) return;
  if (new URLSearchParams(location.search).has('sent') || new URLSearchParams(location.search).has('subscribed')) return;
  const KEY = 'os-greece-pop-v1';
  let seen = false;
  try { seen = !!localStorage.getItem(KEY); } catch (e) {}
  if (seen) return;

  let shown = false;
  function show() {
    if (shown) return; shown = true;
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
    const back = document.createElement('div');
    back.className = 'tour-pop-backdrop';
    back.innerHTML =
      '<div class="tour-pop" role="dialog" aria-modal="true" aria-labelledby="tour-pop-title">' +
        '<button class="close" type="button" aria-label="Close">×</button>' +
        '<span class="eyebrow"><span><span class="dot"></span><span>On the road</span></span></span>' +
        '<p class="kicker">overSTEMed is coming home.</p>' +
        '<h2 class="dates" id="tour-pop-title">19 to 23 <em>October.</em></h2>' +
        '<p class="cities">Thessaloniki &amp; Athens</p>' +
        '<p class="line">Five days of school visits and leadership sessions. <strong>Lead a school in either city? Book a morning on your campus.</strong> The calendar is small and it fills in order.</p>' +
        '<div class="actions">' +
          '<a class="btn btn-ed" href="/greece/">See the dates and book →</a>' +
          '<button class="later" type="button">Not now</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(back);
    const prevFocus = document.activeElement;
    const close = () => {
      back.classList.remove('in');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => back.remove(), 300);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    back.querySelector('.close').onclick = close;
    back.querySelector('.later').onclick = close;
    back.addEventListener('click', (e) => { if (e.target === back) close(); });
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => { back.classList.add('in'); back.querySelector('.btn').focus(); });
  }
  const timer = setTimeout(show, 7000);
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max > 0 && window.scrollY / max > 0.3) { clearTimeout(timer); show(); window.removeEventListener('scroll', onScroll); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
})();

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
