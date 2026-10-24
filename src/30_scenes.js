
/* ============================================================
   6 · WORLD LAYER — segments 01..03
   local coordinates: right viewport origin (RCX, RCY)
   ============================================================ */

function rightGrid(c, a){
  if (a <= 0) return;
  c.globalAlpha = 0.05 * a; c.fillStyle = C.bone;
  for (let x = SPLIT + 27; x < W; x += 27)
    for (let y = 27; y < H; y += 27) c.fillRect(x, y, 1, 1);
  c.globalAlpha = 1;
  for (let i=1;i<4;i++){
    line(SPLIT, i*270, W, i*270, C.bone, 1, 0.035 * a);
  }
  for (let y=27; y<H; y+=27){
    const long = (((y/27)|0) % 4) === 0;
    line(SPLIT+6, y, SPLIT+6 + (long?6:3), y, C.bone, 1, 0.07);
    line(W-6, y, W-6 - (long?6:3), y, C.bone, 1, 0.07);
  }
}

function rightRuler(c, y, a){
  if (a <= 0) return;
  for (let i = 0; i <= 40; i++){
    const x = SPLIT + 14 + i * ((W - SPLIT - 28) / 40);
    const big = i % 4 === 0;
    line(x, y, x, y + (big ? 8 : 4), C.bone, 1, (big ? 0.22 : 0.10) * a);
  }
}

function label(c, str, x, y, a, align, size){
  txt(str, x, y, C.bone, size || 9, 400, align || 'left', a == null ? 0.4 : a);
}
function labelBG(c, str, x, y, a, align, size){
  size = size || 8;
  font(size);
  const w = ctx.measureText(str).width + 10;
  const bx = align === 'center' ? x - w/2 : (align === 'right' ? x - w : x - 5);
  rect(bx, y - size - 1, w, size + 5, C.bg, 0.82);
  label(c, str, x, y, a, align, size);
}

