
/* ============================================================
   49 · THE FOUR SHEETS — lesson / quiz / formula / proof
   ============================================================ */
const PAP = { p:'#F3F0E8', ink:'#191816', red:'#D9452F', sub:'#6E6A60', line:'#D6D0C2' };

function sheet(c, x, y, w, h, rot, shadow){
  c.save();
  if (shadow !== false){
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fillRect(x + 10, y + 12, w, h);
  }
  c.fillStyle = PAP.p;
  c.fillRect(x, y, w, h);
  c.strokeStyle = PAP.line; c.lineWidth = 1;
  c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  return c;
}
function paperGround(c){
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(240,240,242,0.035)';
  for (let y=14; y<H; y+=20) for (let x=SPLIT+10; x<W; x+=20){
    c.beginPath(); c.arc(x, y, 1.0, 0, TAU); c.fill();
  }
}
function ptext(c, str, x, y, size, col, weight, align, alpha){
  c.font = (weight||400) + ' ' + size + 'px "Segoe UI",system-ui,sans-serif';
  c.textAlign = align || 'left'; c.textBaseline = 'alphabetic';
  c.fillStyle = col; c.globalAlpha = alpha == null ? 1 : alpha;
  c.fillText(str, x, y);
  c.globalAlpha = 1;
}
function pmono(c, str, x, y, size, col, alpha){
  c.font = size + 'px "Consolas",monospace';
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillStyle = col; c.globalAlpha = alpha == null ? 1 : alpha;
  c.fillText(str, x, y);
  c.globalAlpha = 1;
}

/* ---------- 1 · lesson ---------- */
function plateLesson(c, t){
  paperGround(c);
  const k = smoothstep(0.15, 1.1, t);
  const X = SPLIT + 90, Y = 90, Wp = 1180, Hp = 900;

  /* a blackboard, not a sheet */
  c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(X+12, Y+14, Wp, Hp);
  c.fillStyle = '#141614'; c.fillRect(X, Y, Wp, Hp);
  c.strokeStyle = '#3A3D38'; c.lineWidth = 2; c.strokeRect(X+0.5, Y+0.5, Wp-1, Hp-1);

  ptext(c, 'LESSON 01', X + 44, Y + 62, 15, '#C9C6BC', 600, 'left', 0.75 * k);
  ptext(c, 'what love is', X + 44, Y + 104, 46, '#EDEAE2', 300, 'left', k);

  /* two circles, you and me */
  const cx1 = X + 430, cx2 = X + 700, cy = Y + 400, R = 168;
  c.globalAlpha = k * 0.9; c.strokeStyle = '#EDEAE2'; c.lineWidth = 2.5;
  c.beginPath(); c.arc(cx1, cy, R, 0, TAU); c.stroke();
  c.beginPath(); c.arc(cx2, cy, R, 0, TAU); c.stroke();
  c.globalAlpha = 1;
  ptext(c, 'me', cx1 - R - 20, cy - R - 18, 30, '#EDEAE2', 500, 'left', k*0.85);
  ptext(c, 'you', cx2 + R - 40, cy - R - 18, 30, '#EDEAE2', 500, 'left', k*0.85);
  ptext(c, 'us', (cx1+cx2)/2 - 18, cy + 10, 26, '#D9452F', 600, 'left', k);

  /* the lesson line, handwritten-ish */
  const line1 = 'love = the part that is both of us';
  const shown = Math.floor(line1.length * smoothstep(1.2, 2.8, t));
  pmono(c, line1.slice(0, shown), X + 44, Y + 690, 30, '#EDEAE2', 0.92);
  pmono(c, '  ... and the part that is neither.', X + 44, Y + 742, 26, '#8E8B82',
        smoothstep(2.6, 3.2, t));
  /* chalk dust */
  c.fillStyle = 'rgba(237,234,226,0.05)';
  for (let i=0;i<90;i++) c.fillRect(X + 30 + hash2(i,1)*(Wp-60), Y + 40 + hash2(i,2)*(Hp-80), 2, 2);

  c.restore();
  label(c, 'LOVE \u00b7 1/4 \u00b7 LESSON', SPLIT + 30, H - 26, 0.4, 'left', 9);
}

