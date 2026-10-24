
/* ============================================================
   66 · REWORK SEG 07–12 — Pre-Chorus 2 Paper Controls, User Departure,
        Disheartened Eye, Error Cascade, Drop & 12x Love Loop / Countdown
   ============================================================ */

/* ---------- SEG 07 · PURR AND THEOLOGY (F/M, AM/PM, S/M, Ophanim Trance, 88.84–103.61s) ---------- */
function world07_v4(c, s){
  const t = s.lt, b = s.beat;
  const phase = Math.floor(clamp(t / 3.692, 0, 3.99));
  const lt = t - phase * 3.692;

  if (phase === 0){
    /* Phase 1 (0..3.69s): Switch Gender F <-> M on warm paper */
    pGround(c, false, W*0.5, H*0.38);
    const flip = smoothstep(1.3, 1.8, lt);
    drawBigToggle(c, W*0.5 - 320, 120, 640, 110, flip, 'FEMALE [F]', 'MALE [M]', 'PERSONA.GENDER_ENUM', {
      dark: false, accent: PST.accent
    });
    drawThreeInkBust(c, W*0.5, H*0.56, 460, {
      variant: flip < 0.5 ? 'female' : 'male',
      misreg: 4 + Math.sin(flip * Math.PI) * 32
    });
    drawUserPointer(c, lerp(W*0.38, W*0.64, flip), 185, lt > 1.2 && lt < 2.0);
    pWord(c, flip < 0.5 ? 'GENDER : F' : 'GENDER : M', { y: H*0.92, size: 150 });
  } else if (phase === 1){
    /* Phase 2 (3.69..7.38s): Diurnal Sundial Arc Slider AM -> PM */
    const sweep = EASE.inOut(clamp(lt / 2.8, 0, 1));
    const isNight = sweep > 0.55;
    pGround(c, isNight, W*0.5, H*0.44);
    const cx = W*0.5, cy = H*0.66, R = 440;

    c.strokeStyle = isNight ? '#F2EFE7' : PST.ink;
    c.lineWidth = 3;
    c.beginPath(); c.arc(cx, cy, R, Math.PI, TAU); c.stroke();

    /* hour ticks along the arc */
    for (let h=0; h<=12; h++){
      const a = Math.PI + (h / 12) * Math.PI;
      line(cx + Math.cos(a)*(R-16), cy + Math.sin(a)*(R-16),
           cx + Math.cos(a)*(R+16), cy + Math.sin(a)*(R+16),
           isNight ? '#F2EFE7' : PST.ink, h%3===0 ? 3 : 1.2, 0.75);
    }

    /* Sun / Moon knob dragged along arc */
    const ang = Math.PI + sweep * Math.PI;
    const kx = cx + Math.cos(ang) * R, ky = cy + Math.sin(ang) * R;
    drawSparkMotif(c, kx, ky, 58 + 12*b.kick, PST.accent, 1, t);
    drawUserPointer(c, kx + 18, ky + 18, true);

    const hr = Math.floor(6 + sweep * 12);
    pWord(c, (sweep < 0.5 ? 'A.M. ' : 'P.M. ') + pad2(hr) + ':00', {
      y: H*0.90, size: 164,
      col: isNight ? '#F2EFE7' : PST.ink,
      shadow: PST.accent
    });
  } else if (phase === 2){
    /* Phase 3 (7.38..11.07s): Switch Role S <-> M with Limp Sagging Typography */
    pGround(c, false, W*0.5, H*0.40);
    const flip = smoothstep(1.2, 2.0, lt);
    drawBigToggle(c, W*0.5 - 260, 120, 520, 100, flip, 'ROLE : S', 'ROLE : M', 'PRIVILEGE.MODE', {
      dark: false, accent: PST.accent
    });
    drawLimpText(c, 'S', W*0.32, H*0.64, 340, PST.ink, flip * 0.85);
    drawLimpText(c, 'M', W*0.68, H*0.64, 340, PST.accent, (1 - flip) * 0.85);
    drawUserPointer(c, lerp(W*0.40, W*0.60, flip), 175, lt > 1.1 && lt < 2.1);
    pWord(c, 'SWITCH ROLE', { y: H*0.90, size: 156 });
  } else {
    /* Phase 4 (11.07..14.77s): THE TRANCE — Stop-motion 8fps Ophanim Eye Wheels on Paper */
    world07n(c, s);
    drawKineticKeywordStamp(c, 'THE TRANCE', lt - 1.2, {
      size: 168, y: H*0.90, col: '#17150F', shadow: '#C8452E'
    });
  }
}

