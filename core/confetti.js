/* kids-core: confetti (the canvas is added if the page has none) */
if (!document.getElementById('confetti')) { const c = document.createElement('canvas'); c.id = 'confetti'; c.setAttribute('aria-hidden', 'true'); document.body.prepend(c); }
const cv = $('#confetti'), cx = cv.getContext('2d');
let parts = [], raf = 0;
function sizeCanvas() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
addEventListener('resize', sizeCanvas); sizeCanvas();
function confetti(n = 90, originY = 0.45) {
  const colors = ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#cc5de8', '#ff922b', '#f783ac'];
  const W = cv.width, H = cv.height;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = (4 + Math.random() * 9) * devicePixelRatio;
    parts.push({ x: W / 2, y: H * originY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6 * devicePixelRatio,
      s: (5 + Math.random() * 7) * devicePixelRatio, r: Math.random() * 6, vr: Math.random() * 0.3 - 0.15,
      c: colors[i % colors.length], life: 1, circle: Math.random() < 0.3 });
  }
  if (!raf) raf = requestAnimationFrame(step);
}
function step() {
  cx.clearRect(0, 0, cv.width, cv.height);
  parts.forEach((p) => {
    p.vy += 0.35 * devicePixelRatio; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.008;
    cx.save(); cx.globalAlpha = Math.max(0, p.life); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
    if (p.circle) { cx.beginPath(); cx.arc(0, 0, p.s / 2, 0, 7); cx.fill(); } else cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    cx.restore();
  });
  parts = parts.filter((p) => p.life > 0 && p.y < cv.height + 50);
  raf = parts.length ? requestAnimationFrame(step) : (cx.clearRect(0, 0, cv.width, cv.height), 0);
}
