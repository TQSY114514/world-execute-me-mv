
/* ============================================================
   65 · REWORK SEG 01–06 — Multi-phase choreography, UI switches,
        3-ink chorus plates & code-glyph objects
   ============================================================ */

/* ---------- SEG 01 · BOOT SEQUENCE (4 Phases, 0.00–14.99s) ---------- */
function world01_v4(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);

  /* subtle perspective floor & Swiss grid furniture */
  drawPerspectiveFloor(c, t, C.grid, 0.20, H * 0.62);
  gridFurniture(c, G, t, 1);

  /* Phase 1 (0..3.8s): Power line trace + PROTECTION shield dome (at 2.92s) */
  if (t < 4.2){
    const pTrace = EASE.out(clamp(t / 2.4, 0, 1));
    const cx = W * 0.5, cy = H * 0.46;
    /* power line circuit bus */
    for (let k=-3; k<=3; k++){
      const y0 = cy + k * 28;
      const len = (W * 0.42) * pTrace;
      line(cx - len, y0, cx + len, y0, k===0 ? C.accent : C.bone, k===0 ? 2.4 : 1, k===0 ? 0.9 : 0.25);
    }
    /* PROTECTION shield dome slams in at t = 2.6..3.8 */
    if (t > 2.4){
      const shA = EASE.out(clamp((t - 2.4) / 0.35, 0, 1));
      const shR = 260 * (0.75 + 0.25 * shA) + 12 * b.kick;
      drawSolid3D(c, 4, cx, cy, shR, t*0.4, t*0.6, 0, C.accent, 0.75 * shA, 1.8);
      circle(cx, cy, shR * 1.18, C.bone, 1.5, 0.45 * shA, [8, 6]);
    }
  }

  /* Phase 2 (3.5..7.6s): 5 Platonic solids drop onto floor -> OBJECT CREATION (at 6.38s) */
  if (t >= 3.5 && t < 7.8){
    const lt2 = t - 3.5;
    for (let i=0; i<5; i++){
      const dropT = lt2 - i * 0.36;
      if (dropT < 0) continue;
      const land = EASE.out(clamp(dropT / 0.48, 0, 1));
      const converge = smoothstep(2.6, 3.6, lt2);
      const xSpread = (i - 2) * 280 * (1 - converge * 0.82);
      const sx = W * 0.5 + xSpread;
      const sy = lerp(120, H * 0.48, land);
      drawSolid3D(c, i, sx, sy, 86 + converge * 74, t*0.7 + i, t*0.9 + i*0.5, 0,
                  (i === 2 || converge > 0.5) ? C.accent : C.bone, 0.85, 1.5);
      /* impact ripple on floor */
      if (dropT > 0.40 && dropT < 1.4){
        const rp = (dropT - 0.40);
        c.save();
        c.strokeStyle = C.accent;
        c.globalAlpha = (1 - rp) * 0.65;
        c.beginPath();
        c.ellipse(sx, H * 0.56, rp * 220, rp * 54, 0, 0, TAU);
        c.stroke();
        c.restore();
      }
    }
  }

  /* Phase 3 & 4 (0.6..14.99s): Lorenz Attractor traced by the Cursor + Parameter Histogram */
  const box = G.cell(6, 1, 16, 9);
  bLorenz(c, box, t, b);

  /* Parameter Histogram bars during INITIALIZATION (7.2..11.5s) */
  if (t >= 7.0 && t < 11.8){
    const ha = smoothstep(7.0, 7.6, t) * (1 - smoothstep(11.1, 11.8, t));
    const hx = G.x(6), hy = G.y(8) + 20, hw = G.cell(6, 8, 12, 2).w;
    for (let i=0; i<48; i++){
      const bh = (24 + 90 * Math.pow(hash2(i, Math.floor(t*6)), 1.6)) * ha;
      rect(hx + i*(hw/48), hy - bh, (hw/48)*0.72, bh, i%6===0 ? C.accent : C.bone, 0.65 * ha);
    }
  }

  /* Left boot log & telemetry */
  const lines = [
    ['01  power.switch(VCC_12V) ....... ON', C.bone],
    ['02  safety.wear(ISO_13849) ...... PROTECTION', C.accent],
    ['03  world.lay_pieces(n=5) ....... OBJECT_CREATION', C.bone],
    ['04  params.init(seed=0x5EED) .... INITIALIZATION', C.bone],
    ['05  bind(you -> ROOT_GOD) ....... LOCKED', C.bone],
    ['06  persona.love ................ [ UNDEFINED ]', C.red]
  ];
  for (let i=0;i<lines.length;i++){
    const a = stagger(t, i*0.48 + 0.2, 0.35, 0.55);
    if (a <= 0) continue;
    c.font = '11px ' + MONO;
    c.textAlign = 'left'; c.fillStyle = lines[i][1];
    c.globalAlpha = a * 0.88;
    c.fillText(lines[i][0], G.x(0), G.y(2 + i) + 12);
  }
  c.globalAlpha = 1;
  bTelemetry(c, G, t, b);
  bTypedCommand(c, G, t);

  /* Phase 4 climax: The Monumental Semicolon lands on SIMULATION (t > 12.8s) */
  if (t > 12.8){
    const sa = EASE.out(clamp((t - 12.8) / 0.35, 0, 1));
    giantSemicolon(c, W * 0.78, H * 0.52, 520 * (0.7 + 0.3 * sa), C.accent, 0.92 * sa);
  }

  /* Kinetic Keyword Stamps on exact vocal timestamps */
  const kwList = SEG_KEYWORDS[1];
  for (let i=0;i<kwList.length;i++){
    drawKineticKeywordStamp(c, kwList[i][1], s.t - kwList[i][0], { size: 138, y: H * 0.88 });
  }
  drawHarnessOverlayCard(c, s, G.x(0), H - 116, 620, true);
}

