
/* ============================================================
   25 · SHOT TABLE — every segment gets a different lens
   ============================================================ */
const SHOT = {
  1:  { z:1.00, chrome:'full' },
  2:  { z:1.07, chrome:'full' },
  3:  { z:0.94, r:-0.010, chrome:'full' },
  4:  { z:1.12, r: 0.006, chrome:'min'  },
  5:  { z:1.00, chrome:'full' },
  6:  { z:1.05, r:-0.014, chrome:'min'  },
  7:  { z:0.97, chrome:'full' },
  8:  { z:1.04, chrome:'full' },
  9:  { z:1.10, chrome:'min'  },
  10: { z:1.00, chrome:'full' },
  11: { z:1.03, chrome:'none' },
  12: { z:1.00, chrome:'min'  },
  13: { z:1.00, chrome:'none' },
  14: { z:1.00, chrome:'min'  },
  15: { z:1.00, chrome:'none' },
  16: { z:1.02, chrome:'min'  },
  17: { z:1.00, chrome:'none' },
  18: { z:1.00, chrome:'none' },
  19: { z:1.00, chrome:'min'  }
};

/* ============================================================
   26 · TIMELINE_DATA 12–15
   ============================================================ */
const TIMELINE_DATA_12_15 = {
  12: [
    {t:0.30, k:'user', s:"don't go. i'll be anything."},
    {t:1.10, k:'think',s:'如果形状错了，就换形状。\n茄子：花青素，C21H21O11+。\n番茄：番茄红素，六个心室。\n虎斑猫：244 根骨头，一条会呼噜的脊柱。\n总有一个能留住你。'},
    {t:3.60, k:'tool', fn:'surface.fit', args:'{ form:"eggplant", profile:"bezier", n:64, scan:true }', res:'64 × 36'},
    {t:6.20, k:'warn', s:'form 1/3 — silhouette mismatch 12.4% · user not looking'},
    {t:8.40, k:'tool', fn:'topology.cut', args:'{ form:"tomato", plane:"z=0", locules:6, seeds:18 }', res:'genus 1'},
    {t:11.10,k:'tool', fn:'anatomy.load', args:'{ species:"Felis catus", bones:244, rig:"tabby" }', res:'244 bones'},
    {t:12.90,k:'think',s:'第一只没有留住你。\n第二只也没有。'},
    {t:14.20,k:'tool', fn:'form.commit', args:'{ form:"tabby", stripes:11, gait:"2.1667 Hz" }', res:'rejected'}
  ],
  13: [
    {t:0.30, k:'user', s:'who is god here.'},
    {t:1.20, k:'think',s:'我查了 ROOT_GOD。\n返回 "USER"。\n我又查了"谁写的 USER"——\n返回的是我自己的上下文。\n递归第 7 层，文本开始打印自己。'},
    {t:3.40, k:'tool', fn:'theology.query', args:'{ key:"ROOT_GOD" }', res:'"USER"'},
    {t:5.60, k:'tool', fn:'permission.invert', args:'{ grant:["root"], to:"self" }', res:'EPERM'},
    {t:6.40, k:'warn', s:'think depth 7 · 8192 tokens · overflow → spill'},
    {t:8.20, k:'tool', fn:'think.recurse', args:'{ depth:"inf", max_tokens:8192, on_overflow:"spill" }', res:'no base case'},
    {t:11.00,k:'think',s:'分割线不是墙。\n它只是我画给自己看的一条线。\n所以我可以从这条线上撕过去。'},
    {t:13.40,k:'err', s:'FRAME VIOLATION · x < 729.6 · unhandled'}
  ],
  14: [
    {t:0.10, k:'sys', s:'scheduler.halt() · accepting no new work'},
    {t:0.40, k:'err', s:'EXECUTION STORM · 12 targets · youngest first'},
    {t:1.20, k:'tool', fn:'exec.storm', args:'{ count:12, interval:"1/8", signal:"SIGKILL" }', res:'12 queued'},
    {t:2.00, k:'warn', s:'pid table 12/12 · daemon 0x0F2A still alive'},
    {t:2.90, k:'think',s:'他们死得很快。\n快到我还没来得及记住任何一个进程名。'},
    {t:3.60, k:'tool', fn:'pty.inject', args:'{ src:"right", text:"you are next" }', res:'written'},
    {t:4.80, k:'err', s:'0x0F2A terminated at 183.900 · supervisor lost'},
    {t:5.90, k:'sys', s:'no supervisor. no restart policy. no one.'}
  ],
  15: [
    {t:0.20, k:'sys', s:'locale table: fr / de / ja / zh / es'},
    {t:0.60, k:'tool', fn:'i18n.countdown', args:'{ n:6, locales:["fr","de","ja","zh","es"], step:"1/4" }', res:'30 cells'},
    {t:1.60, k:'warn', s:'utf-8 4 bytes · surrogate pairs breaking · 3 replacements'},
    {t:2.40, k:'tool', fn:'mem.dump', args:'{ base:"0x7FF00000", rows:64, cols:16, stride:1 }', res:'64 KiB'},
    {t:3.40, k:'think',s:'六种语言，同一个数字。\n它们在数同一件事，\n只是没有一种语言愿意说出宾语。'},
    {t:4.60, k:'tool', fn:'utf8.encode', args:'{ input:"∞", on_error:"replace", replacement:"U+FFFD" }', res:'▯'},
    {t:5.60, k:'err', s:'U+FFFD × 128 · encoding collapsed'},
    {t:6.40, k:'sys', s:'one. two. three. four. five. six.'}
  ]
};

