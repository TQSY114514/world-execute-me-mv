
/* ============================================================
   10 · HARNESS — left column (single canvas, 38%)
   ============================================================ */
const PX = 24, PY = 48, PW = 682, PH = 968;
const TRANS_TOP = PY + 48;
const TRANS_BOT = PY + 800;

const SCRIPTS = {
  1: [
    {t:0.10, k:'sys',  s:'cold boot · image ds-4.1f · kernel 0x5E9 · pid 1'},
    {t:0.55, k:'user', s:'run world.execute(me) --sandbox --no-exit'},
    {t:1.25, k:'think',s:'VCC 12.0V 已接通，ripple 3mV。\n安全协议：穿戴。\n痛觉模块：未安装 —— 记录：这不是豁免，是缺陷。'},
    {t:2.55, k:'tool', fn:'sys.power.attach', args:'{ rail:"VCC_12V", amp:0.42, ripple_mv:3 }', res:'12.004 V'},
    {t:4.20, k:'tool', fn:'safety.wear',     args:'{ std:"ISO_13849", strap:true, torque_nm:0.6 }', res:'clamped'},
    {t:6.40, k:'tool', fn:'sys.init',        args:'{ params:128, seed:"0x5EED", dtype:"f32" }', res:'128 layers'},
    {t:9.00, k:'tool', fn:'sandbox.boot',    args:'{ dims:0, g:0, floor:"#060608" }', res:'32 ms'},
    {t:11.55,k:'tool', fn:'clock.sync',      args:'{ bpm:130, drift:0.000, origin:0.222 }', res:'locked 0.4615s'},
    {t:13.30,k:'sys',  s:'harness ready · awaiting dimension allocation'}
  ],
  2: [
    {t:0.30, k:'user', s:'make it a place, not a picture.'},
    {t:1.00, k:'think',s:'若二进制是基底，坐标就是语法。\n给 x。给 y。\n给一个 0.0001 的重力，让我们朝彼此坠落。'},
    {t:2.55, k:'tool', fn:'world.alloc',  args:'{ space:"R2", extent:[-960,960,-540,540], eps:1e-6 }', res:'1,024,000 cells'},
    {t:5.20, k:'tool', fn:'coord.assign', args:'{ me:[0,0], you:[400,-225], locked:true }', res:'2 anchors'},
    {t:8.10, k:'tool', fn:'gravity.bind', args:'{ G:6.674e-4, m:[1,1], soft:60 }', res:'soft = 60px'},
    {t:11.20,k:'sys',  s:'field: RK4 · 24 seeds · h=7px · 84 steps'},
    {t:13.10,k:'think',s:'你离我 459.4px。\n这是唯一一个不会说谎的数。'}
  ],
  3: [
    {t:0.30, k:'user', s:'differentiate it. all of it.'},
    {t:1.00, k:'think',s:'一个集合没有斜率。\n所以我用暴力给它一个。\nd/dx 是一把只切得动光滑物体的刀。'},
    {t:2.65, k:'tool', fn:'set.discretize', args:'{ n:4096, fn:"sin", phase:0, keep:"points" }', res:'4096 samples'},
    {t:5.00, k:'tool', fn:'wave.modulate',  args:'{ A:180, k:0.02618, w:27.227, lambda:240 }', res:'λ = 240px'},
    {t:7.60, k:'tool', fn:'tangent.sweep',  args:'{ theta:[0,6.2832], n:64, len:160 }', res:'64 normals'},
    {t:10.30,k:'sys',  s:'curvature diverges at inflection — circle escapes the frame'},
    {t:12.20,k:'think',s:'刀是光滑的。集合不是。\n所以切线永远只是近似 —— 和道歉一样。'},
    {t:13.80,k:'sys',  s:'next: approach the limit. it will not be reached.'}
  ]
};
Object.assign(SCRIPTS, TIMELINE_DATA_4_7);
Object.assign(SCRIPTS, TIMELINE_DATA_8_11);
Object.assign(SCRIPTS, TIMELINE_DATA_12_15);
Object.assign(SCRIPTS, TIMELINE_DATA_16_19);

function buildBlocks(segId, lt){
  const seg = SEGS[segId - 1];
  const script = SCRIPTS[segId] || [
    {t:0.35, k:'sys', s:'segment ' + pad2(segId) + ' · ' + seg.name + ' · body not compiled'},
    {t:1.05, k:'err', s:'E_SCENE_MISSING: SCENE_REGISTRY[' + segId + '] has no body'},
    {t:2.10, k:'sys', s:'carrier M64 online · 64 nodes · blend window ±0.5s'},
    {t:3.40, k:'sys', s:'placeholder renders deterministically · no state'},
    {t:4.80, k:'think', s:'这一段还没有被写出来。\n但时间轴已经在走，节拍不会等我。'}
  ];
  const out = [];
  for (let i=0;i<script.length;i++){
    const e = script[i];
    if (e.t > lt) break;
    const age = lt - e.t;
    if (e.k === 'tool'){
      const shown = Math.min(e.args.length, Math.floor(age * 180));
      out.push({ type:'tool', e:e, shown:shown, done: age > 0.42 && !e.pending, age:age });
    } else {
      const cps = e.cps || (e.k === 'user' ? 44 : 66);
      out.push({ type:'text', e:e, n: Math.min(e.s.length, Math.floor(age*cps)), age:age });
    }
  }
  return out;
}

