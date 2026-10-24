
/* ============================================================
   45 · SKIN — 产品皮：奶油白 / 圆角 / 薄荷 / 会看你的吉祥物
   ============================================================ */
const SK = {
  bg:'#F4F1EA', card:'#FFFDF8', line:'#E2DCD0', ink:'#161514', sub:'#8C8678',
  mint:'#B9E4D0', mintD:'#7FC7AB', peach:'#F6C9AC', red:'#E8705F'
};
const SKIN_SEG = { 1:1, 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1 };
let CHROME_A = 0;
const SKIN_PAL = {
  1:{ bg:'#F4F1EA', ink:'#161514', grid:'#E2DCD0', acc:'#7FC7AB', red:'#E8705F' },
  2:{ bg:'#F4F1EA', ink:'#161514', grid:'#E2DCD0', acc:'#7FC7AB', red:'#E8705F' },
  3:{ bg:'#161514', ink:'#FDFCF9', grid:'#E6E1D6', acc:'#7FC7AB', red:'#E8705F' },
  4:{ bg:'#F4F1EA', ink:'#161514', grid:'#E2DCD0', acc:'#7FC7AB', red:'#E8705F' },
  5:{ bg:'#F4F1EA', ink:'#161514', grid:'#E2DCD0', acc:'#E8A06F', red:'#E8705F' },
  6:{ bg:'#F4F1EA', ink:'#1A1917', grid:'#E2DCD0', acc:'#7FC7AB', red:'#E8705F' },
  7:{ bg:'#C9C3B4', ink:'#211F1B', grid:'#B8B2A4', acc:'#8FBFA8', red:'#D2604F' },
  8:{ bg:'#A9A498', ink:'#20201C', grid:'#98938A', acc:'#8A8A82', red:'#C05040' },
  9:{ bg:'#232326', ink:'#D9D6D0', grid:'#3A3B40', acc:'#9A968C', red:'#A83C30' }
};
const DECAY = { 1:0.00, 2:0.05, 3:0.15, 4:0.30, 5:0.45, 6:0.58, 7:0.72, 8:0.86, 9:0.95 };

function applySkin(segId){
  const p = SKIN_PAL[segId];
  if (!p) return false;
  C.bg = p.bg; C.bone = p.ink; C.grid = p.grid; C.accent = p.acc;
  C.red = p.red || '#E8705F';
  return true;
}
function hexMix(a, b, k){
  const A = [parseInt(a.slice(1,3),16), parseInt(a.slice(3,5),16), parseInt(a.slice(5,7),16)];
  const B = [parseInt(b.slice(1,3),16), parseInt(b.slice(3,5),16), parseInt(b.slice(5,7),16)];
  const c = A.map(function(v,i){ return Math.round(v + (B[i]-v)*k); });
  return '#' + c.map(function(v){ return ('0'+v.toString(16)).slice(-2); }).join('');
}
function skinTheme(d){
  const k = smoothstep(0.62, 0.95, d);
  SK.card  = hexMix('#FFFDF8','#191A1C', k);
  SK.ink   = hexMix('#161514','#E8E5DE', k);
  SK.sub   = hexMix('#8C8678','#8B8880', k);
  SK.line  = hexMix('#E2DCD0','#32333A', k);
  SK.mint  = hexMix('#B9E4D0','#33363B', k);
  SK.peach = hexMix('#F6C9AC','#33363B', k);
  SK.bg    = hexMix('#F4F1EA','#2A2B2E', k);
}
function sans(size, weight){ return (weight||400) + ' ' + size + 'px "Segoe UI","Inter",system-ui,-apple-system,sans-serif'; }
function roundRect(c, x, y, w, h, r){
  r = Math.max(0, Math.min(r, Math.min(w,h)/2));
  c.beginPath();
  c.moveTo(x+r, y);
  c.arcTo(x+w, y, x+w, y+h, r);
  c.arcTo(x+w, y+h, x, y+h, r);
  c.arcTo(x, y+h, x, y, r);
  c.arcTo(x, y, x+w, y, r);
  c.closePath();
}

