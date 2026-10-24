
/* ============================================================
   50 · ENGINE II — motion / grid / post / generators
   ============================================================ */

/* ---------- 1 · MOTION: bezier ease + spring impulse ---------- */
function bezierEase(x1, y1, x2, y2){
  const cx = 3*x1, bx = 3*(x2-x1) - cx, ax = 1 - cx - bx;
  const cy = 3*y1, by = 3*(y2-y1) - cy, ay = 1 - cy - by;
  const sx = function(t){ return ((ax*t + bx)*t + cx)*t; };
  const sy = function(t){ return ((ay*t + by)*t + cy)*t; };
  const dx = function(t){ return (3*ax*t + 2*bx)*t + cx; };
  return function(x){
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i=0;i<7;i++){
      const e = sx(t) - x;
      const d = dx(t) || 1e-6;
      t = clamp(t - e/d, 0, 1);
    }
    return sy(t);
  };
}
const EASE = {
  out:   bezierEase(0.16, 1.00, 0.30, 1.00),   /* the house curve: snap in, settle */
  inOut: bezierEase(0.65, 0.00, 0.35, 1.00),
  snap:  bezierEase(0.20, 0.00, 0.00, 1.00),
  back:  bezierEase(0.34, 1.56, 0.64, 1.00),
  soft:  bezierEase(0.33, 1.00, 0.68, 1.00)
};
function springImpulse(t, t0, freq, damping){
  const x = t - t0;
  if (x <= 0) return 0;
  return Math.exp(-(damping) * x) * Math.sin(x * freq * TAU);
}
function expDecay(cur, target, lambda, dt){
  return target + (cur - target) * Math.exp(-lambda * dt);
}
function stagger(t, i, gap, dur){
  const s = i * gap;
  return EASE.out(clamp((t - s) / Math.max(dur, 1e-4), 0, 1));
}

/* ---------- 2 · SWISS GRID ---------- */
function GridLayout(cols, rows, margin, gutter){
  const cw = (W - margin*2 - gutter*(cols-1)) / cols;
  const ch = (H - margin*2 - gutter*(rows-1)) / rows;
  const g = {
    cols: cols, rows: rows, margin: margin, gutter: gutter, cw: cw, ch: ch,
    x: function(col){ return margin + col*(cw + gutter); },
    y: function(row){ return margin + row*(ch + gutter); },
    cell: function(col, row, cs, rs){
      cs = cs || 1; rs = rs || 1;
      return { x: g.x(col), y: g.y(row), w: cw*cs + gutter*(cs-1), h: ch*rs + gutter*(rs-1) };
    },
    cross: function(col, row, size, color, alpha){
      const x = g.x(col), y = g.y(row), sz = size || 7;
      line(x - sz, y, x - 2, y, color || C.bone, 1, alpha == null ? 0.5 : alpha);
      line(x, y - sz, x, y - 2, color || C.bone, 1, alpha == null ? 0.5 : alpha);
    },
    text: function(str, col, row, size, color, alpha, track, weight){
      const x = g.x(col), y = g.y(row) + size;
      ctx.font = (weight || 400) + ' ' + size + 'px "JetBrains Mono",Consolas,monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = color; ctx.globalAlpha = alpha == null ? 1 : alpha;
      let cx2 = x;
      const tr = track == null ? 1.2 : track;
      for (let i=0;i<str.length;i++){
        const chr = str[i];
        ctx.fillText(chr, cx2, y);
        cx2 += ctx.measureText(chr).width + tr;
      }
      ctx.globalAlpha = 1;
      return cx2;
    },
    tag: function(str, col, row, cs, size, fg, bg){
      const q = g.cell(col, row, cs || 2, 1);
      const fs2 = size || 10;
      ctx.font = '500 ' + fs2 + 'px "JetBrains Mono",Consolas,monospace';
      const tw = ctx.measureText(str).width + 12;
      ctx.fillStyle = bg || C.bone;
      ctx.fillRect(q.x, q.y, tw, fs2 + 8);
      ctx.fillStyle = fg || C.bg;
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(str, q.x + 6, q.y + fs2 + 1);
      return tw;
    }
  };
  return g;
}

