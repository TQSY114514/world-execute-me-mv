
/* ============================================================
   5 · SDK — five operators, all real, all deterministic
   ============================================================ */

/* ---- 5.1 project3D -------------------------------------------------
   x,y,z world units; rotX/rotY/rotZ radians; fov = camera distance;
   returns screen {x,y,z,s} or null when behind the near plane. */
function project3D(x, y, z, rotX, rotY, rotZ, fov, cx, cy){
  const ca = Math.cos(rotX), sa = Math.sin(rotX);
  const y1 =  y*ca - z*sa;
  const z1 =  y*sa + z*ca;
  const cb = Math.cos(rotY), sb = Math.sin(rotY);
  const x1 =  x*cb + z1*sb;
  const z2 = -x*sb + z1*cb;
  const cc = Math.cos(rotZ), sc = Math.sin(rotZ);
  const x2 = x1*cc - y1*sc;
  const y2 = x1*sc + y1*cc;
  const den = fov + z2;
  if (den < 40) return null;
  const s = fov / den;
  return { x: cx + x2*s, y: cy + y2*s, z: z2, s: s };
}

/* ---- 5.2 drawChemicalGraph -----------------------------------------
   nodes: [{x,y,el,hl}], bonds: [{a,b,order}], progress 0..1 reveal. */
function drawChemicalGraph(c, nodes, bonds, progress, cx, cy, scale){
  if (!nodes || !nodes.length) return;
  const sx = n => cx + n.x*scale;
  const sy = n => cy + n.y*scale;
  const nb = bonds.length;
  c.lineCap = 'butt';
  for (let i=0;i<nb;i++){
    const b = bonds[i];
    const r = clamp(progress*nb - i, 0, 1);
    if (r <= 0) continue;
    const ax = sx(nodes[b.a]), ay = sy(nodes[b.a]);
    const bx = sx(nodes[b.b]), by = sy(nodes[b.b]);
    const ex = ax + (bx-ax)*r, ey = ay + (by-ay)*r;
    const dx = bx-ax, dy = by-ay, L = Math.hypot(dx,dy) || 1;
    const nx = -dy/L, ny = dx/L;
    c.globalAlpha = 1;
    c.strokeStyle = C.bone;
    if ((b.order||1) === 1){
      c.lineWidth = 1.4; c.globalAlpha = 0.88;
      c.beginPath(); c.moveTo(ax,ay); c.lineTo(ex,ey); c.stroke();
    } else {
      const gap = b.gap || 2.6;
      for (let k=0;k<b.order;k++){
        const o = (k - (b.order-1)/2) * gap * 2;
        c.lineWidth = k === 0 ? 1.4 : 1;
        c.globalAlpha = k === 0 ? 0.9 : 0.45;
        c.beginPath();
        c.moveTo(ax + nx*o, ay + ny*o);
        c.lineTo(ex + nx*o, ey + ny*o);
        c.stroke();
      }
    }
  }
  const rr = 6 * Math.min(1.6, Math.max(0.6, scale));
  for (let i=0;i<nodes.length;i++){
    const n = nodes[i];
    if (progress*nodes.length - i <= 0) continue;
    const px = sx(n), py = sy(n);
    if (n.el && n.el !== 'C'){
      c.globalAlpha = 0.95; c.strokeStyle = C.bone; c.lineWidth = 1;
      c.beginPath(); c.arc(px,py,rr,0,TAU); c.stroke();
      c.globalAlpha = 0.9; c.fillStyle = C.bone;
      c.font = '600 '+Math.round(rr*1.05)+'px '+MONO;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(n.el, px, py+0.5);
    } else {
      c.globalAlpha = 0.9; c.fillStyle = C.bone;
      c.fillRect(px-1.6, py-1.6, 3.2, 3.2);
    }
    if (n.hl){
      c.globalAlpha = 0.85; c.strokeStyle = C.accent; c.lineWidth = 1;
      c.beginPath(); c.arc(px,py,rr+4,0,TAU); c.stroke();
    }
  }
  c.globalAlpha = 1; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
}