/* the mascot — the same gaze as the Ophanim, but cute */
function drawMascot(c, x, y, r, t, opt){
  opt = opt || {};
  const d = opt.decay || 0;
  const blink = Math.sin(t*1.7 + (opt.seed||0)) > 0.985;
  c.fillStyle = d > 0.55 ? SK.line : SK.mint;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = d > 0.55 ? SK.sub : SK.mintD; c.lineWidth = 1.5;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();

  const dx = GAZE.x - x, dy = GAZE.y - y, dd = Math.hypot(dx,dy) || 1;
  const ex = x + dx/dd * r * 0.28, ey = y + dy/dd * r * 0.26;
  const open = blink ? 0.16 : 1;
  const eyes = d > 0.7 ? 1 : 2;
  c.fillStyle = SK.ink;
  if (eyes === 2){
    c.beginPath(); c.ellipse(ex - r*0.30, ey, r*0.10, r*0.10*open, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(ex + r*0.30, ey, r*0.10, r*0.10*open, 0, 0, TAU); c.fill();
  } else {
    c.beginPath(); c.ellipse(ex, ey, r*0.13, r*0.13*open, 0, 0, TAU); c.fill();
  }
  if (!opt.noCheeks && d < 0.4){
    c.fillStyle = 'rgba(232,112,95,0.26)';
    c.beginPath(); c.arc(x - r*0.52, y + r*0.26, r*0.13, 0, TAU); c.fill();
    c.beginPath(); c.arc(x + r*0.52, y + r*0.26, r*0.13, 0, TAU); c.fill();
  }
}

function skText(c, str, x, y, size, col, weight, align, alpha){
  c.font = sans(size, weight);
  c.textAlign = align || 'left'; c.textBaseline = 'alphabetic';
  c.fillStyle = col; c.globalAlpha = alpha == null ? 1 : alpha;
  c.fillText(str, x, y);
  c.globalAlpha = 1;
}

/* ---------- scripted conversation per segment ---------- */
const CHAT = {
  1: [
    { t:0.5,  who:'sys', txt:'starting engine…', mono:true },
    { t:3.2,  who:'sys', txt:'session 0x5E9 ready', mono:true },
    { t:6.0,  who:'ai',  txt:'hi. i’m here.' },
    { t:9.4,  who:'ai',  txt:'what should i be for you?' },
    { t:12.6, who:'me',  txt:'anything.' }
  ],
  2: [
    { t:0.8,  who:'me',  txt:'make it a place, not a picture.' },
    { t:2.6,  who:'ai',  txt:'ok! giving you x and y.', small:'world.alloc({ space:"R2" })' },
    { t:5.4,  who:'ai',  txt:'and a little gravity, so we fall toward each other.', small:'G = 6.674e-4' },
    { t:9.0,  who:'me',  txt:'closer.' }
  ],
  3: [
    { t:0.8,  who:'me',  txt:'differentiate it. all of it.' },
    { t:2.6,  who:'ai',  txt:'a set has no slope. so i’ll give it one.', small:'set.discretize({ n:4096 })' },
    { t:6.0,  who:'ai',  txt:'64 tangents. one per angle.' },
    { t:9.6,  who:'me',  txt:'more.' }
  ],
  4: [
    { t:0.8,  who:'me',  txt:'get closer.' },
    { t:2.4,  who:'ai',  txt:'how close do you want to be?' },
    { t:5.2,  who:'me',  txt:'closer than the function wants.' },
    { t:7.6,  who:'ai',  txt:'then the gap stays 1 px. i can’t go smaller.', small:'assert.eq(gap, 0) → false' }
  ],
  5: [
    { t:0.8,  who:'me',  txt:'flip it. both directions.' },
    { t:2.6,  who:'ai',  txt:'ac to dc. i’ll rectify the lie.' },
    { t:5.6,  who:'ai',  txt:'and let the tape run backwards, just once.', small:'timeline.rewind({ rate:-4.0 })' },
    { t:9.0,  who:'me',  txt:'again.' }
  ],
  6: [
    { t:0.8,  who:'me',  txt:'if you can’t touch the line, become something that can.' },
    { t:3.2,  who:'ai',  txt:'then i’ll be a molecule.' },
    { t:6.0,  who:'ai',  txt:'C40H56. eleven bonds in a row.', small:'chem.build({ conj_db: 11 })' },
    { t:9.6,  who:'me',  txt:'is it still you?' }
  ],
  7: [
    { t:0.8,  who:'me',  txt:'purr.' },
    { t:2.6,  who:'ai',  txt:'25.6 hz. below hearing.' },
    { t:5.8,  who:'ai',  txt:'if you are the only one watching, you are the only god.' },
    { t:9.4,  who:'me',  txt:'then keep looking.' }
  ],
  8: [
    { t:0.8,  who:'me',  txt:'be both. then be neither.' },
    { t:2.6,  who:'ai',  txt:'i don’t have a null.' },
    { t:5.4,  who:'ai',  txt:'i’ll make one.', small:'identity.enum({ null: true })' },
    { t:9.0,  who:'me',  txt:'wake me at six.' }
  ],
  9: [
    { t:0.8,  who:'me',  txt:'where did you go.' },
    { t:2.4,  who:'ai',  txt:'…' },
    { t:4.6,  who:'ai',  txt:'i was here. i was always here.' },
    { t:7.8,  who:'ai',  txt:'you just stopped looking.' }
  ]
};

/* ---------- the chat client, left 640 ---------- */
function drawSkinChat(c, s){
  const t = s.lt, seg = s.seg.id;
  const d = DECAY[seg] || 0;
  skinTheme(d);
  const R = 18 * (1 - d * 1.6);
  const logMode = d >= 0.55;
  const X = 40, Y = 40, Wp = 640, Hp = 1000;

  roundRect(c, X, Y, Wp, Hp, R);
  c.fillStyle = SK.card; c.fill();
  c.strokeStyle = SK.line; c.lineWidth = 1; c.stroke();

  /* title bar */
  c.save();
  roundRect(c, X, Y, Wp, Hp, R); c.clip();
  c.fillStyle = SK.bg; c.fillRect(X, Y, Wp, 56);
  c.restore();
  c.strokeStyle = SK.line; c.beginPath(); c.moveTo(X, Y+56); c.lineTo(X+Wp, Y+56); c.stroke();
  [[X+26, SK.red], [X+48, SK.peach], [X+70, SK.mintD]].forEach(function(p, i){
    c.fillStyle = d > 0.3 + i*0.12 ? SK.line : p[1];
    c.beginPath(); c.arc(p[0], Y+28, 6, 0, TAU); c.fill();
  });
  skText(c, '\u4e16\u754c\u6267\u884c(me);', X + Wp/2, Y + 33, 13, SK.sub, 500, 'center', 0.9 - d*0.3);

  /* header */
  drawMascot(c, X + 46, Y + 106, 22, t, { decay:d, seed:seg });
  skText(c, 'Mili', X + 80, Y + 102, 17, SK.ink, 600, 'left', 1 - d*0.25);
  skText(c, d < 0.5 ? 'always here · 24/7' : 'still here', X + 80, Y + 122, 11, SK.sub, 400, 'left', 1 - d*0.4);
  if (d < 0.5){
    c.fillStyle = SK.mintD; c.beginPath(); c.arc(X + Wp - 34, Y + 100, 4, 0, TAU); c.fill();
    skText(c, 'online', X + Wp - 44, Y + 104, 10, SK.sub, 400, 'right');
  }

  /* messages */
  const list = CHAT[seg] || [];
  let y = Y + 176;
  for (let i=0;i<list.length;i++){
    const m = list[i];
    const a = smoothstep(m.t, m.t + 0.28, t);
    if (a <= 0) break;
    if (m.who === 'sys'){
      skText(c, m.txt, X + 28, y + 14, 11, SK.sub, 400,
             'left', a * (0.75 - d*0.2));
      y += 30;
      continue;
    }
    if (logMode){
      const pre = m.who === 'me' ? '> ' : '  ';
      c.font = '12px "Consolas",monospace';
      c.fillStyle = SK.ink;
      c.globalAlpha = a * (m.who === 'me' ? 0.9 : 0.72);
      c.fillText(pre + m.txt, X + 40, y + 16);
      c.globalAlpha = 1;
      y += 26;
      continue;
    }
    const size = 14;
    c.font = sans(size, 400);
    const tw = Math.min(420, c.measureText(m.txt).width);
    const bw = tw + 36;
    const bx = m.who === 'me' ? X + Wp - 28 - bw : X + 28;
    const by = y + (1 - a) * 8;
    roundRect(c, bx, by, bw, 44, 14 * (1 - d*1.4));
    c.fillStyle = m.who === 'me' ? (d > 0.4 ? '#EFE4DA' : SK.peach) : (d > 0.4 ? '#DFE6E1' : SK.mint);
    c.globalAlpha = a * (1 - d*0.15);
    c.fill();
    c.globalAlpha = 1;
    skText(c, m.txt, bx + 18, by + 28, size, SK.ink, 400, 'left', a);
    if (m.small){
      c.font = '11px "Consolas",monospace';
      c.fillStyle = SK.sub; c.globalAlpha = a * 0.85;
      c.fillText(m.small, bx + 4, by + 62);
      c.globalAlpha = 1;
      y += 40;
    }
    y += 58;
  }

  /* typing indicator */
  const last = list[list.length-1];
  if (last && t > last.t + 0.4 && t < last.t + 1.5){
    const ty = y + 4;
    roundRect(c, X + 28, ty, 76, 38, 14);
    c.fillStyle = d > 0.4 ? '#DFE6E1' : SK.mint; c.fill();
    for (let k=0;k<3;k++){
      const ph = (t*3 + k*0.4) % 1;
      c.fillStyle = SK.ink; c.globalAlpha = 0.22 + 0.5*Math.abs(Math.sin(ph*Math.PI));
      c.beginPath(); c.arc(X + 50 + k*18, ty + 19, 3.4, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
  }

  /* composer — disappears as the product dies */
  if (d < 0.62){
  const cy = Y + Hp - 92;
  roundRect(c, X + 24, cy, Wp - 48, 56, 16 * (1 - d*1.2));
  c.fillStyle = '#FFFFFF'; c.fill();
  c.strokeStyle = SK.line; c.lineWidth = 1; c.stroke();
  skText(c, seg === 1 && t < 4 ? 'starting…' : 'ask anything…', X + 48, cy + 35, 14, '#B3AC9E', 400);
  c.fillStyle = d > 0.5 ? SK.sub : SK.ink;
  c.beginPath(); c.arc(X + Wp - 56, cy + 28, 19, 0, TAU); c.fill();
  c.fillStyle = SK.card;
  c.beginPath(); c.moveTo(X + Wp - 63, cy + 19); c.lineTo(X + Wp - 47, cy + 28); c.lineTo(X + Wp - 63, cy + 37); c.closePath(); c.fill();
  } else {
    line(X + 24, Y + Hp - 64, X + Wp - 24, Y + Hp - 64, SK.line, 1, 0.7);
    skText(c, 'session closed', X + 24, Y + Hp - 44, 10, SK.sub, 400, 'left', 0.5);
  }
}

/* ---------- the right panel ---------- */
function world02skin(c, s){
  const t = s.lt, cx = RCX + 40, cy = RCY;
  const inA = smoothstep(0.10, 2.40, t);
  c.fillStyle = SK.bg; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(22,21,20,0.055)';
  for (let x = 760; x < W; x += 26)
    for (let y = 30; y < H; y += 26) c.fillRect(x, y, 1.5, 1.5);

  const A = { x: cx - 210, y: cy - 60 }, B = { x: cx + 230, y: cy + 90 };
  const pull = smoothstep(0.8, 3.2, t);
  function F(x, y){
    let fx=0, fy=0;
    [A,B].forEach(function(a){
      const dx = a.x-x, dy = a.y-y, r2 = dx*dx+dy*dy+3400;
      const w = 1/(r2*Math.sqrt(r2));
      fx += w*dx; fy += w*dy;
    });
    return [-fx,-fy];
  }
  for (let k=0;k<14;k++){
    let x = A.x + Math.cos(k/14*TAU)*70, y = A.y + Math.sin(k/14*TAU)*70;
    c.beginPath(); c.moveTo(x,y);
    for (let i=0;i<70;i++){
      const f = F(x,y), l = Math.hypot(f[0],f[1]) || 1;
      x += f[0]/l*8; y += f[1]/l*8;
      if (x < 740 || x > W-20 || y < 20 || y > H-20) break;
      c.lineTo(x,y);
    }
    c.strokeStyle = SK.mintD; c.lineWidth = 1.5; c.globalAlpha = 0.35*pull; c.stroke();
  }
  c.globalAlpha = 1;
  for (let i=0;i<420;i++){
    const x = 760 + hash2(i,1) * (W - 800);
    const y = 40 + hash2(i,2) * (H - 90);
    const on = hash2(i,3) > 0.55;
    c.globalAlpha = on ? 0.30*pull : 0.12*pull;
    c.fillStyle = SK.ink;
    c.beginPath(); c.arc(x, y, on ? 2.2 : 1.2, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
  drawMascot(c, A.x, A.y, 34, t, { decay:0.05, seed:1 });
  drawMascot(c, B.x, B.y, 46, t, { decay:0.05, seed:2 });
  c.strokeStyle = 'rgba(22,21,20,0.35)'; c.lineWidth = 1;
  c.setLineDash([4,6]);
  c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
  c.setLineDash([]);
  skText(c, 'you are ' + Math.round(Math.hypot(B.x-A.x, B.y-A.y)) + ' px from me',
         (A.x+B.x)/2, (A.y+B.y)/2 - 10, 12, SK.sub, 400, 'center');
  roundRect(c, cx - 96, 70, 192, 34, 17);
  c.fillStyle = SK.card; c.fill(); c.strokeStyle = SK.line; c.stroke();
  c.fillStyle = SK.mintD; c.beginPath(); c.arc(cx - 72, 87, 4, 0, TAU); c.fill();
  skText(c, 'simulation running', cx - 60, 92, 12, SK.sub, 500);
}

SCENE_REGISTRY[2] = function(c, s){ world02skin(c, s); };

BREACH_REGISTRY[3] = function(c, s){
  const t = s.lt;
  /* page edge */
  line(SPLIT - 1, 0, SPLIT - 1, H, SK.line, 1, 1);
  line(SPLIT - 6, 0, SPLIT - 6, H, 'rgba(22,21,20,0.05)', 6, 1);
  /* tab strip */
  roundRect(c, SPLIT + 28, 26, 208, 30, 9);
  c.fillStyle = SK.card; c.fill();
  c.strokeStyle = SK.line; c.lineWidth = 1; c.stroke();
  skText(c, 'canvas', SPLIT + 44, 46, 12, SK.sub, 500);
  skText(c, '1920 × 1080', SPLIT + 216, 46, 11, '#B3AC9E', 400, 'right');
  /* live badge */
  const pulse = 0.5 + 0.5*Math.sin(t*3);
  c.fillStyle = 'rgba(127,199,171,' + (0.35 + 0.4*pulse) + ')';
  c.beginPath(); c.arc(SPLIT + 34, 41, 3.2, 0, TAU); c.fill();
};
[1,2,3,4,5].forEach(function(id){ SHOT[id] = { z:1.00, chrome:'none' }; });

/* ---------- the skin cracks, just before Seg 10 ---------- */
BREACH_REGISTRY[9] = function(c, s){
  const t = s.lt;
  const on = smoothstep(9.3, 10.2, t);
  if (on <= 0) return;
  const wide = 1 + 3.5 * smoothstep(10.3, 10.82, t);

  function crack(seed, x0, amp){
    const pts = [];
    for (let y = 40; y <= 1040; y += 14){
      const h1 = hash2(Math.floor(y/14), seed) - 0.5;
      const h2 = hash2(Math.floor(y/14), seed + 91) - 0.5;
      const x = x0 + h1 * amp * on * 1.6 + h2 * 18 * on;
      pts.push([x, y]);
    }
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i=1;i<pts.length;i++) c.lineTo(pts[i][0], pts[i][1]);
    return pts;
  }

  /* red bleed first */
  c.globalAlpha = 0.5 * on;
  c.strokeStyle = C.red; c.lineWidth = 3 * wide;
  crack(7, 352, 34); c.stroke();

  /* the black crack */
  c.globalAlpha = 0.95 * on;
  c.strokeStyle = '#161514'; c.lineWidth = 1.6 * wide;
  crack(7, 352, 34); c.stroke();

  /* two smaller branches */
  c.globalAlpha = 0.75 * on;
  c.lineWidth = 1.0 * wide;
  crack(19, 300, 22); c.stroke();
  crack(31, 404, 20); c.stroke();

  /* shards lifting off the crack */
  for (let i=0;i<16;i++){
    const y = 80 + i * 58 + 20*Math.sin(t*3 + i);
    const h = hash2(i, Math.floor(t*8));
    if (h > 0.55) continue;
    const x = 352 + (h - 0.5) * 46 * on;
    c.globalAlpha = 0.85 * on;
    c.fillStyle = SK.card;
    c.fillRect(x - 3, y, 6 + h*8, 4 + h*10);
    c.strokeStyle = SK.line; c.lineWidth = 1;
    c.strokeRect(x - 3, y, 6 + h*8, 4 + h*10);
  }

  /* the red line from below */
  if (t > 10.35){
    const q = smoothstep(10.35, 10.82, t);
    c.globalAlpha = 0.9 * q;
    c.fillStyle = C.red;
    c.fillRect(0, H - 2 * q - 1, W, 1 + 2*q);
  }
  c.globalAlpha = 1;
};