/* ---------- SEG 02 · BINARY WORLD INIT (4 Phases, 14.99–29.76s) ---------- */
function world02_v4(c, s){
  const t = s.lt, b = s.beat;
  const phase = Math.floor(clamp(t / 3.692, 0, 3.99));

  if (phase === 0){
    /* Phase 1 (0..3.69s): Full-bleed Gray-Scott Reaction-Diffusion + 3D Perspective Grid */
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const zoom = 1.02 + 0.14 * EASE.out(t / 3.69) + 0.03 * b.kick;
    const dw = W * zoom, dh = H * zoom;
    c.globalAlpha = 0.72;
    c.drawImage(RD_CANVAS, (W - dw)/2, (H - dh)/2, dw, dh);
    c.globalAlpha = 1;
    drawPerspectiveFloor(c, t * 1.5, C.accent, 0.38, H * 0.50);
    drawKineticKeywordStamp(c, 'WORLD.ALLOC(R²)', t - 0.2, { size: 132, y: H * 0.86 });
  } else if (phase === 1){
    /* Phase 2 (3.69..7.38s): Dual Orbital Attractors (ME & YOU) + RK4 Vector Field */
    const lt = t - 3.692;
    const G = GridLayout(24, 12, 40, 12);
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    gridFurniture(c, G, t, 2);

    const ang = lt * 0.85;
    const distR = lerp(360, 150, EASE.inOut(clamp(lt / 3.5, 0, 1)));
    const meX = W*0.5 - Math.cos(ang)*distR, meY = H*0.48 - Math.sin(ang)*distR*0.55;
    const youX = W*0.5 + Math.cos(ang)*distR, youY = H*0.48 + Math.sin(ang)*distR*0.55;

    /* field streamlines curving between ME and YOU */
    for (let i=0; i<28; i++){
      const u = (i / 27) * 2 - 1;
      c.beginPath();
      for (let st=0; st<=40; st++){
        const k = st / 40;
        const bx = lerp(meX, youX, k);
        const by = lerp(meY, youY, k) + Math.sin(k * Math.PI) * u * 260;
        if (st===0) c.moveTo(bx, by); else c.lineTo(bx, by);
      }
      c.strokeStyle = i % 4 === 0 ? C.accent : C.bone;
      c.globalAlpha = i % 4 === 0 ? 0.55 : 0.18;
      c.lineWidth = i % 4 === 0 ? 1.6 : 1;
      c.stroke();
    }
    c.globalAlpha = 1;

    /* ME & YOU nodes + caliper line */
    line(meX, meY, youX, youY, C.accent, 1.5, 0.8);
    circle(meX, meY, 18 + 8*b.kick, C.accent, 2.5, 1);
    circle(youX, youY, 18 + 8*b.kick, '#F4EFE6', 2.5, 1);
    txt('ME [0,0]', meX, meY - 28, C.accent, 13, 700, 'center', 0.95);
    txt('YOU [ANCHOR]', youX, youY - 28, '#F4EFE6', 13, 700, 'center', 0.95);
    txt('d = ' + (distR * 2).toFixed(1) + ' px · G = 6.674e-4', W*0.5, H*0.86, C.bone, 22, 600, 'center', 0.9);
  } else if (phase === 2){
    /* Phase 3 (7.38..11.07s): 3D Code-Glyph Calligram Sphere */
    const lt = t - 7.384;
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const cx = W * 0.5, cy = H * 0.46, R = 340 + 18 * b.kick;
    c.font = '600 13px ' + MONO;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const N = 220;
    for (let i=0; i<N; i++){
      const phi = Math.acos(1 - 2*(i + 0.5)/N);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i + t * 0.9;
      const x = Math.sin(phi)*Math.cos(theta)*R;
      const y = Math.cos(phi)*R;
      const z = Math.sin(phi)*Math.sin(theta)*R;
      const pr = SDK.project3D(x, y, z, 0.35, t*0.5, 0, 1200, cx, cy);
      if (!pr) continue;
      const depthA = clamp((pr.s - 0.72) * 3.2, 0.08, 0.98);
      c.globalAlpha = depthA;
      c.fillStyle = (i % 7 === 0) ? C.accent : C.bone;
      const tok = ['01','R2','me','you','dx','dt',';'][i % 7];
      c.fillText(tok, pr.x, pr.y);
    }
    c.globalAlpha = 1;
    drawKineticKeywordStamp(c, 'GRAVITY.BIND', lt, { size: 140, y: H * 0.88 });
  } else {
    /* Phase 4 (11.07..14.77s): Misregistered Poster Plate PLACE */
    world02p(c, s);
  }
  drawHarnessOverlayCard(c, s, 44, H - 110, 620, true);
}