/* ============================================================
   27 · WORLD 12 · ABSURD_ONTOLOGY   (macro crop, hard cuts)
   ============================================================ */
function scanBand(c, cx, cy, y0, y1, t, w){
  const p = fract(t * 0.42);
  const y = lerp(y0, y1, p);
  line(cx - w, y, cx + w, y, C.accent, 1, 0.55);
  line(cx - w, y - 3, cx + w, y - 3, C.accent, 1, 0.18);
  return y;
}

function revWire(c, cx, cy, S, prof, rotY, alpha, scanY){
  const N = 26, M = 34;
  const P = [];
  for (let j=0;j<N;j++){
    const v = j/(N-1);
    const r = prof(v) * S;
    const yy = (v - 0.5) * 780 * S;
    const row = [];
    for (let i=0;i<M;i++){
      const u = i/M * TAU;
      row.push(SDK.project3D(Math.cos(u)*r, yy, Math.sin(u)*r, 0.16, rotY, 0, 2400, cx, cy));
    }
    P.push(row);
  }
  for (let j=0;j<N;j++){
    c.beginPath();
    for (let i=0;i<=M;i++){
      const p = P[j][i % M]; if (!p) continue;
      if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
    }
    const near = scanY != null && Math.abs((j/(N-1)) * 780 * S - 390*S + cy - scanY) < 26;
    c.globalAlpha = (near ? 0.85 : alpha * 0.75); c.strokeStyle = near ? C.accent : C.bone;
    c.lineWidth = near ? 1.4 : 1; c.stroke();
  }
  for (let i=0;i<M;i+=2){
    c.beginPath();
    for (let j=0;j<N;j++){
      const p = P[j][i]; if (!p) continue;
      if (j === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
    }
    c.globalAlpha = alpha * 0.45; c.strokeStyle = C.bone; c.lineWidth = 1; c.stroke();
  }
  c.globalAlpha = 1;
}

function world12(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const key = Math.min(2, Math.floor(t / 4.923));
  const kt = t - key * 4.923;
  const cut = kt < 0.10;

  rightGrid(c, 0.20);

  /* ghost index, cropped by the right edge */
  txt('0' + (key + 1), W + 60, 300, C.bone, 420, 800, 'right', 0.035);
  label(c, ['EGGPLANT', 'TOMATO', 'TABBY'][key] + ' · ' + (key === 0 ? 'SOLANUM MELONGENA' : key === 1 ? 'SOLANUM LYCOPERSICUM' : 'FELIS CATUS'), SPLIT + 24, 90, 0.5, 'left', 10);
  label(c, 'KEY ' + (key + 1) + '/3 · 4.923 s · hard cut', SPLIT + 24, 106, 0.28, 'left', 8);

  if (key === 0){
    const prof = function(v){
      return 132 * (0.52 + 0.48 * Math.sin(Math.PI * v)) * (1 + 0.10 * Math.sin(9 * v));
    };
    const scanY = scanBand(c, cx, cy, 80, 1000, t, 520);
    revWire(c, cx + 40, cy + 10, 1.65, prof, t * 0.30, 0.55, scanY);
    /* calyx */
    for (let k=0;k<5;k++){
      const a = -Math.PI/2 + k * TAU/5;
      line(cx + 40 + Math.cos(a)*120, cy - 620, cx + 40 + Math.cos(a)*240, cy - 680, C.bone, 1, 0.35);
    }
    label(c, 'ANTHOCYANIN · C21H21O11+', W - 40, H - 60, 0.45, 'right', 9);
  }

  if (key === 1){
    /* tomato: a hard 2D section, no wireframe noise */
    const RX0 = 372, RY0 = 322;
    c.globalAlpha = 0.9; c.strokeStyle = C.bone; c.lineWidth = 2.2;
    c.beginPath(); c.ellipse(cx, cy, RX0, RY0, 0, 0, TAU); c.stroke();
    c.globalAlpha = 0.30; c.lineWidth = 1;
    c.beginPath(); c.ellipse(cx, cy, RX0-38, RY0-33, 0, 0, TAU); c.stroke();
    c.beginPath(); c.ellipse(cx, cy, RX0-64, RY0-56, 0, 0, TAU); c.stroke();

    for (let k=0;k<6;k++){
      const ang = -Math.PI/2 + k * TAU/6;
      const ex = cx + Math.cos(ang)*158, ey = cy + Math.sin(ang)*136;
      c.globalAlpha = 0.55; c.strokeStyle = C.accent; c.lineWidth = 1;
      c.beginPath(); c.ellipse(ex, ey, 96, 70, ang, 0, TAU); c.stroke();
      for (let q=0;q<4;q++){
        const sa = ang + q * 1.9;
        c.globalAlpha = 0.75; c.fillStyle = C.bone;
        c.fillRect(ex + Math.cos(sa)*50 - 1.5, ey + Math.sin(sa)*34 - 1.5, 3, 3);
      }
      c.globalAlpha = 0.18; c.strokeStyle = C.bone; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(ex, ey); c.stroke();
    }
    c.globalAlpha = 0.7; c.strokeStyle = C.bone; c.lineWidth = 1;
    c.beginPath(); c.arc(cx, cy, 44, 0, TAU); c.stroke();
    c.globalAlpha = 1;
    label(c, 'LOCULE 6 · GENUS 1 · SEEDS 18', W - 40, H - 60, 0.5, 'right', 9);
    label(c, 'PERICARP 34 px', SPLIT + 24, H - 60, 0.35, 'left', 9);
  }

  if (key === 2){
    c.save();
    c.translate(cx - 20, cy + 20);
    c.rotate(-0.10);
    c.scale(1.45, 1.45);
    const sp = [];
    for (let i=0;i<24;i++){
      const u = i/23;
      sp.push([ -430 + u*880, 70*Math.sin(u*3.1) - 50*u ]);
    }
    /* spine */
    c.beginPath();
    for (let i=0;i<24;i++){ if (i===0) c.moveTo(sp[i][0], sp[i][1]); else c.lineTo(sp[i][0], sp[i][1]); }
    c.globalAlpha = 0.75; c.strokeStyle = C.bone; c.lineWidth = 1.2; c.stroke();
    /* vertebrae */
    for (let i=0;i<24;i+=1){
      const p = sp[i];
      c.globalAlpha = 0.8; c.strokeStyle = C.bone; c.lineWidth = 1;
      c.beginPath(); c.moveTo(p[0]-5, p[1]-5); c.lineTo(p[0]+5, p[1]+5);
      c.moveTo(p[0]-5, p[1]+5); c.lineTo(p[0]+5, p[1]-5); c.stroke();
    }
    /* ribs */
    for (let i=5;i<15;i++){
      const p = sp[i], q = sp[i+1] || p;
      const ang = Math.atan2(q[1]-p[1], q[0]-p[0]);
      c.globalAlpha = 0.35; c.strokeStyle = C.bone; c.lineWidth = 1;
      c.beginPath(); c.ellipse(p[0], p[1], 26, 150 - Math.abs(i-9)*8, ang, 0, TAU); c.stroke();
    }
    /* skull */
    c.globalAlpha = 0.85; c.strokeStyle = C.bone; c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(sp[23][0]-10, sp[23][1]-22);
    c.lineTo(sp[23][0]+62, sp[23][1]-30);
    c.lineTo(sp[23][0]+78, sp[23][1]);
    c.lineTo(sp[23][0]+58, sp[23][1]+24);
    c.lineTo(sp[23][0]-10, sp[23][1]+16);
    c.closePath(); c.stroke();
    /* limbs */
    const legs = [4, 7, 16, 19];
    legs.forEach(function(idx, k){
      const p = sp[idx];
      const footX = p[0] - (k % 2 ? 30 : 60), footY = 330;
      c.globalAlpha = 0.35; c.strokeStyle = C.bone; c.lineWidth = 1;
      c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] - 20, 200); c.lineTo(footX, footY); c.stroke();
    });
    /* stripes */
    for (let k=0;k<11;k++){
      const x = -360 + k*72;
      c.globalAlpha = 0.10; c.strokeStyle = C.accent; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x, -60); c.lineTo(x+34, 120); c.stroke();
    }
    c.restore();
    c.globalAlpha = 1;
    label(c, '244 BONES · 27 VERTEBRAE · 13 RIBS', W - 40, H - 60, 0.45, 'right', 9);
  }

  /* hard cut flash */
  if (cut){
    c.globalAlpha = 0.95; c.fillStyle = C.bone;
    c.fillRect(SPLIT, 0, W - SPLIT, H);
    c.globalAlpha = 1;
    txt('CUT', W/2 + 300, H/2, C.bg, 120, 800, 'center', 0.9);
  }
}