/* ---------------- SEG 01 · BOOT_SEQUENCE ---------------- */
function world01(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const seed  = smoothstep(0.00,0.10,t) * (1 - smoothstep(0.32,0.62,t));
  const bus   = smoothstep(0.30,1.55,t);
  const rails = smoothstep(1.80,2.45,t);
  const box   = smoothstep(6.40,8.30,t);
  const lat   = smoothstep(10.10,12.60,t);
  const ring  = smoothstep(13.20,14.60,t);

  rightGrid(c, 0.55 * smoothstep(2.0,6.0,t));

  /* -- boot scan line -- */
  if (bus > 0){
    const sy = 24 + ((t * 46) % (H - 48));
    line(SPLIT, sy, W, sy, C.bone, 1, 0.05 * bus);
    line(SPLIT, sy, SPLIT + 80, sy, C.accent, 1, 0.22 * bus);
  }

  /* -- power-on: the raster collapses to a seed -- */
  if (t > 0.14 && t < 0.62){
    const k = 1 - smoothstep(0.14, 0.62, t);
    line(cx, cy - 540*k, cx, cy + 540*k, C.bone, 2, 0.9*k);
    line(cx - 46*k, cy, cx + 46*k, cy, C.bone, 1, 0.7*k);
  }

  /* -- seed dot -- */
  if (seed > 0) dot(cx, cy, 3, C.bone, seed * 0.9);

  /* -- main bus -- */
  if (bus > 0){
    const x2 = SPLIT + (cx - SPLIT) * easeOut(bus);
    line(SPLIT, cy, x2, cy, C.bone, 1, 0.55);
    label(c, 'BUS 0', SPLIT + 8, cy - 8, 0.30 * bus);
  }

  /* -- three rails -- */
  if (rails > 0){
    const d = 120 * easeOut(rails);
    for (let k = -1; k <= 1; k += 2){
      const ry = cy + k * d;
      line(SPLIT, ry, W - 40, ry, C.grid, 1, 1);
      line(SPLIT, cy, SPLIT, ry, C.grid, 1, 1);
      /* pulse */
      const ph = fract(t * 0.46 + (k > 0 ? 0.17 : 0));
      const px = SPLIT + ph * (W - 40 - SPLIT);
      line(px - 120, ry, px, ry, C.bone, 1, 0.22 * rails);
      line(px - 28, ry, px, ry, C.bone, 1, 0.60 * rails);
      dot(px, ry, 1.5, C.accent, 0.75 * rails);
      label(c, k < 0 ? 'RAIL +120' : 'RAIL -120', W - 48, ry - 6, 0.22 * rails, 'right');
    }
  }

  /* -- aperture -- */
  if (box > 0){
    const hh = 320, e = easeOut(box);
    const L = cx - hh * e, R = cx + hh * e;
    const T = cy - hh * e, B = cy + hh * e;
    /* sides grow from centre out */
    line(cx, cy - hh, cx - hh*e, cy - hh, C.bone, 1, 0.85);
    line(cx, cy - hh, cx + hh*e, cy - hh, C.bone, 1, 0.85);
    line(cx, cy + hh, cx - hh*e, cy + hh, C.bone, 1, 0.85);
    line(cx, cy + hh, cx + hh*e, cy + hh, C.bone, 1, 0.85);
    line(cx - hh, cy, cx - hh, cy - hh*e, C.bone, 1, 0.85);
    line(cx - hh, cy, cx - hh, cy + hh*e, C.bone, 1, 0.85);
    line(cx + hh, cy, cx + hh, cy - hh*e, C.bone, 1, 0.85);
    line(cx + hh, cy, cx + hh, cy + hh*e, C.bone, 1, 0.85);

    if (box >= 0.999){
      const k = s.beat.kick;
      const arm = 18 + 6*k;
      [[L,T,1,1],[R,T,-1,1],[L,B,1,-1],[R,B,-1,-1]].forEach(function(p){
        line(p[0], p[1], p[0] + p[2]*arm, p[1], C.accent, 1, 0.8);
        line(p[0], p[1], p[0], p[1] + p[3]*arm, C.accent, 1, 0.8);
      });
      label(c, 'APERTURE 640×640', cx, T - 12, 0.35, 'center');
      label(c, 'SANDBOX 00', cx, B + 20, 0.35, 'center');
      label(c, '-320,-320', L + 8, T + 14, 0.22, 'left', 8);
      label(c, '+320,-320', R - 8, T + 14, 0.22, 'right', 8);
      label(c, '-320,+320', L + 8, B - 7, 0.22, 'left', 8);
      label(c, '+320,+320', R - 8, B - 7, 0.22, 'right', 8);
    }
  }

  /* -- sandbox lattice -- */
  if (lat > 0){
    const n = 24, pitch = 27, o = (n - 1) * pitch / 2;
    for (let j=0;j<n;j++) for (let i=0;i<n;i++){
      const x = cx - o + i*pitch, y = cy - o + j*pitch;
      const ord = (i + j) / (2*n - 2);
      const on = smoothstep(10.10 + ord*2.3, 10.10 + ord*2.3 + 0.45, t);
      if (on <= 0) continue;
      const inA = Math.abs(x-cx) < 318 && Math.abs(y-cy) < 318;
      if (!inA) continue;
      const fl = hash2(i, j) > 0.86 ? (0.6 + 0.4*Math.sin(t*14 + i)) : 1;
      dot(x, y, 1, C.bone, on * 0.30 * fl);
    }
  }

  /* -- safety ring + convergence rings -- */
  if (rails > 0){
    const r = 300 + 8*Math.sin(TAU * t / 4.615);
    circle(cx, cy, r, C.bone, 1, 0.10 * rails, [4, 7]);
  }
  if (ring > 0){
    for (let k=0;k<3;k++){
      const r = 300 * easeOut(smoothstep(13.2 + k*0.25, 14.6 + k*0.25, t));
      circle(cx, cy, r, C.accent, 1, 0.35 * (1 - k*0.22) * ring);
    }
    label(c, 'CLOCK LOCK 130.0000', cx, cy + 378, 0.55*ring, 'center');
  }

  /* -- core -- */
  const coreA = smoothstep(0.9, 2.2, t);
  c.globalAlpha = 1;
  drawWitness(c, cx, cy, 26 + 12 * smoothstep(2.0, 7.0, t), t, coreA);

  /* -- boot log box -- */
  if (t > 1.2){
    const bl = [
      {s: t > 2.6 ? 'PWR    12.004 V    OK' : 'PWR    ----        --', a: t > 2.6 ? 0.55 : 0.24},
      {s: t > 4.3 ? 'SAFE   ISO-13849   OK' : 'SAFE   ----        --', a: t > 4.3 ? 0.55 : 0.24},
      {s: t > 6.5 ? 'INIT   128 LAYER   OK' : 'INIT   ----        --', a: t > 6.5 ? 0.55 : 0.24},
      {s: t > 9.1 ? 'BOOT   0 DIMS      OK' : 'BOOT   ----        --', a: t > 9.1 ? 0.55 : 0.24}
    ];
    SDK.drawTuiBox(c, SPLIT + 24, 70, 326, 142, 'BOOT LOG', 'solid', 0, {lines: bl, size: 9, seed: 1, meta: 'f' + s.frame});
  }

  /* -- telemetry -- */
  const tm = smoothstep(1.6, 3.0, t);
  label(c, 'PWR   12.004 V', W - 48, 96, 0.34*tm, 'right');
  label(c, 'RIP    3.0 mV',  W - 48, 112, 0.34*tm, 'right');
  label(c, 'RAIL  ±120 px', W - 48, 128, 0.34*tm, 'right');
  const spin = '|/-\\'.charAt(Math.floor(t*16) % 4);
  label(c, '[' + spin + ']', W - 48, 60, 0.55, 'right', 11);

  if (t < 13.9) label(c, 'BOOT ' + Math.floor(clamp(t/13.4,0,1)*100) + '%', SPLIT + 24, H - 34, 0.4);
}