/* grid hairline furniture: rulers + hex rain */
function gridFurniture(c, g, t, seed){
  c.save();
  c.globalAlpha = 0.16;
  c.strokeStyle = C.grid; c.lineWidth = 1;
  for (let i=1;i<g.cols;i++){
    const x = g.x(i) - g.gutter/2;
    c.beginPath(); c.moveTo(x, g.margin); c.lineTo(x, g.margin + 8); c.stroke();
    c.beginPath(); c.moveTo(x, H - g.margin - 8); c.lineTo(x, H - g.margin); c.stroke();
  }
  for (let j=1;j<g.rows;j++){
    const y = g.y(j) - g.gutter/2;
    c.beginPath(); c.moveTo(g.margin, y); c.lineTo(g.margin + 8, y); c.stroke();
    c.beginPath(); c.moveTo(W - g.margin - 8, y); c.lineTo(W - g.margin, y); c.stroke();
  }
  c.restore();

  /* micro telemetry: hex stream in the margins */
  c.font = '8px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = C.bone; c.textAlign = 'left';
  for (let k=0;k<26;k++){
    const y = g.margin + 6 + k*38;
    const v = Math.floor(hash2(k + Math.floor(t*2), seed) * 65535);
    c.globalAlpha = 0.13;
    c.fillText(('0000' + v.toString(16)).slice(-4).toUpperCase(), 6, y);
    c.fillText(('0000' + ((v*7)%65535).toString(16)).slice(-4).toUpperCase(), W - 34, y);
  }
  c.globalAlpha = 1;
}

/* ---------- 3 · POST: bloom + chroma + grain ---------- */
const POST = {
  bw: 384, bh: 216,
  b1: document.createElement('canvas'),
  b2: document.createElement('canvas'),
  c1: document.createElement('canvas'),
  c2: document.createElement('canvas'),
  grain: null, gp: null,
  lean: /(\?|&)lean=1/.test(location.search)
};
POST.b1.width = POST.bw; POST.b1.height = POST.bh;
POST.b2.width = POST.bw; POST.b2.height = POST.bh;
POST.c1.width = W; POST.c1.height = H;
POST.c2.width = W; POST.c2.height = H;
POST.b1x = POST.b1.getContext('2d');
POST.b2x = POST.b2.getContext('2d');
POST.c1x = POST.c1.getContext('2d');
POST.c2x = POST.c2.getContext('2d');

function postGrainTile(){
  if (POST.grain) return POST.grain;
  const S = 256, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g2 = cv.getContext('2d');
  const im = g2.createImageData(S, S);
  const rnd = xorshift(0xBEEF01);
  for (let i=0;i<im.data.length;i+=4){
    const v = 128 + (rnd()*120 - 60);
    im.data[i]=im.data[i+1]=im.data[i+2]=v; im.data[i+3]=255;
  }
  g2.putImageData(im, 0, 0);
  return (POST.grain = cv);
}

function postProcess(c, t, kick, opts){
  opts = opts || {};
  if (POST.lean) return;
  const bloom = opts.bloom == null ? 0.34 : opts.bloom;

  /* --- bloom: quarter-res, threshold by drawing twice with 'lighter' --- */
  if (bloom > 0){
    POST.b1x.globalCompositeOperation = 'source-over';
    POST.b1x.clearRect(0, 0, POST.bw, POST.bh);
    POST.b1x.drawImage(canvas, 0, 0, POST.bw, POST.bh);
    POST.b2x.globalCompositeOperation = 'source-over';
    POST.b2x.clearRect(0, 0, POST.bw, POST.bh);
    POST.b2x.drawImage(POST.b1, 0, 0);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = bloom;
    c.drawImage(POST.b2, 0, 0, W, H);
    c.globalAlpha = bloom * 0.55;
    c.drawImage(POST.b2, -8, -8, W + 16, H + 16);
    c.restore();
  }

  /* --- chromatic jitter on the kick --- */
  const ch = opts.chroma == null ? (0.6 + kick * 2.2) : opts.chroma;
  if (kick > 0.55 && ch > 0.8){
    POST.c1x.globalCompositeOperation = 'source-over';
    POST.c1x.clearRect(0, 0, W, H);
    POST.c1x.drawImage(canvas, 0, 0);
    POST.c1x.globalCompositeOperation = 'multiply';
    POST.c1x.fillStyle = '#FF0000';
    POST.c1x.fillRect(0, 0, W, H);

    POST.c2x.globalCompositeOperation = 'source-over';
    POST.c2x.clearRect(0, 0, W, H);
    POST.c2x.drawImage(canvas, 0, 0);
    POST.c2x.globalCompositeOperation = 'multiply';
    POST.c2x.fillStyle = '#0044FF';
    POST.c2x.fillRect(0, 0, W, H);

    const d = ch * (0.6 + kick);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.34;
    c.drawImage(POST.c1, -d, 0);
    c.drawImage(POST.c2, d, 0);
    c.restore();
  }

  /* --- grain --- */
  const tile = postGrainTile();
  if (!POST.gp) POST.gp = c.createPattern(tile, 'repeat');
  const f = Math.floor(t * 60);
  c.save();
  c.globalAlpha = 0.075;
  c.globalCompositeOperation = 'overlay';
  c.translate((f*37) % 256 - 256, (f*61) % 256 - 256);
  c.fillStyle = POST.gp;
  c.fillRect(0, 0, W + 512, H + 512);
  c.restore();

  /* --- vignette --- */
  const vg = c.createRadialGradient(W/2, H/2, H*0.30, W/2, H/2, H*1.0);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.36)');
  c.fillStyle = vg;
  c.fillRect(0, 0, W, H);
}