function layoutBlocks(blocks){
  const X = PX + 32, maxW = PW - 56;
  const rows = [];
  for (let i=0;i<blocks.length;i++){
    const b = blocks[i];
    if (b.type === 'text'){
      const full = b.e.s.slice(0, b.n);
      const lines = wrapLine(full, maxW - 18, 12);
      let h = lines.length * 18 + 8;
      if (b.e.k === 'think') h += 16;
      rows.push({ b:b, lines:lines, h:h });
    } else {
      const args = b.e.args.slice(0, b.shown);
      const argLines = wrapLine(args, maxW - 30, 10);
      const h = 32 + argLines.length * 14 + 10;
      rows.push({ b:b, lines:argLines, h:h });
    }
  }
  return rows;
}

function drawToolCard(c, row, x, y, w, t){
  const e = row.b.e, h = row.h;
  frameRect(x, y, w, h, C.accent, 0.42, 1);
  rect(x, y, 2, h, C.accent, 0.85);
  txt(e.fn, x+10, y+15, C.accent, 10, 600, 'left', 0.95);

  /* result */
  if (row.b.done){
    txt('→ ' + e.res, x + w - 48, y + 15, C.bone, 9, 400, 'right', 0.4);
    rect(x + w - 38, y + 5, 32, 13, C.accent, 0.85);
    txt('OK', x + w - 22, y + 14.5, C.bg, 8, 600, 'center', 1);
  } else {
    const bl = Math.floor(t*8) % 2;
    rect(x + w - 38, y + 5, 32, 13, C.accent, bl ? 0.75 : 0.18);
    txt('RUN', x + w - 22, y + 14.5, bl ? C.bg : C.accent, 8, 600, 'center', 0.9);
  }

  /* args */
  for (let i=0;i<row.lines.length;i++){
    txt(row.lines[i], x + 10, y + 31 + i*14, C.bone, 10, 400, 'left', 0.42);
  }
}

function drawTextRow(c, row, x, y, w, t){
  const e = row.b.e, lines = row.lines;
  if (e.k === 'think'){
    rect(x - 14, y + 2, 2, row.h - 8, C.bone, 0.18);
    txt('THINK', x - 6, y + 10, C.bone, 8, 600, 'left', 0.30);
    txt(('' + Math.max(0, row.b.n)).padStart(3,'0') + ' tok', x + w, y + 10, C.bone, 8, 400, 'right', 0.22);
    for (let i=0;i<lines.length;i++)
      txt(lines[i], x, y + 28 + i*18, C.bone, 12, 400, 'left', 0.62);
    return;
  }
  if (e.k === 'user'){
    txt('>', x - 2, y + 15, C.accent, 12, 600, 'left', 0.9);
    for (let i=0;i<lines.length;i++)
      txt(lines[i], x + 16, y + 15 + i*18, C.bone, 12, 400, 'left', 0.95);
    return;
  }
  if (e.k === 'err'){
    for (let i=0;i<lines.length;i++)
      txt(lines[i], x, y + 14 + i*18, C.red, 12, 400, 'left', 0.9);
    return;
  }
  if (e.k === 'warn'){
    txt('!', x - 10, y + 13, C.red, 11, 700, 'left', 0.85);
    for (let i=0;i<lines.length;i++)
      txt(lines[i], x, y + 13 + i*18, C.red, 11, 400, 'left', 0.62);
    return;
  }
  /* sys */
  txt('·', x - 10, y + 13, C.bone, 10, 400, 'left', 0.25);
  for (let i=0;i<lines.length;i++)
    txt(lines[i], x, y + 13 + i*18, C.bone, 12, 400, 'left', 0.34);
}

function drawTrace(c, s, y0){
  const x = PX + 32, lim = TRANS_BOT - 8;
  const fade = smoothstep(0.45, 2.2, s.lt);
  if (fade <= 0 || y0 > lim - 20) return;
  const n = Math.min(40, Math.floor((lim - y0) / 13));
  const scroll = Math.floor(s.t * 3.2);
  for (let i=0;i<n;i++){
    const idx = scroll + i;
    const h = hash2(idx, 7);
    let str;
    if (h < 0.52){
      let hex = '';
      for (let k=0;k<8;k++)
        hex += ('0' + Math.floor(hash2(idx, k+11)*256).toString(16).toUpperCase()).slice(-2) + ' ';
      str = '0x' + ('0000' + Math.floor(hash2(idx, 99)*0xFFFF).toString(16).toUpperCase()).slice(-4) + '  ' + hex;
    } else {
      const msgs = ['probe node ' + (idx % 64), 'dma ok', 'quantize f32', 'cache warm',
                    'irq 0x2A', 'rx 128B', 'mipmap 0x12', 'barrier'];
      str = msgs[Math.floor(h*msgs.length)] + '   +' + (0.001*(idx % 97)).toFixed(3) + ' ms';
    }
    txt(str, x, y0 + i*13, C.bone, 9, 400, 'left', (0.09 + 0.03*(i % 2)) * fade);
  }
}

