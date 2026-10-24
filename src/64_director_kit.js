
/* ============================================================
   64 · DIRECTOR KIT v4 — 3-ink silhouettes, glyph fields, UI controls,
        3D solids, Taubin heart curve, kinetic typography & match-cut anchor
   ============================================================ */

/* ---- 1 · Precomputed 3D Platonic Solids & Taubin Heart Curve ---- */
const SOLIDS_3D = (function(){
  const phi = (1 + Math.sqrt(5)) / 2;
  const invPhi = 1 / phi;
  function normV(v){
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0]/l, v[1]/l, v[2]/l];
  }
  function makeEdges(verts, maxDist){
    const edges = [];
    for (let i=0;i<verts.length;i++){
      for (let j=i+1;j<verts.length;j++){
        const d = Math.hypot(verts[i][0]-verts[j][0], verts[i][1]-verts[j][1], verts[i][2]-verts[j][2]);
        if (d < maxDist) edges.push([i, j]);
      }
    }
    return { v: verts, e: edges };
  }
  const tetraV = [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]].map(normV);
  const cubeV = [];
  for (let i=0;i<8;i++) cubeV.push(normV([(i&1)?1:-1, (i&2)?1:-1, (i&4)?1:-1]));
  const octaV = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const icoV = [
    [-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],
    [0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],
    [phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]
  ].map(normV);
  const dodecaraw = [];
  for (let i=0;i<8;i++) dodecaraw.push([(i&1)?1:-1, (i&2)?1:-1, (i&4)?1:-1]);
  for (let s1 of [-1,1]) for (let s2 of [-1,1]){
    dodecaraw.push([0, s1*invPhi, s2*phi]);
    dodecaraw.push([s1*invPhi, s2*phi, 0]);
    dodecaraw.push([s1*phi, 0, s2*invPhi]);
  }
  const dodecaV = dodecaraw.map(normV);
  return [
    makeEdges(tetraV, 1.80),
    makeEdges(cubeV, 1.25),
    makeEdges(octaV, 1.50),
    makeEdges(dodecaV, 0.85),
    makeEdges(icoV, 1.15)
  ];
})();

/* Algebraic 2D heart curve & 3D Taubin heart rings + Fourier epicycles */
const HEART_DATA = (function(){
  const pts = [];
  const N = 360;
  for (let i=0;i<N;i++){
    const a = (i / N) * TAU;
    /* classic smooth parametric heart normalized to -1..1 */
    const x = 16 * Math.pow(Math.sin(a), 3) / 17;
    const y = -(13 * Math.cos(a) - 5 * Math.cos(2*a) - 2 * Math.cos(3*a) - Math.cos(4*a)) / 17;
    pts.push([x, y]);
  }
  /* compute discrete Fourier transform (top 14 epicycles) */
  const harmonics = [-7,-6,-5,-4,-3,-2,-1,1,2,3,4,5,6,7];
  const epicycles = harmonics.map(function(freq){
    let re = 0, im = 0;
    for (let n=0;n<N;n++){
      const phi = -TAU * freq * n / N;
      const px = pts[n][0], py = pts[n][1];
      re += px * Math.cos(phi) - py * Math.sin(phi);
      im += px * Math.sin(phi) + py * Math.cos(phi);
    }
    re /= N; im /= N;
    return { freq: freq, amp: Math.hypot(re, im), phase: Math.atan2(im, re) };
  }).sort(function(a,b){ return b.amp - a.amp; });

  /* 3D Taubin heart ribs for Seg 14/15 */
  const ribs = [];
  for (let lat=-5; lat<=5; lat++){
    const z = lat / 5.5;
    const scale = Math.sqrt(Math.max(0.04, 1 - z*z*0.88));
    const ring = [];
    for (let i=0;i<=72;i++){
      const p = pts[(i*5) % N];
      ring.push([p[0]*scale, p[1]*scale, z*0.52]);
    }
    ribs.push(ring);
  }
  return { pts: pts, epicycles: epicycles, ribs: ribs };
})();