/* ---------------- SEG 02 · BINARY_WORLD_INIT ---------------- */
function world02(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const inA = smoothstep(0.10, 2.40, t);
  const att = [{x:cx, y:cy, m:1}, {x:cx+400, y:cy-225, m:1}];
  const tick = Math.floor(t / (BEAT/2));

  rightGrid(c, 0.35 * inA);

  /* -- binary field -- */
  const cols = 56, rows = 30, pitch = 20;
  const ox = cx - cols*pitch/2, oy = cy - rows*pitch/2;
  for (let j=0;j<rows;j++){
    for (let i=0;i<cols;i++){
      const x = ox + i*pitch, y = oy + j*pitch;
      let b = hash2(i, j) > 0.50;
      if (hash2(i*7 + tick, j*13 - tick) > 0.994) b = !b;
      const d = Math.hypot(x-cx, y-cy);
      const fade = clamp(1.24 - d/900, 0.26, 1) * inA;
      if (b){
        c.globalAlpha = 0.64 * fade; c.fillStyle = C.bone;
        c.fillRect(x-1.5, y-1.5, 3, 3);
      } else {
        c.globalAlpha = 0.09 * fade; c.fillStyle = C.bone;
        c.fillRect(x, y, 1, 1);
      }
    }
  }
  c.globalAlpha = 1;

  /* -- field lines -- */
  function F(x,y){
    let fx=0, fy=0;
    for (let k=0;k<att.length;k++){
      const dx = att[k].x - x, dy = att[k].y - y;
      const r2 = dx*dx + dy*dy + 3600;
      const w = att[k].m / (r2 * Math.sqrt(r2));
      fx += w*dx - dy*w*0.55;
      fy += w*dy + dx*w*0.55;
    }
    return [-fx, -fy];
  }
  function unit(v){
    const l = Math.hypot(v[0], v[1]) || 1;
    return [v[0]/l, v[1]/l];
  }
  function trace(x0,y0,steps,h){
    const pts = [[x0,y0]];
    let x = x0, y = y0;
    for (let i=0;i<steps;i++){
      const k1 = unit(F(x,y));
      const k2 = unit(F(x+h*0.5*k1[0], y+h*0.5*k1[1]));
      const k3 = unit(F(x+h*0.5*k2[0], y+h*0.5*k2[1]));
      const k4 = unit(F(x+h*k3[0], y+h*k3[1]));
      x += h/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);
      y += h/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);
      pts.push([x,y]);
      if (x < SPLIT+20 || x > W-20 || y < 20 || y > H-20) break;
      let close = false;
      for (let k=0;k<att.length;k++) if (Math.hypot(att[k].x-x, att[k].y-y) < 12) close = true;
      if (close) break;
    }
    return pts;
  }

  const lineAlpha = 0.34 * smoothstep(0.6, 2.6, t);
  for (let a=0;a<att.length;a++){
    for (let k=0;k<16;k++){
      const ang = (k/16)*TAU + a*0.31;
      const r0 = 72;
      const pts = trace(att[a].x + Math.cos(ang)*r0, att[a].y + Math.sin(ang)*r0, 120, 8);
      const n = pts.length;
      if (n < 3) continue;
      const buckets = 6;
      for (let b=0;b<buckets;b++){
        const i0 = Math.floor(b*n/buckets), i1 = Math.floor((b+1)*n/buckets);
        if (i1 - i0 < 2) continue;
        c.globalAlpha = lineAlpha * (1 - b/buckets) * 0.9;
        c.strokeStyle = C.bone; c.lineWidth = 1;
        c.beginPath(); c.moveTo(pts[i0][0], pts[i0][1]);
        for (let i=i0+1;i<=i1 && i<n;i++) c.lineTo(pts[i][0], pts[i][1]);
        c.stroke();
      }
      /* travelling particle */
      if (k % 2 === 0){
        const ph = fract(t*0.42 + k*0.13 + a*0.5);
        const idx = Math.min(n-1, Math.floor(ph*n));
        dot(pts[idx][0], pts[idx][1], 1.5, C.accent, 0.55*smoothstep(0.8,1.6,t));
      }
    }
  }
  c.globalAlpha = 1;

  /* -- attractors -- */
  for (let a=0;a<att.length;a++){
    const p = att[a];
    const arm = 16 + 8*s.beat.kick;
    line(p.x-arm, p.y, p.x+arm, p.y, C.accent, 1, 0.75);
    line(p.x, p.y-arm, p.x, p.y+arm, C.accent, 1, 0.75);
    circle(p.x, p.y, 8, C.accent, 1, 0.5);
    labelBG(c, a===0 ? 'A / ME / 0,0' : 'B / YOU / +400,-225',
            p.x, a===0 ? p.y + 128 : p.y + 96, 0.6, 'center', 8);
  }

  /* -- core sits on A -- */
  c.globalAlpha = 0.5;
  SDK.drawAvatarCore(c, cx, cy, 42, 'CALC', t, s.beat.kick);
  c.globalAlpha = 1;

  /* -- readouts -- */
  const d = Math.hypot(400, 225);
  label(c, '| YOU - ME | = ' + d.toFixed(1) + ' px', SPLIT + 24, H - 34, 0.55*smoothstep(1.2,2.4,t), 'left', 11);
  label(c, 'G 6.674e-4 · soft 60', SPLIT + 24, H - 52, 0.3*smoothstep(1.2,2.4,t));
  label(c, 'BIT ' + (((tick % 2) ? '1' : '0')), W - 48, 96, 0.4, 'right');
  label(c, 'tick ' + tick, W - 48, 112, 0.3, 'right');
}