/* ---- 5.3 drawTuiBox ------------------------------------------------
   borderStyle: 'solid' | 'dash' | 'double' | 'ascii'
   opts: {lines, size, pad, seed, meta, scroll} — auto-wrap + clip. */
function drawTuiBox(c, x, y, w, h, title, borderStyle, glitch, opts){
  glitch = glitch || 0;
  opts = opts || {};
  const rnd = xorshift(0x51ee + (opts.seed||0)*977 + Math.floor(glitch*13));
  const gx = glitch > 0 ? (rnd()*2-1) * glitch * 10 : 0;
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);

  c.save();
  /* border */
  c.strokeStyle = C.bone; c.lineWidth = 1; c.globalAlpha = 0.9;
  if (borderStyle === 'dash') c.setLineDash([7,4]);
  else if (borderStyle === 'dot') c.setLineDash([2,4]);
  c.strokeRect(x+0.5, y+0.5, w-1, h-1);
  c.setLineDash([]);
  if (borderStyle === 'double'){
    c.globalAlpha = 0.3; c.strokeRect(x+3.5, y+3.5, w-7, h-7);
  }
  /* corner ticks outside */
  c.globalAlpha = 0.95; c.strokeStyle = C.bone; c.lineWidth = 1;
  const t = 6;
  [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(function(p){
    c.beginPath();
    c.moveTo(p[0] + p[2]*t, p[1]); c.lineTo(p[0], p[1]); c.lineTo(p[0], p[1] + p[3]*t);
    c.stroke();
  });

  /* title bar — inverted block */
  const tb = 15;
  c.globalAlpha = 0.94; c.fillStyle = C.bone;
  c.fillRect(x + 1 + gx*0.4, y + 1, w - 2, tb);
  c.globalAlpha = 1; c.fillStyle = C.bg;
  c.font = '600 9px ' + MONO; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText(String(title).toUpperCase(), x + 8 + gx*0.4, y + 8.5);
  if (opts.meta){
    c.textAlign = 'right';
    c.fillText(String(opts.meta).toUpperCase(), x + w - 8, y + 8.5);
  }

  /* scanlines + inner clip */
  c.globalAlpha = 1;
  for (let sy = y + tb + 3; sy < y + h - 2; sy += 3){
    c.globalAlpha = 0.035;
    c.fillStyle = C.bone;
    c.fillRect(x+1, sy, w-2, 1);
  }
  c.globalAlpha = 1;

  /* text body */
  if (opts.lines && opts.lines.length){
    const size = opts.size || 11;
    const pad = opts.pad == null ? 10 : opts.pad;
    const lh = Math.round(size*1.55);
    c.save();
    c.beginPath(); c.rect(x+1, y+tb+2, w-2, h-tb-4); c.clip();
    let cy = y + tb + 8 + size;
    for (let i=0;i<opts.lines.length;i++){
      const ln = opts.lines[i];
      let col = C.bone, alpha = 0.62, str = ln;
      if (typeof ln === 'object'){ str = ln.s; col = ln.c || C.bone; alpha = ln.a == null ? 0.62 : ln.a; }
      const wrapped = wrapLine(String(str), w - pad*2, size);
      for (let k=0;k<wrapped.length;k++){
        if (cy > y + h - 6) break;
        c.globalAlpha = alpha; c.fillStyle = col;
        c.font = '400 ' + size + 'px ' + MONO;
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillText(wrapped[k], x + pad, cy);
        cy += lh;
      }
      if (cy > y + h - 6) break;
    }
    c.restore();
  }

  /* glitch tear inside the title */
  if (glitch > 0.05){
    const gy = y + 2 + Math.floor(rnd()*tb);
    c.globalAlpha = 0.9;
    c.fillStyle = C.bg;
    c.fillRect(x + 2, gy, w - 4, 2);
  }
  c.restore();
  c.globalAlpha = 1; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
}