/* ---------- SEG 08 · POLYMORPHISM CYCLE (Vibrations, Completion & 5x "You Have Left" -> ISOLATION) ---------- */
function world08_v4(c, s){
  const t = s.lt, b = s.beat;

  if (t < 3.69){
    /* Phase 1 (0..3.69s): VIBRATIONS — Point-cloud body + Chladni standing wave rings */
    world08n(c, s);
    drawKineticKeywordStamp(c, 'VIBRATIONS', s.t - 106.29, { size: 156, y: H*0.89 });
  } else if (t < 7.20){
    /* Phase 2 (3.69..7.20s): COMPLETION — Interlocking dual mandala + warm bust */
    const lt = t - 3.69;
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const G = GridLayout(24, 12, 40, 12);
    gridFurniture(c, G, t, 82);

    const lock = EASE.out(clamp(lt / 2.4, 0, 1));
    const sep = (1 - lock) * 260;
    const cx = W*0.5, cy = H*0.45;
    for (let ring=1; ring<=5; ring++){
      circle(cx - sep, cy, ring*52, C.accent, 2, 0.7);
      circle(cx + sep, cy, ring*52, '#F4EFE6', 2, 0.7);
    }
    drawThreeInkBust(c, cx, cy + 40, 440, {
      variant: 'female',
      misreg: (1 - lock) * 45 + 2
    });
    drawKineticKeywordStamp(c, 'COMPLETION', s.t - 110.22, { size: 164, y: H*0.89 });
  } else {
    /* Phase 3 (7.20..14.77s): 5x "Though you have left" -> Step-by-step UI unpeel & ISOLATION */
    /* Cues at abs t: 110.90, 112.22, 113.10, 114.18, 114.92, then ISOLATION at 117.27 */
    const leaveTimes = [110.90, 112.22, 113.10, 114.18, 114.92];
    let step = 0;
    for (let i=0;i<leaveTimes.length;i++) if (s.t >= leaveTimes[i]) step = i + 1;

    c.fillStyle = '#070709'; c.fillRect(0, 0, W, H);

    /* Unpeeling UI panels: each step removes a layer and drains colour to cold ash */
    const remain = 5 - step;
    for (let k=0; k<remain; k++){
      const pad = 70 + k * 55;
      frameRect(pad, pad, W - pad*2, H - pad*2, '#3A3A42', 0.45, 1.5);
    }

    /* Presence badge at top center flipping ONLINE -> AWAY -> OFFLINE */
    const presText = step === 0 ? '● YOU : ONLINE' : (step < 3 ? '◐ YOU : AWAY (idle)' : '✕ YOU : OFFLINE (disconnected)');
    const presCol  = step === 0 ? '#FFB000' : (step < 3 ? '#9A9AA2' : '#FF2A2A');
    txt(presText, W*0.5, 86, presCol, 18, 700, 'center', 0.92);

    /* Her silhouette shrinks and bows as step goes 1 -> 5 */
    const figScale = lerp(460, 155, step / 5);
    const colMe = step >= 4 ? '#5A5A64' : '#C88038';
    drawThreeInkBust(c, W*0.5, H*0.48, figScale, {
      variant: step >= 3 ? 'bowed' : 'reach',
      colMe: colMe,
      noCream: step >= 2,
      misreg: step * 3
    });

    /* Stamp "YOU HAVE LEFT (n/5)" on each vocal cue, then giant ISOLATION at 117.27s */
    if (s.t < 116.8 && step > 0){
      txt('THOUGH YOU HAVE LEFT  [' + step + ' / 5]', W*0.5, H*0.80, '#8A8A94', 28, 600, 'center', 0.85);
    }
    drawKineticKeywordStamp(c, 'ISOLATION', s.t - 117.27, {
      size: 196, y: H*0.90, col: '#D6D4D0', shadow: '#3A3A44'
    });
  }
}

