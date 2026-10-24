
/* ============================================================
   32 · IMPACT FRAMES — 2–3 frame full-field hits
   ============================================================ */
const IMPACTS = {
  3:  [{t:4.62,type:'invert',dur:3},{t:9.23,type:'white',dur:2},
       {t:11.08,type:'invert',dur:3},{t:13.84,type:'white',dur:2,w:'LIMIT'}],
  6:  [{t:3.02,type:'invert',dur:3},{t:5.38,type:'white',dur:2},
       {t:8.81,type:'red',dur:3},{t:10.78,type:'invert',dur:4,w:'QUENCH'}],
  12: [{t:4.92,type:'invert',dur:3},{t:9.85,type:'white',dur:2,w:'CUT'},
       {t:14.10,type:'invert',dur:3}],
  14: [{t:1.20,type:'red',dur:3},{t:3.30,type:'invert',dur:2},{t:5.40,type:'red',dur:3}],
  15: [{t:5.20,type:'invert',dur:3}]
};

function impactAt(segId, lt){
  const list = IMPACTS[segId];
  if (!list) return null;
  for (let i=0;i<list.length;i++){
    const q = list[i];
    const d = lt - q.t;
    if (d >= 0 && d < q.dur / 60) return q;
  }
  return null;
}

function drawImpact(c, q){
  if (!q) return;
  if (q.type === 'invert'){
    c.globalCompositeOperation = 'difference';
    c.globalAlpha = 1; c.fillStyle = '#ffffff';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
  } else if (q.type === 'white'){
    c.globalAlpha = 0.97; c.fillStyle = C.bone;
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
    if (q.w){
      txt(q.w, W/2, H/2 + 90, C.bg, 220, 800, 'center', 0.9);
    }
  } else if (q.type === 'red'){
    c.globalAlpha = 0.94; c.fillStyle = C.red;
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
  }
  if (q.w && q.type === 'invert'){
    txt(q.w, W/2, H/2 + 80, C.bg, 180, 800, 'center', 0.85);
  }
}

/* ============================================================
   33 · SEG 03 · TANGENT — drafting sheet, macro dolly, laser fan
   paradigm B (engineering drawing) + D (kinetic type)
   ============================================================ */