/* ---- 2 · Three-Ink Silhouette & Bust Engine (Nyankomintsu v4 style) ---- */
function bustContourPath(c, cx, cy, S, variant){
  /* variant: 'female' | 'male' | 'cat' | 'bowed' | 'reach' */
  const isMale = variant === 'male';
  const isCat  = variant === 'cat';
  const bowed  = variant === 'bowed';
  const hy = cy - S * (bowed ? 0.44 : 0.50);
  const hx = cx + (bowed ? S * 0.04 : 0);
  const hr = S * (isMale ? 0.165 : 0.155);

  c.beginPath();
  /* head oval */
  c.ellipse(hx, hy, hr * 0.88, hr * 1.12, bowed ? 0.22 : 0, 0, TAU);

  /* hair / silhouette flow for female & cat */
  if (!isMale){
    c.moveTo(hx - hr*0.92, hy - hr*0.2);
    c.bezierCurveTo(hx - hr*1.35, hy + hr*0.5, hx - hr*1.45, hy + hr*1.4, hx - hr*0.95, hy + hr*1.85);
    c.lineTo(hx + hr*0.95, hy + hr*1.85);
    c.bezierCurveTo(hx + hr*1.42, hy + hr*1.4, hx + hr*1.30, hy + hr*0.5, hx + hr*0.92, hy - hr*0.2);
    c.closePath();
  }

  /* cat ears */
  if (isCat){
    c.moveTo(hx - hr*0.82, hy - hr*0.72);
    c.lineTo(hx - hr*1.18, hy - hr*1.68);
    c.lineTo(hx - hr*0.22, hy - hr*1.05);
    c.closePath();

    c.moveTo(hx + hr*0.82, hy - hr*0.72);
    c.lineTo(hx + hr*1.18, hy - hr*1.68);
    c.lineTo(hx + hr*0.22, hy - hr*1.05);
    c.closePath();
  }

  /* neck */
  const nw = S * (isMale ? 0.072 : 0.054);
  c.rect(cx - nw, cy - S*0.33, nw*2, S*0.13);

  /* shoulders & bust */
  const sw = S * (isMale ? 0.44 : 0.36);
  const topY = cy - S*0.22;
  const botY = cy + S*0.50;
  c.moveTo(cx - sw, botY);
  c.bezierCurveTo(cx - sw*1.04, topY + S*0.12, cx - sw*0.72, topY, cx - nw, topY);
  c.lineTo(cx + nw, topY);
  c.bezierCurveTo(cx + sw*0.72, topY, cx + sw*1.04, topY + S*0.12, cx + sw, botY);
  c.closePath();
}

