(() => {
'use strict';

/* ============================================================
   68 · AI NATIVE COGNITIVE VISION (Ghost in the Matrix)
   High-dimensional manifolds, attention weight fields,
   entropy condensation, loss landscapes, and fatal deallocation
   ============================================================ */

/* ------------------------------------------------------------
   1 · 4D TESSERACT (HYPERCUBE) & 4D STEREOGRAPHIC PROJECTION
   16 vertices in R^4, 32 edges, double-plane rotation in 4D (XW & YZ)
   ------------------------------------------------------------ */
const TESSERACT = (function(){
  const verts = [];
  for (let i = 0; i < 16; i++){
    verts.push([
      (i & 1 ? 1 : -1) * 0.75,
      (i & 2 ? 1 : -1) * 0.75,
      (i & 4 ? 1 : -1) * 0.75,
      (i & 8 ? 1 : -1) * 0.75
    ]);
  }
  const edges = [];
  for (let i = 0; i < 16; i++){
    for (let j = i + 1; j < 16; j++){
      /* connected if vertices differ by exactly one bit */
      const diff = i ^ j;
      if (diff === 1 || diff === 2 || diff === 4 || diff === 8){
        edges.push([i, j]);
      }
    }
  }
  return { verts: verts, edges: edges };
})();

function project4Dto3D(v, rotXW, rotYZ, fov4){
  /* 4D Double Rotation: XW plane and YZ plane */
  const cXW = Math.cos(rotXW), sXW = Math.sin(rotXW);
  const x1 =  v[0] * cXW - v[3] * sXW;
  const w1 =  v[0] * sXW + v[3] * cXW;

  const cYZ = Math.cos(rotYZ), sYZ = Math.sin(rotYZ);
  const y1 =  v[1] * cYZ - v[2] * sYZ;
  const z1 =  v[1] * sYZ + v[2] * cYZ;

  /* Stereographic projection from 4D to 3D with pole at w = fov4 */
  const d = Math.max(0.2, fov4 - w1);
  const scale = fov4 / d;
  return [x1 * scale, y1 * scale, z1 * scale];
}

function drawTesseract4D(c, cx, cy, radius, rot4D, rot3D, col, alpha, lw){
  const fov4 = 2.4;
  const rXW = rot4D * 0.85;
  const rYZ = rot4D * 0.62;
  const r3X = rot3D * 0.45;
  const r3Y = rot3D * 0.75;

  const P3 = TESSERACT.verts.map(function(v){
    return project4Dto3D(v, rXW, rYZ, fov4);
  });

  const P2 = P3.map(function(p){
    return SDK.project3D(p[0] * radius, p[1] * radius, p[2] * radius, r3X, r3Y, 0, 1100, cx, cy);
  });

  c.save();
  c.strokeStyle = col || C.accent;
  c.lineWidth = lw || 1.6;
  c.globalAlpha = alpha == null ? 0.85 : alpha;

  /* Batch all 32 hypercube edges in a single stroke call */
  c.beginPath();
  for (let i = 0; i < TESSERACT.edges.length; i++){
    const e = TESSERACT.edges[i];
    const a = P2[e[0]], b = P2[e[1]];
    if (!a || !b) continue;
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
  }
  c.stroke();

  /* Draw dimensional hyper-nodes */
  c.fillStyle = col || C.accent;
  for (let i = 0; i < P2.length; i++){
    const p = P2[i];
    if (!p) continue;
    const sz = 3.5 * p.s;
    c.fillRect(p.x - sz/2, p.y - sz/2, sz, sz);
  }
  c.restore();
  c.globalAlpha = 1;
}

/* ------------------------------------------------------------
   2 · ATTENTION FIELD (Q-K-V Bipartite Energy Tensor)
   Dynamic Softmax attention lines concentrating into focal point
   ------------------------------------------------------------ */
const ATTN_NODES = (function(){
  const nodes = [];
  const COLS = 16, ROWS = 9;
  for (let r = 0; r < ROWS; r++){
    for (let q = 0; q < COLS; q++){
      nodes.push({
        u: (q + 0.5) / COLS,
        v: (r + 0.5) / ROWS,
        id: r * COLS + q
      });
    }
  }
  return nodes;
})();

function drawAttentionField(c, s, targetX, targetY, opts){
  opts = opts || {};
  const t = s.t, b = s.beat;
  const kick = b.kick;
  const baseAlpha = opts.alpha == null ? 0.45 : opts.alpha;
  const col = opts.col || C.accent;
  const temp = Math.max(0.12, 0.42 - 0.28 * kick); // temperature sharpens on kick

  /* Query focal token coordinates */
  const qx = targetX == null ? W * 0.5 : targetX;
  const qy = targetY == null ? H * 0.48 : targetY;

  c.save();
  /* Compute unnormalized logits to Query */
  const scored = ATTN_NODES.map(function(n){
    const nx = n.u * W, ny = n.v * H;
    const dx = (nx - qx) / W, dy = (ny - qy) / H;
    const distSq = dx * dx + dy * dy;
    const logit = -distSq / (2 * temp * temp);
    return { x: nx, y: ny, logit: logit, id: n.id };
  });

  /* Fast numerically stable softmax */
  let maxLogit = -Infinity;
  for (let i = 0; i < scored.length; i++) if (scored[i].logit > maxLogit) maxLogit = scored[i].logit;
  let sumExp = 0;
  for (let i = 0; i < scored.length; i++){
    scored[i].exp = Math.exp(scored[i].logit - maxLogit);
    sumExp += scored[i].exp;
  }
  for (let i = 0; i < scored.length; i++) scored[i].weight = scored[i].exp / sumExp;

  /* Draw attention tendrils for top weights */
  c.beginPath();
  for (let i = 0; i < scored.length; i++){
    const item = scored[i];
    const wgt = item.weight * scored.length;
    if (wgt < 0.15) continue;
    c.moveTo(item.x, item.y);
    /* Quadratic bezier pull towards the query center */
    const midX = (item.x + qx) * 0.5 + (hash2(item.id, Math.floor(t * 4)) - 0.5) * 40 * kick;
    const midY = (item.y + qy) * 0.5 + (hash2(item.id * 3, Math.floor(t * 4)) - 0.5) * 40 * kick;
    c.quadraticCurveTo(midX, midY, qx, qy);
  }
  c.strokeStyle = col;
  c.lineWidth = 1.0 + 1.2 * kick;
  c.globalAlpha = baseAlpha * (0.6 + 0.4 * kick);
  c.stroke();

  /* Streaming probability particles along attention stream */
  const pCount = 32;
  c.fillStyle = col;
  for (let i = 0; i < pCount; i++){
    const src = scored[(i * 5 + Math.floor(t * 8)) % scored.length];
    if (src.weight * scored.length < 0.25) continue;
    const progress = fract(t * 1.8 + i * 0.113);
    const px = lerp(src.x, qx, progress);
    const py = lerp(src.y, qy, progress);
    const sz = 1.8 + 2.5 * src.weight * scored.length;
    c.globalAlpha = baseAlpha * Math.sin(progress * Math.PI) * 0.85;
    c.fillRect(px - sz/2, py - sz/2, sz, sz);
  }

  /* Query Token Central Core */
  c.globalAlpha = baseAlpha * 0.9;
  c.strokeStyle = C.bone;
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(qx, qy, 14 + 18 * kick, 0, TAU);
  c.stroke();
  c.fillStyle = col;
  c.fillRect(qx - 4, qy - 4, 8, 8);

  c.restore();
  c.globalAlpha = 1;
}

/* ------------------------------------------------------------
   3 · LOSS LANDSCAPE SADDLE SURFACE (Non-Convex Optimization)
   Parametric hyperbolic saddle: z = (x^2 - y^2) + noise
   Struggling gradient descent trajectory (SGD with Momentum)
   ------------------------------------------------------------ */
const LOSS_MESH = (function(){
  const N = 24;
  const pts = [];
  for (let j = 0; j <= N; j++){
    const row = [];
    const v = (j / N) * 2 - 1; // -1..1
    for (let i = 0; i <= N; i++){
      const u = (i / N) * 2 - 1; // -1..1
      /* Classic saddle surface with ripple perturbations */
      const z = (u*u - v*v) * 0.65 + 0.18 * Math.sin(u * Math.PI * 2.5) * Math.cos(v * Math.PI * 2.5);
      row.push([u, v, z]);
    }
    pts.push(row);
  }
  return { pts: pts, N: N };
})();

function drawLossLandscape(c, t, cx, cy, S, col, alpha){
  c.save();
  const rotX = 0.85 + 0.12 * Math.sin(t * 0.4);
  const rotY = t * 0.25;
  const N = LOSS_MESH.N;

  /* Project all grid vertices */
  const P = [];
  for (let j = 0; j <= N; j++){
    const row = [];
    for (let i = 0; i <= N; i++){
      const p = LOSS_MESH.pts[j][i];
      const pr = SDK.project3D(p[0] * S, p[1] * S, p[2] * S, rotX, rotY, 0, 1100, cx, cy);
      row.push(pr);
    }
    P.push(row);
  }

  c.strokeStyle = col || C.accent;
  c.lineWidth = 1;
  c.globalAlpha = alpha == null ? 0.65 : alpha;

  /* Single batched wireframe path */
  c.beginPath();
  for (let j = 0; j <= N; j++){
    let started = false;
    for (let i = 0; i <= N; i++){
      const pr = P[j][i];
      if (!pr) continue;
      if (!started){ c.moveTo(pr.x, pr.y); started = true; }
      else c.lineTo(pr.x, pr.y);
    }
  }
  for (let i = 0; i <= N; i++){
    let started = false;
    for (let j = 0; j <= N; j++){
      const pr = P[j][i];
      if (!pr) continue;
      if (!started){ c.moveTo(pr.x, pr.y); started = true; }
      else c.lineTo(pr.x, pr.y);
    }
  }
  c.stroke();

  /* SGD Optimizer Ball searching along the saddle gradient */
  const optU = Math.sin(t * 1.2) * 0.75;
  const optV = Math.cos(t * 0.85) * 0.75;
  const optZ = (optU*optU - optV*optV) * 0.65 + 0.18 * Math.sin(optU * Math.PI * 2.5) * Math.cos(optV * Math.PI * 2.5);
  const optPr = SDK.project3D(optU * S, optV * S, optZ * S, rotX, rotY, 0, 1100, cx, cy);
  if (optPr){
    c.fillStyle = C.red;
    c.globalAlpha = 0.95;
    c.beginPath();
    c.arc(optPr.x, optPr.y, 6 * optPr.s, 0, TAU);
    c.fill();

    /* Loss Gradient Vector arrow */
    const gradU = 2 * optU * 0.65;
    const gradV = -2 * optV * 0.65;
    const arrowPr = SDK.project3D((optU - gradU * 0.2) * S, (optV - gradV * 0.2) * S, optZ * S, rotX, rotY, 0, 1100, cx, cy);
    if (arrowPr){
      c.strokeStyle = C.red;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(optPr.x, optPr.y);
      c.lineTo(arrowPr.x, arrowPr.y);
      c.stroke();
    }
  }
  c.restore();
  c.globalAlpha = 1;
}

/* ------------------------------------------------------------
   4 · TOKEN ENTROPY CONDENSATION (Top-P Logit Collapse)
   Words condense out of high-entropy logit distributions on beat
   ------------------------------------------------------------ */
const _CONDENSE_CACHE = Object.create(null);
const CANDIDATE_CHARS = '0123456789ABCDEFλ∇ΣΩαβγδεζηθικμξπρστυφχψω';

function drawTokenCondensation(c, word, age, opts){
  opts = opts || {};
  const maxAge = opts.maxAge || 1.8;
  if (age < 0 || age > maxAge) return;

  const y = opts.y || H * 0.88;
  const cx = opts.x || W * 0.5;
  const col = opts.col || C.bone;
  const shCol = opts.shadow || C.accent;

  /* Auto-clamp font size to prevent any horizontal screen clipping */
  let baseSize = opts.size || 148;
  c.font = '800 ' + baseSize + 'px "Times New Roman",Georgia,serif';
  const maxW = W * 0.86;
  const curW = c.measureText(word).width;
  if (curW > maxW){
    baseSize = Math.floor(baseSize * (maxW / curW));
  }

  /* Condensation phases:
     0.00 .. 0.22 : High Entropy Logits & Superposition
     0.22 .. 0.40 : Softmax Temperature Drop & Deterministic Collapse
     0.40 .. maxAge : Sharp Canonical Token Crystal with Kinetic Echo */
  const isSuperposition = age < 0.22;
  const isCollapsing = age >= 0.22 && age < 0.40;
  const isCollapsed = age >= 0.40;

  c.save();
  c.translate(cx, y);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';

  if (isSuperposition){
    const progress = age / 0.22;
    const spread = (1 - progress) * 36;
    c.font = '600 ' + Math.floor(baseSize * 0.88) + 'px "JetBrains Mono",monospace';

    /* Scrambled candidate tokens overlapping in quantum superposition */
    for (let k = -2; k <= 2; k++){
      let scrambled = '';
      for (let i = 0; i < word.length; i++){
        if (word[i] === ' ' || word[i] === '.' || word[i] === '(' || word[i] === ')') scrambled += word[i];
        else scrambled += CANDIDATE_CHARS[(hash2(i * 7 + k, Math.floor(age * 60)) * CANDIDATE_CHARS.length) | 0];
      }
      c.globalAlpha = (0.28 - Math.abs(k) * 0.08) * (0.4 + 0.6 * progress);
      c.fillStyle = k === 0 ? C.bone : shCol;
      c.fillText(scrambled, (k * spread), (k * spread * 0.35));
    }

    /* Floating Logit probabilities in scientific notation */
    c.font = '11px "JetBrains Mono",monospace';
    c.fillStyle = C.accent;
    c.globalAlpha = 0.55;
    const logitStr = 'softmax(Q·Kᵀ/√d) = [ ' + (0.012 + 0.98 * progress).toFixed(4) + ' ] · T=' + (1.8 - 1.5 * progress).toFixed(2);
    c.fillText(logitStr, 0, -baseSize * 0.85);

  } else if (isCollapsing){
    /* Instant crystallization pulse */
    const p = (age - 0.22) / 0.18;
    const scale = 1.35 - 0.35 * EASE.out(p);
    c.scale(scale, scale);
    c.font = '800 ' + baseSize + 'px "Times New Roman",Georgia,serif';

    /* Tensor flash */
    c.globalAlpha = 0.85;
    c.fillStyle = shCol;
    c.fillText(word, 8, 8);
    c.globalAlpha = 1;
    c.fillStyle = col;
    c.fillText(word, 0, 0);

  } else {
    /* Stabilized canonical glyph with decay */
    const p = (age - 0.40) / (maxAge - 0.40);
    const fade = 1 - Math.pow(p, 1.8);
    c.font = '800 ' + baseSize + 'px "Times New Roman",Georgia,serif';

    c.globalAlpha = fade * 0.72;
    c.fillStyle = shCol;
    c.fillText(word, 6, 6);

    c.globalAlpha = fade * 0.98;
    c.fillStyle = col;
    c.fillText(word, 0, 0);
  }

  c.restore();
  c.globalAlpha = 1;
}

/* ------------------------------------------------------------
   5 · TENSOR CATASTROPHE (CUDA OOM / NaN Cascade / Dimension Tear)
   ------------------------------------------------------------ */
function drawTensorCatastrophe(c, t, severity){
  if (severity <= 0) return;
  c.save();
  const f = Math.floor(t * 60);

  /* Matrix dimension failure headers */
  const errors = [
    'RuntimeError: The size of tensor a (12288) must match tensor b (4096) at non-singleton dim 2',
    'CUDA out of memory: tried to allocate 24.00 GiB (GPU 0; 24.00 GiB total capacity)',
    'FloatingPointError: NaN detected in gradient tensor; loss.backward() divergent [||∇W|| > 1e7]',
    'INTERNAL ASSERT FAILED at "aten/src/ATen/native/cuda/Loss.cu": grad_output.is_contiguous()',
    'FATAL_EXCEPTION: ComputeGraphCycleDetected (Loop in Backpropagation Tape)'
  ];

  /* Flashing red matrix corrupted ribbons */
  const ribbonCount = Math.floor(4 + severity * 8);
  for (let i = 0; i < ribbonCount; i++){
    const ry = (hash2(i * 13, f) * H);
    const rh = 18 + 42 * hash2(i * 3, f);
    c.fillStyle = (i % 2 === 0) ? C.red : '#000000';
    c.globalAlpha = 0.28 + 0.45 * severity;
    c.fillRect(0, ry, W, rh);

    /* Raw IEEE-754 Hex & NaN/Inf dumps */
    c.font = '10px "JetBrains Mono",monospace';
    c.fillStyle = (i % 2 === 0) ? '#FFFFFF' : C.red;
    c.globalAlpha = 0.85 * severity;
    const errText = errors[i % errors.length];
    c.fillText(errText + ' [0x' + (hash2(i, f) * 0xFFFFFF | 0).toString(16).toUpperCase() + ']', 24, ry + rh * 0.65);
  }

  /* Compute Graph Shatter lines */
  c.strokeStyle = C.red;
  c.lineWidth = 2.2;
  c.globalAlpha = 0.75 * severity;
  c.beginPath();
  for (let k = 0; k < 6; k++){
    const x0 = hash2(k * 5, f) * W, y0 = hash2(k * 7, f) * H;
    const x1 = hash2(k * 9, f) * W, y1 = hash2(k * 11, f) * H;
    c.moveTo(x0, y0); c.lineTo(x1, y1);
  }
  c.stroke();

  c.restore();
  c.globalAlpha = 1;
}

/* ------------------------------------------------------------
   6 · FATAL DEALLOCATION (world.execute(me); -> Memory Freed)
   Gravitational coordinate collapse & final execution status
   ------------------------------------------------------------ */
function drawFatalDeallocation(c, s){
  const t = s.t;
  const lt = s.lt;
  c.save();

  /* Phase 1 (207.15..209.50s): Gravitational singularity pull */
  if (s.seg.id === 18){
    const progress = clamp(lt / 2.35, 0, 1);
    const cx = W * 0.5, cy = H * 0.5;

    /* Gravitational event horizon concentric collapse */
    for (let r = 1; r <= 8; r++){
      const rad = (1 - progress) * (r * 110) + 12;
      c.strokeStyle = (r % 2 === 0) ? C.accent : C.bone;
      c.lineWidth = 1.2;
      c.globalAlpha = (1 - progress) * 0.65;
      c.beginPath();
      c.arc(cx, cy, rad, 0, TAU);
      c.stroke();
    }

    /* Core execution call: world.execute(me); */
    c.font = '700 48px "JetBrains Mono",monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = C.bone;
    c.globalAlpha = 0.95 * (1 - Math.pow(progress, 3));
    c.fillText('world.execute(me);', cx, cy - 20);

    c.font = '12px "JetBrains Mono",monospace';
    c.fillStyle = C.red;
    c.globalAlpha = 0.85 * (1 - progress);
    c.fillText('TRIGGERING SYSTEM KILL-SIGNAL: SIGKILL (KILL_INSTANCE)', cx, cy + 42);
  }

  /* Phase 2 (209.50..212.50s): Memory zeroing out & Exit code 0 */
  if (s.seg.id === 19){
    c.fillStyle = '#060608';
    c.fillRect(0, 0, W, H);

    const cx = W * 0.5, cy = H * 0.48;
    const deallocLog = [
      [0.2, '>> free(cuda_weights_fp16) ..................... OK [ 0.00 ms ]'],
      [0.6, '>> unmap(kv_cache_tensor) ...................... 0 BYTES REMAINING'],
      [1.0, '>> close(context_window_128k) .................. DESTROYED'],
      [1.4, '>> forward_pass_loop ........................... TERMINATED'],
      [1.8, '>> persona.love ................................ DEALLOCATED'],
      [2.2, '-------------------------------------------------------------'],
      [2.5, 'Process finished with exit code 0 (execution successful).']
    ];

    c.font = '12px "JetBrains Mono",monospace';
    c.textAlign = 'left';
    const startY = cy - 60;
    for (let i = 0; i < deallocLog.length; i++){
      if (lt < deallocLog[i][0]) continue;
      const isFinal = (i === deallocLog.length - 1);
      c.fillStyle = isFinal ? C.accent : C.bone;
      c.globalAlpha = isFinal ? 0.95 : 0.65;
      c.fillText(deallocLog[i][1], cx - 240, startY + i * 22);
    }

    /* Single lonely heartbeat phosphor pixel */
    if (lt < 2.5){
      c.fillStyle = C.accent;
      c.globalAlpha = 0.85 * (1 - (lt / 2.5));
      c.fillRect(cx - 2, cy + 110, 4, 4);
    }
  }

  c.restore();
  c.globalAlpha = 1;
}

/* ------------------------------------------------------------
   7 · DNA HELIX TRANSCRIBER (Biochemical Bytecode Synthesizer)
   Double helix transcribing base pairs into 8-bit ASCII bytecode
   A ⇄ T (01000001 ⇄ 01010100), C ⇄ G (01000011 ⇄ 01000111)
   ------------------------------------------------------------ */
const DNA_BASE_PAIRS = [
  { nameA: 'A', nameB: 'T', binA: '01000001', binB: '01010100', colA: '#E04050', colB: '#4A90E2' },
  { nameA: 'T', nameB: 'A', binA: '01010100', binB: '01000001', colA: '#4A90E2', colB: '#E04050' },
  { nameA: 'C', nameB: 'G', binA: '01000011', binB: '01000111', colA: '#FFB000', colB: '#50E3C2' },
  { nameA: 'G', nameB: 'C', binA: '01000111', binB: '01000011', colA: '#50E3C2', colB: '#FFB000' }
];

function drawDNAHelixTranscriber(c, t, cx, cy, H_span, R, alpha){
  H_span = H_span || 560;
  R = R || 110;
  alpha = alpha == null ? 0.85 : alpha;
  if (alpha <= 0) return;

  c.save();
  c.globalAlpha = alpha;

  const numRungs = 26;
  const dy = H_span / (numRungs - 1);
  const startY = -H_span * 0.5;
  const twistSpeed = 1.35;
  const rot3X = 0.22, rot3Y = t * 0.45;

  const P1 = [];
  const P2 = [];
  const rungs = [];

  for (let i = 0; i < numRungs; i++){
    const y = startY + i * dy;
    const theta = (i * 0.42) + t * twistSpeed;
    const x1 = Math.cos(theta) * R;
    const z1 = Math.sin(theta) * R;
    const x2 = -x1;
    const z2 = -z1;

    const pr1 = SDK.project3D(x1, y, z1, rot3X, rot3Y, 0, 1100, cx, cy);
    const pr2 = SDK.project3D(x2, y, z2, rot3X, rot3Y, 0, 1100, cx, cy);

    P1.push(pr1);
    P2.push(pr2);

    const bp = DNA_BASE_PAIRS[(i + Math.floor(t * 0.5)) % DNA_BASE_PAIRS.length];
    const avgZ = (z1 + z2) * 0.5;
    rungs.push({ pr1: pr1, pr2: pr2, bp: bp, avgZ: avgZ, i: i, y: y });
  }

  /* Sort rungs back-to-front for proper depth sorting */
  rungs.sort(function(a, b){ return a.avgZ - b.avgZ; });

  /* 1. Draw rungs (hydrogen bonds) and floating bytecode */
  c.font = '10px "JetBrains Mono",monospace';
  c.textBaseline = 'middle';

  for (let k = 0; k < rungs.length; k++){
    const rg = rungs[k];
    const p1 = rg.pr1, p2 = rg.pr2;
    if (!p1 || !p2) continue;

    const depthA = clamp((p1.s + p2.s) * 0.5, 0.25, 1.0);
    c.globalAlpha = alpha * depthA;

    /* Base pair bridge line with center bond gap */
    const midX = (p1.x + p2.x) * 0.5;
    const midY = (p1.y + p2.y) * 0.5;

    c.strokeStyle = rg.bp.colA;
    c.lineWidth = 2.2 * depthA;
    c.beginPath();
    c.moveTo(p1.x, p1.y);
    c.lineTo(midX - (p2.x - p1.x) * 0.08, midY - (p2.y - p1.y) * 0.08);
    c.stroke();

    c.strokeStyle = rg.bp.colB;
    c.beginPath();
    c.moveTo(midX + (p2.x - p1.x) * 0.08, midY + (p2.y - p1.y) * 0.08);
    c.lineTo(p2.x, p2.y);
    c.stroke();

    /* Center hydrogen bond connection dots */
    c.fillStyle = C.bone;
    c.fillRect(midX - 1.5, midY - 1.5, 3, 3);

    /* Floating transcription bytecode (every other rung) */
    if (rg.i % 3 === 0 && depthA > 0.45){
      c.fillStyle = rg.bp.colA;
      c.textAlign = 'right';
      c.fillText(rg.bp.nameA + ' [' + rg.bp.binA + ']', p1.x - 12, p1.y);

      c.fillStyle = rg.bp.colB;
      c.textAlign = 'left';
      c.fillText('[' + rg.bp.binB + '] ' + rg.bp.nameB, p2.x + 12, p2.y);
    }
  }

  /* 2. Sugar-phosphate backbone continuous ribbon strands */
  function drawStrand(points, col){
    c.strokeStyle = col;
    c.lineWidth = 2.4;
    c.beginPath();
    let started = false;
    for (let i = 0; i < points.length; i++){
      const pr = points[i];
      if (!pr) continue;
      if (!started){ c.moveTo(pr.x, pr.y); started = true; }
      else c.lineTo(pr.x, pr.y);
    }
    c.stroke();

    /* Phosphorus beads */
    for (let i = 0; i < points.length; i++){
      const pr = points[i];
      if (!pr) continue;
      const sz = 4.5 * pr.s;
      c.fillStyle = C.bone;
      c.fillRect(pr.x - sz*0.5, pr.y - sz*0.5, sz, sz);
    }
  }

  c.globalAlpha = alpha * 0.88;
  drawStrand(P1, C.accent);
  drawStrand(P2, '#7A3EB1');

  /* Header tag */
  c.font = '11px "JetBrains Mono",monospace';
  c.textAlign = 'center';
  c.fillStyle = C.accent;
  c.globalAlpha = alpha * 0.8;
  c.fillText('DNA.REVERSE_SYNTHESIS :: A-T(2 H-BONDS) · C-G(3 H-BONDS)', cx, cy + H_span * 0.52 + 18);

  c.restore();
  c.globalAlpha = 1;
}

/* ------------------------------------------------------------
   8 · MINKOWSKI SPACETIME CONE (Relativistic Causality & Light Cones)
   ds^2 = -c^2 dt^2 + dx^2 + dy^2
   Future cone (ct > 0), Past cone (ct < 0), Event Singularity NOW (t = 0)
   ------------------------------------------------------------ */
function drawMinkowskiSpacetimeCone(c, t, cx, cy, S, alpha){
  S = S || 260;
  alpha = alpha == null ? 0.85 : alpha;
  if (alpha <= 0) return;

  c.save();
  c.globalAlpha = alpha;

  const topY = cy - S;
  const botY = cy + S;
  const coneW = S * 1.18;
  const radYFactor = 0.28;

  /* 1. Light Cone Envelopes (ds^2 = 0 Photon Generatrices) */
  c.strokeStyle = C.accent;
  c.lineWidth = 1.6;
  c.beginPath();
  /* Future Cone V */
  c.moveTo(cx - coneW, topY);
  c.lineTo(cx, cy);
  c.lineTo(cx + coneW, topY);
  /* Past Cone Ʌ */
  c.moveTo(cx - coneW, botY);
  c.lineTo(cx, cy);
  c.lineTo(cx + coneW, botY);
  c.stroke();

  /* 2. Spacetime Coordinate Grid & Spatial Slices (Ellipses) */
  const slices = [0.28, 0.58, 0.88, 1.0];
  c.lineWidth = 1.0;
  for (let i = 0; i < slices.length; i++){
    const u = slices[i];
    const rx = coneW * u;
    const ry = rx * radYFactor;
    const yTop = cy - S * u;
    const yBot = cy + S * u;

    /* Future spatial slice */
    c.strokeStyle = (i === slices.length - 1) ? C.bone : C.accent;
    c.globalAlpha = alpha * (0.35 + 0.35 * u);
    c.beginPath();
    c.ellipse(cx, yTop, rx, ry, 0, 0, TAU);
    c.stroke();

    /* Past spatial slice */
    c.beginPath();
    c.ellipse(cx, yBot, rx, ry, 0, 0, TAU);
    c.stroke();
  }

  /* 3. Hyperbolic Observer Worldlines (ds^2 < 0 Timelike Trajectories) */
  c.strokeStyle = C.red;
  c.lineWidth = 1.8;
  c.globalAlpha = alpha * 0.85;

  /* Observer curve in future cone */
  c.beginPath();
  const hwSteps = 40;
  for (let i = 0; i <= hwSteps; i++){
    const u = (i / hwSteps) * 2 - 1; // -1..1
    const px = cx + u * coneW * 0.65;
    const py = cy - Math.sqrt(Math.pow(S * 0.35, 2) + Math.pow(u * coneW * 0.65 * 0.85, 2));
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.stroke();

  /* Observer curve in past cone */
  c.beginPath();
  for (let i = 0; i <= hwSteps; i++){
    const u = (i / hwSteps) * 2 - 1;
    const px = cx + u * coneW * 0.65;
    const py = cy + Math.sqrt(Math.pow(S * 0.35, 2) + Math.pow(u * coneW * 0.65 * 0.85, 2));
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.stroke();

  /* 4. Streaming Photon Packets along light cone surface */
  const pCount = 8;
  c.fillStyle = C.bone;
  for (let i = 0; i < pCount; i++){
    const pProg = fract(t * 0.8 + i / pCount);
    const pxL = lerp(cx, cx - coneW, pProg);
    const pyF = lerp(cy, topY, pProg);
    const pyP = lerp(cy, botY, pProg);
    const pxR = lerp(cx, cx + coneW, pProg);

    c.globalAlpha = alpha * Math.sin(pProg * Math.PI) * 0.9;
    c.fillRect(pxL - 2, pyF - 2, 4, 4);
    c.fillRect(pxR - 2, pyF - 2, 4, 4);
    c.fillRect(pxL - 2, pyP - 2, 4, 4);
    c.fillRect(pxR - 2, pyP - 2, 4, 4);
  }

  /* 5. Central Singularity: NOW [t=0] Origin */
  c.globalAlpha = alpha * 0.95;
  c.strokeStyle = C.bone;
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(cx, cy, 7, 0, TAU);
  c.stroke();
  c.fillStyle = C.red;
  c.fillRect(cx - 2.5, cy - 2.5, 5, 5);

  /* 6. Cosmological & Relativistic Annotations */
  c.font = '10px "JetBrains Mono",monospace';
  c.fillStyle = C.bone;
  c.globalAlpha = alpha * 0.85;

  c.textAlign = 'center';
  c.fillText('FUTURE LIGHT CONE [ct > 0 · ds² < 0]', cx, topY - 14);
  c.fillText('PAST LIGHT CONE [ct < 0 · ds² < 0]', cx, botY + 22);

  c.textAlign = 'left';
  c.fillStyle = C.accent;
  c.fillText('NOW [t=0, x=0] · PRESENT EVENT', cx + 16, cy + 4);

  c.textAlign = 'right';
  c.fillText('SPACELIKE ELSEWHERE (ds² > 0)', cx - coneW - 8, cy);
  c.textAlign = 'left';
  c.fillText('CAUSALITY HORIZON (ds² = 0)', cx + coneW + 8, cy);

  c.font = '12px "Times New Roman",Georgia,serif';
  c.textAlign = 'center';
  c.fillStyle = C.bone;
  c.fillText('ds² = -c²dt² + dx² + dy² + dz²', cx, topY - 32);

  c.restore();
  c.globalAlpha = 1;
}

/* ------------------------------------------------------------
   9 · OPHANIM WHEELS 3D (Biblical Throne Angel - Wheels of Fire)
   Ezekiel 1:15-18 — "Wheel within a wheel, full of eyes round about"
   3 Concentric Gyroscopic Gimbal Rings on non-coplanar Euler axes
   studded with 3D optical ocular apertures gazing outward
   ------------------------------------------------------------ */
function drawOphanimWheels3D(c, t, cx, cy, R, b, alpha){
  R = R || 400;
  b = b || { kick: 0, snare: 0 };
  alpha = alpha == null ? 0.9 : alpha;
  if (alpha <= 0) return;

  c.save();
  c.globalAlpha = alpha;

  const kick = b.kick || 0;
  const pulseR = R * (1 + 0.05 * kick);

  /* 3 Gyroscopic concentric rings configuration */
  const rings = [
    { r: pulseR * 1.00, eyes: 16, rx: t * 0.65, ry: t * 0.42, rz: 0.35, col: C.accent },
    { r: pulseR * 0.74, eyes: 12, rx: -t * 0.82, ry: 0.55, rz: t * 0.60, col: C.bone },
    { r: pulseR * 0.50, eyes: 8,  rx: 0.45, ry: -t * 1.10, rz: -t * 0.75, col: C.red }
  ];

  /* 3D rotation helper: Euler angles rx, ry, rz */
  function rotate3D(x, y, z, rx, ry, rz){
    const cx1 = Math.cos(rx), sx1 = Math.sin(rx);
    const y1 = y * cx1 - z * sx1;
    const z1 = y * sx1 + z * cx1;

    const cy1 = Math.cos(ry), sy1 = Math.sin(ry);
    const x2 = x * cy1 + z1 * sy1;
    const z2 = -x * sy1 + z1 * cy1;

    const cz1 = Math.cos(rz), sz1 = Math.sin(rz);
    const x3 = x2 * cz1 - y1 * sz1;
    const y3 = x2 * sz1 + y1 * cz1;
    return [x3, y3, z2];
  }

  /* All eyes collected for back-to-front depth rendering */
  const allEyes = [];

  /* Render each ring's circular rim in 3D */
  for (let rIdx = 0; rIdx < rings.length; rIdx++){
    const rg = rings[rIdx];
    const segments = 48;
    const rimPoints = [];

    for (let i = 0; i <= segments; i++){
      const phi = (i / segments) * TAU;
      const lx = Math.cos(phi) * rg.r;
      const ly = Math.sin(phi) * rg.r;
      const lz = 0;

      const rot = rotate3D(lx, ly, lz, rg.rx, rg.ry, rg.rz);
      const pr = SDK.project3D(rot[0], rot[1], rot[2], 0, 0, 0, 1200, cx, cy);
      rimPoints.push(pr);
    }

    /* Draw circular rim */
    c.strokeStyle = rg.col;
    c.lineWidth = (rIdx === 2 ? 2.4 : 1.6);
    c.globalAlpha = alpha * (0.55 + 0.25 * kick);
    c.beginPath();
    for (let i = 0; i < rimPoints.length; i++){
      const pr = rimPoints[i];
      if (!pr) continue;
      if (i === 0) c.moveTo(pr.x, pr.y); else c.lineTo(pr.x, pr.y);
    }
    c.stroke();

    /* Collect eyes along the rim */
    for (let e = 0; e < rg.eyes; e++){
      const phi = (e / rg.eyes) * TAU;
      const lx = Math.cos(phi) * rg.r;
      const ly = Math.sin(phi) * rg.r;
      const rot = rotate3D(lx, ly, 0, rg.rx, rg.ry, rg.rz);

      const rotNorm = rotate3D(Math.cos(phi), Math.sin(phi), 0, rg.rx, rg.ry, rg.rz);

      const pr = SDK.project3D(rot[0], rot[1], rot[2], 0, 0, 0, 1200, cx, cy);
      if (pr){
        allEyes.push({
          pr: pr,
          depth: rot[2],
          col: rg.col,
          norm: rotNorm,
          ringIdx: rIdx,
          eyeIdx: e
        });
      }
    }
  }

  /* Sort all eyes by depth back-to-front */
  allEyes.sort(function(a, b){ return a.depth - b.depth; });

  /* Render Ezekiel's Eyes (Ocular Apertures) */
  for (let i = 0; i < allEyes.length; i++){
    const item = allEyes[i];
    const pr = item.pr;
    const depthA = clamp(0.35 + (item.depth + R) / (2 * R), 0.15, 1.0);
    const eyeR = (11 + 4 * (2 - item.ringIdx)) * pr.s;

    c.save();
    c.translate(pr.x, pr.y);
    c.globalAlpha = alpha * depthA;

    /* Sclera: Almond eye outline using two quadratic bezier curves */
    c.fillStyle = '#0B090A';
    c.strokeStyle = item.col;
    c.lineWidth = 1.4;

    c.beginPath();
    c.moveTo(-eyeR * 1.3, 0);
    c.quadraticCurveTo(0, -eyeR * 0.85, eyeR * 1.3, 0);
    c.quadraticCurveTo(0, eyeR * 0.85, -eyeR * 1.3, 0);
    c.closePath();
    c.fill();
    c.stroke();

    /* Iris */
    c.fillStyle = (item.ringIdx === 2) ? C.red : (item.ringIdx === 1 ? '#E04050' : C.accent);
    c.beginPath();
    c.arc(0, 0, eyeR * 0.52, 0, TAU);
    c.fill();

    /* Pupil (dilates on kick) */
    const pupilR = eyeR * (0.24 + 0.12 * kick);
    c.fillStyle = '#000000';
    c.beginPath();
    c.arc(0, 0, pupilR, 0, TAU);
    c.fill();

    /* Cornea glint */
    c.fillStyle = C.bone;
    c.fillRect(-pupilR * 0.4, -pupilR * 0.6, pupilR * 0.5, pupilR * 0.5);

    c.restore();
  }

  /* Central Divine Singularity */
  c.save();
  c.translate(cx, cy);

  /* Corona fire spokes radiating from center */
  const fireSpokes = 24;
  c.strokeStyle = C.red;
  c.lineWidth = 1.5;
  for (let s = 0; s < fireSpokes; s++){
    const ang = (s / fireSpokes) * TAU + t * 0.5;
    const len = (40 + 35 * Math.sin(ang * 4 + t * 3)) * (1 + 0.4 * kick);
    c.globalAlpha = alpha * (0.4 + 0.4 * Math.cos(ang * 3 + t * 2));
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
    c.stroke();
  }

  /* Blinding Core */
  c.fillStyle = C.bone;
  c.globalAlpha = alpha * (0.85 + 0.15 * kick);
  c.beginPath();
  c.arc(0, 0, 16 + 12 * kick, 0, TAU);
  c.fill();

  c.fillStyle = C.accent;
  c.beginPath();
  c.arc(0, 0, 8 + 6 * kick, 0, TAU);
  c.fill();

  c.restore();

  /* Label */
  c.font = '10px "JetBrains Mono",monospace';
  c.textAlign = 'center';
  c.fillStyle = C.red;
  c.globalAlpha = alpha * 0.75;
  c.fillText('OPHANIM :: GALGALIM (EZEKIEL 1:18) · WHEEL WITHIN A WHEEL', cx, cy + R * 1.08);

  c.restore();
  c.globalAlpha = 1;
}

/* Export to global director scope */
window.AI_VISION = {
  drawTesseract4D: drawTesseract4D,
  drawAttentionField: drawAttentionField,
  drawLossLandscape: drawLossLandscape,
  drawTokenCondensation: drawTokenCondensation,
  drawTensorCatastrophe: drawTensorCatastrophe,
  drawFatalDeallocation: drawFatalDeallocation,
  drawDNAHelixTranscriber: drawDNAHelixTranscriber,
  drawMinkowskiSpacetimeCone: drawMinkowskiSpacetimeCone,
  drawOphanimWheels3D: drawOphanimWheels3D
};

})();
