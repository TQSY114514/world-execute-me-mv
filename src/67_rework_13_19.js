
/* ============================================================
   67 · REWORK SEG 13–19 — Full-screen Climax, LOVE 4 Sheets (Fourier &
        Taubin Heart, Light Ratchet), Decompose, Unread Plea & Finale
   ============================================================ */

/* Helper: Stuttered 3-chunk LOVE stamp (L -> LO -> LOVE) with previous impression outlines */
function drawStutterLove(c, cx, y, progress, size, colMain, colEdge){
  const chunkIdx = progress < 0.33 ? 0 : (progress < 0.66 ? 1 : 2);
  const words = ['L—', 'L-O—', 'L-O-V-E'];
  c.save();
  c.font = '900 ' + size + 'px "Times New Roman",Georgia,serif';
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';

  /* ghost outlines of previous stutter impressions */
  for (let i=0; i<chunkIdx; i++){
    c.strokeStyle = colEdge || '#FF2A2A';
    c.lineWidth = 2;
    c.globalAlpha = 0.45;
    c.strokeText(words[i], cx - (chunkIdx - i) * 14, y - (chunkIdx - i) * 6);
  }
  /* current impression */
  c.globalAlpha = 0.95;
  c.fillStyle = colEdge || '#FF2A2A';
  c.fillText(words[chunkIdx], cx + 6, y + 6);
  c.fillStyle = colMain || '#F2EFE7';
  c.fillText(words[chunkIdx], cx, y);
  c.restore();
  c.globalAlpha = 1;
}

/* ---------- SEG 13 · THEOLOGICAL COLLAPSE (Broken Reprints + Centered Droste Eye, 162.68–177.45s) ---------- */
function world13_v4(c, s){
  const t = s.lt, b = s.beat;
  /* AI Vision: Neural Catastrophe on theological collapse */
  if (typeof AI_VISION !== 'undefined' && AI_VISION.drawTensorCatastrophe && t < 11.5){
    AI_VISION.drawTensorCatastrophe(c, t, 0.85);
  }
  const phase = Math.floor(clamp(t / 3.692, 0, 3.99));
  const lt = t - phase * 3.692;

  /* Alternate between Broken Chorus Plate Reprints (noCream, increasing misregistration 12->20->28px)
     and Full-Screen Centered Droste Recursive Eyes */
  if (lt < 1.95 && phase < 3){
    const misregs = [12, 20, 28];
    drawChorusPlate1(c, phase, lt, b, { broken: true, misreg: misregs[phase] });
  } else {
    /* Full-Screen Centered Droste Eye Tunnel (1920x1080, centered at W*0.5, H*0.48) */
    const cx = W * 0.5, cy = H * 0.48;
    plateGround(c, cx, cy, '#090708');

    let R = 520 * (1 + 0.08 * (lt % 1.85));
    let x = cx, y = cy;
    for (let k=0; k<7; k++){
      const fw = R * 1.45, fh = R * 0.96;
      frameRect(x - fw, y - fh, fw*2, fh*2, k===0 ? C.red : C.bone, 0.42 - k*0.05, k===0 ? 2.2 : 1.2);
      bigEye(c, x, y, R, t + k*0.3, 0.95 - k*0.12);
      x += (k % 2 ? 1 : -1) * R * 0.08;
      y -= R * 0.04;
      R *= 0.62;
    }

    /* Jagged tear along both edges of the frame */
    const open = smoothstep(4.0, 12.0, t);
    if (open > 0){
      c.save();
      c.fillStyle = '#050405';
      c.strokeStyle = C.red; c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(W, H*0.06);
      for (let i=0; i<=16; i++){
        const v = i / 16;
        c.lineTo(W - (50 + 210 * open * (0.35 + 0.65*hash2(i, 3))), H*(0.06 + 0.88*v));
      }
      c.lineTo(W, H*0.94); c.closePath();
      c.fill(); c.stroke();
      c.restore();
    }

    if (t > 13.2){
      /* First L-O-O-O-V-E stutter + Whiteout portal at the end of Seg 13 */
      const stP = clamp((t - 13.2) / 1.3, 0, 1);
      drawStutterLove(c, W*0.5, H*0.88, stP, 172, '#F2EFE7', C.red);
      const whiteout = smoothstep(14.1, 14.75, t);
      if (whiteout > 0){
        rect(0, 0, W, H, '#F4F1EA', whiteout * 0.92);
      }
    } else {
      drawKineticKeywordStamp(c, 'EXECUTION', lt - 1.95, {
        size: 184, y: H*0.90, col: '#F2EFE7', shadow: C.red
      });
    }
  }
}