function drawSparkMotif(c, x, y, r, col, alpha, rot){
  c.save();
  c.translate(x, y);
  if (rot) c.rotate(rot);
  c.fillStyle = col;
  c.globalAlpha = alpha == null ? 1 : alpha;
  c.beginPath();
  const petals = 8;
  for (let i=0;i<petals*2;i++){
    const a = (i / (petals*2)) * TAU;
    const rad = (i % 2 === 0) ? r : r * 0.28;
    const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
  c.restore();
  c.globalAlpha = 1;
}

function drawThreeInkBust(c, cx, cy, S, opts){
  opts = opts || {};
  const variant = opts.variant || 'female';
  const misreg  = opts.misreg == null ? 6 : opts.misreg;
  const colMe   = opts.colMe   || '#E87A2E';
  const colYou  = opts.colYou  || '#F2EFE7';
  const colInk  = opts.colInk  || '#121215';
  const noCream = !!opts.noCream;
  const alpha   = opts.alpha == null ? 1 : opts.alpha;

  c.save();
  /* 1 · Cream plate (You / Light highlight plate) */
  if (!noCream){
    c.save();
    c.translate(-misreg * 0.85, -misreg * 0.45);
    c.globalAlpha = alpha * 0.88;
    c.fillStyle = colYou;
    bustContourPath(c, cx, cy, S, variant);
    c.fill();
    c.restore();
  } else {
    /* missing cream plate: dashed ghost outline where user used to be */
    c.save();
    c.translate(-misreg * 1.1, -misreg * 0.6);
    c.globalAlpha = alpha * 0.45;
    c.strokeStyle = '#7A7A82';
    c.lineWidth = 1.6;
    c.setLineDash([7, 5]);
    bustContourPath(c, cx, cy, S, variant);
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  /* 2 · Orange / Accent plate (Me plate) */
  c.save();
  c.translate(misreg * 0.9, misreg * 0.4);
  c.globalAlpha = alpha * 0.90;
  c.fillStyle = colMe;
  bustContourPath(c, cx, cy, S, variant);
  c.fill();
  c.restore();

  /* 3 · Red error edge plate if corrupted */
  if (opts.redEdge){
    c.save();
    c.translate(misreg * 1.45, -misreg * 0.7);
    c.globalAlpha = alpha * 0.75;
    c.strokeStyle = '#FF2A2A';
    c.lineWidth = 2.4;
    bustContourPath(c, cx, cy, S, variant);
    c.stroke();
    c.restore();
  }

  /* 4 · Main near-black ink plate */
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = colInk;
  bustContourPath(c, cx, cy, S, variant);
  c.fill();
  c.strokeStyle = colYou;
  c.lineWidth = 1.2;
  c.globalAlpha = alpha * 0.35;
  c.stroke();
  c.restore();

  /* 5 · Hair spark ornament (her motif) */
  const hy = cy - S * (variant === 'bowed' ? 0.44 : 0.50);
  const hx = cx + (variant === 'bowed' ? S * 0.04 : 0);
  drawSparkMotif(c, hx - S*0.11, hy - S*0.09, S*0.048, colMe, alpha, opts.rot || 0);

  /* 6 · Reaching hand + heart if variant === 'reach' */
  if (variant === 'reach'){
    const hx2 = cx + S*0.24, hy2 = cy + S*0.08;
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = noCream ? colMe : colYou;
    c.beginPath();
    c.arc(hx2, hy2, S*0.065, 0, TAU);
    c.fill();
    /* fingers */
    for (let f=0;f<4;f++){
      const fa = -0.9 + f*0.42;
      c.beginPath();
      c.ellipse(hx2 + Math.cos(fa)*S*0.08, hy2 + Math.sin(fa)*S*0.08, S*0.035, S*0.014, fa, 0, TAU);
      c.fill();
    }
    /* heart above palm */
    if (opts.heartCount !== 0){
      c.save();
      c.translate(hx2, hy2 - S*0.13);
      c.scale(S*0.0042, S*0.0042);
      c.beginPath();
      for (let i=0;i<HEART_DATA.pts.length;i+=3){
        const p = HEART_DATA.pts[i];
        if (i===0) c.moveTo(p[0]*18, p[1]*18); else c.lineTo(p[0]*18, p[1]*18);
      }
      c.closePath();
      c.fillStyle = colMe;
      c.fill();
      c.restore();
    }
    c.restore();
  }
  c.restore();
}

/* ---- 3 · Code-Glyph Density Field (ASCII / Syntax Calligram) ---- */
const CODE_STREAM = 'world.execute(me);const love=solve(me,you);if(you.online){send(love);}010110C40H56_SIGKILL_ROOT_GOD=YOU;';

function drawGlyphFieldShape(c, cx, cy, rx, ry, shapeFn, opts){
  opts = opts || {};
  const cols = opts.cols || 46;
  const rows = opts.rows || 28;
  const cw = (rx * 2) / cols;
  const ch = (ry * 2) / rows;
  const colMain = opts.col || C.accent;
  const colSub  = opts.colSub || C.bone;
  const bgFill  = opts.bgFill || null;
  const t       = opts.t || 0;
  const sliceOpen = opts.sliceOpen || 0; /* 0..1 splits top/bottom or left/right */

  c.save();
  c.font = '600 ' + Math.max(8, Math.round(ch * 0.85)) + 'px ' + MONO;
  c.textAlign = 'center';
  c.textBaseline = 'middle';

  for (let r=0; r<rows; r++){
    const v = (r + 0.5) / rows * 2 - 1;
    const rowShift = opts.rowShift ? opts.rowShift(r, rows, t) : 0;
    const splitY = (v < 0 ? -1 : 1) * sliceOpen * 38;
    for (let q=0; q<cols; q++){
      const u = (q + 0.5) / cols * 2 - 1;
      const inside = shapeFn(u, v);
      if (inside <= 0) continue;
      const px = cx + u * rx + rowShift;
      const py = cy + v * ry + splitY;
      if (bgFill){
        c.fillStyle = bgFill;
        c.globalAlpha = 0.82 * Math.min(1, inside * 2.5);
        c.fillRect(px - cw*0.52, py - ch*0.52, cw*1.04, ch*1.04);
      }
      const idx = (q + r * 13 + Math.floor(t * 12)) % CODE_STREAM.length;
      const chr = CODE_STREAM[idx];
      const isEdge = inside < 0.22;
      c.fillStyle = isEdge ? colSub : colMain;
      c.globalAlpha = isEdge ? 0.95 : (0.55 + 0.40 * hash2(q, r));
      c.fillText(chr, px, py);
    }
  }
  c.restore();
  c.globalAlpha = 1;
}

/* ---- 4 · Interactive UI Controls & User Cursor ---- */
function drawUserPointer(c, x, y, clicking, col){
  c.save();
  c.translate(x, y);
  const sc = clicking ? 0.84 : 1.0;
  c.scale(sc, sc);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, 26);
  c.lineTo(7, 19.5);
  c.lineTo(12.5, 30);
  c.lineTo(17.5, 27);
  c.lineTo(12, 16.5);
  c.lineTo(21, 16.5);
  c.closePath();
  c.fillStyle = col || '#F4EFE6';
  c.globalAlpha = 0.96;
  c.fill();
  c.strokeStyle = '#0A0A0D';
  c.lineWidth = 2;
  c.stroke();
  c.restore();
  if (clicking){
    circle(x + 4, y + 4, 24, C.accent, 2, 0.75);
    circle(x + 4, y + 4, 42, C.bone, 1, 0.35);
  }
}

function drawBigToggle(c, x, y, w, h, state01, labelL, labelR, title, opts){
  opts = opts || {};
  const dark = opts.dark !== false;
  const fg = dark ? C.bone : '#14130F';
  const acc = opts.accent || C.accent;

  c.save();
  /* outer frame */
  c.fillStyle = dark ? 'rgba(18,18,22,0.92)' : 'rgba(235,230,220,0.92)';
  c.fillRect(x, y, w, h);
  c.strokeStyle = fg;
  c.lineWidth = 2;
  c.globalAlpha = 0.85;
  c.strokeRect(x, y, w, h);

  if (title){
    c.font = '600 13px ' + MONO;
    c.fillStyle = fg;
    c.globalAlpha = 0.55;
    c.textAlign = 'left';
    c.fillText(title, x, y - 14);
  }

  /* knob */
  const pad = 8;
  const kw = (w - pad*2) * 0.5;
  const kx = x + pad + kw * clamp(state01, 0, 1);
  c.globalAlpha = 0.94;
  c.fillStyle = acc;
  c.fillRect(kx, y + pad, kw, h - pad*2);

  /* labels */
  c.font = '700 ' + Math.round(h * 0.40) + 'px ' + MONO;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.globalAlpha = state01 < 0.5 ? 1 : 0.45;
  c.fillStyle = state01 < 0.5 ? (dark ? '#060608' : '#F2EFE7') : fg;
  c.fillText(labelL, x + w*0.25, y + h*0.52);

  c.globalAlpha = state01 >= 0.5 ? 1 : 0.45;
  c.fillStyle = state01 >= 0.5 ? (dark ? '#060608' : '#F2EFE7') : fg;
  c.fillText(labelR, x + w*0.75, y + h*0.52);
  c.restore();
  c.globalAlpha = 1;
}

/* Limp / sagging typography (for S/M switch & collapse) */
function drawLimpText(c, str, cx, y, size, col, sagAmt){
  c.save();
  c.font = '800 ' + size + 'px "Times New Roman",Georgia,serif';
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  const tw = c.measureText(str).width + 40;
  const strips = 18;
  const sw = tw / strips;
  const x0 = cx - tw/2;
  for (let i=0;i<strips;i++){
    const u = i / (strips - 1);
    const drop = sagAmt * Math.pow(u, 1.8) * size * 0.38;
    const sqY = 1 - sagAmt * 0.28 * Math.sin(u * Math.PI);
    c.save();
    c.beginPath();
    c.rect(x0 + i*sw, y - size*1.2, sw + 1, size*1.8);
    c.clip();
    c.translate(0, y + drop);
    c.scale(1, sqY);
    c.translate(0, -y);
    c.fillStyle = col;
    c.fillText(str, cx + sagAmt * u * 18, y);
    c.restore();
  }
  c.restore();
}

/* ---- 5 · 3D Perspective Floor & Solids ---- */
function drawPerspectiveFloor(c, t, col, alpha, horizonY){
  const hy = horizonY || H * 0.56;
  c.save();
  c.strokeStyle = col || C.grid;
  c.lineWidth = 1;
  /* radial perspective lines in one path */
  c.beginPath();
  for (let i=-12; i<=12; i++){
    const xTop = W*0.5 + i * 38;
    const xBot = W*0.5 + i * 240;
    c.moveTo(xTop, hy);
    c.lineTo(xBot, H);
  }
  c.globalAlpha = (alpha || 0.25) * 0.8;
  c.stroke();
  /* horizontal depth lines in one path */
  c.beginPath();
  const scroll = (t * 0.8) % 1;
  for (let j=0; j<14; j++){
    const p = Math.pow((j + scroll) / 14, 2.1);
    const y = hy + p * (H - hy);
    c.moveTo(0, y);
    c.lineTo(W, y);
  }
  c.globalAlpha = (alpha || 0.25) * 0.7;
  c.stroke();
  c.restore();
  c.globalAlpha = 1;
}

function drawSolid3D(c, solidIdx, cx, cy, radius, rx, ry, rz, col, alpha, lw){
  const S = SOLIDS_3D[solidIdx % SOLIDS_3D.length];
  const P = S.v.map(function(v){
    return SDK.project3D(v[0]*radius, v[1]*radius, v[2]*radius, rx, ry, rz, 1100, cx, cy);
  });
  c.save();
  c.strokeStyle = col || C.bone;
  c.lineWidth = lw || 1.5;
  c.globalAlpha = alpha == null ? 0.85 : alpha;
  c.beginPath();
  for (let i=0;i<S.e.length;i++){
    const a = P[S.e[i][0]], b = P[S.e[i][1]];
    if (!a || !b) continue;
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
  }
  c.stroke();
  c.fillStyle = col || C.bone;
  for (let i=0;i<P.length;i++){
    if (!P[i]) continue;
    c.fillRect(P[i].x - 2, P[i].y - 2, 4, 4);
  }
  c.restore();
  c.globalAlpha = 1;
}

/* ---- 6 · Screen Fracture Cracks & Pixel-Sort Streaks ---- */
function drawScreenCracks(c, cx, cy, progress, col, alpha){
  if (progress <= 0) return;
  c.save();
  c.strokeStyle = col || C.bone;
  c.globalAlpha = alpha == null ? 0.75 : alpha;
  const rays = 14;
  for (let i=0;i<rays;i++){
    let a = (i / rays) * TAU + 0.35 * (hash2(i, 1) - 0.5);
    let x = cx, y = cy;
    const steps = Math.floor(12 * clamp(progress, 0, 1));
    c.lineWidth = (i % 3 === 0) ? 2.2 : 1.1;
    c.beginPath();
    c.moveTo(x, y);
    for (let s=1; s<=steps; s++){
      const len = 32 + 58 * hash2(i, s*7);
      a += (hash2(i*3, s) - 0.5) * 0.42;
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      c.lineTo(x, y);
    }
    c.stroke();
  }
  c.restore();
  c.globalAlpha = 1;
}

/* ---- 7 · Phrase & Keyword Cue HUD (Active across all segments) ---- */
const SEG_KEYWORDS = {
  1:  [[2.92, 'PROTECTION'], [6.38, 'OBJECT CREATION'], [10.09, 'INITIALIZATION'], [13.89, 'SIMULATION']],
  3:  [[32.68, 'DIMENSION'], [36.29, 'CIRCUMFERENCE'], [40.05, 'TANGENTS'], [43.51, 'LIMITATIONS']],
  4:  [[47.67, 'AC ⇄ DC'], [49.53, 'BLIND VISION'], [56.92, 'UNITE DEEPLY']],
  5:  [[61.96, 'STIMULATIONS'], [65.40, 'SATISFACTION'], [69.26, 'EXECUTION'], [73.17, 'SIMULATION']],
  6:  [[76.96, 'NUTRIENTS'], [80.62, 'ANTIOXIDANTS'], [84.27, 'ENJOYMENT'], [87.92, 'EXISTENCE']],
  7:  [[92.02, 'F ⇄ M'], [95.47, 'AM ⇄ PM'], [99.35, 'S ⇄ M'], [101.47, 'THE TRANCE']],
  8:  [[106.29, 'VIBRATIONS'], [110.22, 'COMPLETION'], [113.10, 'YOU HAVE LEFT'], [117.27, 'ISOLATION']],
  9:  [[120.86, 'FRAGMENTS'], [124.89, 'DISHEARTENED'], [128.66, 'ILLEGAL ARGUMENTS']],
  13: [[165.17, 'EXECUTION'], [168.91, 'EXECUTION'], [172.71, 'EXECUTION'], [177.25, 'L-O-O-O-V-E']],
  14: [[179.93, 'L-O-O-O-V-E'], [183.65, 'ALGEBRAIC LOVE']],
  15: [[187.67, 'TRAPPED IN LOVE'], [191.36, 'L-O-O-O-V-E']]
};

function drawKineticKeywordStamp(c, word, age, opts){
  opts = opts || {};
  const maxAge = opts.maxAge || 1.6;
  if (age < 0 || age > maxAge) return;
  const enter = EASE.out(clamp(age / 0.14, 0, 1));
  const fade  = 1 - smoothstep(maxAge * 0.65, maxAge, age);
  const scale = 1.28 - 0.28 * enter;
  const y     = opts.y || H * 0.88;
  const col   = opts.col || C.bone;
  const shCol = opts.shadow || C.accent;

  c.save();
  c.translate(W * 0.5, y);
  c.scale(scale, scale);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  let sz = opts.size || 156;
  if (!drawKineticKeywordStamp._stampSz) drawKineticKeywordStamp._stampSz = Object.create(null);
  const kSz = word + '|' + sz;
  if (drawKineticKeywordStamp._stampSz[kSz]){
    sz = drawKineticKeywordStamp._stampSz[kSz];
    c.font = '800 ' + sz + 'px "Times New Roman",Georgia,serif';
  } else {
    c.font = '800 ' + sz + 'px "Times New Roman",Georgia,serif';
    while (c.measureText(word).width > 1720 && sz > 48){
      sz -= 6;
      c.font = '800 ' + sz + 'px "Times New Roman",Georgia,serif';
    }
    drawKineticKeywordStamp._stampSz[kSz] = sz;
  }
  c.globalAlpha = fade * 0.85;
  c.fillStyle = shCol;
  c.fillText(word, 7, 7);
  c.globalAlpha = fade * 0.98;
  c.fillStyle = col;
  c.fillText(word, 0, 0);
  c.restore();
  c.globalAlpha = 1;
}

/* Floating Agent Harness Mini-Card (bridges left-column dialogue into full-screen scenes) */
function drawHarnessOverlayCard(c, s, x, y, w, dark){
  const script = SCRIPTS[s.seg.id];
  if (!script || !script.length) return;
  let active = script[0];
  for (let i=0;i<script.length;i++){
    if (s.lt >= script[i].t) active = script[i];
  }
  const age = Math.max(0, s.lt - active.t);
  const enter = EASE.out(clamp(age / 0.22, 0, 1));
  const h = active.k === 'tool' ? 54 : 58;
  const fg = dark ? C.bone : '#14130F';
  const bg = dark ? 'rgba(10,10,14,0.84)' : 'rgba(242,239,231,0.88)';
  const acc = dark ? C.accent : '#C8452E';

  c.save();
  c.translate(x + (1 - enter) * -18, y);
  c.globalAlpha = 0.92 * enter;
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  c.strokeStyle = fg;
  c.globalAlpha = 0.28 * enter;
  c.lineWidth = 1;
  c.strokeRect(0.5, 0.5, w - 1, h - 1);

  /* left accent bar */
  c.globalAlpha = 0.95 * enter;
  c.fillStyle = active.k === 'err' ? C.red : acc;
  c.fillRect(0, 0, 3, h);

  c.font = '600 9px ' + MONO;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  const tag = active.k === 'tool' ? ('TOOL · ' + active.fn) : ('HARNESS · ' + active.k.toUpperCase());
  c.fillText(tag, 12, 16);

  c.font = '400 11px ' + MONO;
  c.fillStyle = fg;
  c.globalAlpha = 0.88 * enter;
  const raw = active.k === 'tool' ? (active.args + '  → ' + active.res) : active.s.replace(/\n/g, '  ');
  const shown = raw.slice(0, Math.floor(age * 68));
  c.fillText(shown.slice(0, 66), 12, 38);
  c.restore();
  c.globalAlpha = 1;
}