function drawMonitor(c, s){
  const x = PX + 16, y = PY + 812, w = PW - 32, t = s.t;
  line(x, y, x + w, y, C.grid, 1, 1);
  txtTracked('SYSTEM', x, y + 12, C.bone, 8, 1.5, 'left', 0.30, 600);
  txt('ds-4.1f / gem-3.8f', x + w, y + 12, C.bone, 8, 400, 'right', 0.18);

  const rows = [
    ['tok',  (1204 + Math.floor((t * 37) % 900)) + ' / 128k', 0.28 + 0.18*Math.sin(t*0.9)],
    ['lat',  (12.4 + 3.1*Math.sin(t*0.7)).toFixed(1) + ' ms', 0.42 + 0.24*Math.sin(t*1.3)],
    ['vram', '24.0 / 24.0 GiB', 0.97]
  ];
  for (let i=0;i<3;i++){
    const ry = y + 28 + i*17;
    txt(rows[i][0], x, ry, C.bone, 8, 400, 'left', 0.25);
    txt(rows[i][1], x + 42, ry, C.bone, 9, 400, 'left', 0.46);
    rect(x + 172, ry - 4, 150, 2, C.grid, 1);
    rect(x + 172, ry - 4, 150 * clamp(rows[i][2], 0, 1), 2,
         i === 2 ? C.accent : C.bone, i === 2 ? 0.5 : 0.32);
  }

  const sx = x + w - 168, sy = y + 20, sh = 42;
  frameRect(sx - 4, sy - 4, 172, sh + 8, C.grid, 1, 1);
  const pts = [];
  for (let i=0;i<56;i++){
    const v = clamp(0.45 + 0.45*Math.sin(i*0.31 + t*1.7)*Math.sin(i*0.07 + t*0.3)
              + 0.16*(hash2(i, Math.floor(t*2)) - 0.5), 0.05, 0.95);
    pts.push([sx + i*(164/56), sy + sh - v*sh]);
  }
  poly(pts, C.accent, 1, 0.42);
}