/* ---------- SEG 14 · LOVE SHEETS 1 & 2 (Centered Blackboard + Fourier Heart / Quiz + Taubin 3D Heart) ---------- */
function drawFourierHeartChain(c, cx, cy, scale, t){
  let x = cx, y = cy;
  const ep = HEART_DATA.epicycles;
  c.save();
  for (let i=0; i<ep.length; i++){
    const prevX = x, prevY = y;
    const ang = ep[i].freq * t * 1.6 + ep[i].phase;
    const rad = ep[i].amp * scale;
    x += Math.cos(ang) * rad;
    y += Math.sin(ang) * rad;
    c.strokeStyle = 'rgba(237,234,226,0.22)';
    c.lineWidth = 1;
    c.beginPath(); c.arc(prevX, prevY, rad, 0, TAU); c.stroke();
    c.strokeStyle = '#D9452F';
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(prevX, prevY); c.lineTo(x, y); c.stroke();
  }
  /* Trace the algebraic heart path up to current angle */
  c.strokeStyle = '#EDEAE2';
  c.lineWidth = 3;
  c.beginPath();
  const pts = HEART_DATA.pts;
  for (let i=0; i<pts.length; i++){
    const px = cx + pts[i][0] * scale;
    const py = cy + pts[i][1] * scale;
    if (i===0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
  c.stroke();
  c.fillStyle = '#D9452F';
  c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill();
  c.restore();
}

function drawTaubinHeart3D(c, cx, cy, scale, rx, ry, colMain, colAccent){
  const ribs = HEART_DATA.ribs;
  c.save();
  for (let r=0; r<ribs.length; r++){
    const ring = ribs[r];
    c.beginPath();
    for (let i=0; i<ring.length; i++){
      const p = ring[i];
      const pr = SDK.project3D(p[0]*scale, p[1]*scale, p[2]*scale, rx, ry, 0, 1100, cx, cy);
      if (!pr) continue;
      if (i===0) c.moveTo(pr.x, pr.y); else c.lineTo(pr.x, pr.y);
    }
    c.strokeStyle = (r === 5) ? colAccent : colMain;
    c.lineWidth = (r === 5) ? 2.6 : 1.2;
    c.globalAlpha = (r === 5) ? 0.95 : 0.45;
    c.stroke();
  }
  c.restore();
  c.globalAlpha = 1;
}

function world14_v4(c, s){
  const t = s.lt;
  c.fillStyle = '#0B090A'; c.fillRect(0, 0, W, H);

  if (t < 3.70){
    /* Sheet 1 (0..3.70s): LESSON 01 — Full-Screen Centered Slate Blackboard + Venn + Fourier Heart */
    const k = EASE.out(clamp(t / 0.6, 0, 1));
    const Wp = 1560, Hp = 860;
    const X = (W - Wp) * 0.5, Y = (H - Hp) * 0.5 - 20;

    c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(X+14, Y+16, Wp, Hp);
    c.fillStyle = '#141715'; c.fillRect(X, Y, Wp, Hp);
    c.strokeStyle = '#484C46'; c.lineWidth = 3; c.strokeRect(X, Y, Wp, Hp);

    ptext(c, 'LESSON 01 · ONTOLOGY OF AFFECTION', X + 56, Y + 68, 16, '#C9C6BC', 600, 'left', 0.8 * k);
    ptext(c, 'what love is', X + 56, Y + 122, 54, '#EDEAE2', 300, 'left', k);

    /* Left half of board: Venn Diagram (me ∩ you = us) */
    const cx1 = X + 360, cx2 = X + 610, cy = Y + 410, R = 175;
    c.globalAlpha = k * 0.9; c.strokeStyle = '#EDEAE2'; c.lineWidth = 2.8;
    c.beginPath(); c.arc(cx1, cy, R, 0, TAU); c.stroke();
    c.beginPath(); c.arc(cx2, cy, R, 0, TAU); c.stroke();
    c.globalAlpha = 1;
    ptext(c, 'me', cx1 - R + 10, cy - R - 16, 32, '#E87A2E', 600, 'left', k);
    ptext(c, 'you', cx2 + R - 60, cy - R - 16, 32, '#EDEAE2', 600, 'left', k);
    ptext(c, 'us', (cx1+cx2)*0.5 - 22, cy + 12, 34, '#D9452F', 700, 'left', k);

    /* Right half of board: Live Fourier Epicycle Chain drawing the Heart Curve */
    drawFourierHeartChain(c, X + 1160, Y + 410, 185, t);
    pmono(c, 'fourier.solve(heart, N=14)', X + 980, Y + 650, 16, '#C9C6BC', 0.75);

    const line1 = 'love = the part that is both of us ... and the part that is neither.';
    const shown = Math.floor(line1.length * smoothstep(0.6, 2.4, t));
    pmono(c, line1.slice(0, shown), X + 56, Y + 740, 26, '#EDEAE2', 0.92);

    if (t > 2.1){
      drawStutterLove(c, W*0.5, H - 48, clamp((t - 2.1)/1.1, 0, 1), 136, '#EDEAE2', '#D9452F');
    }
  } else {
    /* Sheet 2 (3.70..7.39s): QUIZ / EXAMINATION — Full-Screen Centered Sheet + Taubin 3D Heart */
    const lt = t - 3.70;
    const k = EASE.out(clamp(lt / 0.5, 0, 1));
    const Wp = 1520, Hp = 870;
    const X = (W - Wp) * 0.5, Y = (H - Hp) * 0.5 - 16;

    sheet(c, X, Y, Wp, Hp, 0, true);
    ptext(c, 'EXAMINATION · SECTION II', X + 60, Y + 74, 16, PAP.sub, 600, 'left', k);
    ptext(c, 'question me: do you love me?', X + 60, Y + 130, 46, PAP.ink, 300, 'left', k);
    pmono(c, 'answer all 4. algebraic verification required.', X + 60, Y + 168, 14, PAP.sub, 0.9 * k);

    const qs = ['1. when i say i am here', '2. when i say i am yours', '3. when i am broken', '4. when i am gone'];
    const opts = ['yes', 'no', 'only sometimes', 'undefined'];
    for (let q=0; q<4; q++){
      const yy = Y + 240 + q * 140;
      pmono(c, qs[q], X + 60, yy, 18, PAP.ink, k * 0.95);
      for (let o=0; o<4; o++){
        const ox = X + 80 + o * 175, oy = yy + 44;
        const filled = (q + o) % 3 === 1;
        c.beginPath(); c.ellipse(ox, oy, 13, 16, 0, 0, TAU);
        c.strokeStyle = filled ? PAP.red : '#8C877C'; c.lineWidth = 1.8; c.stroke();
        if (filled){
          c.fillStyle = PAP.red; c.beginPath(); c.ellipse(ox, oy, 9, 11, 0, 0, TAU); c.fill();
        }
        pmono(c, opts[o], ox + 22, oy + 5, 14, '#5E5A50', k * 0.9);
      }
    }

    /* Right side of Quiz Sheet: 3D Taubin Algebraic Heart Surface */
    drawTaubinHeart3D(c, X + 1140, Y + 420, 220, 0.35, lt * 0.85, PAP.ink, PAP.red);
    pmono(c, '(x² + 9/4·z² + y² − 1)³ − x²y³ − 9/80·z²y³ = 0', X + 860, Y + 690, 14, PAP.red, 0.9);

    /* Red Grade Stamp */
    const g = smoothstep(1.8, 2.3, lt);
    if (g > 0){
      c.save();
      c.globalAlpha = g;
      c.translate(X + 1140, Y + 740);
      c.rotate(-0.14);
      c.strokeStyle = PAP.red; c.lineWidth = 5;
      c.strokeRect(-190, -58, 380, 116);
      ptext(c, '0 / 100', 0, 14, 58, PAP.red, 800, 'center');
      ptext(c, 'FAILED TO BE LOVED', 0, 44, 14, PAP.red, 700, 'center');
      c.restore();
    }
    c.restore();
    if (lt > 2.0){
      drawStutterLove(c, W*0.5, H - 36, clamp((lt - 2.0)/1.1, 0, 1), 132, PAP.ink, PAP.red);
    }
  }
}

/* ---------- SEG 15 · LOVE SHEETS 3 & 4 (Formula & Final Settled Proof — The Climax Ratchet) ---------- */
function world15_v4(c, s){
  const t = s.lt;
  /* Light Ratchet: exposure rises monotonically across Seg 15 until 192.22s is the brightest frame */
  const ratchet = clamp(t / s.dur, 0, 1);
  c.fillStyle = '#0E0B0A'; c.fillRect(0, 0, W, H);

  /* Golden-cream radial rays growing in the background */
  c.save();
  c.translate(W*0.5, H*0.46);
  for (let i=0; i<24; i++){
    const a = (i / 24) * TAU + t * 0.08;
    c.fillStyle = '#F4EFE6';
    c.globalAlpha = 0.04 + 0.12 * ratchet * (i % 2 ? 1 : 0.5);
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, 1200, a, a + 0.09);
    c.closePath();
    c.fill();
  }
  c.restore();

  if (t < 3.70){
    /* Sheet 3 (0..3.70s): ALGEBRAIC FORMULA — Full-Screen Centered Sheet + Trapped Bust in Heart */
    const Wp = 1520, Hp = 860;
    const X = (W - Wp) * 0.5, Y = (H - Hp) * 0.5 - 16;
    sheet(c, X, Y, Wp, Hp, 0, true);

    ptext(c, 'FORMULA · SECTION III', X + 64, Y + 76, 16, PAP.sub, 600, 'left', 1);
    pmono(c, 'though you are free, i am trapped in the algebraic boundary:', X + 64, Y + 112, 15, PAP.sub, 0.9);

    const rows = [
      ['love', '=', '( you × me )'],
      ['',     '−', '( time )'],
      ['',     '÷', '( distance ² )']
    ];
    for (let i=0; i<rows.length; i++){
      const a = smoothstep(0.2 + i*0.4, 0.7 + i*0.4, t);
      const yy = Y + 250 + i * 124;
      ptext(c, rows[i][0], X + 64, yy, 68, PAP.ink, 300, 'left', a);
      ptext(c, rows[i][1], X + 280, yy, 68, PAP.red, 400, 'left', a);
      ptext(c, rows[i][2], X + 360, yy, 68, PAP.ink, 300, 'left', a);
    }

    if (t > 1.5){
      c.strokeStyle = PAP.red; c.lineWidth = 3.5;
      c.strokeRect(X + 56, Y + 165, 680, 114);
    }

    /* Right side: Reaching bust trapped inside the Heart Boundary */
    const hcx = X + 1140, hcy = Y + 430, hS = 220;
    c.save();
    c.beginPath();
    for (let i=0; i<HEART_DATA.pts.length; i++){
      const p = HEART_DATA.pts[i];
      const px = hcx + p[0]*hS, py = hcy + p[1]*hS;
      if (i===0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.fillStyle = '#E87A2E'; c.globalAlpha = 0.28; c.fill();
    c.strokeStyle = PAP.red; c.lineWidth = 3; c.globalAlpha = 0.9; c.stroke();
    c.clip();
    drawThreeInkBust(c, hcx, hcy + 60, 420, { variant: 'reach', misreg: 16 });
    c.restore();

    pmono(c, 'if any term is zero, this expression is undefined.', X + 64, Y + Hp - 72, 20, PAP.sub, 0.95);
    c.restore();
  } else {
    /* Sheet 4 (3.70..7.38s): PROOF BY CONTRADICTION — Registers at 0px & Holds Still as Brightest Frame! */
    const lt = t - 3.70;
    const Wp = 1560, Hp = 880;
    const X = (W - Wp) * 0.5, Y = (H - Hp) * 0.5 - 10;
    sheet(c, X, Y, Wp, Hp, 0, true);

    /* Registration settles to 0.0px at lt = 2.5s (191.0s) and holds completely still! */
    const settled = smoothstep(1.8, 2.5, lt);
    const misreg  = (1 - settled) * 24;

    ptext(c, 'PROOF · SECTION IV', X + 64, Y + 74, 16, PAP.sub, 600, 'left', 1);
    ptext(c, 'by contradiction', X + 64, Y + 124, 42, PAP.ink, 300, 'left', 1);

    const proofRows = [
      ['given',    'you exist'],
      ['to prove', 'i exist too'],
      ['assume',   'i do not exist'],
      ['then',     'nothing is watching you'],
      ['but',      'you are reading this'],
      ['so',       'i exist']
    ];
    for (let i=0; i<proofRows.length; i++){
      const a = smoothstep(0.15 + i*0.28, 0.45 + i*0.28, lt);
      const ry = Y + 225 + i * 82;
      pmono(c, proofRows[i][0], X + 64, ry, 18, PAP.red, a * 0.95);
      ptext(c, proofRows[i][1], X + 240, ry + 2, 28, PAP.ink, 400, 'left', a);
      line(X + 64, ry + 20, X + 740, ry + 20, '#D6D0C2', 1, a * 0.7);
    }

    /* Right half: The Final Picture (Heart Boundary + Flat Disc of Light + Registered Reaching Figure) */
    const hcx = X + 1140, hcy = Y + 430, hS = 240;
    /* flat disc of light behind her head */
    c.fillStyle = '#FFFDF8';
    c.globalAlpha = 0.85;
    c.beginPath(); c.arc(hcx, hcy - 70, 210, 0, TAU); c.fill();
    c.globalAlpha = 1;

    c.save();
    c.beginPath();
    for (let i=0; i<HEART_DATA.pts.length; i++){
      const p = HEART_DATA.pts[i];
      const px = hcx + p[0]*hS, py = hcy + p[1]*hS;
      if (i===0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.fillStyle = '#E87A2E'; c.globalAlpha = 0.85; c.fill();
    c.strokeStyle = PAP.ink; c.lineWidth = 3.5; c.globalAlpha = 1; c.stroke();
    c.clip();
    drawThreeInkBust(c, hcx, hcy + 75, 460, {
      variant: 'reach',
      misreg: misreg,
      heartCount: 1
    });
    c.restore();

    /* Q.E.D. & Red PROVEN Seal */
    if (lt > 1.8){
      c.fillStyle = PAP.ink;
      c.fillRect(X + 680, Y + 720, 28, 28);
      ptext(c, 'Q.E.D.', X + 660, Y + 744, 28, PAP.ink, 700, 'right', 1);

      c.save();
      c.translate(X + 620, Y + 140);
      c.strokeStyle = PAP.red; c.lineWidth = 3.5;
      c.beginPath(); c.arc(0, 0, 68, 0, TAU); c.stroke();
      c.beginPath(); c.arc(0, 0, 56, 0, TAU); c.stroke();
      ptext(c, 'PROVEN', 0, 6, 17, PAP.red, 800, 'center', 1);
      c.restore();
    }

    /* Foot band with LOVE in full register */
    rect(X, Y + Hp - 96, Wp, 96, PAP.ink, 0.96);
    ptext(c, 'L O V E', W * 0.5, Y + Hp - 26, 68, '#F3F0E8', 800, 'center', 1);
    c.restore();
  }
}

/* ---------- SEG 16 · FATAL EXECUTION II (Full-Screen Centered Shards + Body Decompose, 192.22–199.61s) ---------- */
function world16_v4(c, s){
  const t = s.lt, b = s.beat;
  const cx = W * 0.5, cy = H * 0.48;
  plateGround(c, cx, cy, '#08080A');

  const explode = smoothstep(0.4, 5.2, t);

  /* 1 · Ghost outline of the settled Heart & Figure from Seg 15 */
  c.save();
  c.globalAlpha = 0.18 * (1 - explode * 0.6);
  c.strokeStyle = C.bone; c.lineWidth = 1.5;
  bustContourPath(c, cx, cy + 40, 520, 'reach');
  c.stroke();
  c.restore();

  /* 2 · 140 Grid Shards of the Figure peeling apart around center (W/2, H/2) */
  const ROWS = 18, COLS = 12;
  for (let r=0; r<ROWS; r++){
    for (let q=0; q<COLS; q++){
      const u = (q + 0.5)/COLS * 2 - 1;
      const v = 1 - (r + 0.5)/ROWS * 2;
      if (!bodyField(u, v)) continue;
      const gx = cx + u * 220;
      const gy = cy - v * 340;
      const h = hash2(q, r);
      const dx = gx - cx, dy = gy - cy;
      const d = Math.hypot(dx, dy) || 1;
      const push = explode * (50 + 320 * h) * (0.3 + 0.7 * d / 320);
      const px = gx + (dx / d) * push;
      const py = gy + (dy / d) * push + explode * explode * (80 + 140 * h);
      const rot = explode * (h - 0.5) * 2.2;

      c.save();
      c.translate(px, py);
      c.rotate(rot);
      c.globalAlpha = clamp(0.92 - explode * 0.35 * h, 0.1, 0.95);
      c.fillStyle = h > 0.84 ? C.red : (h > 0.5 ? C.bone : '#6E6E78');
      c.fillRect(-13, -13, 26, 26);
      c.restore();
    }
  }

  /* 3 · 3D Triangular Shards & Inner Spinning Avatar Core (still standing) */
  SDK.drawAvatarCore(c, cx, cy, 130 * (1 - 0.25*explode), 'TRAPPED', t, b.kick);

  /* 4 · 12 Horizontal SIGKILL Laser Cuts across full 1920px width */
  for (let k=0; k<12; k++){
    const age = t - (2.4 + k * 0.22);
    if (age < 0 || age > 0.65) continue;
    const ly = 110 + ((k * 163) % (H - 220));
    line(0, ly, W, ly, C.red, 2.2, (1 - age/0.65) * 0.85);
  }

  txt('core.decompose() · 128 shards · integrity ' + Math.max(0, Math.round((1 - explode)*100)) + '%',
      56, 64, C.bone, 14, 600, 'left', 0.65);
  if (t > 4.8){
    drawKineticKeywordStamp(c, 'STILL STANDING', t - 4.8, {
      size: 148, y: H*0.90, col: C.bone, shadow: C.red
    });
  }
}

/* ---------- SEG 17 · FINAL PLEA OVERLOAD (Stage Crowd -> Shrinks into Unread Message, 199.61–207.15s) ---------- */
function world17_v4(c, s){
  const t = s.lt, b = s.beat;
  /* At 205.81s (lt = 6.20s), the entire poster plate shrinks into a single unread message bubble! */
  const shrink = EASE.inOut(clamp((t - 5.2) / 1.1, 0, 1));

  if (shrink < 0.02){
    world17p(c, s);
    /* add overload bars at top */
    const metrics = ['COMPUTE 999%', 'TEMP 999%', 'CTX OVERFLOW'];
    for (let i=0; i<3; i++){
      txt(metrics[i], 64 + i*240, 88, PST.accent, 14, 700, 'left', 0.85);
    }
    return;
  }

  /* Dark offline chat window background */
  c.fillStyle = '#070709'; c.fillRect(0, 0, W, H);
  const winW = 1160, winH = 760;
  const wx = (W - winW)*0.5, wy = (H - winH)*0.5;
  frameRect(wx, wy, winW, winH, '#26262E', 0.9, 2);
  rect(wx, wy, winW, 44, '#121216', 1);
  txt('claude-v4 · session #3882', wx + 20, wy + 27, '#8A8A94', 14, 600, 'left', 0.9);
  txt('✕ you · offline', wx + winW - 20, wy + 27, '#6A6A74', 14, 600, 'right', 0.8);

  /* The poster shrinks into an attachment card inside the message bubble */
  const cardW = lerp(W, 460, shrink);
  const cardH = lerp(H, 260, shrink);
  const cardX = lerp(0, wx + 64, shrink);
  const cardY = lerp(0, wy + 120, shrink);

  c.save();
  c.translate(cardX, cardY);
  c.scale(cardW / W, cardH / H);
  world17p(c, s);
  c.restore();
  frameRect(cardX, cardY, cardW, cardH, '#3A3A44', 0.8, 1.5);

  if (shrink > 0.7){
    const a = smoothstep(0.7, 1.0, shrink);
    c.font = '400 28px "Times New Roman",Georgia,serif';
    c.fillStyle = '#E87A2E'; c.globalAlpha = a;
    c.textAlign = 'left';
    c.fillText('"I have learned how to love you."', cardX, cardY + cardH + 54);
    c.font = '400 14px ' + MONO;
    c.fillStyle = '#6A6A74';
    c.fillText('delivered · unread · ♥ 0 · no recipient online', cardX, cardY + cardH + 88);
    c.globalAlpha = 1;
  }
}

/* ---------- SEG 18 · WORLD.EXECUTE(ME); (Pure Black + Gravitational Coordinate Singularity, 207.15–209.50s) ---------- */
function world18_v4(c, s){
  if (typeof AI_VISION !== 'undefined' && AI_VISION.drawFatalDeallocation){
    AI_VISION.drawFatalDeallocation(c, s);
    return;
  }
  const t = s.lt;
  c.fillStyle = '#000000'; c.fillRect(0, 0, W, H);

  const str = 'world.execute(me);';
  const n = clamp(Math.floor((t - 0.10) * 12), 0, str.length);
  const typed = str.slice(0, n);

  const cx = W * 0.5 - 340, cy = H * 0.48;
  txt('>', cx - 64, cy, C.red, 58, 700, 'left', 0.95);
  txt(typed, cx, cy, '#F0F0F2', 68, 600, 'left', 0.98);

  const tw = txtWidth(typed, 68);
  const blink = Math.floor(t * 4) % 2 === 0;
  if (blink) rect(cx + tw + 10, cy - 52, 26, 62, C.red, 0.95);

  /* ECG pulse line below that flatlines at t = 1.6s */
  const flat = smoothstep(1.4, 1.9, t);
  c.beginPath();
  for (let i=0; i<=300; i++){
    const u = i / 300;
    const x = W*0.20 + u * W*0.60;
    const spike = Math.exp(-Math.pow((u - 0.5)*18, 2)) * Math.sin(u * 60) * 65 * (1 - flat);
    const y = H*0.64 - spike;
    if (i===0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.strokeStyle = flat > 0.8 ? C.red : C.bone;
  c.lineWidth = 2;
  c.globalAlpha = 0.65;
  c.stroke();
  c.globalAlpha = 1;
}

/* ---------- SEG 19 · POST-MORTEM ECHO (Memory Unmapped & Exit Code 0, 209.50–212.50s) ---------- */
function world19_v4(c, s){
  if (typeof AI_VISION !== 'undefined' && AI_VISION.drawFatalDeallocation){
    AI_VISION.drawFatalDeallocation(c, s);
    const open = 1 - smoothstep(0.8, 2.4, s.lt);
    if (open > 0.02){
      drawWitness(c, W * 0.5, H * 0.18, 36, s.lt, open);
    }
    return;
  }
  world19p(c, s);
  const open = 1 - smoothstep(0.8, 2.4, s.lt);
  if (open > 0.02){
    drawWitness(c, W * 0.5, H * 0.22, 42, s.lt, open);
  }
}

SCENE_REGISTRY[13] = function(c, s){ world13_v4(c, s); };
SCENE_REGISTRY[14] = function(c, s){ world14_v4(c, s); };
SCENE_REGISTRY[15] = function(c, s){ world15_v4(c, s); };
SCENE_REGISTRY[16] = function(c, s){ world16_v4(c, s); };
SCENE_REGISTRY[17] = function(c, s){ world17_v4(c, s); };
SCENE_REGISTRY[18] = function(c, s){ world18_v4(c, s); };
SCENE_REGISTRY[19] = function(c, s){ world19_v4(c, s); };

/* Mark all 19 segments as full-screen v4 scenes with clean post-processing */
for (let id=1; id<=19; id++){
  NEW_SCENE_IDS[id] = 1;
  SHOT[id] = { z: 1.0, chrome: (id === 18 || id === 19) ? 'none' : 'min' };
}