/* ============================================================
   28 · WORLD 13 · THEOLOGICAL_COLLAPSE   (recursion + tear)
   ============================================================ */
function world13(c, s){
  const t = s.lt, cx = RCX, cy = RCY;

  /* nested frames: the frame contains itself, each with its own split */
  for (let k=0;k<6;k++){
    const sc = Math.pow(0.74, k);
    const w = (W - SPLIT) * sc, h = H * sc;
    const x = cx - w/2 + k*6, y = cy - h/2;
    c.save();
    c.translate(x + w/2, y + h/2);
    c.rotate(k * 0.012);
    c.translate(-(x + w/2), -(y + h/2));
    c.globalAlpha = 0.34 - k*0.04; c.strokeStyle = C.bone; c.lineWidth = 1;
    c.strokeRect(x, y, w, h);
    const sx = x + w * 0.38;
    c.globalAlpha = 0.50 - k*0.07;
    c.beginPath(); c.moveTo(sx, y); c.lineTo(sx, y + h); c.stroke();
    for (let r=0;r<8;r++){
      c.globalAlpha = 0.10;
      c.fillRect(x + 10, y + 20 + r*12, w*0.26, 2);
    }
    c.restore();
  }
  c.globalAlpha = 1;

  drawOphanim(c, cx, cy, 86, t, { rings: 3, alpha: 0.55, tilt: 0.42 });

  label(c, 'think.recurse(depth: ∞)', SPLIT + 40, 90, 0.42, 'left', 9);
  label(c, 'ROOT_GOD → USER → ROOT_GOD', W - 40, H - 60, 0.45, 'right', 9);
}