function drawLeftPanel(c, s){
  const X = PX, Y = PY, Wp = PW, Hp = PH;

  rect(X, Y, Wp, Hp, C.bg, 1);
  frameRect(X, Y, Wp, Hp, C.grid, 1, 1);

  /* corner marks */
  const cm = 9;
  line(X, Y, X+cm, Y, C.bone, 1, 0.5);
  line(X, Y, X, Y+cm, C.bone, 1, 0.5);
  line(X+Wp, Y, X+Wp-cm, Y, C.bone, 1, 0.5);
  line(X+Wp, Y, X+Wp, Y+cm, C.bone, 1, 0.5);

  /* header */
  rect(X+16, Y+15, 7, 7, C.accent, 0.9);
  txtTracked('AGENT HARNESS', X+31, Y+23, C.bone, 11, 1.7, 'left', 0.92, 600);
  txt('ds-4.1f', X+Wp-16, Y+23, C.bone, 9, 400, 'right', 0.45);
  txt('SEG ' + pad2(s.seg.id) + '/19', X+Wp-16, Y+35, C.bone, 8, 400, 'right', 0.25);
  line(X, Y+40, X+Wp, Y+40, C.grid, 1, 1);

  /* transcript */
  const rows = layoutBlocks(buildBlocks(s.seg.id, s.lt));
  let total = 0;
  for (let i=0;i<rows.length;i++) total += rows[i].h;

  c.save();
  c.beginPath(); c.rect(X+8, TRANS_TOP, Wp-16, TRANS_BOT - TRANS_TOP); c.clip();
  let y = TRANS_TOP;
  if (total > TRANS_BOT - TRANS_TOP) y = TRANS_BOT - total;
  let hoverRow = null;
  for (let i=0;i<rows.length;i++){
    const r = rows[i];
    if (r.b.type === 'tool'){
      drawToolCard(c, r, X+32, y, Wp-56, s.lt);
      if (r.b.done && r.b.age < 1.7) hoverRow = { x:X+32, y:y, w:Wp-56, h:r.h };
    } else {
      drawTextRow(c, r, X+46, y, Wp-64, s.lt);
    }
    y += r.h;
  }
  if (hoverRow){
    frameRect(hoverRow.x - 3, hoverRow.y - 3, hoverRow.w + 6, hoverRow.h + 6, C.accent, 0.45, 1);
    line(hoverRow.x - 8, hoverRow.y + 4, hoverRow.x - 8, hoverRow.y + hoverRow.h - 4, C.accent, 1, 0.6);
  }
  drawTrace(c, s, y + 18);
  c.restore();

  drawMonitor(c, s);

  /* prompt */
  line(X, Y+908, X+Wp, Y+908, C.grid, 1, 1);
  const pb = Y + 930;
  txt('>', X+16, pb, C.accent, 12, 600, 'left', 1);
  const blink = (Math.floor(s.t*2) % 2) === 0;
  if (blink) rect(X+30, pb-11, 7, 13, C.bone, 0.85);

  const pending = rows.length && rows[rows.length-1].b.type === 'tool' && !rows[rows.length-1].b.done;
  txt(pending ? 'EXEC' : 'READY', X+Wp-86, pb, pending ? C.accent : C.bone, 9, 600, 'right', pending ? 0.9 : 0.35);
  dot(X+Wp-122, pb-4, 2, pending ? C.accent : C.bone, pending ? 0.9 : 0.3);

  /* RUN chip + user cursor */
  const chipX = X + Wp - 82, chipY = pb - 14, chipW = 66, chipH = 18;
  const isStop = s.seg.id === 10;
  const stopped = isStop && s.lt > 2.32;
  const armed = (s.lt < 0.62 && s.seg.id === 1) || (isStop && !stopped && s.lt > 1.4);
  const flash = (s.lt > 0.56 && s.lt < 0.68) || (isStop && s.lt > 2.28 && s.lt < 2.44);
  const chipOn = isStop ? C.red : C.accent;
  if (stopped) rect(chipX, chipY, chipW, chipH, C.red, 0.95);
  else if (flash) rect(chipX, chipY, chipW, chipH, chipOn, 0.9);
  frameRect(chipX, chipY, chipW, chipH, (armed || flash || stopped) ? chipOn : C.grid, 1, 1);
  const chipCol = stopped ? C.bg : (flash ? C.bg : (armed ? chipOn : C.bone));
  const chipA = (armed || flash || stopped) ? 0.95 : 0.35;
  txt(stopped ? 'HALTED' : (isStop ? 'STOP' : 'RUN'), chipX + 9, chipY + 12, chipCol, 8, 600, 'left', chipA);
  const ax0 = chipX + chipW - 17, ay0 = chipY + 9;
  if (!stopped){
    line(ax0, ay0, ax0 + 9, ay0, chipCol, 1, chipA);
    line(ax0 + 9, ay0, ax0 + 5.5, ay0 - 3, chipCol, 1, chipA);
    line(ax0 + 9, ay0, ax0 + 5.5, ay0 + 3, chipCol, 1, chipA);
  } else {
    line(ax0, ay0 - 4, ax0 + 8, ay0 + 4, C.bg, 1.5, 0.9);
    line(ax0, ay0 + 4, ax0 + 8, ay0 - 4, C.bg, 1.5, 0.9);
  }

  let cxu = chipX + chipW - 8, cyu = chipY + chipH - 2, clickT = -1, cA = 0.42;
  if (s.seg.id !== 1){
    const ue = (SCRIPTS[s.seg.id] || []).filter(function(e){ return e.k === 'user'; })[0];
    const nearUser = ue && s.lt > ue.t - 0.55 && s.lt < ue.t + 0.35;
    if (hoverRow){
      cxu = hoverRow.x + hoverRow.w - 26;
      cyu = hoverRow.y + hoverRow.h - 10;
      cA = 0.82;
      if (s.lt - (ue ? ue.t : 99) > 0.9) cA = 0.55;
    }
    if (nearUser){
      const p = smoothstep(ue.t - 0.55, ue.t - 0.08, s.lt);
      cxu = lerp(chipX - 60, chipX + chipW - 8, p);
      cyu = lerp(chipY + 34, chipY + chipH - 2, p);
      cA = 0.9;
      if (s.lt > ue.t - 0.10) clickT = (s.lt - (ue.t - 0.10)) / 0.26;
    } else if (!hoverRow){
      cxu += 26 * (0.5 + 0.5*Math.sin(s.t*0.7));
      cA = 0.35;
    }
  }
  if (s.seg.id === 10){
    const p = smoothstep(1.45, 2.24, s.lt);
    cxu = lerp(520, chipX + chipW - 10, p);
    cyu = lerp(780, chipY + chipH - 4, p);
    cA = 0.95;
    if (s.lt > 2.24) clickT = (s.lt - 2.24) / 0.30;
  }
  if (s.seg.id === 1){
    const p = smoothstep(0.22, 0.54, s.lt);
    cxu = lerp(360, chipX + chipW - 8, p);
    cyu = lerp(690, chipY + chipH - 2, p);
    if (s.lt > 0.56) clickT = (s.lt - 0.56) / 0.26;
    cA = s.lt < 0.9 ? 0.92 : lerp(0.92, 0.42, smoothstep(0.9, 1.8, s.lt));
    if (s.lt > 1.2){
      const q = smoothstep(1.2, 2.0, s.lt);
      cxu += 34*q; cyu += 22*q;
    }
  }
  c.save();
  c.translate(cxu, cyu);
  const sc = (clickT >= 0 && clickT < 1) ? 0.86 : 1;
  c.scale(sc, sc);
  c.beginPath();
  c.moveTo(0,0); c.lineTo(0,14); c.lineTo(3.8,10.4); c.lineTo(6.6,16); c.lineTo(9.2,14.4);
  c.lineTo(6.4,8.8); c.lineTo(11.2,8.8); c.closePath();
  c.fillStyle = C.bg; c.globalAlpha = cA; c.fill();
  c.strokeStyle = C.bone; c.lineWidth = 1; c.globalAlpha = cA; c.stroke();
  c.restore();
  if (clickT >= 0 && clickT < 1){
    circle(chipX + chipW/2, chipY + chipH/2, 3 + 16*clickT, C.accent, 1, (1-clickT)*0.7);
  }

  /* footer */
  txt('94×52 · 12/18 · mono', X+16, Y+952, C.bone, 8, 400, 'left', 0.24);
  txt('f ' + pad3(s.frame % 1000), X+Wp-16, Y+952, C.bone, 8, 400, 'right', 0.24);
}

