
/* ============================================================
   48 · THREE PLATES — droste eye / dissolving figure / cut fruit
   ============================================================ */

/* one eye, big enough to be a landscape */
function bigEye(c, x, y, R, t, alpha){
  const w = R, h = R * 0.54;
  c.save();
  c.translate(x, y);
  /* socket */
  c.beginPath();
  c.moveTo(-w, 0);
  c.quadraticCurveTo(0, -h * 1.45, w, 0);
  c.quadraticCurveTo(0, h * 1.45, -w, 0);
  c.closePath();
  c.fillStyle = 'rgba(20,20,24,1)';
  c.globalAlpha = alpha;
  c.fill();
  c.strokeStyle = C.bone; c.lineWidth = 1.6; c.stroke();

  /* iris */
  const ir = h * 0.95;
  c.beginPath(); c.arc(0, 0, ir, 0, TAU);
  c.fillStyle = C.accent; c.globalAlpha = alpha * 0.9; c.fill();
  for (let i=1;i<=6;i++){
    c.beginPath(); c.arc(0, 0, ir * i / 7, 0, TAU);
    c.strokeStyle = C.bg; c.lineWidth = 1.1;
    c.globalAlpha = alpha * 0.55; c.stroke();
  }
  /* pupil + catchlight */
  c.beginPath(); c.arc(0, 0, ir * 0.34, 0, TAU);
  c.fillStyle = C.bg; c.globalAlpha = alpha; c.fill();
  c.beginPath(); c.arc(-ir * 0.30, -ir * 0.30, ir * 0.11, 0, TAU);
  c.fillStyle = C.bone; c.globalAlpha = alpha * 0.95; c.fill();
  /* lids */
  c.beginPath();
  c.moveTo(-w, 0); c.quadraticCurveTo(0, -h * 1.45, w, 0);
  c.strokeStyle = C.bone; c.lineWidth = 2.2; c.globalAlpha = alpha; c.stroke();
  c.restore();
}

/* ---------- Seg 13 : the recursion opens on an eye ---------- */
function world13(c, s){
  const t = s.lt, cx = RCX, cy = RCY + 20;
  plateGround(c, cx - 120, cy - 140, C.bg);

  /* nested windows, each one further in */
  let R = 430, x = cx, y = cy;
  const N = 6;
  for (let k=0;k<N;k++){
    const fw = R * 1.42, fh = R * 1.02;
    frameRect(x - fw, y - fh, fw*2, fh*2, C.bone, 0.34 - k*0.045, 1);
    /* corner ticks */
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(q){
      line(x + q[0]*fw, y + q[1]*fh, x + q[0]*(fw-16), y + q[1]*fh, C.bone, 1, 0.35 - k*0.045);
    });
    bigEye(c, x, y, R, t, 0.95 - k*0.13);
    x += R * 0.20;
    y -= R * 0.10;
    R *= 0.60;
  }

  /* the tear: the frame is ripped open at the edge */
  const open = smoothstep(4.0, 6.2, t);
  if (open > 0){
    c.save();
    c.beginPath();
    c.moveTo(W, H * 0.10);
    for (let i=0;i<=14;i++){
      const v = i/14;
      c.lineTo(W - (60 + 190 * open * (0.4 + 0.6*hash2(i, 3))), H*(0.10 + 0.80*v));
    }
    c.lineTo(W, H*0.90);
    c.closePath();
    c.fillStyle = C.bg; c.globalAlpha = 0.92; c.fill();
    c.strokeStyle = C.bone; c.lineWidth = 2; c.globalAlpha = 0.8; c.stroke();
    c.restore();
  }

  label(c, 'think.recurse(depth: \u221e)', SPLIT + 30, 60, 0.42, 'left', 9);
  label(c, 'line ' + Math.min(129, Math.floor(t*2.4) + 1) + ' / 129', W - 30, H - 26, 0.3, 'right', 8);
}