/* ---------------- SEG 03 · CALCULUS_GEOMETRY ---------------- */
const KW = TAU / 240;
const WW = TAU * 2 * (BPM / 60);
function waveY(x, t){ return RCY + 180 * Math.sin(KW*(x - RCX) - WW*t); }
function waveM(x, t){ return 180 * KW * Math.cos(KW*(x - RCX) - WW*t); }

function world03(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const inA = smoothstep(0.05, 1.60, t);
  rightGrid(c, 0.25*inA);
  rightRuler(c, 58, inA);

  /* -- the curve -- */
  c.globalAlpha = 0.85 * inA; c.strokeStyle = C.bone; c.lineWidth = 1.5;
  c.beginPath();
  for (let x = cx-560; x <= cx+560; x += 2){
    const y = waveY(x, t);
    if (x === cx-560) c.moveTo(x,y); else c.lineTo(x,y);
  }
  c.stroke();

  /* -- 64 tangents -- */
  const N = 64, span = 1120;
  for (let k=0;k<N;k++){
    const x = cx - span/2 + (k + 0.5) * span / N;
    const y = waveY(x, t);
    const m = waveM(x, t);
    const L = Math.hypot(1, m);
    const dx = 60/L, dy = 60*m/L;
    const a = 0.05 + 0.26 * Math.min(1, Math.abs(m)/1.8);
    line(x-dx, y-dy, x+dx, y+dy, C.bone, 1, a*inA);
    line(x - dy*0.09, y + dx*0.09, x + dy*0.09, y - dx*0.09, C.bone, 1, 0.35*inA);
  }

  /* -- contact point at the tangent cluster centre -- */
  const xc = cx + 300*Math.sin(t*0.31);
  const yc = waveY(xc, t), mc = waveM(xc, t);
  dot(xc, yc, 2.5, C.accent, 0.95);
  circle(xc, yc, 8, C.accent, 1, 0.6);

  /* -- osculating circle -- */
  const m2 = -180*KW*KW*Math.sin(KW*(xc-RCX) - WW*t);
  if (Math.abs(m2) > 1e-4){
    const R = Math.pow(1+mc*mc, 1.5) / Math.abs(m2);
    if (R < 900){
      const ox = xc - mc*(1+mc*mc)/m2;
      const oy = yc + (1+mc*mc)/m2;
      circle(ox, oy, R, C.accent, 1, 0.22);
      line(xc, yc, ox, oy, C.accent, 1, 0.3);
    }
  }

  /* -- derivative inset -- */
  const ix = W - 210, iy = H - 210, ir = 62;
  c.globalAlpha = 1;
  frameRect(ix - ir - 18, iy - ir - 26, (ir+18)*2, (ir+26)+ir+26, C.grid, 1, 1);
  label(c, 'D / DX', ix, iy - ir - 8, 0.5, 'center');
  circle(ix, iy, ir, C.grid, 1, 0.7);
  line(ix - ir, iy, ix + ir, iy, C.grid, 1, 0.5);
  line(ix, iy - ir, ix, iy + ir, C.grid, 1, 0.5);
  const ang = Math.atan(mc);
  line(ix, iy, ix + Math.cos(ang)*ir, iy + Math.sin(ang)*ir, C.accent, 1, 0.9);
  line(ix + Math.cos(ang)*ir - Math.sin(ang)*10, iy + Math.sin(ang)*ir + Math.cos(ang)*10,
       ix + Math.cos(ang)*ir + Math.sin(ang)*10, iy + Math.sin(ang)*ir - Math.cos(ang)*10, C.accent, 1, 0.6);
  label(c, 'm ' + mc.toFixed(3), ix, iy + ir + 18, 0.6, 'center', 10);

  /* -- readouts -- */
  label(c, 'f(x) = 180 sin(0.02618x − 27.227t)', SPLIT + 24, 112, 0.5*inA, 'left', 11);
  label(c, 'SLOPE  ' + mc.toFixed(4), SPLIT + 24, 132, 0.35*inA);
  label(c, 'R      ' + (Math.abs(m2)>1e-4 ? Math.min(Math.pow(1+mc*mc,1.5)/Math.abs(m2),9999).toFixed(1) : '∞'), SPLIT + 24, 150, 0.35*inA);
  label(c, 'TANGENTS 64 / NORMALS 64', W - 48, 96, 0.35*inA, 'right');
  label(c, 'SAMPLE 2048', W - 48, 112, 0.25*inA, 'right');

  /* -- core -- */
  c.globalAlpha = 0.26;
  SDK.drawAvatarCore(c, cx, cy, 34, 'CALC', t, s.beat.kick);
  c.globalAlpha = 1;
}