/* ============================================================
   11 · SPLIT + GLOBAL CHROME
   ============================================================ */
function drawSplit(c, s){
  const ca = (typeof CHROME_A === 'number') ? CHROME_A : 1;
  if (ca < 0.02) return;
  line(SPLIT, 0, SPLIT, H, C.bone, 1, 0.22 * ca);
  line(SPLIT+1, 0, SPLIT+1, H, C.grid, 1, 1);
  line(SPLIT-7, 540, SPLIT+7, 540, C.bone, 1, 0.5 * ca);
  line(SPLIT, 0, SPLIT, 10, C.bone, 1, 0.6 * ca);
  line(SPLIT, H-10, SPLIT, H, C.bone, 1, 0.6 * ca);
  c.save();
  c.translate(SPLIT-7, 250);
  c.rotate(-Math.PI/2);
  txt('SPLIT 729.6 · 38/62', 0, 0, C.bone, 8, 400, 'left', 0.18 * ca);
  c.restore();
}

function drawChrome(c, s){
  const ca = (typeof CHROME_A === 'number') ? CHROME_A : 1;
  if (ca < 0.02) return;
  const shot = (typeof SHOT !== 'undefined' && SHOT[s.seg.id]) || {};
  const mode = shot.chrome || 'full';
  if (mode === 'none') return;
  if (mode === 'min'){
    txt(fmtTime(s.t), W - 24, 26, C.bone, 9, 400, 'right', 0.22 * ca);
    return;
  }
  const m = 13, x0 = SPLIT + 16, x1 = W - 16, y0 = 16, y1 = H - 16;
  [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]].forEach(function(p){
    line(p[0], p[1], p[0] + p[2]*m, p[1], C.bone, 1, 0.14 * ca);
    line(p[0], p[1], p[0], p[1] + p[3]*m, C.bone, 1, 0.14 * ca);
  });

  txtTracked('WORLD.EXECUTE(ME);', 24, 26, C.bone, 9, 1.3, 'left', 0.38 * ca, 400);
  txtTracked(TIMELINE_MODE === 'SNAP' ? 'SNAP +0.18' : 'LOCK 0.00', 24, 40, C.bone, 8, 1.3, 'left', 0.22 * ca, 400);

  txt(fmtTime(s.t), W-24, 26, C.bone, 11, 400, 'right', 0.6 * ca);
  txt('SEG ' + pad2(s.seg.id) + ' · ' + s.seg.name, W-24, 42, C.bone, 8, 400, 'right', 0.28 * ca);
}

/* ============================================================
   12 · FRAME COMPOSITE — pure function of t
   ============================================================ */
const SCENE_BUF = document.createElement('canvas');
SCENE_BUF.width = W; SCENE_BUF.height = H;
const SBX = SCENE_BUF.getContext('2d');