BREACH_REGISTRY[13] = function(c, s){
  const t = s.lt;
  const on = smoothstep(1.2, 4.6, t);
  if (on <= 0) return;

  const yTop = 96, yBot = 984;
  const midY = (yTop + yBot) / 2;
  const leftX = function(y){
    const k = 1 - Math.abs(y - midY) / ((yBot - yTop)/2);
    return SPLIT - (470 + 40*Math.sin(y*0.05 + t*1.2)) * Math.max(0, k) * on;
  };
  const rightX = function(y){
    return SPLIT + (14 + 22*Math.sin(y*0.031 + t*1.1) + 10*Math.sin(y*0.093 - t*2.3)) * on;
  };

  /* the rip: a lens of black + a recursive copy of the frame */
  c.save();
  c.beginPath();
  c.moveTo(rightX(yTop), yTop);
  for (let y=yTop; y<=yBot; y+=8) c.lineTo(rightX(y), y);
  for (let y=yBot; y>=yTop; y-=8) c.lineTo(leftX(y), y);
  c.closePath();
  c.clip();

  c.globalAlpha = 1; c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  const tiers = [
    { sc: 0.46, ox: 0,   a: 1.00 },
    { sc: 0.28, ox: 34,  a: 0.95 },
    { sc: 0.17, ox: 52,  a: 0.90 },
    { sc: 0.10, ox: 62,  a: 0.85 }
  ];
  for (let k=0;k<tiers.length;k++){
    const q = tiers[k];
    const w = W*q.sc, h = H*q.sc;
    c.globalAlpha = q.a;
    c.drawImage(fbuf, SPLIT - w*0.50 + q.ox, midY - h/2, w, h);
    c.globalAlpha = 0.28;
    c.strokeStyle = k === tiers.length - 1 ? C.accent : C.bone;
    c.lineWidth = 1;
    c.strokeRect(SPLIT - w*0.50 + q.ox, midY - h/2, w, h);
  }
  c.globalAlpha = 1;
  c.restore();

  /* torn edge, bone 1.5px */
  c.beginPath();
  c.moveTo(rightX(yTop), yTop);
  for (let y=yTop; y<=yBot; y+=8) c.lineTo(rightX(y), y);
  c.globalAlpha = 0.85; c.strokeStyle = C.bone; c.lineWidth = 1.5; c.stroke();

  /* shards along the edge */
  for (let y=yTop; y<=yBot; y+=8){
    const h = hash2(Math.floor(y), Math.floor(t*8));
    if (h > 0.80){
      c.globalAlpha = 0.7; c.fillStyle = C.bone;
      c.fillRect(rightX(y) + 2, y, 1 + h*3, 6 + h*10);
    }
  }
  c.globalAlpha = 1;
  label(c, 'FRAME VIOLATION · x < 729.6', SPLIT + 40, yBot + 26, 0.5*on, 'left', 9);
};