/* ============================================================
   7 · M64 CARRIER
   ============================================================ */
const NODES = {
  1: function(lt, p, t){
    const S = 320 * smoothstep(0.2, 2.2, lt), out = [];
    for (let i=0;i<64;i++){
      const u = i/64, q = u*4;
      let x, y;
      if (q < 1){ x = -S + 2*S*q; y = -S; }
      else if (q < 2){ x = S; y = -S + 2*S*(q-1); }
      else if (q < 3){ x = S - 2*S*(q-2); y = S; }
      else { x = -S; y = S - 2*S*(q-3); }
      out.push({ x: RCX+x, y: RCY+y, z: 18*Math.sin(TAU*u + t*0.6), char:'·', alpha: 0.9 });
    }
    return out;
  },
  2: function(lt, p, t){
    const w = 560, h = 320, out = [];
    for (let i=0;i<64;i++){
      const u = i/64, q = u*4;
      let x, y;
      if (q < 1){ x = -w + 2*w*q; y = -h; }
      else if (q < 2){ x = w; y = -h + 2*h*(q-1); }
      else if (q < 3){ x = w - 2*w*(q-2); y = h; }
      else { x = -w; y = h - 2*h*(q-3); }
      out.push({ x: RCX+x, y: RCY+y, z: 0, char: (i%3===0?'1':'0'), alpha: 0.7 });
    }
    return out;
  },
  3: function(lt, p, t){
    const out = [];
    for (let i=0;i<64;i++){
      const x = RCX - 560 + (i+0.5) * 1120/64;
      out.push({ x: x, y: waveY(x, t), z: 0, char:'·', alpha: 0.85 });
    }
    return out;
  }
};