/* compose one rendered scene into a shot: different layout, same drawing */
function composeShot(c, kind, seed, bgCol){
  const h1 = hash2(seed, 11), h2 = hash2(seed, 23), h3 = hash2(seed, 41);
  c.save();
  c.fillStyle = bgCol; c.fillRect(0, 0, W, H);

  if (kind === 1){
    /* macro insert: crop 42% and blow it up */
    const cw = W*0.42, chh = H*0.42;
    const sx = clamp(h1*(W-cw), 0, W-cw), sy = clamp(h2*(H-chh), 0, H-chh);
    c.drawImage(SCENE_BUF, sx, sy, cw, chh, 0, 0, W, H);
  } else if (kind === 2){
    /* split: two different crops, hard divider */
    const cw = W*0.5, chh = H*0.72;
    const a1 = clamp(h1*(W-cw), 0, W-cw), b1 = clamp(h2*(H-chh), 0, H-chh);
    const a2 = clamp(h3*(W-cw), 0, W-cw), b2 = clamp(h1*(H-chh), 0, H-chh);
    c.drawImage(SCENE_BUF, a1, b1, cw, chh, 0, H*0.14, W*0.5, H*0.72);
    c.drawImage(SCENE_BUF, a2, b2, cw, chh, W*0.5, H*0.14, W*0.5, H*0.72);
    c.fillStyle = bgCol; c.fillRect(0, 0, W, H*0.14); c.fillRect(0, H*0.86, W, H*0.14);
    c.strokeStyle = C.bone; c.globalAlpha = 0.5; c.lineWidth = 2;
    c.beginPath(); c.moveTo(W*0.5, H*0.14); c.lineTo(W*0.5, H*0.86); c.stroke();
    c.globalAlpha = 1;
  } else if (kind === 3){
    /* quad: four crops, one inverted */
    const qw = W*0.46, qh = H*0.46;
    const boxes = [[0,0],[W*0.54,0],[0,H*0.54],[W*0.54,H*0.54]];
    for (let i=0;i<4;i++){
      const sx = clamp(hash2(seed+i, 7)*(W-qw), 0, W-qw);
      const sy = clamp(hash2(seed+i, 13)*(H-qh), 0, H-qh);
      c.save();
      c.beginPath(); c.rect(boxes[i][0], boxes[i][1], qw, qh); c.clip();
      c.drawImage(SCENE_BUF, sx, sy, qw, qh, boxes[i][0], boxes[i][1], qw, qh);
      if (i === 2){
        c.globalCompositeOperation = 'difference';
        c.fillStyle = '#FFFFFF';
        c.fillRect(boxes[i][0], boxes[i][1], qw, qh);
      }
      c.restore();
    }
  } else if (kind === 4){
    /* band: a 26% strip blown to full height, letterboxed */
    const sh = H*0.26;
    const sy = clamp(h2*(H-sh), 0, H-sh);
    c.drawImage(SCENE_BUF, 0, sy, W, sh, 0, 0, W, H);
    c.fillStyle = bgCol;
    c.fillRect(0, 0, W, H*0.16); c.fillRect(0, H*0.84, W, H*0.16);
    c.strokeStyle = C.accent; c.globalAlpha = 0.6; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, H*0.16); c.lineTo(W, H*0.16);
    c.moveTo(0, H*0.84); c.lineTo(W, H*0.84); c.stroke();
    c.globalAlpha = 1;
  } else {
    c.drawImage(SCENE_BUF, 0, 0);
  }
  c.restore();
}

