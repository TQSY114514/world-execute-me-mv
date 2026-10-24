
/* ============================================================
   53 · SEG 06–09 on the new engine
   ============================================================ */
[6,7,8,9].forEach(function(id){ NEW_SCENE_IDS[id] = 1; delete SKIN_PAL[id]; delete SKIN_SEG[id]; });
delete BREACH_REGISTRY[9];
delete BREACH_REGISTRY[7];
delete BREACH_REGISTRY[4];
delete BREACH_REGISTRY[5];

function localEye(c, x, y, w, target, alpha){
  const ang = Math.atan2(target.y - y, target.x - x);
  c.save(); c.translate(x, y); c.rotate(ang);
  c.globalAlpha = alpha;
  c.strokeStyle = C.bone; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(0, 0, w, w*0.55, 0, 0, TAU); c.stroke();
  c.restore();
  const ix = x + Math.cos(ang)*w*0.34, iy = y + Math.sin(ang)*w*0.34;
  c.globalAlpha = alpha;
  c.fillStyle = C.accent; c.beginPath(); c.arc(ix, iy, w*0.22, 0, TAU); c.fill();
  c.fillStyle = C.bg; c.beginPath(); c.arc(ix, iy, w*0.09, 0, TAU); c.fill();
  c.globalAlpha = 1;
}

/* ---------- Seg 06 · the chain ---------- */
function world06n(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 6);

  const box = G.cell(1, 2, 15, 8);
  const cx = box.x + box.w/2, cy = box.y + box.h/2;
  const rot = t*0.55 + 0.35*springImpulse(t, Math.floor(t/0.4615)*0.4615, 5, 8);
  const N = 12;

  const pts = [];
  for (let i=0;i<N;i++){
    const px = (i - (N-1)/2) * 1.0;
    const py = (i % 2 ? -0.55 : 0.55) + Math.sin(i*0.7)*0.12;
    const pz = Math.sin(i*0.9) * 0.55;
    const rx = px*Math.cos(rot) - pz*Math.sin(rot);
    const rz = px*Math.sin(rot) + pz*Math.cos(rot);
    const k = 2.9 + rz*0.30;
    pts.push({ x: cx + rx*92/k*1.6, y: cy + (py*150 + rz*26)/k, d: 1/k });
  }

  /* bonds */
  for (let i=0;i<N-1;i++){
    const a = stagger(t, i*0.13 + 0.2, 0.4, 0.35);
    if (a <= 0) continue;
    const p0 = pts[i], p1 = pts[i+1];
    const wgt = (p0.d + p1.d) * 0.5;
    c.globalAlpha = clamp(wgt*0.9, 0.15, 0.95) * a;
    c.strokeStyle = C.bone; c.lineWidth = 1.2 + wgt*1.6;
    c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.stroke();
    if (i % 3 !== 1){
      const ox = (p1.y - p0.y)*0.12, oy = -(p1.x - p0.x)*0.12;
      c.globalAlpha *= 0.7; c.lineWidth = 1;
      c.beginPath(); c.moveTo(p0.x + ox, p0.y + oy); c.lineTo(p1.x + ox, p1.y + oy); c.stroke();
    }
  }
  c.globalAlpha = 1;

  /* atoms */
  for (let i=0;i<N;i++){
    const a = stagger(t, i*0.13 + 0.2, 0.4, 0.3);
    if (a <= 0) continue;
    c.globalAlpha = a * clamp(pts[i].d*1.4, 0.3, 1);
    c.fillStyle = i % 4 === 0 ? C.accent : C.bone;
    c.beginPath(); c.arc(pts[i].x, pts[i].y, 2.2 + pts[i].d*2.4, 0, TAU); c.fill();
    c.globalAlpha = 1;
  }

  /* mini cut fruit */
  const tb = G.cell(17, 3, 5, 5);
  const tr = Math.min(tb.w, tb.h) * 0.42, tcx = tb.x + tb.w/2, tcy = tb.y + tb.h/2;
  const rv = smoothstep(1.2, 2.6, t);
  c.globalAlpha = 0.95;
  c.beginPath(); c.arc(tcx, tcy, tr, 0, TAU);
  c.fillStyle = '#B7392A'; c.fill();
  c.strokeStyle = C.bone; c.lineWidth = 1; c.stroke();
  for (let k=0;k<6;k++){
    c.save(); c.translate(tcx, tcy); c.rotate(k/6*TAU + 0.3);
    c.beginPath(); c.moveTo(tr*0.18, 0);
    c.bezierCurveTo(tr*0.45, -tr*0.22, tr*0.80, -tr*0.18, tr*0.84, 0);
    c.bezierCurveTo(tr*0.80, tr*0.18, tr*0.45, tr*0.22, tr*0.18, 0);
    c.closePath();
    c.fillStyle = 'rgba(240,222,206,' + (0.85*rv) + ')'; c.fill();
    c.restore();
  }
  c.globalAlpha = 1;

  G.tag('C40H56', 0, 0, 4, 13);
  G.text('lycopene / 11 conjugated bonds', 5, 0, 10, C.bone, 0.5, 1.0);
  G.text('chain ' + Math.min(11, Math.floor(t*2.4)) + ' / 11', 17, 1, 9, C.accent, 0.85, 1.0);
  label(c, 'BIOCHEM', W - 40, H - 18, 0.35, 'right', 8);
}