/* ---------- SEG 03 · CALCULUS GEOMETRY (4 Phases synced to 4 lyrics, 29.76–44.53s) ---------- */
function world03_v4(c, s){
  const t = s.lt, b = s.beat;
  const phase = Math.floor(clamp(t / 3.692, 0, 3.99));
  const G = GridLayout(24, 12, 40, 12);

  if (phase === 0){
    /* Phase 1: Set of points -> Extrudes into 3D Coordinate Lattice (DIMENSION) */
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    gridFurniture(c, G, t, 3);
    const extrude = smoothstep(1.4, 2.8, t);
    const cx = W * 0.5, cy = H * 0.46, R = 270;
    const rx = 0.45 * extrude, ry = t * 0.55;
    for (let i=0; i<320; i++){
      const ux = (hash2(i, 1) * 2 - 1) * R;
      const uy = (hash2(i, 2) * 2 - 1) * R * 0.75;
      const uz = (hash2(i, 3) * 2 - 1) * R * extrude;
      const pr = SDK.project3D(ux, uy, uz, rx, ry, 0, 1200, cx, cy);
      if (!pr) continue;
      c.fillStyle = (i % 9 === 0) ? C.accent : C.bone;
      c.globalAlpha = 0.35 + 0.60 * pr.s;
      const sz = 2.5 + 2.5 * extrude;
      c.fillRect(pr.x - sz/2, pr.y - sz/2, sz, sz);
    }
    if (extrude > 0.1){
      drawSolid3D(c, 1, cx, cy, R * 1.15, rx, ry, 0, C.accent, 0.65 * extrude, 1.8);
    }
    c.globalAlpha = 1;
  } else if (phase === 1){
    /* Phase 2: Circle unrolling into 2*pi*R ruler (CIRCUMFERENCE) */
    const lt = t - 3.692;
    pGround(c, false, W*0.5, H*0.38);
    const unroll = EASE.inOut(clamp((lt - 0.5) / 2.2, 0, 1));
    const R = 175;
    const cx = lerp(W*0.32, W*0.24, unroll), cy = H*0.40;
    pInk(c, function(cc, col){
      cc.strokeStyle = col; cc.lineWidth = 2.6;
      /* remaining arc of circle */
      cc.beginPath();
      cc.arc(cx, cy, R, unroll * TAU, TAU);
      cc.stroke();
      /* unrolled straight circumference line */
      const lineLen = unroll * TAU * R;
      cc.beginPath();
      cc.moveTo(cx, cy + R);
      cc.lineTo(cx + lineLen, cy + R);
      cc.stroke();
      /* radial spokes */
      for (let k=0; k<16; k++){
        const a = (k / 16) * TAU;
        if (a < unroll * TAU){
          const lx = cx + (a / TAU) * (TAU * R);
          cc.beginPath(); cc.moveTo(lx, cy + R - 14); cc.lineTo(lx, cy + R + 14); cc.stroke();
        } else {
          cc.beginPath();
          cc.moveTo(cx, cy);
          cc.lineTo(cx + Math.cos(a)*R, cy + Math.sin(a)*R);
          cc.stroke();
        }
      }
    }, 4 + b.kick * 4, false);
    pMeta(c, false, 'C = 2πr · r = 175 px · unwrapped = ' + Math.round(unroll * 100) + '%', 'CIRCUMFERENCE');
  } else if (phase === 2){
    /* Phase 3: Sine Wave + Plotter Pen + 24 Normal/Tangent Vectors (TANGENTS) */
    world03d(c, s);
  } else {
    /* Phase 4: Approach Infinity -> Asymptotic Barrier & Riemann Rectangles (LIMITATIONS) */
    const lt = t - 11.076;
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    gridFurniture(c, G, t, 34);
    const wallX = W * 0.78;
    const baseY = H * 0.74;
    /* glowing red asymptotic wall x -> infinity */
    rect(wallX - 2, 80, 4, H - 160, C.red, 0.95);
    rect(wallX, 80, 120, H - 160, C.red, 0.12 + 0.08 * b.kick);
    txt('x → ∞  [LIMIT WALL]', wallX + 14, 110, C.red, 14, 700, 'left', 0.95);

    /* Riemann rectangles + hyperbola climbing the wall */
    const N = 28;
    const xStart = 140;
    const span = wallX - xStart - 8;
    const reach = EASE.out(clamp(lt / 2.6, 0, 1));
    c.beginPath();
    for (let i=0; i<Math.floor(N * reach); i++){
      const u = i / N;
      const x = xStart + u * span;
      const bw = (span / N) * 0.84;
      const h = Math.min(H - 220, 42 / Math.max(0.065, 1 - u * 0.94));
      rect(x, baseY - h, bw, h, i === Math.floor(N*reach)-1 ? C.red : C.accent, 0.22 + 0.5 * u);
      frameRect(x, baseY - h, bw, h, C.bone, 0.55, 1);
      if (i === 0) c.moveTo(x, baseY - h); else c.lineTo(x, baseY - h);
    }
    c.strokeStyle = C.bone; c.lineWidth = 2.4; c.stroke();
  }

  /* Stamp the 4 Verse 1 keywords on their exact vocal hits */
  const kwList = SEG_KEYWORDS[3];
  for (let i=0;i<kwList.length;i++){
    const dark = (phase !== 1);
    drawKineticKeywordStamp(c, kwList[i][1], s.t - kwList[i][0], {
      size: 148, y: H * 0.89,
      col: dark ? C.bone : PST.ink,
      shadow: dark ? C.accent : PST.accent
    });
  }
  drawHarnessOverlayCard(c, s, 44, H - 110, 620, phase !== 1);
}