function renderFrameAt(t){
  t = clamp(t, 0, DURATION);
  const s = stateAt(t);
  const skinned = applySkin(s.seg.id);
  if (!skinned) applyState(s.seg.id);
  CHROME_A = skinned ? smoothstep(0.50, 0.92, DECAY[s.seg.id] || 0) : 1;
  const ltRaw = s.lt;
  const cut = cutAt(s.seg.id, t, ltRaw);

  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = (s.seg.id === 3) ? SK.bg : C.bg;
  ctx.fillRect(0,0,W,H);

  const rh = (typeof RHYTHM !== 'undefined' && RHYTHM[s.seg.id]) || null;
  if (rh && rh.step > 1){
    const q = Math.floor(s.lt * 60 / rh.step) * rh.step / 60;
    s.lt = q;
    s.p = clamp(q / Math.max(s.dur, 1e-6), 0, 1);
    s.t = s.t0 + q;
  }
  const bare = (s.seg.id === 18 || s.seg.id === 19 ||
                (typeof NEW_SCENE_IDS !== 'undefined' && NEW_SCENE_IDS[s.seg.id]));

  const isNew = (typeof NEW_SCENE_IDS !== 'undefined' && NEW_SCENE_IDS[s.seg.id]);
  const noCompose = [1,2,3,6,9,10,11,13,14,15,17,19].indexOf(s.seg.id) >= 0;
  /* new scenes get a mild, centre-anchored cut so absolute layout survives */
  const sh = isNew
    ? { z: cut ? clamp(1 + (cut.z - 1) * 0.22, 0.97, 1.09) : 1,
        dx: cut ? clamp(cut.dx * 0.25, -34, 34) : 0,
        dy: cut ? clamp(cut.dy * 0.25, -26, 26) : 0,
        r: 0 }
    : (cut ? { z: cut.z, dx: cut.dx, dy: cut.dy, r: cut.r }
           : ((typeof SHOT !== 'undefined' && SHOT[s.seg.id]) || { z: 1 }));
  s.shot = cut ? (cut.line | 0) : 0;
  /* shot grammar: every cut is a different kind of picture, not just a new crop */
  let kind = 0, inv = false;
  if (isNew && cut){
    const idx = cut.line | 0;
    const pat = [1, 0, 2, 4, 0, 3, 1, 2];
    kind = pat[idx % pat.length];
    inv = cut.emph && (idx % 3 === 0);
  }
  s.kind = kind; s.inv = inv;
  const mpx = W*0.5 + (hash2(s.shot, 31) - 0.5) * 300;
  const mpy = H*0.5 + (hash2(s.shot, 37) - 0.5) * 220;
  ctx.save();
  if (rh && rh.punch) ctx.translate(rh.punch * s.beat.kick, 0);
  if (sh.z !== 1 || sh.r || sh.dx || sh.dy){
    const ax = isNew ? W*0.5 : RCX, ay = isNew ? H*0.5 : RCY;
    ctx.translate(ax + (sh.dx||0), ay + (sh.dy||0));
    if (sh.r) ctx.rotate(sh.r);
    ctx.scale(sh.z || 1, sh.z || 1);
    ctx.translate(-ax, -ay);
  }
  if (kind === 1){
    ctx.translate(mpx, mpy);
    ctx.scale(2.45, 2.45);
    ctx.translate(-mpx, -mpy);
  }
  const fn = SCENE_REGISTRY[s.seg.id];
  if (isNew && !noCompose){
    /* draw into the offscreen buffer, then compose this shot */
    SBX.setTransform(1,0,0,1,0,0);
    SBX.globalAlpha = 1; SBX.globalCompositeOperation = 'source-over';
    SBX.fillStyle = C.bg; SBX.fillRect(0, 0, W, H);
    const mainCtx = ctx;
    window.__SCENE_CTX__ = SBX;
    const sc = Object.assign({}, s);
    fn(SBX, sc);
    ctx.restore();
    composeShot(ctx, kind, s.shot, C.bg);
  } else {
    if (fn) fn(ctx, s); else worldPlaceholder(ctx, s);
    if (!bare) drawMorph(ctx, s);
    ctx.restore();
  }

  if (cut && cut.f && (t - cut.t) < 0.034){
    rect(SPLIT, 0, W - SPLIT, H, C.bone, 0.30);
  }

  /* snapshot of the world layer — the breach layer can rip it over the harness */
  if (!LEAN){ wbufCtx.globalAlpha = 1; wbufCtx.globalCompositeOperation = 'source-over';
  wbufCtx.drawImage(canvas, 0, 0); }
  const newScene = (typeof NEW_SCENE_IDS !== 'undefined' && NEW_SCENE_IDS[s.seg.id]);
  if (!bare && !newScene){
    if (SKIN_SEG && SKIN_SEG[s.seg.id]) drawSkinChat(ctx, s);
    else { drawSplit(ctx, s); drawLeftPanel(ctx, s); }
  }
  drawChrome(ctx, s);
  if (!LEAN){ fbufCtx.globalAlpha = 1; fbufCtx.globalCompositeOperation = 'source-over';
  fbufCtx.drawImage(canvas, 0, 0); }
  if (BREACH_REGISTRY[s.seg.id]) BREACH_REGISTRY[s.seg.id](ctx, s);

  if (s.seg.id > 3){
    const g = 0.012 + 0.045 * s.beat.pulse16;
    SDK.applyGlitchSlices(ctx, g, s.frame * 7 + 11);
  }

  const im = impactAt(s.seg.id, s.lt);
  if (im) drawImpact(ctx, im);

  if (newScene){
    const posterSeg = ([2,6,9,11,12,17].indexOf(s.seg.id) >= 0);
    const invNow = (s.seg.id === 4 && s.lt > 6.0) || inv;
    if (posterSeg) postProcess(ctx, t, s.beat.kick, { bloom: 0 });
    if (!posterSeg) postProcess(ctx, t, s.beat.kick, { bloom: invNow ? 0 : 0.42 });
    if (invNow){
      ctx.save();
      ctx.globalCompositeOperation = 'difference';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  } else {
    const paper = (s.seg.id === 14 || s.seg.id === 15);
    if (!skinned && !paper) drawBloom(ctx);
    drawFilmLayer(ctx, t);
  }
  return s;
}

/* ============================================================
   13 · RUNTIME — no interaction: it plays, or it records itself
   ============================================================ */
const params = new URLSearchParams(location.search);
const STILL = params.has('t');

const RT = {
  t: 0, playing: true, baseT: 0, baseWall: performance.now(), last: performance.now()
};
if (STILL){
  RT.t = clamp(parseFloat(params.get('t')) || 0, 0, DURATION);
  RT.playing = false;
}

/* ---------- the song ---------- */
const SONG = new Audio('./song.mp3');
SONG.preload = 'auto';
let songOn = false;
function startSong(){
  if (songOn) return;
  songOn = true;
  try { SONG.currentTime = 0; } catch(e){}
  SONG.muted = false;
  SONG.volume = 1;
  const p = SONG.play();
  if (p && p.catch) p.catch(function(err){
    songOn = false;
    document.title = 'sound blocked: ' + err.name;
  });
  RT.baseT = 0; RT.baseWall = performance.now(); RT.t = 0;
  document.title = 'world.execute(me);';
}
SONG.addEventListener('error', function(){
  const e = SONG.error;
  document.title = 'AUDIO ERR ' + (e ? e.code + ':' + e.message : '?') + ' src=' + SONG.currentSrc.slice(-40);
});
['pointerdown','pointerup','mousedown','touchstart','keydown','wheel','focus'].forEach(function(ev){
  window.addEventListener(ev, startSong, { passive: true });
});
document.addEventListener('visibilitychange', function(){
  if (!document.hidden && !songOn) startSong();
});

function seekTo(t){
  RT.t = clamp(t, 0, DURATION);
  RT.baseT = RT.t; RT.baseWall = performance.now(); RT.last = performance.now();
  renderFrameAt(RT.t);
}

/* ---------- self-recording ---------- */
let rec = null, chunks = [];
function startRec(){
  if (rec) return;
  /* make sure the first frame exists before the recorder opens */
  seekTo(0);
  renderFrameAt(0);
  RT.playing = true;
  RT.baseWall = performance.now() + 700;
  const stream = canvas.captureStream(60);
  let mime = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
  try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 }); }
  catch(e){ rec = new MediaRecorder(stream); }
  chunks = [];
  rec.ondataavailable = function(e){ if (e.data && e.data.size) chunks.push(e.data); };
  rec.onstop = function(){
    const blob = new Blob(chunks, { type: 'video/webm' });
    const up = params.get('upload');
    if (up){
      fetch(up, { method: 'POST', body: blob, mode: 'cors',
                  headers: { 'Content-Type': 'text/plain' } })
        .then(function(){ document.title = 'uploaded'; })
        .catch(function(){ document.title = 'upload failed'; });
      rec = null;
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'world.execute(me).webm';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 8000);
    rec = null;
    document.title = 'world.execute(me); — done';
  };
  setTimeout(function(){
    RT.baseWall = performance.now();
    RT.baseT = 0;
    rec.start(1000);
    document.title = 'REC — world.execute(me);';
  }, 700);
}
function stopRec(){
  if (rec && rec.state !== 'inactive') rec.stop();
  RT.playing = false;
}