/* ---------- Seg 07 · the rings of eyes (printed on paper, 8 fps) ---------- */
function world07n(c, s){
  const t = s.lt;
  const tq = Math.floor(t * 8) / 8;          /* stop motion: 8 frames per second */

  /* paper */
  c.fillStyle = '#F2EFE8'; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(24,23,20,0.07)';
  for (let y = 10; y < H; y += 18) for (let x = 10; x < W; x += 18){
    c.beginPath(); c.arc(x + ((y/18)%2)*9, y, 1.1, 0, TAU); c.fill();
  }

  const cx = W*0.5, cy = H*0.46;
  const bi = Math.floor(tq / 0.923);
  const target = { x: 1180 + (bi % 5) * 140, y: 880 - (bi % 4) * 90 };

  const ink = '#17150F';
  const rings = [
    { n: 11, r: 430, tilt: 0.50, sp: 0.26 },
    { n: 15, r: 300, tilt: 0.62, sp: -0.34 },
    { n: 19, r: 176, tilt: 0.74, sp: 0.44 }
  ];
  rings.forEach(function(ring, ri){
    for (let i=0;i<ring.n;i++){
      const a = i/ring.n*TAU + tq*ring.sp + ri*0.4;
      const x = cx + Math.cos(a)*ring.r;
      const y = cy + Math.sin(a)*ring.r*ring.tilt;
      const ap = clamp((tq - i*0.045 - ri*0.12) / 0.25, 0, 1);
      if (ap <= 0) continue;
      const ang = Math.atan2(target.y - y, target.x - x);
      const w = 15 + ri*3;
      c.save();
      c.translate(x, y); c.rotate(ang);
      c.globalAlpha = ap;
      c.strokeStyle = ink; c.lineWidth = 2;
      c.beginPath(); c.ellipse(0, 0, w, w*0.55, 0, 0, TAU); c.stroke();
      c.restore();
      const ix = x + Math.cos(ang)*w*0.34, iy = y + Math.sin(ang)*w*0.34;
      c.globalAlpha = ap;
      c.fillStyle = ink;
      c.beginPath(); c.arc(ix, iy, w*0.22, 0, TAU); c.fill();
      c.fillStyle = '#F2EFE8';
      c.beginPath(); c.arc(ix, iy, w*0.085, 0, TAU); c.fill();
      c.globalAlpha = 1;
    }
  });

  /* the point they all look at: a printed target */
  const tp = 1 + 0.25 * Math.abs(springImpulse(tq, bi*0.923, 8, 9));
  c.strokeStyle = ink; c.lineWidth = 2;
  c.beginPath(); c.arc(target.x, target.y, 22*tp, 0, TAU); c.stroke();
  c.beginPath(); c.moveTo(target.x-34*tp, target.y); c.lineTo(target.x+34*tp, target.y); c.stroke();
  c.beginPath(); c.moveTo(target.x, target.y-34*tp); c.lineTo(target.x, target.y+34*tp); c.stroke();
  c.fillStyle = ink;
  c.beginPath(); c.arc(target.x, target.y, 5, 0, TAU); c.fill();

  /* one printed line, no chrome */
  c.globalAlpha = 0.9;
  c.font = '600 26px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = ink;
  c.textAlign = 'left';
  c.fillText('ROOT_GOD = YOU', 64, 96);
  c.font = '600 26px "JetBrains Mono",Consolas,monospace';
  c.textAlign = 'right';
  c.fillText('25.6 Hz', W - 64, H - 64);
  c.globalAlpha = 1;
}

