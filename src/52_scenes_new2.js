
/* ============================================================
   52 · SEG 04–05 on the new engine
   ============================================================ */
NEW_SCENE_IDS[4] = 1; NEW_SCENE_IDS[5] = 1;
delete SKIN_PAL[4]; delete SKIN_PAL[5];
delete SKIN_SEG[4]; delete SKIN_SEG[5];

/* ---------- Seg 04 · the limit you cannot reach (no grid) ---------- */
function world04n(c, s){
  const t = s.lt, b = s.beat;
  const invert = smoothstep(6.0, 6.8, t);
  const cx = W*0.5, cy = H*0.5;

  /* ground: no furniture at all */
  c.fillStyle = invert > 0.5 ? '#F0F0F2' : C.bg;
  c.fillRect(0, 0, W, H);

  const N = 14;
  const base = Math.hypot(W, H) * 0.92;   /* the outer frame is already off-screen */
  for (let k=0;k<N;k++){
    const ap = stagger(t, k*0.26, 0.42, 0.26);
    if (ap <= 0) continue;
    const sc = Math.pow(0.68, k);
    const w2 = base * 0.5 * sc, h2 = base * 0.34 * sc;
    const snap = 1 + 0.07 * springImpulse(t, k*0.26, 8, 12);
    c.save();
    c.translate(cx, cy);
    c.rotate(0.015 * k);
    c.scale(snap, snap);
    c.globalAlpha = (invert > 0.5) ? 0.88 : ap * (0.92 - k*0.05);
    c.strokeStyle = (k === N-1) ? C.accent : (invert > 0.5 ? '#101012' : C.bone);
    c.lineWidth = k < 3 ? 2 : 1;
    c.strokeRect(-w2, -h2, w2*2, h2*2);
    c.restore();
  }

  /* the point that is never reached */
  const pulse = 1 + 0.5 * Math.abs(springImpulse(t, Math.floor(t/0.4615)*0.4615, 9, 8));
  c.globalAlpha = 1;
  c.fillStyle = invert > 0.5 ? '#101012' : C.accent;
  c.beginPath(); c.arc(cx, cy, 2.2*pulse, 0, TAU); c.fill();
  c.globalAlpha = 0.18;
  c.beginPath(); c.arc(cx, cy, 16*pulse, 0, TAU); c.fill();
  c.globalAlpha = 1;

  /* inversion wipe */
  if (invert > 0 && invert < 1){
    c.fillStyle = 'rgba(240,240,242,' + invert + ')';
    c.fillRect(0, 0, W, H);
  }
}

/* ---------- Seg 05 · current, space, time ---------- */
function world05n(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 5);

  /* --- torus knot, projected, snapping per beat --- */
  const box = G.cell(1, 1, 14, 10);
  const bcx = box.x + box.w/2, bcy = box.y + box.h/2;
  const step = Math.floor(t / 0.4615);
  const rot = step * 0.34 + 0.6 * springImpulse(t, step*0.4615, 5, 9);
  const tilt = 0.9 + 0.15 * Math.sin(t*0.4);
  const S = box.w * 0.30;

  const pts = GEN.knot;
  c.save();
  c.translate(bcx, bcy);
  for (let i=0;i<pts.length-1;i++){
    const p0 = pts[i], p1 = pts[i+1];
    const k = 1 / (1.55 + p0[2]*0.35);
    const x0 = (p0[0]*Math.cos(rot) - p0[1]*Math.sin(rot)) * S * k;
    const y0 = ((p0[0]*Math.sin(rot) + p0[1]*Math.cos(rot)) * tilt + p0[2]*1.2) * S * k * 0.72;
    const k1 = 1 / (1.55 + p1[2]*0.35);
    const x1 = (p1[0]*Math.cos(rot) - p1[1]*Math.sin(rot)) * S * k1;
    const y1 = ((p1[0]*Math.sin(rot) + p1[1]*Math.cos(rot)) * tilt + p1[2]*1.2) * S * k1 * 0.72;
    const d = (p0[2] + 0.34) / 0.68;
    c.strokeStyle = i % 7 === 0 ? C.accent : C.bone;
    c.globalAlpha = 0.14 + 0.62 * clamp(d, 0, 1) * (i % 7 === 0 ? 1 : 0.55);
    c.lineWidth = 0.7 + 0.9 * clamp(d, 0, 1);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  }
  c.globalAlpha = 1;
  c.restore();

  /* --- the scope: 1200 samples, phase locked to the beat --- */
  const sx = G.x(15), sy = G.y(2), sw = G.cell(15, 2, 9, 7).w, sh = G.cell(15, 2, 9, 7).h;
  const acOn = smoothstep(0.6, 1.8, t);
  const dcOn = t > 5.2 ? 1 : 0;
  const cyBase = sy + sh*0.5;
  c.beginPath();
  for (let i=0;i<=1200;i++){
    const u = i/1200;
    const age = t - (1 - u) * 1.6;
    const env = Math.exp(-Math.max(0, age) * 2.2) * acOn;
    const v = Math.sin((u*14 + t*3.2) * TAU) * env * (1 - dcOn*0.7);
    const y = cyBase + v * sh * 0.30;
    if (i === 0) c.moveTo(sx + u*sw, y); else c.lineTo(sx + u*sw, y);
  }
  c.strokeStyle = C.bone; c.lineWidth = 1.1; c.globalAlpha = 0.6; c.stroke();
  c.globalAlpha = 1;

  /* the rectified band */
  if (dcOn){
    const w2 = sw * smoothstep(5.2, 6.2, t);
    c.fillStyle = C.accent; c.globalAlpha = 0.10;
    c.fillRect(sx, cyBase - sh*0.10, w2, sh*0.20);
    line(sx, cyBase, sx + w2, cyBase, C.accent, 1.4, 0.85);
    c.globalAlpha = 1;
  }

  G.tag('AC / DC', 15, 0, 5, 12);
  G.text('50.00 Hz', 15, 1, 10, C.bone, 0.5, 1.2);
  G.text('rectified ' + (dcOn ? '100%' : Math.round(acOn*40) + '%'), 20, 1, 10, C.accent, 0.9, 1.0);
  G.text('beam 1200 samples', 15, 11, 9, C.bone, 0.35, 1.0);
  label(c, 'CURRENT', W - 40, H - 18, 0.35, 'right', 8);
}

SCENE_REGISTRY[4] = function(c, s){ world04n(c, s); };
SCENE_REGISTRY[5] = function(c, s){ world05n(c, s); };
SHOT[4] = { z:1, chrome:'none' };
SHOT[5] = { z:1, chrome:'none' };