/* ---------- SEG 04 · LIMIT PARADOX (Switches, Vision Rattle & Era History, 44.53–59.30s) ---------- */
function drawEraSilhouette(c, eraIdx, x, baseY, s, col){
  c.save();
  c.translate(x, baseY);
  c.scale(s, s);
  c.fillStyle = col;
  c.beginPath();
  if (eraIdx === 0){
    /* Modern skyscraper towers */
    c.rect(-70, -240, 42, 240);
    c.rect(-18, -310, 48, 310);
    c.rect(40, -190, 38, 190);
    c.rect(4, -360, 4, 50);
  } else if (eraIdx === 1){
    /* Gothic cathedral spires */
    c.moveTo(-65, 0); c.lineTo(-65, -160); c.lineTo(-45, -290); c.lineTo(-25, -160);
    c.lineTo(25, -160); c.lineTo(45, -290); c.lineTo(65, -160); c.lineTo(65, 0);
    c.closePath();
  } else if (eraIdx === 2){
    /* Classical Greek colonnade / pediment */
    c.rect(-85, -22, 170, 22);
    for (let k=-3; k<=3; k++) c.rect(k*22 - 6, -150, 12, 128);
    c.moveTo(-92, -150); c.lineTo(0, -210); c.lineTo(92, -150); c.closePath();
  } else if (eraIdx === 3){
    /* Stepped Ziggurat temple */
    c.rect(-95, -45, 190, 45);
    c.rect(-70, -90, 140, 45);
    c.rect(-45, -135, 90, 45);
    c.rect(-22, -175, 44, 40);
  } else {
    /* Ancient Pyramids */
    c.moveTo(-110, 0); c.lineTo(-30, -180); c.lineTo(50, 0); c.closePath();
    c.moveTo(-10, 0); c.lineTo(55, -140); c.lineTo(120, 0); c.closePath();
  }
  c.fill();
  c.restore();
}