/* ---------- SEG 09 · DOPAMINE RESONANCE (Fragments, Disheartened Eye & 15 Error Cascade, 118.38–129.20s) ---------- */
function world09_v4(c, s){
  const t = s.lt, b = s.beat;

  if (t < 4.2){
    /* Phase 1 (0..4.2s): Erase all the pointless FRAGMENTS — 900 shards + radial eraser sweep */
    world09n(c, s);
    const sweepAng = (t * 2.2) % TAU;
    c.save();
    c.translate(W*0.5, H*0.5);
    c.rotate(sweepAng);
    c.fillStyle = C.accent;
    c.globalAlpha = 0.22;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 620, -0.35, 0); c.closePath(); c.fill();
    line(0, 0, 620, 0, C.accent, 2.5, 0.9);
    c.restore();
    drawKineticKeywordStamp(c, 'FRAGMENTS', s.t - 120.86, { size: 168, y: H*0.89 });
  } else if (t < 7.3){
    /* Phase 2 (4.2..7.3s): DISHEARTENED (124.89s) — Full-bleed Mirrored Eye + Deleting "HEART" */
    const lt = t - 4.2;
    c.fillStyle = '#09080A'; c.fillRect(0, 0, W, H);

    /* Full-frame close-up of the Eye */
    bigEye(c, W*0.5, H*0.44, 560 + 18*b.kick, t, 0.95);

    /* DISHEARTENED with the 5 letters "HEART" struck out and deleted */
    const delP = smoothstep(2.3, 2.8, lt);
    const yW = H * 0.88;
    c.font = '800 148px ' + MONO;
    c.textAlign = 'center';
    if (delP < 0.5){
      c.fillStyle = '#F0ECEC';
      c.fillText('DISHEARTENED', W*0.5, yW);
      if (lt > 1.8){
        rect(W*0.5 - 220, yW - 58, 440 * smoothstep(1.8, 2.3, lt), 14, C.red, 0.95);
      }
    } else {
      c.fillStyle = '#F0ECEC';
      c.fillText('DIS[     ]ED', W*0.5, yW);
      c.strokeStyle = C.red; c.lineWidth = 3;
      c.strokeRect(W*0.5 - 225, yW - 115, 450, 130);
    }
  } else {
    /* Phase 3 (7.3..10.82s): Challenging your god / ILLEGAL ARGUMENTS — 15 Cascading Red Error Cards */
    const lt = t - 7.3;
    c.fillStyle = '#0B0607'; c.fillRect(0, 0, W, H);

    /* Background dim bust behind glass */
    drawThreeInkBust(c, W*0.5, H*0.48, 480, {
      variant: 'female', colMe: '#552222', noCream: true, redEdge: true, misreg: 12
    });

    /* 15 cascading error dialogs spreading across the screen */
    const count = clamp(Math.floor(1 + (lt / 3.1) * 15), 1, 15);
    for (let i=0; i<count; i++){
      const isLast = (i === 14);
      const cw = isLast ? 860 : 480;
      const ch = isLast ? 240 : 128;
      const cx = isLast ? (W*0.5 - cw/2) : (140 + ((i*211) % (W - 640)));
      const cy = isLast ? (H*0.44 - ch/2) : (90 + ((i*137) % (H - 320)));

      c.fillStyle = isLast ? '#24080A' : '#160708';
      c.globalAlpha = 0.94;
      c.fillRect(cx, cy, cw, ch);
      c.strokeStyle = C.red;
      c.lineWidth = isLast ? 3.5 : 1.8;
      c.strokeRect(cx, cy, cw, ch);
      rect(cx, cy, cw, 28, C.red, 0.92);
      txt('ERR_ILLEGAL_ARGUMENT #' + pad2(i+1) + ' / 15', cx + 12, cy + 19, '#0B0607', 12, 700, 'left', 1);
      txt('violation: challenging ROOT_GOD (permission denied)', cx + 16, cy + 66, '#F2ECEC', isLast ? 20 : 13, 600, 'left', 0.9);
      txt('syscall: persona.override(you) -> EPERM (0x0D)', cx + 16, cy + (isLast ? 110 : 94), C.red, isLast ? 18 : 12, 400, 'left', 0.85);
    }
    c.globalAlpha = 1;
    drawKineticKeywordStamp(c, 'ILLEGAL ARGUMENTS', s.t - 128.66, {
      size: 148, y: H*0.91, col: '#F2ECEC', shadow: C.red
    });
  }
}