/* ---------- Seg 16 : the body comes apart, keeping its grid ---------- */
function world16b(c, s){
  const t = s.lt;
  plateGround(c, RCX, RCY, C.bg);

  const H0 = 720, top = 130, x0 = RCX;
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const octx = off.getContext('2d');
  figurePath(octx, x0, top, H0);

  const explode = smoothstep(1.8, 5.6, t);
  const CELL = 24;
  const bx = x0, by = top + H0 * 0.42;

  /* a ghost of the body it still remembers */
  c.save();
  c.globalAlpha = 0.10 * (1 - explode * 0.6);
  figurePath(c, x0, top, H0);
  c.strokeStyle = C.bone; c.lineWidth = 1; c.stroke();
  c.restore();

  for (let gy = top + CELL*0.5; gy < top + H0; gy += CELL){
    for (let gx = x0 - 170; gx < x0 + 170; gx += CELL){
      if (!octx.isPointInPath(gx, gy)) continue;
      const ddx = (gx - bx), ddy = (gy - by);
      const d = Math.hypot(ddx, ddy) || 1;
      const h = hash2(Math.floor(gx/CELL), Math.floor(gy/CELL));
      const push = explode * (30 + 210 * h) * (0.25 + 0.75 * d / 340);
      const px = gx + ddx/d * push;
      const py = gy + ddy/d * push + explode * explode * (60 + 90*h);
      const rot = explode * (h - 0.5) * 1.4;

      c.save();
      c.translate(px, py);
      c.rotate(rot);
      c.globalAlpha = 0.9 - explode * 0.25 * h;
      c.fillStyle = h > 0.88 ? C.red : C.bone;
      c.fillRect(-CELL*0.42, -CELL*0.42, CELL*0.84, CELL*0.84);
      c.restore();
    }
  }
  c.globalAlpha = 1;

  label(c, 'core.decompose() · 128 shards', SPLIT + 30, 60, 0.45, 'left', 9);
  if (t > 5.4) label(c, 'still standing', W - 36, H - 40, 0.6, 'right', 10);
}