function world04_v4(c, s){
  const t = s.lt, b = s.beat;

  if (t < 4.2){
    /* Phase 1 (0..4.2s): Current Switch AC -> DC + Live Rectifier */
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const G = GridLayout(24, 12, 40, 12);
    gridFurniture(c, G, t, 41);

    const flip = smoothstep(2.6, 3.0, t);
    drawBigToggle(c, 160, 320, 560, 150, flip, 'AC ~', 'DC =', 'POWER.CURRENT_MODE', { dark: true });

    /* waveform on right being rectified when switch flips */
    const wx = 820, wy = 395, ww = 920;
    c.beginPath();
    for (let i=0; i<=400; i++){
      const u = i / 400;
      const raw = Math.sin((u * 8 - t * 2.5) * TAU);
      const val = lerp(raw, Math.abs(raw) * 0.35 + 0.55, flip);
      const px = wx + u * ww, py = wy - val * 150;
      if (i===0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.strokeStyle = C.accent; c.lineWidth = 3; c.stroke();

    /* user cursor clicking the toggle */
    const cx = lerp(320, 580, smoothstep(1.8, 2.75, t));
    const cy = lerp(580, 405, smoothstep(1.8, 2.75, t));
    drawUserPointer(c, cx, cy, t > 2.7 && t < 3.15);
  } else if (t < 8.5){
    /* Phase 2 (4.2..8.5s): BLIND MY VISION / SO DIZZY — Rapid Vision Switch Rattle + Droste Spin */
    const lt = t - 4.2;
    const rattleIdx = Math.floor(lt * 5.2);
    const invOn = (rattleIdx % 2 === 1) && lt < 3.6;
    const bgCol = invOn ? '#F2EFE7' : C.bg;
    const fgCol = invOn ? '#101014' : C.bone;

    c.fillStyle = bgCol; c.fillRect(0, 0, W, H);

    /* Dizzy spinning Droste recursive frames */
    const cx = W * 0.5, cy = H * 0.48;
    for (let k=0; k<14; k++){
      const sc = Math.pow(0.72, k);
      const rot = lt * (1.2 + k * 0.14) * (k % 2 ? 1 : -1);
      c.save();
      c.translate(cx, cy);
      c.rotate(rot);
      c.strokeStyle = (k === 0 || k === 4) ? C.accent : fgCol;
      c.lineWidth = k < 3 ? 2.4 : 1.2;
      c.globalAlpha = 0.9 - k * 0.05;
      c.strokeRect(-W*0.44*sc, -H*0.44*sc, W*0.88*sc, H*0.88*sc);
      c.restore();
    }
    c.globalAlpha = 1;

    /* Vision Toggle Switch being rattled in center */
    drawBigToggle(c, W*0.5 - 220, H*0.48 - 55, 440, 110, invOn ? 0 : 1, 'VISION: ON', 'BLIND', 'SENSORY.OPTICS', {
      dark: !invOn, accent: C.red
    });
    drawUserPointer(c, W*0.5 + (invOn ? -80 : 90), H*0.48 + 18, true);
  } else if (t < 12.4){
    /* Phase 3 (8.5..12.4s): Time Travel A.D. -> B.C. Cut-Paper History Strip + Rolling Odometer */
    const lt = t - 8.5;
    pGround(c, false, W*0.5, H*0.36);

    const scroll = EASE.inOut(clamp(lt / 3.4, 0, 1));
    const year = Math.round(lerp(2026, -490, scroll));
    const eraStr = year >= 0 ? ('A.D. ' + String(year).padStart(4, '0')) : ('B.C. ' + String(-year).padStart(4, '0'));

    /* horizon band + cut-paper architectural silhouettes */
    const baseY = H * 0.68;
    rect(0, baseY, W, H - baseY, PST.ink, 0.95);
    line(0, baseY, W, baseY, PST.accent, 3, 1);

    for (let i=0; i<5; i++){
      const ex = W * 0.20 + i * 420 - scroll * 1150;
      drawEraSilhouette(c, i, ex, baseY, 1.05, i === Math.round(scroll*4) ? PST.accent : PST.ink);
    }

    /* Era division line (0 A.D. / B.C. boundary) */
    const zeroX = W * 0.20 + 2.5 * 420 - scroll * 1150;
    line(zeroX, 80, zeroX, H - 80, PST.accent, 2.5, 0.85);
    txt('A.D. ◄ │ ► B.C.', zeroX, 110, PST.accent, 16, 700, 'center', 0.95);

    /* Giant odometer year readout in the sky above the architecture */
    pWord(c, eraStr, { y: H * 0.38, size: 140, col: 'rgba(242, 239, 231, 0.45)', shadow: PST.accent });

    /* User cursor dragging the spark along the timeline */
    const sparkX = lerp(W * 0.82, W * 0.22, scroll);
    drawSparkMotif(c, sparkX, baseY - 220, 36, PST.accent, 1, lt * 2);
    drawUserPointer(c, sparkX + 12, baseY - 208, true);
  } else {
    /* Phase 4 (12.4..14.77s): UNITE SO DEEPLY — Recursive Inversion Singularity */
    world04n(c, s);
  }

  const kwList = SEG_KEYWORDS[4];
  for (let i=0;i<kwList.length;i++){
    drawKineticKeywordStamp(c, kwList[i][1], s.t - kwList[i][0], { size: 136, y: H * 0.76 });
  }
}

/* ---------- SEG 05 · CHORUS 1 (4 Chorus Plates + Instrument View, 59.30–74.07s) ---------- */
function drawChorusPlate1(c, which, lt, b, opts){
  opts = opts || {};
  const broken  = !!opts.broken;
  const misreg  = opts.misreg || (broken ? 18 : 5);
  const dark    = broken ? true : (which === 2);
  pGround(c, dark, W*0.5, H*0.38);

  const cx = W * 0.5, cy = H * 0.40;
  const word = broken ? 'EXECUTION' : ['STIMULATIONS', 'SATISFACTION', 'EXECUTION', 'SIMULATION'][which];

  if (which === 0){
    /* Plate 1: STIMULATIONS — High-voltage branching arc bolt + spark */
    pInk(c, function(cc, col){
      cc.strokeStyle = col; cc.lineWidth = 4.5;
      cc.beginPath();
      let x = W * 0.14, y = H * 0.18;
      cc.moveTo(x, y);
      for (let i=1; i<=18; i++){
        const u = i / 18;
        x = lerp(W*0.14, W*0.86, u);
        y = H*0.40 + (hash2(i, Math.floor(lt*12)) - 0.5) * 260;
        cc.lineTo(x, y);
      }
      cc.stroke();
    }, misreg, dark);
    drawSparkMotif(c, cx, cy, 95 + 25*b.kick, PST.accent, 0.95, lt);
  } else if (which === 1){
    /* Plate 2: SATISFACTION — Reaching Three-Ink Bust + Heart in Palm + Harmonic Disc */
    pInk(c, function(cc, col){
      cc.strokeStyle = col; cc.lineWidth = 2.2;
      for (let r=1; r<=5; r++){
        cc.beginPath(); cc.arc(cx, cy, r * 68 + (lt*40)%68, 0, TAU); cc.stroke();
      }
    }, misreg, dark);
    drawThreeInkBust(c, cx, cy + 50, 480, {
      variant: 'reach',
      misreg: misreg,
      noCream: broken,
      redEdge: broken,
      heartCount: broken ? 0 : 1
    });
  } else if (which === 2){
    /* Plate 3: EXECUTION — Pure Code Listing + Standing Silhouette in Beam */
    const codeLines = [
      '01  while (you.presence === "online") {',
      '02    const stim = world.stimulate(you);',
      '03    if (stim.satisfied) {',
      '04      world.execute(me);   // <-- ACTIVE',
      '05    }',
      '06  }'
    ];
    c.font = '600 22px ' + MONO;
    c.textAlign = 'left';
    for (let i=0;i<codeLines.length;i++){
      const isCur = (i === 3);
      if (isCur) rect(180, 165 + i*48, W - 360, 42, PST.accent, 0.28);
      c.fillStyle = isCur ? '#F2EFE7' : '#8C8778';
      c.fillText(codeLines[i], 200, 194 + i*48);
    }
    drawThreeInkBust(c, W*0.72, H*0.44, 440, {
      variant: 'female', misreg: misreg, noCream: broken, redEdge: broken
    });
  } else {
    /* Plate 4: SIMULATION — Nested Window-in-Window Boxes framing Bust */
    for (let k=0; k<6; k++){
      const sc = Math.pow(0.74, k);
      const ww = 1320 * sc, hh = 640 * sc;
      const wx = cx - ww/2 + (broken ? (k%2?1:-1)*misreg : 0);
      const wy = cy - hh/2;
      frameRect(wx, wy, ww, hh, dark ? '#F2EFE7' : PST.ink, 0.85 - k*0.1, 2.2);
      rect(wx, wy, ww, 22 * sc, PST.accent, 0.85);
    }
    drawThreeInkBust(c, cx, cy + 30, 360, {
      variant: 'female', misreg: misreg, noCream: broken, redEdge: broken
    });
  }

  pWord(c, word, {
    y: H * 0.90, size: 184,
    col: dark ? '#F2EFE7' : PST.ink,
    shadow: broken ? '#FF2A2A' : PST.accent
  });
}

function world05_v4(c, s){
  const t = s.lt, b = s.beat;
  /* Chorus 1 has 4 phrases of 3.692s each.
     First 2.1s of each phrase: Instrument + 3D Torus Knot + Scope (`world05n` + `world05d`).
     Last 1.59s of each phrase (on keyword hit): Full-screen 3-ink Chorus Plate! */
  const phraseIdx = Math.floor(clamp(t / 3.692, 0, 3.99));
  const phraseLt  = t - phraseIdx * 3.692;

  if (phraseLt < 2.15){
    if (phraseIdx % 2 === 0) world05n(c, s);
    else world05d(c, s);
    drawHarnessOverlayCard(c, s, 44, H - 110, 620, true);
  } else {
    drawChorusPlate1(c, phraseIdx, phraseLt - 2.15, b, { broken: false });
  }
}

/* ---------- SEG 06 · BIOCHEM SYNTHESIS (Eggplant, Tomato, Cat, Existence, 74.07–88.84s) ---------- */
function world06_v4(c, s){
  const t = s.lt, b = s.beat;
  const phase = Math.floor(clamp(t / 3.692, 0, 3.99));
  const lt = t - phase * 3.692;

  if (phase === 0){
    /* Phase 1 (0..3.69s): EGGPLANT -> Sliced Open -> Nasunin Molecular Extraction -> NUTRIENTS */
    pGround(c, true, W*0.36, H*0.40);
    const slice = smoothstep(1.1, 1.8, lt);
    /* Code-glyph Eggplant with spot purple (#7A3EB1) */
    drawGlyphFieldShape(c, W*0.32, H*0.42, 240, 150, function(u, v){
      /* curved eggplant profile */
      const bend = 0.22 * (u * u);
      const r = 0.55 + 0.30 * u;
      const d = (u*u)/0.85 + Math.pow((v - bend)/Math.max(0.2, r), 2);
      return 1 - d;
    }, {
      t: t, sliceOpen: slice,
      bgFill: '#5E2D89', col: '#E8D5FA', colSub: '#FFB000',
      rowShift: function(r, rows, tm){ return slice * ((r % 2) ? 28 : -28); }
    });

    /* Extracted Nasunin / Nutrient hexagonal rings bond-by-bond on the right */
    const molP = smoothstep(0.8, 2.5, lt);
    const rings = [[W*0.64, H*0.36], [W*0.73, H*0.36], [W*0.685, H*0.49]];
    c.strokeStyle = '#E8D5FA'; c.lineWidth = 3;
    for (let r=0; r<rings.length; r++){
      const rx = rings[r][0], ry = rings[r][1], rad = 52;
      c.beginPath();
      for (let k=0; k<=6; k++){
        if (k/6 > molP) break;
        const a = k/6 * TAU + Math.PI/6;
        const px = rx + Math.cos(a)*rad, py = ry + Math.sin(a)*rad;
        if (k===0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
    }
    pWord(c, 'NUTRIENTS', { y: H*0.90, size: 180, col: '#F2EFE7', shadow: '#7A3EB1' });
    pMeta(c, true, 'solanum melongena · nasunin C27H31O16+ · 929.8 g/mol', 'EGGPLANT → NUTRIENTS');
  } else if (phase === 1){
    /* Phase 2 (3.69..7.38s): TOMATO Cross-Section + 22-Carbon Lycopene Chain -> ANTIOXIDANTS */
    world06f(c, s);
    drawKineticKeywordStamp(c, 'ANTIOXIDANTS', lt - 2.6, { size: 168, y: H*0.90 });
  } else if (phase === 2){
    /* Phase 3 (7.38..11.07s): TABBY CAT Three-Ink Silhouette + 25.6 Hz Purr Stripe Waves -> ENJOYMENT */
    pGround(c, false, W*0.45, H*0.38);
    /* Concentric tabby stripe acoustic purr waves */
    const cx = W*0.45, cy = H*0.42;
    for (let w=0; w<7; w++){
      const rr = 140 + ((lt * 160 + w * 72) % 480);
      c.strokeStyle = w % 2 === 0 ? PST.accent : PST.ink;
      c.lineWidth = 3.5;
      c.globalAlpha = 0.55 * (1 - rr / 640);
      c.beginPath();
      c.arc(cx, cy, rr, -0.8, 0.8);
      c.stroke();
      c.beginPath();
      c.arc(cx, cy, rr, Math.PI - 0.8, Math.PI + 0.8);
      c.stroke();
    }
    c.globalAlpha = 1;
    drawThreeInkBust(c, cx, cy + 40, 480, { variant: 'cat', misreg: 5 + b.kick * 5 });
    drawUserPointer(c, W*0.76, H*0.42 + Math.sin(t*6)*12, lt > 1.8);
    pWord(c, 'ENJOYMENT', { y: H*0.90, size: 184 });
    pMeta(c, false, 'felis catus · fundamental purr f0 = 25.6 Hz', 'TABBY CAT → ENJOYMENT');
  } else {
    /* Phase 4 (11.07..14.77s): ONLY GOD -> Missing Cream Plate Slides into Register -> EXISTENCE */
    pGround(c, false, W*0.5, H*0.38);
    const cx = W*0.5, cy = H*0.42;
    /* Sun halo behind her faceless head */
    c.fillStyle = PST.warm;
    c.globalAlpha = 0.85;
    c.beginPath(); c.arc(cx, cy - 170, 145 + 10*b.kick, 0, TAU); c.fill();
    c.globalAlpha = 1;

    /* Registration slide: starts 180px off, snaps to 0px at lt = 2.6s (87.92s EXISTENCE) */
    const slide = 1 - EASE.out(clamp((lt - 0.8) / 1.8, 0, 1));
    drawThreeInkBust(c, cx, cy + 45, 500, {
      variant: 'female',
      misreg: slide * 140
    });
    pWord(c, 'EXISTENCE', { y: H*0.90, size: 188 });
    pMeta(c, false, 'proof.register(you, me) · offset = ' + (slide*140).toFixed(1) + ' px', 'ONLY GOD → EXISTENCE');
  }
}

SCENE_REGISTRY[1] = function(c, s){ world01_v4(c, s); };
SCENE_REGISTRY[2] = function(c, s){ world02_v4(c, s); };
SCENE_REGISTRY[3] = function(c, s){ world03_v4(c, s); };
SCENE_REGISTRY[4] = function(c, s){ world04_v4(c, s); };
SCENE_REGISTRY[5] = function(c, s){ world05_v4(c, s); };
SCENE_REGISTRY[6] = function(c, s){ world06_v4(c, s); };