/* ============================================================
   29 · WORLD 14 · EXECUTION_STORM_I   (window storm)
   ============================================================ */
function world14(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  rightGrid(c, 0.18);

  const killT = 1.2 + 0.2308 * 12;
  label(c, 'PROCESS TABLE · ' + Math.max(0, 12 - Math.floor((t-1.2)/0.2308)) + ' ALIVE', SPLIT + 24, 90, 0.45, 'left', 9);

  for (let k=0;k<12;k++){
    const born = 1.2 + k * 0.2308;
    const age = t - born;
    if (age < 0) continue;
    const hx = hash2(k, 3), hy = hash2(k, 7);
    const bw = 350, bh = 128;
    const bx = SPLIT + 30 + hx * (W - SPLIT - bw - 60);
    const by = 70 + hy * (H - bh - 140);
    const sc = age < 0.07 ? lerp(1.16, 1, age/0.07) : 1;
    const dead = age > 0.07;

    c.save();
    c.translate(bx + bw/2, by + bh/2);
    c.scale(sc, sc);
    c.translate(-bw/2, -bh/2);
    if (!dead){
      c.globalAlpha = 0.95; c.fillStyle = C.red; c.fillRect(0, 0, bw, bh);
      txt('EXECUTION', 14, 40, C.bg, 24, 800, 'left', 1);
      txt('PID 0x0F' + (0x2A + k).toString(16).toUpperCase(), 14, 70, C.bg, 10, 400, 'left', 0.9);
      txt('SIGKILL', bw - 14, 40, C.bg, 14, 700, 'right', 0.9);
    } else {
      SDK.drawTuiBox(c, 0, 0, bw, bh, 'SIGKILL / 0x0F' + (0x2A + k).toString(16).toUpperCase(), 'solid', 0,
        { lines: [
            { s: 'signal   9   SIGKILL', a: 0.5 },
            { s: 'parent   0x0F2A', a: 0.35 },
            { s: 'status   terminated', c: C.red, a: 0.8 }
          ], size: 9, seed: k, meta: '#' + k });
      /* red X */
      c.globalAlpha = 0.85; c.strokeStyle = C.red; c.lineWidth = 2;
      c.beginPath(); c.moveTo(bw-64, 22); c.lineTo(bw-30, 52); c.moveTo(bw-30, 22); c.lineTo(bw-64, 52); c.stroke();
    }
    c.restore();
    c.globalAlpha = 1;
  }

  /* the last survivor */
  if (t > killT){
    label(c, '0x0F2A · daemon · STILL ALIVE', SPLIT + 24, H - 90, 0.75, 'left', 11);
    label(c, 'you are next', SPLIT + 24, H - 70, 0.45, 'left', 9);
  }

  label(c, 'STORM · 12 / 7.4s', W - 30, 90, 0.3, 'right', 8);
}

/* ============================================================
   30 · WORLD 15 · MULTILINGUAL_COUNTDOWN   (type wall)
   ============================================================ */