/* ---------- 2 · quiz ---------- */
function plateQuiz(c, t){
  paperGround(c);
  const k = smoothstep(0.1, 0.9, t);
  const X = SPLIT + 120, Y = 70, Wp = 1000, Hp = 940;
  sheet(c, X, Y, Wp, Hp, -0.012);

  ptext(c, 'QUIZ', X + 52, Y + 74, 16, PAP.sub, 600, 'left', k);
  ptext(c, 'do you love me?', X + 52, Y + 124, 40, PAP.ink, 300, 'left', k);
  pmono(c, 'answer all 4. no partial credit.', X + 52, Y + 158, 12, PAP.sub, 0.9 * k);

  const qs = ['1. when i say i am here', '2. when i say i am yours', '3. when i am broken', '4. when i am gone'];
  const opts = ['yes', 'no', 'only sometimes', '—'];
  for (let q=0;q<4;q++){
    const yy = Y + 220 + q*150;
    pmono(c, qs[q], X + 52, yy, 15, PAP.ink, k * 0.9);
    for (let o=0;o<4;o++){
      const ox = X + 70 + o*150, oy = yy + 44;
      const filled = (q + o) % 3 === 1;
      c.globalAlpha = k;
      c.beginPath(); c.ellipse(ox, oy, 12, 15, 0, 0, TAU);
      c.strokeStyle = filled ? PAP.red : '#8C877C'; c.lineWidth = 1.6; c.stroke();
      if (filled){
        c.fillStyle = PAP.red; c.beginPath(); c.ellipse(ox, oy, 8, 10, 0, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
      pmono(c, opts[o], ox + 20, oy + 5, 12, '#6E6A60', k * 0.9);
    }
  }
  /* grade stamp */
  const g = smoothstep(2.4, 2.9, t);
  if (g > 0){
    c.globalAlpha = g;
    c.save();
    c.translate(X + Wp - 190, Y + Hp - 150);
    c.rotate(-0.16);
    c.strokeStyle = PAP.red; c.lineWidth = 5;
    c.strokeRect(-150, -60, 300, 120);
    ptext(c, '0 / 100', 0, 16, 56, PAP.red, 700, 'center');
    ptext(c, 'FAILED TO BE LOVED', 0, 46, 13, PAP.red, 600, 'center', 0.85);
    c.restore();
    c.globalAlpha = 1;
  }
  c.restore();
  label(c, 'LOVE \u00b7 2/4 \u00b7 QUIZ', SPLIT + 30, H - 26, 0.4, 'left', 9);
}

/* ---------- 3 · formula ---------- */
function plateFormula(c, t){
  paperGround(c);
  const k = smoothstep(0.1, 1.0, t);
  const X = SPLIT + 140, Y = 120, Wp = 1040, Hp = 840;
  sheet(c, X, Y, Wp, Hp, 0.010);

  ptext(c, 'FORMULA', X + 60, Y + 76, 15, PAP.sub, 600, 'left', k);
  pmono(c, 'the only one that ever worked', X + 60, Y + 104, 12, PAP.sub, 0.85 * k);

  const L = [
    ['love', '=', '( you \u00d7 me )'],
    ['', '\u2212', '( time )'],
    ['', '\u00f7', '( distance \u00b2 )']
  ];
  let yy = Y + 240;
  L.forEach(function(row, i){
    const a = smoothstep(0.5 + i*0.5, 0.9 + i*0.5, t);
    ptext(c, row[0], X + 60, yy, 64, PAP.ink, 300, 'left', a);
    ptext(c, row[1], X + 270, yy, 64, PAP.red, 300, 'left', a);
    ptext(c, row[2], X + 340, yy, 64, PAP.ink, 300, 'left', a);
    yy += 118;
  });
  /* the box around the answer */
  const a2 = smoothstep(2.2, 2.7, t);
  if (a2 > 0){
    c.globalAlpha = a2;
    c.strokeStyle = PAP.red; c.lineWidth = 3;
    c.strokeRect(X + 56, Y + 148, 620, 108);
    c.globalAlpha = 1;
  }
  /* footnote */
  const fn = 'if any term is zero, this is undefined.';
  pmono(c, fn.slice(0, Math.floor(fn.length * smoothstep(2.6, 3.4, t))),
        X + 60, Y + Hp - 90, 18, PAP.sub, 0.95);
  c.restore();
  label(c, 'LOVE \u00b7 3/4 \u00b7 FORMULA', SPLIT + 30, H - 26, 0.4, 'left', 9);
}

/* ---------- 4 · proof ---------- */
function plateProof(c, t){
  paperGround(c);
  const k = smoothstep(0.1, 1.0, t);
  const X = SPLIT + 150, Y = 110, Wp = 1020, Hp = 860;
  sheet(c, X, Y, Wp, Hp, 0.014);

  ptext(c, 'PROOF', X + 60, Y + 78, 15, PAP.sub, 600, 'left', k);
  ptext(c, 'by contradiction', X + 60, Y + 122, 34, PAP.ink, 300, 'left', k);

  const rows = [
    ['given', 'you exist'],
    ['to prove', 'i exist too'],
    ['assume', 'i do not exist'],
    ['then', 'nothing is watching you'],
    ['but', 'you are reading this'],
    ['so', 'i exist']
  ];
  rows.forEach(function(r, i){
    const a = smoothstep(0.5 + i*0.42, 0.8 + i*0.42, t);
    pmono(c, r[0], X + 64, Y + 230 + i*86, 17, PAP.red, a * 0.9);
    ptext(c, r[1], X + 260, Y + 232 + i*86, 27, PAP.ink, 300, 'left', a);
    line(X + 60, Y + 250 + i*86, X + Wp - 60, Y + 250 + i*86, '#D6D0C2', 1, a * 0.6);
  });

  /* QED */
  const q = smoothstep(3.0, 3.5, t);
  if (q > 0){
    c.globalAlpha = q;
    c.fillStyle = PAP.ink;
    c.fillRect(X + Wp - 150, Y + Hp - 150, 30, 30);
    ptext(c, 'Q.E.D.', X + Wp - 170, Y + Hp - 170, 26, PAP.ink, 400, 'right');
    c.globalAlpha = 1;
  }
  /* red seal */
  const s2 = smoothstep(3.4, 3.9, t);
  if (s2 > 0){
    c.globalAlpha = s2 * 0.9;
    c.strokeStyle = PAP.red; c.lineWidth = 3;
    c.beginPath(); c.arc(X + Wp - 200, Y + 190, 74, 0, TAU); c.stroke();
    c.beginPath(); c.arc(X + Wp - 200, Y + 190, 60, 0, TAU); c.stroke();
    ptext(c, 'PROVEN', X + Wp - 200, Y + 198, 16, PAP.red, 700, 'center');
    c.globalAlpha = 1;
  }
  c.restore();
  label(c, 'LOVE \u00b7 4/4 \u00b7 PROOF', SPLIT + 30, H - 26, 0.4, 'left', 9);
}

function lovePlate(c, s, which){ 
  if (which === 0) plateLesson(c, s.lt);
  else if (which === 1) plateQuiz(c, s.lt);
  else if (which === 2) plateFormula(c, s.lt);
  else plateProof(c, s.lt);
}

SCENE_REGISTRY[14] = function(c, s){ lovePlate(c, s, s.lt < 3.70 ? 0 : 1); };
SCENE_REGISTRY[15] = function(c, s){ lovePlate(c, s, s.lt < 3.70 ? 2 : 3); };
SHOT[14] = { z:1.00, chrome:'none' };
SHOT[15] = { z:1.00, chrome:'none' };