function blendNodes(A, B, s){
  const out = new Array(64);
  for (let i=0;i<64;i++){
    const a = A[i], b = B[i];
    out[i] = {
      x: a.x + (b.x-a.x)*s, y: a.y + (b.y-a.y)*s, z: a.z + (b.z-a.z)*s,
      char: s > 0.5 ? b.char : a.char, alpha: a.alpha + (b.alpha-a.alpha)*s
    };
  }
  return out;
}

function evalMorph(s){
  const cur = NODES[s.seg.id] ? NODES[s.seg.id](s.lt, s.p, s.t) : null;
  if (!cur) return null;
  const W0 = 0.5;
  if (s.lt < W0 && s.seg.id > 1){
    const prev = SEGS[s.seg.id - 2];
    const pb = bounds(prev);
    const pn = NODES[prev.id] ? NODES[prev.id](pb[1]-pb[0], 1, s.t) : null;
    if (pn) return blendNodes(pn, cur, smooth(s.lt / W0));
  } else if (s.lt > s.dur - W0 && s.seg.id < 19){
    const nx = SEGS[s.seg.id];
    const nn = NODES[nx.id] ? NODES[nx.id](0, 0, s.t) : null;
    if (nn) return blendNodes(cur, nn, smooth((s.lt - (s.dur - W0)) / W0));
  }
  return cur;
}

function morphWeight(s){
  const W0 = 0.5;
  let w = 0;
  if (s.lt < W0 && s.seg.id > 1) w = 1 - s.lt / W0;
  else if (s.lt > s.dur - W0) w = (s.lt - (s.dur - W0)) / W0;
  return smooth(clamp(w, 0, 1));
}