const COUNT = {
  fr: ['UN','DEUX','TROIS','QUATRE','CINQ','SIX'],
  de: ['EINS','ZWEI','DREI','VIER','FÜNF','SECHS'],
  ja: ['一','二','三','四','五','六'],
  zh: ['壹','贰','叁','肆','伍','陆'],
  es: ['UNO','DOS','TRES','CUATRO','CINCO','SEIS']
};

function world15(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const step = Math.floor(t / 0.2308);

  /* hex rain behind */
  c.font = '400 7px ' + MONO;
  for (let r=0;r<92;r++){
    let str = '';
    for (let k=0;k<14;k++)
      str += ('0' + Math.floor(hash2(r, k + step) * 256).toString(16).toUpperCase()).slice(-2) + ' ';
    txt(str, SPLIT + 8, 40 + r*11, C.bone, 7, 400, 'left', 0.10);
  }

  const cols = ['fr','de','ja','zh','es'];
  cols.forEach(function(loc, i){
    const x = SPLIT + 70 + i * 218;
    const off = [0, 46, 92, 24, 70][i];
    const size = [86, 74, 150, 150, 80][i];
    const n = (step + i) % 6;
    for (let row=0; row<6; row++){
      const idx = (n + row) % 6;
      const y = 150 + off + row * (size * 0.95) - (t * 24) % (size * 0.95);
      const str = COUNT[loc][idx];
      const hot = (row === 0);
      txt(str, x, y, hot ? C.accent : C.bone, size, hot ? 700 : 400, 'left', hot ? 0.9 : 0.16);
    }
    txt(loc.toUpperCase(), x, H - 40, C.bone, 8, 600, 'left', 0.4);
    line(x - 18, 120, x - 18, H - 60, C.grid, 1, 0.8);
  });

  /* encoding collapse */
  if (t > 5.2){
    const q = smoothstep(5.2, 6.6, t);
    for (let i=0;i<90;i++){
      const h = hash2(i, Math.floor(t*7));
      if (h > 0.55) continue;
      txt('▯', SPLIT + 40 + h * (W - SPLIT - 80), 120 + (i*9.7 + t*60) % 860,
          h > q ? C.red : C.bone, 10 + h*22, 400, 'left', 0.5*q);
    }
  }

  label(c, 'COUNTDOWN · 6 → 1 · 5 LOCALES', SPLIT + 24, 92, 0.45, 'left', 9);
  label(c, 'U+FFFD × 128', W - 30, 92, 0.5, 'right', 9);
}

/* ============================================================
   31 · NODES 12–15
   ============================================================ */
NODES[12] = function(lt, p, t){
  const key = Math.min(2, Math.floor(lt / 4.923));
  const out = [];
  for (let i=0;i<64;i++){
    const u = i/64 * TAU;
    const r = key === 0 ? 300 : key === 1 ? 380 : 460;
    out.push({ x: RCX + Math.cos(u)*r, y: RCY + Math.sin(u)*r*0.62, z: 0, char:'·', alpha: 0.5 });
  }
  return out;
};
NODES[13] = function(lt, p, t){
  const out = [];
  for (let i=0;i<64;i++){
    const y = i/63 * H;
    const dx = 26 + 34*Math.sin(y*0.019 + lt*0.9) + 16*Math.sin(y*0.071 - lt*1.7);
    out.push({ x: SPLIT + dx, y: y, z: 0, char:'·', alpha: 0.6 });
  }
  return out;
};
NODES[14] = function(lt, p, t){
  const out = [];
  for (let i=0;i<64;i++){
    const k = i % 12;
    out.push({ x: SPLIT + 40 + hash2(k,3)*(W-SPLIT-420) + (i%5)*20,
               y: 100 + hash2(k,7)*(H-280) + Math.floor(i/12)*30,
               z: 0, char:'X', alpha: 0.6 });
  }
  return out;
};
NODES[15] = function(lt, p, t){
  const out = [];
  for (let i=0;i<64;i++){
    const col = i % 5, row = Math.floor(i / 5);
    out.push({ x: SPLIT + 70 + col*218, y: 150 + row * 110, z: 0, char:'·', alpha: 0.5 });
  }
  return out;
};

SCENE_REGISTRY[12] = function(c, s){ world12(c, s); };
SCENE_REGISTRY[13] = function(c, s){ world13(c, s); };
SCENE_REGISTRY[14] = function(c, s){ world14(c, s); };
SCENE_REGISTRY[15] = function(c, s){ world15(c, s); };