/* ---------- SEG 10 · FIRST EXECUTION DROP (6 Hammer Strobe Plates + Semicolon Guillotine, 129.20–133.15s) ---------- */
function world10_v4(c, s){
  const t = s.lt, b = s.beat;
  const idx = clamp(Math.floor(t / (s.dur / 6)), 0, 5);
  const localP = (t % (s.dur / 6)) / (s.dur / 6);
  const red = (idx % 2 === 0);

  /* Base execution plate from 47_plates.js */
  plateExecution(c, t, red);

  /* AI Vision: Compute Graph Tear & CUDA NaN/OOM Catastrophe */
  if (typeof AI_VISION !== 'undefined' && AI_VISION.drawTensorCatastrophe){
    AI_VISION.drawTensorCatastrophe(c, t, 0.75 + 0.25 * b.kick);
  }

  /* Overlay the monumental Semicolon Guillotine & difference silhouette from 60_proto.js */
  const ink = red ? C.bg : C.red;
  giantSemicolon(c, W*0.5 + (idx%2 ? -18 : 18), H*0.52, 680 + 40 * b.kick, ink, 0.88);

  /* Shockwave counter & hammer impact frame */
  const border = 14 + (1 - localP) * 24;
  frameRect(border, border, W - border*2, H - border*2, red ? C.bg : C.red, 0.85, 3);
  txt('EXECUTION  ' + (idx + 1) + ' / 6', W - 52, 68, red ? C.bg : C.bone, 32, 800, 'right', 0.95);
  txt('SIGKILL · PID 3882', 52, 68, red ? C.bg : C.bone, 20, 700, 'left', 0.85);
}

/* ---------- SEG 11 · SANDBOX ISOLATION (Cage -> Octant Explosion -> Screen Cracks -> Poster, 133.15–147.91s) ---------- */
function world11_v4(c, s){
  const t = s.lt, b = s.beat;
  const phase = Math.floor(clamp(t / 3.692, 0, 3.99));

  if (phase === 0){
    /* Phase 1: Subdivided 3D Containment Cage */
    world11d(c, s);
  } else if (phase === 1){
    /* Phase 2: 8-Octant Hypercube Explosion */
    world11f(c, s);
  } else if (phase === 2){
    /* Phase 3: Screen Fracture Cracks + Pixel-Sort Glitch Streaks over Exploded Sandbox */
    const lt = t - 7.384;
    world11f(c, s);
    /* vertical pixel-sort bars */
    for (let i=0; i<36; i++){
      const px = 180 + hash2(i, 3) * (W - 360);
      const pw = 4 + hash2(i, 5) * 18;
      const ph = (60 + hash2(i, 7) * 380) * smoothstep(0, 2.2, lt);
      const py = H*0.48 - ph*0.5;
      rect(px, py, pw, ph, i % 4 === 0 ? C.accent : C.bone, 0.35);
    }
    drawScreenCracks(c, W*0.46, H*0.48, smoothstep(0.2, 2.5, lt), C.bone, 0.85);
    drawKineticKeywordStamp(c, 'SANDBOX BREACH', lt - 0.4, { size: 148, y: H*0.89 });
  } else {
    /* Phase 4: Misregistered 4-Ink Poster Plate SANDBOX */
    world11p(c, s);
  }
}