/* ---- 5.4 drawAvatarCore -------------------------------------------- */
const PHI = (1 + Math.sqrt(5)) / 2;
const ICO_V = [
  [-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],
  [0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],
  [PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1]
];
const ICO_E = (function(){
  const out = [];
  for (let i=0;i<12;i++) for (let j=i+1;j<12;j++){
    const dx=ICO_V[i][0]-ICO_V[j][0], dy=ICO_V[i][1]-ICO_V[j][1], dz=ICO_V[i][2]-ICO_V[j][2];
    if (Math.abs(Math.sqrt(dx*dx+dy*dy+dz*dz) - 2) < 1e-6) out.push([i,j]);
  }
  return out;
})();
const CORE_CH = '0123456789<>/\\|_+-=#*:;';

function drawAvatarCore(c, cx, cy, radius, state, t, kick){
  const S = state || 'BOOT';
  const base = c.globalAlpha;
  const panic = S === 'PANIC';
  const col = panic ? C.red : C.bone;
  const jx = panic ? Math.sin(t*61.3)*2.2 : 0;
  const jy = panic ? Math.cos(t*53.7)*2.0 : 0;
  const R = radius, cr = Math.cos, sr = Math.sin;

  c.save();
  c.translate(cx + jx, cy + jy);

  /* --- rings --- */
  const rings = (S === 'BOOT') ? 2 : (S === 'TRAPPED' ? 3 : 2);
  for (let k=0;k<rings;k++){
    let rr = R * (0.62 + k*0.22);
    let a = 0.30 - k*0.07, dash = null;
    if (S === 'DIZZY'){
      rr = R * (0.6 + k*0.2 + 0.05*Math.sin(t*3.1 + k));
      a = 0.26;
    }
    if (S === 'SYNC') a = 0.34 + kick*0.25;
    if (panic){ dash = [3 + Math.floor((k+t*10)%6), 5]; a = 0.32 + 0.2*Math.sin(t*17+k); }
    c.globalAlpha = Math.max(0, a) * base;
    c.strokeStyle = col; c.lineWidth = 1;
    if (dash) c.setLineDash(dash);
    c.beginPath(); c.arc(0, 0, rr, t*(0.6+k*0.3), t*(0.6+k*0.3) + TAU - (dash?0.9:0)); c.stroke();
    if (dash) c.setLineDash([]);
  }

  /* --- state geometry --- */
  if (S === 'CALC' || S === 'SYNC' || S === 'DIZZY'){
    const sc = R * 0.92 / 1.902;
    const rx = t * (S === 'DIZZY' ? 1.9 : 0.55);
    const ry = t * (S === 'DIZZY' ? -1.3 : 0.83);
    const P = ICO_V.map(function(v){
      return project3D(v[0]*sc, v[1]*sc, v[2]*sc, rx, ry, 0, 900, 0, 0);
    });
    c.globalAlpha = 0.5 * base; c.strokeStyle = col; c.lineWidth = 1;
    c.beginPath();
    for (let i=0;i<ICO_E.length;i++){
      const p = P[ICO_E[i][0]], q = P[ICO_E[i][1]];
      if (!p || !q) continue;
      c.moveTo(p.x, p.y); c.lineTo(q.x, q.y);
    }
    c.stroke();
    c.globalAlpha = 0.9 * base; c.fillStyle = col;
    for (let i=0;i<P.length;i++){
      const p = P[i]; if (!p) continue;
      c.fillRect(p.x-1, p.y-1, 2, 2);
    }
  }

  if (S === 'TRAPPED'){
    const half = R * 1.45;
    const rot = t * 0.42;
    const V = [];
    for (let i=0;i<8;i++){
      const sx = (i&1)?1:-1, sy = (i&2)?1:-1, sz = (i&4)?1:-1;
      V.push(project3D(sx*half, sy*half, sz*half, 0.35, rot, 0, 1200, 0, 0));
    }
    const E = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
    c.globalAlpha = 0.34 * base; c.strokeStyle = col; c.lineWidth = 1;
    c.beginPath();
    for (let i=0;i<E.length;i++){
      const p = V[E[i][0]], q = V[E[i][1]];
      if (!p || !q) continue;
      c.moveTo(p.x,p.y); c.lineTo(q.x,q.y);
    }
    c.stroke();
  }

  /* --- crossing tick marks --- */
  const tick = R * 1.18;
  c.globalAlpha = 0.5 * base; c.strokeStyle = col; c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-tick,0); c.lineTo(-tick+6,0); c.moveTo(tick-6,0); c.lineTo(tick,0);
  c.moveTo(0,-tick); c.lineTo(0,-tick+6); c.moveTo(0,tick-6); c.lineTo(0,tick);
  c.stroke();

  /* --- ascii kernel --- */
  const N = 7;
  const cell = Math.max(6, Math.min(11, R*2/N));
  const tickRate = panic ? 18 : (S === 'BOOT' ? 4 : 8);
  const tk = Math.floor(t * tickRate);
  c.font = '400 ' + Math.round(cell*0.94) + 'px ' + MONO;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const lit = S === 'BOOT' ? 0.28 : 0.72;
  for (let j=0;j<N;j++) for (let i=0;i<N;i++){
    const h = hash2(i + tk*17, j - tk*11);
    const dx = i-(N-1)/2, dy = j-(N-1)/2;
    const d = Math.hypot(dx,dy) / (N*0.55);
    if (d > 1) continue;
    if (h > lit + d*0.18) continue;
    const ch = CORE_CH.charAt(Math.floor(h*CORE_CH.length));
    c.globalAlpha = (0.25 + 0.6*h) * base * (1 - d*0.5);
    c.fillStyle = (S === 'PANIC' && h > 0.94) ? C.red : col;
    c.fillText(ch, dx*cell, dy*cell + 1);
  }
  c.globalAlpha = 1;
  c.restore();
  c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  c.globalAlpha = 1;
}