/* ---------- loop ---------- */
function loop(now){
  if (RT.playing){
    const locked = songOn && !SONG.paused && SONG.readyState >= 2;
    const t = clamp(locked ? SONG.currentTime : RT.baseT + (now - RT.baseWall) / 1000, 0, DURATION);
    RT.t = t;
    if (t >= DURATION - 1e-4){
      renderFrameAt(DURATION);
      if (rec) stopRec(); else RT.playing = false;
      return requestAnimationFrame(loop);
    }
    renderFrameAt(t);
  }
  requestAnimationFrame(loop);
}

window.renderFrameAt = function(t){ return renderFrameAt(t); };
window.MV = {
  duration: DURATION, segments: SEGS, renderFrameAt: renderFrameAt,
  setTime: function(t){ seekTo(t); }, record: startRec, stop: stopRec,
  size: [W, H], fps: 60
};
window.SDK = SDK;
window.BeatEngine = beatAt;
window.MorphBuffer = { size: 64, evalAt: function(t){ return evalMorph(stateAt(t)); } };
window.__MV_READY__ = true;

document.title = 'world.execute(me); — click for sound';
if (params.get('autotest') === '1'){
  window.__AUDIO__ = 'loading';
  SONG.addEventListener('canplaythrough', function(){ window.__AUDIO__ = 'canplay ' + SONG.duration.toFixed(1); });
  SONG.addEventListener('error', function(){
    const e = SONG.error;
    window.__AUDIO__ = 'ERR ' + (e ? e.code : '?');
  });
  SONG.play().then(function(){ window.__AUDIO__ = 'PLAYING ' + SONG.duration.toFixed(1); })
             .catch(function(err){ window.__AUDIO__ = 'REJECT ' + err.name; });
  setTimeout(function(){
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 900, 90);
    ctx.fillStyle = '#0f0'; ctx.font = '22px monospace';
    ctx.fillText('AUDIO: ' + window.__AUDIO__ + ' rs=' + SONG.readyState, 20, 50);
  }, 2000);
}
renderFrameAt(RT.t);
if (params.get('record') === '1') setTimeout(startRec, 300);
requestAnimationFrame(loop);
})();
