
/* ============================================================
   63 · MOTION II — form transformation + plotter growth
   ============================================================ */

/* ---- 1 · purge every legacy overlay layer ---- */
(function purgeLegacy(){
  for (const k in BREACH_REGISTRY) delete BREACH_REGISTRY[k];
})();

/* ---- 2 · closed contours as point arrays, morphed ---- */
const CONTOURS = {
  circle: function(u){ return [Math.cos(u*TAU), Math.sin(u*TAU)]; },
  square: function(u){
    const a = u*TAU;
    const k = 2.2;
    const cx = Math.cos(a), cy = Math.sin(a);
    const m = Math.max(Math.abs(cx), Math.abs(cy));
    return [cx/m * 0.92, cy/m * 0.92];
  },
  star: function(u){
    const a = u*TAU;
    const r = 1 + 0.30*Math.cos(6*a);
    return [Math.cos(a)*r, Math.sin(a)*r];
  },
  egg: function(u){
    const a = u*TAU;
    const r = 1 + 0.18*Math.sin(a) + 0.06*Math.cos(2*a);
    return [Math.cos(a)*r, Math.sin(a)*r*1.18];
  },
  comma: function(u){
    /* a comma / semicolon tail: a teardrop */
    const a = u*TAU;
    const r = 0.55 + 0.45*Math.cos(a*0.5);
    return [Math.cos(a)*r*0.7, Math.sin(a)*r*0.95 - 0.05];
  },
  eye: function(u){
    const a = u*TAU;
    const x = Math.cos(a);
    const y = Math.sin(a) * 0.52 * (1 - 0.15*Math.cos(a*2));
    return [x, y];
  }
};

function contourPoints(name, n){
  const f = CONTOURS[name] || CONTOURS.circle;
  const pts = [];
  for (let i=0;i<n;i++) pts.push(f(i/n));
  return pts;
}

function morphPoints(A, B, k){
  const out = [];
  for (let i=0;i<A.length;i++){
    out.push([A[i][0] + (B[i][0]-A[i][0])*k, A[i][1] + (B[i][1]-A[i][1])*k]);
  }
  return out;
}

function strokeContour(c, pts, cx, cy, size, col, alpha, close){
  c.beginPath();
  for (let i=0;i<pts.length;i++){
    const x = cx + pts[i][0]*size, y = cy + pts[i][1]*size;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  if (close !== false) c.closePath();
  c.strokeStyle = col; c.globalAlpha = alpha == null ? 1 : alpha;
  c.stroke();
  c.globalAlpha = 1;
}

/* ---- 3 · SEG 12 · the shape becomes the next shape, leaving ghosts ---- */
const MORPH_SEQ = ['circle', 'square', 'star', 'egg', 'comma', 'eye'];

function world12m(c, s){
  const t = s.lt, b = s.beat;
  posterGround(c, false, W*0.5, H*0.34);

  const N = 220;
  const idxF = t / 1.846;
  const i0 = Math.floor(idxF) % MORPH_SEQ.length;
  const i1 = (i0 + 1) % MORPH_SEQ.length;
  const k = EASE.out(clamp((idxF - Math.floor(idxF)) / 0.55, 0, 1));

  const A = contourPoints(MORPH_SEQ[i0], N);
  const B = contourPoints(MORPH_SEQ[i1], N);
  const now = morphPoints(A, B, k);

  const cx = W*0.5, cy = H*0.34, S = 300;

  /* ghosts of the last four states */
  for (let g=4; g>=1; g--){
    const gp = (i0 - g + MORPH_SEQ.length*2) % MORPH_SEQ.length;
    strokeContour(c, contourPoints(MORPH_SEQ[gp], N), cx, cy, S, PST.ink, 0.06 * (5-g)/4);
  }

  /* misregistered current contour */
  const m = 5 + b.kick * 7;
  const passes = [[m, m*0.35, PST.warm], [-m*0.5, m*0.8, PST.grey], [m*1.7, m*0.95, PST.accent]];
  for (let i=0;i<3;i++){
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.globalAlpha = 0.45;
    strokeContour(c, now, cx + passes[i][0], cy + passes[i][1], S, passes[i][2]);
    c.restore();
  }
  strokeContour(c, now, cx, cy, S, PST.ink, 1);

  /* the vertices themselves, as ticks */
  for (let i=0;i<N;i+=8){
    const x = cx + now[i][0]*S, y = cy + now[i][1]*S;
    line(x, y, x + now[i][0]*10, y + now[i][1]*10, PST.accent, 1, 0.5);
  }

  pWord(c, MORPH_SEQ[k > 0.5 ? i1 : i0].toUpperCase(), { y: H*0.88, size: 170 });
  pMeta(c, false, 'the form is negotiable · ' + MORPH_SEQ[i0] + ' → ' + MORPH_SEQ[i1], (k*100).toFixed(0) + '%');
}

/* ---- 4 · SEG 03 · the curve draws itself, the tangent follows ---- */
function world03m(c, s){
  const t = s.lt, b = s.beat;
  posterGround(c, false, W*0.5, H*0.32);

  const cx = W*0.5, cy = H*0.34;
  const S = 300;
  const f = function(x){ return 0.55*x*x - 0.35; };
  const d1 = function(x){ return 1.1*x; };

  /* growth: the pen travels left to right, once per bar */
  const cycle = 1.846;
  const prog = clamp((t % cycle) / (cycle*0.72), 0, 1);
  const head = -2.0 + 4.0 * EASE.inOut(prog);
  const shownPts = 260;

  const drawCurve = function(cc, col){
    cc.strokeStyle = col; cc.lineWidth = 2.2;
    cc.beginPath();
    for (let i=0;i<=shownPts;i++){
      const x = -2.0 + (4.0) * (i/shownPts) * (head + 2.0)/4.0;
      const X = cx + x*S*0.75, Y = cy - f(x)*S*0.55;
      if (i === 0) cc.moveTo(X, Y); else cc.lineTo(X, Y);
    }
    cc.stroke();
  };
  drawCurve(c, PST.ink);

  /* the pen + tangent */
  const x0 = head, y0 = f(x0), m0 = d1(x0);
  const X0 = cx + x0*S*0.75, Y0 = cy - y0*S*0.55;
  const tx = 220, ty = tx * m0 * 0.55/0.75;
  line(X0 - tx, Y0 + ty, X0 + tx, Y0 - ty, PST.accent, 2.2, 0.95);
  c.fillStyle = PST.ink;
  c.beginPath(); c.arc(X0, Y0, 5.5, 0, TAU); c.fill();
  c.fillStyle = PST.accent;
  c.beginPath(); c.arc(X0, Y0, 2.2, 0, TAU); c.fill();

  /* the trail of the pen */
  for (let i=1;i<=10;i++){
    const xh = head - i*0.035;
    const Xh = cx + xh*S*0.75, Yh = cy - f(xh)*S*0.55;
    c.globalAlpha = 0.30 - i*0.028;
    c.fillStyle = PST.accent;
    c.beginPath(); c.arc(Xh, Yh, 3.4 - i*0.2, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;

  pWord(c, 'TANGENT', { y: H*0.88, size: 180 });
  pMeta(c, false, "f(x) = 0.55x² − 0.35 · pen at x = " + x0.toFixed(2), "f'(x) = " + m0.toFixed(2));
}