/* ---------- 4 · GENERATORS ---------- */
const GEN = {};

/* Lorenz attractor — 2000 points, integrated once */
GEN.lorenz = (function(){
  const pts = [];
  let x = 0.1, y = 0, z = 0;
  const s = 10, r = 28, b = 8/3, dt = 0.0045;
  for (let i=0;i<2600;i++){
    const dx = s*(y-x), dy = x*(r-z)-y, dz = x*y-b*z;
    x += dx*dt; y += dy*dt; z += dz*dt;
    if (i > 300) pts.push([x, y, z]);
  }
  return pts;
})();

/* L-system tree — ~900 segments */
GEN.tree = (function(){
  const segs = [];
  function grow(x, y, a, len, depth){
    if (depth <= 0 || len < 2) return;
    const nx = x + Math.cos(a)*len, ny = y + Math.sin(a)*len;
    segs.push([x, y, nx, ny, depth]);
    grow(nx, ny, a - 0.42 + 0.08*hash2(depth, segs.length), len*0.72, depth-1);
    grow(nx, ny, a + 0.38 + 0.08*hash2(depth+7, segs.length), len*0.70, depth-1);
    if (depth % 3 === 0) grow(nx, ny, a + 0.06, len*0.55, depth-2);
  }
  grow(0, 0, -Math.PI/2, 150, 9);
  return segs;
})();

/* torus knot — 1400 vertices */
GEN.knot = (function(){
  const pts = [];
  const p = 3, q = 7, R = 1, r2 = 0.34;
  for (let i=0;i<=1400;i++){
    const u = i/1400 * TAU * p;
    const x = (R + r2*Math.cos(q*u/p)) * Math.cos(u);
    const y = (R + r2*Math.cos(q*u/p)) * Math.sin(u);
    const z = r2 * Math.sin(q*u/p);
    pts.push([x, y, z]);
  }
  return pts;
})();

/* reaction-diffusion — 96x54 grid, stepped once */
GEN.rd = (function(){
  const w = 96, h = 54;
  let a = new Float32Array(w*h), b = new Float32Array(w*h);
  for (let i=0;i<w*h;i++){ a[i] = 1; b[i] = (hash2(i%w, (i/w)|0) > 0.86) ? 1 : 0; }
  const la = 0.055, lb = 0.062, da = 0.25, db = 0.12;
  for (let step=0; step<2400; step++){
    const na = new Float32Array(w*h), nb = new Float32Array(w*h);
    for (let y=0;y<h;y++) for (let x=0;x<w;x++){
      const i = y*w+x;
      let sa=0, sb=0;
      for (let oy=-1;oy<=1;oy++) for (let ox=-1;ox<=1;ox++){
        const j = ((y+oy+h)%h)*w + ((x+ox+w)%w);
        const wgt = (ox===0 && oy===0) ? -1 : (ox===0||oy===0 ? 0.2 : 0.05);
        sa += a[j]*wgt; sb += b[j]*wgt;
      }
      const av = a[i], bv = b[i];
      const abb = av*bv*bv;
      na[i] = clamp(av + (da*sa - abb + la*(1-av)), 0, 1.2);
      nb[i] = clamp(bv + (db*sb + abb - (la+lb)*bv), 0, 1.2);
    }
    a = na; b = nb;
  }
  return { w: w, h: h, b: b };
})();