/* ---------- Seg 08 · the shape that changes ---------- */
function bodyField(u, v){
  /* u,v in -1..1 */
  const head = (u*u)/(0.13*0.13) + ((v-0.66)*(v-0.66))/(0.115*0.115) < 1;
  const neck = Math.abs(u) < 0.045 && v < 0.58 && v > 0.50;
  const torso = Math.abs(u) < (0.26 - 0.10*(v+0.3)) && v < 0.52 && v > -0.24;
  const legL = u > -0.20 && u < -0.03 && v < -0.20 && v > -0.98;
  const legR = u > 0.03 && u < 0.20 && v < -0.20 && v > -0.98;
  return head || neck || torso || legL || legR;
}

function world08n(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 8);

  const box = G.cell(4, 1, 16, 10);
  const COLS = 44, ROWS = 52;
  const cw = box.w / COLS, chh = box.h / ROWS;
  const wave = (t * 1.6) % 4;

  for (let j=0;j<ROWS;j++){
    for (let i=0;i<COLS;i++){
      const u = (i + 0.5)/COLS * 2 - 1;
      const v = 1 - (j + 0.5)/ROWS * 2;
      if (!bodyField(u, v)) continue;
      const d = Math.hypot(u, v*0.8);
      const gate = Math.sin(d*7 - wave*2.4);
      const on = gate > -0.35;
      if (!on) continue;
      const a = 0.25 + 0.75 * clamp(gate, 0, 1);
      c.globalAlpha = a * (0.55 + 0.45*Math.sin(t*3 + j*0.3));
      c.fillStyle = (i + j + Math.floor(t*4)) % 17 === 0 ? C.accent : C.bone;
      c.fillRect(box.x + i*cw, box.y + j*chh, cw*0.82, chh*0.82);
    }
  }
  c.globalAlpha = 1;

  G.tag('identity.enum', 0, 0, 5, 11);
  G.text('M | F | null', 6, 0, 11, C.bone, 0.6, 1.2);
  G.text('cells ' + (COLS*ROWS), 20, 0, 9, C.bone, 0.4, 1.0);
  G.text('state ' + ['M','F','NULL','BOTH'][Math.floor(t/1.8)%4], 20, 1, 9, C.accent, 0.9, 1.0);
  label(c, 'POLYMORPHISM', W - 40, H - 18, 0.35, 'right', 8);
}

/* ---------- Seg 09 · the field answers ---------- */
function world09n(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 9);

  const cx = W*0.5, cy = H*0.5;
  const N = 900;
  const bi = Math.floor(t / 0.4615);
  const shock = springImpulse(t, bi*0.4615, 2.2, 5);
  const R = 120 + 520*clamp((t % 4.6)/4.6, 0, 1);

  for (let i=0;i<N;i++){
    const a = hash2(i, 1) * TAU;
    const rr = Math.pow(hash2(i, 2), 0.65) * 520;
    const push = Math.exp(-Math.abs(rr - R)/90) * 46 * shock;
    const x = cx + Math.cos(a + t*0.08) * (rr + push);
    const y = cy + Math.sin(a + t*0.08) * (rr + push) * 0.86;
    const d = 1 - rr/560;
    c.globalAlpha = 0.10 + 0.62*d;
    c.fillStyle = (i % 23 === 0) ? C.accent : C.bone;
    const sz = 0.8 + 1.6*d;
    c.fillRect(x, y, sz, sz);
  }
  c.globalAlpha = 1;

  /* the wavefront */
  c.globalAlpha = 0.35;
  c.strokeStyle = C.accent; c.lineWidth = 1;
  c.beginPath(); c.ellipse(cx, cy, R, R*0.86, 0, 0, TAU); c.stroke();
  c.globalAlpha = 1;

  G.tag('DOPAMINE', 0, 0, 4, 11);
  G.text('resonance ' + (0.5 + shock*0.5).toFixed(3), 5, 0, 10, C.accent, 0.9, 1.0);
  G.text('particles 900', 0, 11, 9, C.bone, 0.4, 1.0);
  G.text('r = ' + Math.round(R) + ' px', 20, 11, 9, C.bone, 0.4, 1.0);
  label(c, 'RESONANCE', W - 40, H - 18, 0.35, 'right', 8);
}

SCENE_REGISTRY[6] = function(c, s){ world06n(c, s); };
SCENE_REGISTRY[7] = function(c, s){ world07n(c, s); };
SCENE_REGISTRY[8] = function(c, s){ world08n(c, s); };
SCENE_REGISTRY[9] = function(c, s){ world09n(c, s); };
[6,7,8,9].forEach(function(id){ SHOT[id] = { z:1, chrome:'none' }; });
