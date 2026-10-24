
/* ============================================================
   42 · THE WITNESS — 一只一直在看你的眼睛
   ============================================================ */
const GAZE = { x: 0, y: 0, live: false };
function initGaze(){
  /* fixed gaze: the film is not interactive */
  GAZE.x = W * 0.06; GAZE.y = H * 0.90;
}

/* one eye: almond + iris locked to the gaze point */
function drawEye(c, x, y, s, ang, alpha, irisCol){
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.globalAlpha = alpha;
  c.strokeStyle = C.bone; c.lineWidth = 1;
  c.beginPath(); c.ellipse(0, 0, s, s * 0.52, 0, 0, TAU); c.stroke();
  c.restore();

  const dx = GAZE.x - x, dy = GAZE.y - y;
  const d = Math.hypot(dx, dy) || 1;
  const px = x + dx/d * s * 0.34;
  const py = y + dy/d * s * 0.34;

  c.globalAlpha = alpha;
  c.fillStyle = irisCol || C.accent;
  c.beginPath(); c.arc(px, py, s * 0.20, 0, TAU); c.fill();
  c.fillStyle = C.bg;
  c.beginPath(); c.arc(px, py, s * 0.085, 0, TAU); c.fill();
  c.fillStyle = C.bone;
  c.fillRect(px - s*0.11, py - s*0.11, Math.max(1, s*0.05), Math.max(1, s*0.05));
  c.globalAlpha = 1;
}

/* a single witness eye — used in the boot, and at the very end */
function drawWitness(c, cx, cy, s, t, open){
  open = open == null ? 1 : open;
  const blink = Math.sin(t * 0.7) > 0.985 ? 0.15 : 1;
  const h = open * blink;
  const dx = GAZE.x - cx, dy = GAZE.y - cy;
  const ang = Math.atan2(dy, dx);
  c.globalAlpha = 0.85;
  c.strokeStyle = C.bone; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(cx, cy, s, s * 0.5 * h, ang, 0, TAU); c.stroke();
  const px = cx + Math.cos(ang) * s * 0.3;
  const py = cy + Math.sin(ang) * s * 0.3;
  c.fillStyle = C.bg; c.beginPath(); c.arc(px, py, s*0.26, 0, TAU); c.fill();
  c.strokeStyle = C.accent; c.lineWidth = 1;
  c.beginPath(); c.arc(px, py, s*0.26, 0, TAU); c.stroke();
  c.fillStyle = C.bone; c.beginPath(); c.arc(px, py, s*0.09, 0, TAU); c.fill();
  c.globalAlpha = 1;
}

/* the Ophanim: rings of eyes, all locked on the same point */
function drawOphanim(c, cx, cy, R, t, opts){
  opts = opts || {};
  const rings = opts.rings || 4;
  const alpha = opts.alpha == null ? 0.75 : opts.alpha;
  const tilt = opts.tilt == null ? 0.50 : opts.tilt;

  /* gyroscope: three great circles in perspective */
  for (let k=0;k<3;k++){
    const rr = R * (1.06 + k*0.10);
    const a = t * (0.25 + k*0.12) + k * 1.1;
    c.save();
    c.translate(cx, cy);
    c.rotate(a * 0.35);
    c.globalAlpha = alpha * (0.16 - k*0.03);
    c.strokeStyle = C.bone; c.lineWidth = 1;
    c.beginPath(); c.ellipse(0, 0, rr, rr * (tilt + k*0.18), a, 0, TAU); c.stroke();
    c.restore();
  }

  /* the central eye */
  drawWitness(c, cx, cy, R * 0.26, t, 1);

  for (let k=0;k<rings;k++){
    const rr = R * (1 - k * 0.24);
    const n = 10 - k * 2;
    const dir = (k % 2) ? -1 : 1;
    const rot = t * dir * (0.22 + k * 0.06) + k * 0.7;
    const s = R * (0.17 - k * 0.03);

    /* ring wire */
    c.globalAlpha = alpha * 0.12;
    c.strokeStyle = C.bone; c.lineWidth = 1;
    c.beginPath(); c.ellipse(cx, cy, rr, rr*tilt, 0, 0, TAU); c.stroke();

    for (let i=0;i<n;i++){
      const a = rot + i/n * TAU;
      const ex = cx + Math.cos(a) * rr;
      const ey = cy + Math.sin(a) * rr * tilt;
      const gx = GAZE.x - ex, gy = GAZE.y - ey;
      const ga = Math.atan2(gy, gx);
      const face = 0.55 + 0.45 * Math.cos(a - ga);   /* back-facing eyes dim */
      drawEye(c, ex, ey, s, ga, alpha * (0.35 + 0.55*face),
              k === rings-1 ? C.accent : C.bone);
    }
  }
  c.globalAlpha = 1;
}

initGaze();