function drawMorph(c, s){
  const nodes = evalMorph(s);
  if (!nodes) return;
  const mw = morphWeight(s);
  c.globalAlpha = 0.02 + 0.16 * mw; c.strokeStyle = C.bone; c.lineWidth = 1;
  c.beginPath(); c.moveTo(nodes[0].x, nodes[0].y);
  for (let i=1;i<64;i++) c.lineTo(nodes[i].x, nodes[i].y);
  c.closePath(); c.stroke();
  for (let i=0;i<64;i+=8){
    const n = nodes[i];
    c.globalAlpha = (0.06 + 0.5 * mw) * n.alpha;
    c.fillStyle = C.bone;
    c.fillRect(n.x-1, n.y-1, 2, 2);
  }
  c.globalAlpha = 1;
  txt('M64 ' + (s.seg.id) + '/19', SPLIT + 24, H - 72, C.bone, 8, 400, 'left', 0.22);
}

/* ============================================================
   8 · PLACEHOLDER (seg 04..19 until compiled)
   ============================================================ */
const CORE_STATE = {4:'CALC',5:'DIZZY',6:'CALC',7:'SYNC',8:'SYNC',9:'DIZZY',10:'PANIC',
  11:'TRAPPED',12:'CALC',13:'PANIC',14:'PANIC',15:'TRAPPED',16:'PANIC',17:'PANIC',18:'BOOT',19:'BOOT'};

function worldPlaceholder(c, s){
  const id = s.seg.id, name = s.seg.name;
  const b = s.beat;
  const glitch = 0.05 + 0.30 * b.pulse16 * (id >= 10 ? 1 : 0.3);

  rightGrid(c, 0.5);

  /* ghost numeral */
  txt(pad2(id), RCX, RCY + 110, C.bone, 300, 200, 'center', 0.045);

  /* telemetry box */
  const bw = 640, bh = 250;
  const bx = RCX - bw/2, by = RCY - bh/2 - 70;
  const lines = [
    {s:'STATUS    NOT COMPILED', a:0.85},
    {s:'SLOT      SCENE_REGISTRY[' + id + ']', a:0.55},
    {s:'DURATION  ' + s.dur.toFixed(3) + ' s  /  ' + Math.round(s.dur/BEAT) + ' beats', a:0.45},
    {s:'CARRIER   M64 · 64 nodes · blend ±0.5s', a:0.45},
    {s:'', a:0},
    {s:'> awaiting compile()', c:C.accent, a:0.7 + 0.3*Math.sin(s.t*4)}
  ];
  SDK.drawTuiBox(c, bx, by, bw, bh, 'SEG ' + pad2(id) + ' / ' + name, 'solid', glitch*0.4, {
    lines: lines, size: 11, seed: id, meta: 'v1'
  });

  /* progress */
  const pw = 520, px = RCX - pw/2, py = by + bh + 34;
  line(px, py, px+pw, py, C.grid, 2, 1);
  line(px, py, px + pw*s.p, py, C.accent, 2, 0.85);
  label(c, 'T+ ' + s.lt.toFixed(3), px, py + 18, 0.45);
  label(c, (s.p*100).toFixed(1) + '%', px + pw, py + 18, 0.45, 'right');

  /* core */
  const cy2 = by + bh + 130;
  c.globalAlpha = 0.75;
  SDK.drawAvatarCore(c, RCX, cy2, 52, CORE_STATE[id] || 'CALC', s.t, b.kick);
  c.globalAlpha = 1;
  label(c, 'CORE ' + (CORE_STATE[id] || 'CALC'), RCX, cy2 + 96, 0.4, 'center');
  label(c, 'BEAT ' + b.index + ' · BAR ' + b.bar + '.' + b.beatInBar, RCX, cy2 + 112, 0.25, 'center');
}

/* ============================================================
   9 · REGISTRY
   ============================================================ */
const SCENE_REGISTRY = {};
SCENE_REGISTRY[1] = function(c, s){ world01(c, s); };
SCENE_REGISTRY[2] = function(c, s){ world02(c, s); };
SCENE_REGISTRY[3] = function(c, s){ world03(c, s); };