/* ---- 5.5 applyGlitchSlices ----------------------------------------- */
function applyGlitchSlices(c, intensity, seed){
  if (!(intensity > 0.001)) return;
  intensity = clamp(intensity, 0, 1);
  const rnd = xorshift(0x9e37 + (seed|0));
  bctx.globalAlpha = 1; bctx.globalCompositeOperation = 'source-over';
  bctx.drawImage(canvas, 0, 0);

  c.save();
  c.imageSmoothingEnabled = false;
  const bands = 3 + Math.floor(intensity * 13);
  for (let i=0;i<bands;i++){
    const sy = Math.floor(rnd() * H);
    const sh = 2 + Math.floor(rnd() * (10 + 60*intensity));
    const dx = Math.round((rnd()*2-1) * 110 * intensity);
    if (sh < 1) continue;
    c.globalAlpha = 0.92;
    c.drawImage(buf, 0, sy, W, sh, dx, sy, W, sh);
  }
  /* chromatic-free channel split: accent ghost on 2 bands */
  c.globalCompositeOperation = 'lighter';
  for (let i=0;i<1+Math.floor(intensity*2);i++){
    const sy = Math.floor(rnd()*H), sh = 4 + Math.floor(rnd()*26*intensity);
    const dx = Math.round((rnd()*2-1) * 26 * intensity);
    c.globalAlpha = 0.10 * intensity;
    c.drawImage(buf, 0, sy, W, sh, dx, sy, W, sh);
  }
  /* inversion bands — only above 0.35 */
  if (intensity > 0.35){
  c.globalCompositeOperation = 'difference';
  const nInv = 1 + Math.floor(intensity * 4);
  for (let i=0;i<nInv;i++){
    const sy = Math.floor(rnd()*H), sh = 3 + Math.floor(rnd()*50*intensity);
    c.globalAlpha = 0.85;
    c.fillStyle = '#ffffff';
    c.fillRect(0, sy, W, sh);
  }
  }
  c.restore();
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

const SDK = {
  project3D: project3D,
  drawChemicalGraph: drawChemicalGraph,
  drawTuiBox: drawTuiBox,
  drawAvatarCore: drawAvatarCore,
  applyGlitchSlices: applyGlitchSlices
};