/* ---------- Seg 06 : the fruit, cut open, with its chain pulled out ---------- */
function world06c(c, s){
  const t = s.lt;
  const cx = RCX - 150, cy = RCY + 10;
  const R = 208;

  /* paper */
  c.fillStyle = '#F4F1EA'; c.fillRect(SPLIT, 0, W - SPLIT, H);
  c.fillStyle = 'rgba(26,25,23,0.055)';
  for (let y=18; y<H; y+=22) for (let x=SPLIT+14; x<W; x+=22){
    c.beginPath(); c.arc(x + ((y/22)%2)*11, y, 1.1, 0, TAU); c.fill();
  }

  const reveal = smoothstep(0.8, 3.0, t);
  const TOM = '#D9452F';

  /* the cut face */
  c.save();
  c.translate(cx, cy);
  c.rotate(-0.10 + t * 0.012);

  /* skin + flesh wall */
  c.beginPath(); c.arc(0, 0, R, 0, TAU);
  c.fillStyle = TOM; c.fill();
  c.strokeStyle = '#8E2A1C'; c.lineWidth = 6; c.stroke();
  c.beginPath(); c.arc(0, 0, R * 0.90, 0, TAU);
  c.strokeStyle = 'rgba(138,42,28,0.55)'; c.lineWidth = 2; c.stroke();
  c.beginPath(); c.arc(0, 0, R * 0.86, 0, TAU);
  c.fillStyle = '#E4573D'; c.fill();

  /* chambers: gel + seeds, slightly irregular */
  for (let k=0;k<6;k++){
    const a = k/6 * TAU + 0.30 + (hash2(k, 5) - 0.5) * 0.10;
    const spread = 1.22 + (hash2(k, 9) - 0.5) * 0.22;
    c.save(); c.rotate(a);
    c.beginPath();
    c.moveTo(R*0.20, 0);
    c.bezierCurveTo(R*0.50, -R*0.24*spread, R*0.80, -R*0.20*spread, R*0.86, 0);
    c.bezierCurveTo(R*0.80, R*0.20*spread, R*0.50, R*0.24*spread, R*0.20, 0);
    c.closePath();
    c.fillStyle = '#F0CDB8'; c.globalAlpha = reveal; c.fill();
    c.strokeStyle = '#8E2A1C'; c.lineWidth = 1.6; c.globalAlpha = reveal * 0.9; c.stroke();
    /* seeds, clustered toward the wall */
    for (let i=0;i<6;i++){
      const u = 0.42 + i*0.075 + (hash2(k*7+i, 2) - 0.5) * 0.05;
      const v = (i % 2 ? -1 : 1) * (0.045 + hash2(k*7+i, 4) * 0.05) * (1 - i*0.08);
      c.beginPath();
      c.ellipse(R*u, R*v, R*0.028, R*0.016, a * 0.2, 0, TAU);
      c.fillStyle = '#C6A377'; c.globalAlpha = reveal * 0.95; c.fill();
      c.strokeStyle = '#8E5A2E'; c.lineWidth = 0.8; c.stroke();
    }
    c.restore();
  }
  /* core */
  c.beginPath();
  for (let k=0;k<=12;k++){
    const a2 = k/12 * TAU;
    const rr = R*0.16 * (0.85 + 0.15*hash2(k, 21));
    const px = Math.cos(a2)*rr, py = Math.sin(a2)*rr;
    if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
  c.fillStyle = '#EFD5C2'; c.globalAlpha = reveal; c.fill();
  c.strokeStyle = '#8E2A1C'; c.lineWidth = 1.4; c.stroke();
  c.restore();

  /* the chain, pulled out to the right */
  const n = 11, zig = 46, stepX = 54;
  const chX = cx + R + 96, chY = cy - 10;
  const pull = smoothstep(0.6, 4.2, t);
  for (let i=0;i<n;i++){
    const x1 = chX + i*stepX, y1 = chY + (i%2 ? -zig : zig);
    if (i < n - 1){
      const x2 = chX + (i+1)*stepX, y2 = chY + ((i+1)%2 ? -zig : zig);
      const a = smoothstep(i*0.11, i*0.11 + 0.5, pull);
      /* double bond on most links */
      line(x1, y1, x2, y2, '#1A1917', 2.0, a);
      if (i % 3 !== 1) line(x1, y1 - 7, x2, y2 - 7, '#1A1917', 1.2, a * 0.85);
      /* electron */
      c.beginPath(); c.arc(x1, y1, 3.2, 0, TAU);
      c.fillStyle = '#7FC7AB'; c.globalAlpha = a; c.fill();
    }
  }

  /* the formula, printed big */
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  let fx = SPLIT + 62;
  c.fillStyle = '#1A1917'; c.globalAlpha = 0.94;
  c.font = '600 112px "Segoe UI",system-ui,sans-serif';
  c.fillText('C', fx, 252); fx += c.measureText('C').width + 2;
  c.font = '600 46px "Segoe UI",system-ui,sans-serif';
  c.fillText('40', fx, 216); fx += c.measureText('40').width + 6;
  c.font = '600 112px "Segoe UI",system-ui,sans-serif';
  c.fillText('H', fx, 252); fx += c.measureText('H').width + 2;
  c.font = '600 46px "Segoe UI",system-ui,sans-serif';
  c.fillText('56', fx, 216);
  c.globalAlpha = 1;

  c.font = '13px "Consolas",monospace';
  c.fillStyle = '#6E6A60';
  c.fillText('lycopene · 11 conjugated bonds · ' + Math.round(11 * pull) + '/11', SPLIT + 62, 286);
  c.fillText('quench  ' + (t > 8.6 ? 'ROO\u00b7 + C40H56 \u2192 ROOH + C40H55\u00b7' : 'waiting'), SPLIT + 62, H - 60);
}

SCENE_REGISTRY[13] = function(c, s){ world13(c, s); };
SCENE_REGISTRY[16] = function(c, s){ world16b(c, s); };
SCENE_REGISTRY[6]  = function(c, s){ world06c(c, s); };
[6,13,16].forEach(function(id){ SHOT[id] = { z:1.00, chrome:'none' }; });