function world03b(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const k = s.beat.kick;
  const punch = 1 + 0.055 * k;
  const zoom = lerp(1.9, 15.0, smoothstep(1.2, 13.2, t)) * punch;
  const touchX = cx + 210 * Math.sin(t * 0.23);
  const touchY = waveY(touchX, t);
  const m0 = waveM(touchX, t);
  const m2 = -180 * KW * KW * Math.sin(KW*(touchX-RCX) - WW*t);
  const R = Math.abs(m2) > 1e-5 ? Math.pow(1+m0*m0, 1.5)/Math.abs(m2) : 9999;

  /* ---------- paper ---------- */
  rect(SPLIT, 0, W - SPLIT, H, C.bone, 1);

  /* ---------- kinetic type, vertical, cropped ---------- */
  c.save();
  c.fillStyle = C.bg; c.globalAlpha = 0.055;
  c.font = '800 340px ' + MONO;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.translate(cx + 20, cy);
  c.rotate(-Math.PI/2);
  c.fillText('TANGENT', 0, 0);
  c.restore();

  /* ---------- macro plane ---------- */
  c.save();
  c.translate(cx, cy);
  c.scale(zoom, zoom);
  c.translate(-touchX, -touchY);

  /* engineering grid in world units */
  const step = zoom > 8 ? 5 : zoom > 4 ? 10 : 20;
  const x0 = touchX - (W/2)/zoom, x1 = touchX + (W/2)/zoom;
  const y0 = touchY - (H/2)/zoom, y1 = touchY + (H/2)/zoom;
  c.globalAlpha = 0.07; c.strokeStyle = C.bg; c.lineWidth = 1/zoom;
  c.beginPath();
  for (let x = Math.floor(x0/step)*step; x < x1; x += step){ c.moveTo(x, y0); c.lineTo(x, y1); }
  for (let y = Math.floor(y0/step)*step; y < y1; y += step){ c.moveTo(x0, y); c.lineTo(x1, y); }
  c.stroke();
  c.globalAlpha = 1;

  /* the curve */
  c.strokeStyle = C.bg; c.lineWidth = 2.4/zoom; c.globalAlpha = 0.95;
  c.beginPath();
  for (let x = x0; x <= x1; x += 0.5/zoom){
    const y = waveY(x, t);
    if (x === x0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.stroke();

  /* laser tangent fan — spacing and length held constant on screen */
  const fanN = 41, gapS = 26 / zoom, lenS = 110 / zoom, nrmS = 30 / zoom;
  for (let i=0;i<fanN;i++){
    const px = touchX + (i - (fanN-1)/2) * gapS + (touchX - cx) * 0;
    if (px < x0 - 20/zoom || px > x1 + 20/zoom) continue;
    const py = waveY(px, t);
    const mm = waveM(px, t);
    const L = Math.hypot(1, mm);
    const dx = lenS/L, dy = lenS*mm/L;
    c.globalAlpha = 0.16; c.strokeStyle = C.bg; c.lineWidth = 0.8/zoom;
    c.beginPath(); c.moveTo(px-dx, py-dy); c.lineTo(px+dx, py+dy); c.stroke();
    const nx = -mm/L*nrmS, ny = 1/L*nrmS;
    c.globalAlpha = 0.62; c.strokeStyle = C.accent; c.lineWidth = 0.9/zoom;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px+nx, py+ny); c.stroke();
    c.beginPath();
    c.moveTo(px+nx, py+ny); c.lineTo(px+nx*0.62 - ny*0.34, py+ny*0.62 + nx*0.34);
    c.moveTo(px+nx, py+ny); c.lineTo(px+nx*0.62 + ny*0.34, py+ny*0.62 - nx*0.34);
    c.stroke();
  }

  /* the one tangent that matters */
  const L0 = Math.hypot(1, m0);
  c.globalAlpha = 1; c.strokeStyle = C.red; c.lineWidth = 1.6/zoom;
  c.beginPath();
  c.moveTo(touchX - 70/L0, touchY - 70*m0/L0);
  c.lineTo(touchX + 70/L0, touchY + 70*m0/L0);
  c.stroke();

  /* osculating circle */
  if (R < 4000){
    const ox = touchX - m0*(1+m0*m0)/m2;
    const oy = touchY + (1+m0*m0)/m2;
    c.globalAlpha = 0.75; c.strokeStyle = C.accent; c.lineWidth = 1.1/zoom;
    c.beginPath(); c.arc(ox, oy, R, 0, TAU); c.stroke();
    c.globalAlpha = 0.35;
    c.beginPath(); c.moveTo(touchX, touchY); c.lineTo(ox, oy); c.stroke();
  }
  c.globalAlpha = 1;

  /* contact point */
  c.fillStyle = C.red;
  c.fillRect(touchX - 2.2/zoom, touchY - 2.2/zoom, 4.4/zoom, 4.4/zoom);
  c.restore();

  /* ---------- sheet edge ---------- */
  line(SPLIT, 0, SPLIT, H, C.bg, 2, 0.9);

  /* ---------- annotations (screen space) ---------- */
  const ink = C.bg;
  /* crosshair at the contact */
  line(cx - 26, cy, cx - 8, cy, ink, 1, 0.55);
  line(cx + 8, cy, cx + 26, cy, ink, 1, 0.55);
  line(cx, cy - 26, cx, cy - 8, ink, 1, 0.55);
  line(cx, cy + 8, cx, cy + 26, ink, 1, 0.55);

  /* leader to the gap callout */
  line(cx + 16, cy - 10, cx + 150, cy - 74, ink, 1, 0.7);
  txt('Δ = 1.0e-4 px', cx + 156, cy - 76, C.red, 11, 700, 'left', 0.95);
  txt('tangent ∩ curve', cx + 156, cy - 62, ink, 8, 400, 'left', 0.55);

  /* vibrating ruler along the bottom */
  const ry = H - 92;
  const jit = k * 2.2;
  line(SPLIT + 20, ry, W - 20, ry, ink, 1, 0.8);
  for (let i=0;i<=64;i++){
    const x = SPLIT + 24 + i * ((W - SPLIT - 48) / 64);
    const big = i % 8 === 0;
    line(x, ry, x, ry + (big ? 12 : 6) + (big ? jit : 0), ink, 1, big ? 0.8 : 0.35);
    if (big) txt(String(i * 5), x, ry + 26, ink, 7, 400, 'center', 0.5);
  }
  txt('X / px  ×' + zoom.toFixed(2), W - 24, ry - 8, ink, 8, 600, 'right', 0.6);

  /* readout block */
  const bx = SPLIT + 28, by = 78;
  txt('d/dx', bx, by, ink, 9, 700, 'left', 0.5);
  txt('m  ' + m0.toFixed(4), bx, by + 26, ink, 18, 700, 'left', 0.9);
  txt('R  ' + (R > 4000 ? '∞' : R.toFixed(1)), bx, by + 48, ink, 11, 400, 'left', 0.6);
  txt('x  ' + (touchX - cx).toFixed(2), bx, by + 66, ink, 9, 400, 'left', 0.4);
  txt('y  ' + (touchY - cy).toFixed(2), bx, by + 80, ink, 9, 400, 'left', 0.4);
  txt('ZOOM ' + zoom.toFixed(1) + '×', bx, by + 100, C.red, 10, 700, 'left', 0.9);

  /* ---------- PiP locator ---------- */
  const px0 = W - 320, py0 = 96, pw = 280, ph = 190;
  c.globalAlpha = 1; c.fillStyle = C.bone; c.fillRect(px0, py0, pw, ph);
  c.strokeStyle = ink; c.lineWidth = 1; c.globalAlpha = 0.8;
  c.strokeRect(px0 + 0.5, py0 + 0.5, pw - 1, ph - 1);
  c.beginPath();
  for (let x = px0 + 4; x < px0 + pw - 4; x += 1){
    const wx = cx - 560 + ((x - px0) / pw) * 1120;
    const wy = py0 + ph/2 + (waveY(wx, t) - cy) * (ph*0.36/180);
    if (x === px0 + 4) c.moveTo(x, wy); else c.lineTo(x, wy);
  }
  c.globalAlpha = 0.85; c.strokeStyle = ink; c.lineWidth = 1; c.stroke();
  const lx = px0 + ((touchX - (cx - 560)) / 1120) * pw;
  c.globalAlpha = 0.9; c.strokeStyle = C.red;
  c.strokeRect(lx - 7, py0 + 40, 14, ph - 80);
  c.globalAlpha = 1;
  txt('LOCATOR · FULL CURVE', px0 + 6, py0 + 14, ink, 7, 600, 'left', 0.55);

  /* ---------- derivative table ---------- */
  const tx0 = SPLIT + 28, ty0 = H - 300;
  txt('SAMPLES', tx0, ty0, ink, 8, 700, 'left', 0.45);
  for (let i=0;i<5;i++){
    const sx = cx - 400 + i * 200;
    const sy = waveY(sx, t);
    const mm = waveM(sx, t);
    const yy = ty0 + 18 + i*16;
    txt('x' + pad3(i) + '  ' + (sx-cx).toFixed(1).padStart(7) + '   m ' + mm.toFixed(3).padStart(8), tx0, yy, ink, 8, 400, 'left', 0.45);
  }
}

/* ============================================================
   34 · SEG 06 · ANTIOXIDANT — electron cloud + stoichiometry
   ============================================================ */
function world06b(c, s){
  const t = s.lt, cx = RCX, cy = RCY + 20;
  const reveal = clamp((t - 1.6) / 3.6, 0, 1);
  const k = s.beat.kick;
  const punch = 1 + 0.03 * k;

  rightGrid(c, 0.18);

  /* ---------- kinetic type ---------- */
  c.save();
  c.globalAlpha = 0.05; c.fillStyle = C.bone;
  c.font = '800 300px ' + MONO;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('C40H56', cx, cy - 210);
  c.restore();

  /* ---------- electron cloud: halftone probability field ---------- */
  const ROT = -0.075, SCL = 1.05 * punch;
  const cs2 = Math.cos(ROT), sn2 = Math.sin(ROT);
  const TX = function(x, y){ return cx + (x*cs2 - y*sn2) * SCL; };
  const TY = function(x, y){ return cy + (x*sn2 + y*cs2) * SCL; };
  const nDots = 1400;
  for (let i=0;i<nDots;i++){
    const bond = i % 22;
    const a = LYCO.nodes[bond], b = LYCO.nodes[bond+1];
    const f = hash2(i, 1);
    const bx = a.x + (b.x-a.x)*f, by = a.y + (b.y-a.y)*f;
    const ang = hash2(i, 2) * TAU;
    const rad = 6 + 64 * Math.pow(hash2(i, 3), 2.2);
    const px = TX(bx + Math.cos(ang)*rad*0.55, by + Math.sin(ang)*rad);
    const py = TY(bx + Math.cos(ang)*rad*0.55, by + Math.sin(ang)*rad);
    const dens = Math.exp(-rad*rad / 900);
    if (dens < 0.06) continue;
    c.globalAlpha = 0.05 + 0.22 * dens * reveal;
    c.fillStyle = dens > 0.55 ? C.accent : C.bone;
    c.fillRect(px, py, 1.4, 1.4);
  }
  c.globalAlpha = 1;

  /* ---------- molecule ---------- */
  c.save();
  c.translate(cx, cy);
  c.rotate(ROT);
  c.scale(SCL, SCL);
  for (let i=0;i<22;i+=2){
    const a = LYCO.nodes[i], b = LYCO.nodes[i+1];
    const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
    const ang = Math.atan2(b.y-a.y, b.x-a.x);
    const rev = clamp(reveal * 39 - i, 0, 1);
    if (rev <= 0) continue;
    c.save(); c.translate(mx, my); c.rotate(ang);
    c.globalAlpha = 0.32 * rev; c.strokeStyle = C.accent; c.lineWidth = 1;
    c.setLineDash([3,4]);
    c.beginPath(); c.ellipse(0, -13, 16, 6, 0, 0, TAU); c.stroke();
    c.beginPath(); c.ellipse(0,  13, 16, 6, 0, 0, TAU); c.stroke();
    c.setLineDash([]);
    c.restore();
  }
  c.globalAlpha = 1;
  SDK.drawChemicalGraph(c, LYCO.nodes, LYCO.bonds, reveal, 0, 0, 1);
  if (reveal > 0.85){
    for (let q=0;q<11;q++){
      const u = fract(t*0.30 + q/11) * 21;
      const i0 = Math.floor(u), f = u - i0;
      const a = LYCO.nodes[i0], b = LYCO.nodes[Math.min(i0+1,31)];
      dot(a.x + (b.x-a.x)*f, a.y + (b.y-a.y)*f, 1.6, C.accent, 0.9);
    }
  }
  c.restore();

  /* ---------- PiP: one double bond at 6x ---------- */
  const px0 = W - 356, py0 = 92, pw = 320, ph = 210;
  c.fillStyle = C.bg; c.fillRect(px0, py0, pw, ph);
  frameRect(px0, py0, pw, ph, C.bone, 0.6, 1);
  c.save();
  c.beginPath(); c.rect(px0+1, py0+1, pw-2, ph-2); c.clip();
  const src = LYCO.nodes[10], src2 = LYCO.nodes[11];
  const mxx = (src.x+src2.x)/2, myy = (src.y+src2.y)/2;
  const mag = 6.2;
  c.translate(px0 + pw/2, py0 + ph/2 + 10);
  c.scale(mag, mag);
  c.translate(-mxx, -myy);
  c.strokeStyle = C.bone; c.lineWidth = 1.2/mag; c.globalAlpha = 0.9;
  c.beginPath(); c.moveTo(src.x, src.y); c.lineTo(src2.x, src2.y); c.stroke();
  c.strokeStyle = C.accent; c.lineWidth = 1/mag; c.globalAlpha = 0.8;
  c.beginPath(); c.moveTo(src.x, src.y-2.4); c.lineTo(src2.x, src2.y-2.4); c.stroke();
  c.globalAlpha = 0.5;
  c.beginPath(); c.ellipse(mxx, myy-9, 15, 5, 0, 0, TAU); c.stroke();
  c.beginPath(); c.ellipse(mxx, myy+9, 15, 5, 0, 0, TAU); c.stroke();
  c.restore();
  c.globalAlpha = 1;
  txt('π BOND ×6.2', px0 + 6, py0 + 14, C.bone, 7, 600, 'left', 0.6);
  txt('C10=C11', px0 + pw - 6, py0 + 14, C.accent, 7, 600, 'right', 0.8);

  /* ---------- stoichiometry box ---------- */
  const bx = SPLIT + 24, by = H - 250, bw = 430, bh = 190;
  SDK.drawTuiBox(c, bx, by, bw, bh, 'BALANCE', 'solid', 0, { seed: 6, meta: 'C40H56' });
  const rows = [
    { s: 'C40H56 + 54 O2  →  40 CO2 + 28 H2O', a: 0.72 },
    { s: 'C  40 / 40      H  56 / 56      O  108 / 108', a: 0.38 },
    { s: 'ROO· + C40H56  →  ROOH + C40H55·', c: C.accent, a: 0.6 },
    { s: (t > 8.8 ? 'H-DONATION  OK    k 1.6e10' : 'H-DONATION  ...'), a: 0.45 }
  ];
  let ly = by + 34;
  for (let i=0;i<rows.length;i++){
    txt(rows[i].s, bx + 10, ly, rows[i].c || C.bone, 8, 400, 'left', rows[i].a);
    ly += 26;
  }
  txt('ΔH  −14110 kJ/mol', bx + 10, by + bh - 12, C.bone, 8, 400, 'left', 0.35);

  /* ---------- quench ---------- */
  if (t > 8.6 && t < 12.6){
    const p = clamp((t-8.6)/1.3, 0, 1);
    const target = LYCO.nodes[11];
    const tx = TX(target.x, target.y), ty = TY(target.x, target.y);
    if (p < 1){
      const ex = lerp(SPLIT + 60, tx, easeIn(p)), ey = lerp(200, ty, easeIn(p));
      dot(ex, ey, 3, C.red, 0.95);
      line(ex, ey, tx, ty, C.red, 1, 0.18);
    } else {
      const q = clamp((t-9.9)/1.4, 0, 1);
      circle(tx, ty, 8 + 90*q, C.red, 1, (1-q)*0.9);
      circle(tx, ty, 8 + 44*q, C.accent, 1, (1-q)*0.6);
    }
  }

  label(c, 'LYCOPENE · 11 CONJUGATED C=C', SPLIT + 24, 92, 0.5, 'left', 9);
  label(c, 'ψ11 · 40 CARBONS · 9.6 nm', SPLIT + 24, 108, 0.28, 'left', 8);
}

SCENE_REGISTRY[3] = function(c, s){ world03b(c, s); };
SCENE_REGISTRY[6] = function(c, s){ world06b(c, s); };

SHOT[3] = { z:1.00, chrome:'none' };
SHOT[6] = { z:1.00, chrome:'min' };