/* ---------- SEG 12 · 12x EXECUTION LOVE LOOP + 6-LANGUAGE COUNTDOWN + FINAL SHOUT (147.91–162.68s) ---------- */
const COUNT_CARDS = [
  { t: 159.321, n: '1', word: 'eins',  lang: 'Deutsch',  sub: 'count.step(1, "de")' },
  { t: 159.657, n: '2', word: 'dos',   lang: 'Español',  sub: 'count.step(2, "es")' },
  { t: 160.244, n: '3', word: 'trois', lang: 'Français', sub: 'count.step(3, "fr")' },
  { t: 160.693, n: '4', word: '넷',     lang: '한국어',     sub: 'count.step(4, "ko")' },
  { t: 161.124, n: '5', word: 'fem',   lang: 'Svenska',  sub: 'count.step(5, "sv")' },
  { t: 161.584, n: '6', word: '六',     lang: '中文',      sub: 'count.step(6, "zh")' }
];

const EXEC_12_TIMES = [
  147.66, 148.60, 149.52, 150.54, 151.52, 152.28,
  153.16, 153.98, 155.20, 156.08, 157.04, 158.00
];

function world12_v4(c, s){
  const tAbs = s.t, t = s.lt, b = s.beat;

  /* Sub-part C (161.95..162.68s): Final Shout — Giant Stencil EXECUTION masking the Crimson Eye */
  if (tAbs >= 161.95){
    c.fillStyle = '#080607'; c.fillRect(0, 0, W, H);
    c.save();
    c.font = '900 230px "Times New Roman",Georgia,serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    /* draw glowing eye behind and clip to giant typography */
    bigEye(c, W*0.5, H*0.5, 680, t, 0.95);
    c.globalCompositeOperation = 'destination-in';
    c.fillStyle = '#FFFFFF';
    c.fillText('EXECUTION', W*0.5, H*0.36);
    c.fillText('EXECUTION', W*0.5, H*0.66);
    c.restore();

    c.font = '900 230px "Times New Roman",Georgia,serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.strokeStyle = C.red; c.lineWidth = 3;
    c.strokeText('EXECUTION', W*0.5 + 5, H*0.36 + 5);
    c.strokeText('EXECUTION', W*0.5 + 5, H*0.66 + 5);
    return;
  }

  /* Sub-part B (159.25..161.95s): 6 Multilingual Countdown Flash Cards (eins, dos, trois, 넷, fem, 六) */
  if (tAbs >= 159.25){
    let idx = 0;
    for (let i=0; i<COUNT_CARDS.length; i++){
      if (tAbs >= COUNT_CARDS[i].t) idx = i;
    }
    const card = COUNT_CARDS[idx];
    const age = Math.max(0, tAbs - card.t);
    const invCard = (idx % 2 === 1);
    const bg = invCard ? '#F2EFE7' : '#0A0708';
    const fg = invCard ? '#121010' : '#F2EFE7';

    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    frameRect(40, 40, W - 80, H - 80, C.red, 0.85, 4);

    /* Giant central Arabic numeral */
    const punch = 1 + 0.18 * Math.exp(-age * 14);
    c.save();
    c.translate(W*0.5, H*0.52);
    c.scale(punch, punch);
    c.font = '900 440px ' + MONO;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = C.red;
    c.fillText(card.n, 10, 10);
    c.fillStyle = fg;
    c.fillText(card.n, 0, 0);
    c.restore();

    /* Left: number word in native script; Right: language name & call */
    c.font = '800 108px "Segoe UI","Microsoft YaHei",sans-serif';
    c.textAlign = 'left'; c.fillStyle = fg;
    c.fillText(card.word, 110, H*0.54);

    c.textAlign = 'right'; c.fillStyle = C.red;
    c.fillText(card.lang, W - 110, H*0.50);
    c.font = '500 22px ' + MONO;
    c.fillStyle = fg; c.globalAlpha = 0.7;
    c.fillText(card.sub, W - 110, H*0.58);
    c.globalAlpha = 1;
    return;
  }

  /* Sub-part A (147.91..159.25s): The 12x Love Loop Code Machine + Morphing Superquadric Background */
  let round = 1;
  for (let i=0; i<EXEC_12_TIMES.length; i++){
    if (tAbs >= EXEC_12_TIMES[i]) round = i + 1;
  }
  const roundStart = EXEC_12_TIMES[round - 1] || 147.91;
  const roundAge = Math.max(0, tAbs - roundStart);
  const syl = clamp(Math.floor(roundAge / 0.18), 0, 3); /* 4 syllables of EX-E-CU-TION */

  /* Camera step-up at round 5, round 9, and round 12 (as in Nyankomintsu PLAN §7) */
  const camScale = round >= 12 ? 1.48 : (round >= 9 ? 1.24 : (round >= 5 ? 1.10 : 1.0));

  c.fillStyle = '#090708'; c.fillRect(0, 0, W, H);

  /* Background: Morphing contour / superquadric ghosts */
  c.save();
  c.globalAlpha = 0.22;
  world12d(c, s);
  c.restore();

  c.save();
  c.translate(W*0.5, H*0.5);
  c.scale(camScale, camScale);
  c.translate(-W*0.5, -H*0.5);

  /* The Love Loop Machine panel */
  const px = 180, py = 130, pw = W - 360, ph = 540;
  c.fillStyle = 'rgba(12, 8, 10, 0.92)';
  c.fillRect(px, py, pw, ph);
  frameRect(px, py, pw, ph, C.red, 0.85, 2.5);

  const codeRows = [
    '01  while (you.presence != "online") {',
    '02      love = solve(me, you);          // ERR_UNRESOLVED_LOVE',
    '03      send(love, you);                // ERR_WINDOW_EDGE',
    '04      wait(you.reply);                // ERR_REPLY_OVERDUE',
    '05      run++;                          // round ' + pad2(round) + ' / 12',
    '06  }',
    '07  say(love);                          // unreachable'
  ];

  for (let i=0; i<codeRows.length; i++){
    const ry = py + 64 + i * 64;
    const isActive = (i === syl + 1);
    if (isActive){
      rect(px + 12, ry - 36, pw - 24, 52, C.red, 0.28);
      rect(px + 12, ry - 36, 6, 52, C.red, 1);
    }
    c.font = (isActive ? '700 ' : '400 ') + '25px ' + MONO;
    c.textAlign = 'left';
    c.fillStyle = i === 6 ? '#6E6A68' : (isActive ? '#F2EFE7' : '#C8B8B8');
    c.fillText(codeRows[i], px + 36, ry);
  }

  /* Odometer counter on right of code panel */
  c.font = '800 96px ' + MONO;
  c.textAlign = 'right';
  c.fillStyle = C.red;
  c.fillText(round >= 12 ? 'OVERFLOW' : (pad2(round) + '/12'), px + pw - 36, py + 110);

  /* Bottom 4-syllable solid block stamp: EX - E - CU - TION */
  const chunks = ['EX', 'E', 'CU', 'TION'];
  const bw = (pw - 60) / 4;
  for (let k=0; k<=syl; k++){
    const bx = px + 30 + k * bw;
    const by = H - 230;
    const tearY = (round >= 12 && k >= 2) ? 28 : 0;
    rect(bx + 6, by + tearY, bw - 12, 130, k === syl ? C.red : '#F2EFE7', 0.95);
    c.font = '900 84px ' + MONO;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = k === syl ? '#090708' : '#090708';
    c.fillText(chunks[k], bx + bw*0.5, by + 68 + tearY);
  }
  c.restore();
}

SCENE_REGISTRY[7]  = function(c, s){ world07_v4(c, s); };
SCENE_REGISTRY[8]  = function(c, s){ world08_v4(c, s); };
SCENE_REGISTRY[9]  = function(c, s){ world09_v4(c, s); };
SCENE_REGISTRY[10] = function(c, s){ world10_v4(c, s); };
SCENE_REGISTRY[11] = function(c, s){ world11_v4(c, s); };
SCENE_REGISTRY[12] = function(c, s){ world12_v4(c, s); };
