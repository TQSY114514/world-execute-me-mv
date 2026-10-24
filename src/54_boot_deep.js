
/* ============================================================
   54 · SEG 01 — deep boot (layered)
   ============================================================ */
function bLyAlpha(i, n, t){ return clamp(t - i*0.012, 0, 1); }

function bTelemetry(c, G, t, b){
  const rows = [
    ['CPU', 0.55 + 0.18*Math.sin(t*1.7), C.accent],
    ['VRAM', 0.78 + 0.10*Math.sin(t*0.9 + 1), C.bone],
    ['CTX', 0.42 + 0.25*Math.sin(t*1.3 + 2), C.bone],
    ['TEMP', 0.68 + 0.20*Math.sin(t*0.6 + 3), C.red]
  ];
  for (let i=0;i<rows.length;i++){
    const y = G.y(7) + i*26;
    const x = G.x(0);
    c.font = '9px "JetBrains Mono",Consolas,monospace';
    c.textAlign = 'left'; c.fillStyle = C.bone; c.globalAlpha = 0.5;
    c.fillText(rows[i][0], x, y + 8);
    const bw = 150;
    c.globalAlpha = 0.18; c.fillStyle = C.bone;
    c.fillRect(x + 46, y, bw, 4);
    c.globalAlpha = 0.85; c.fillStyle = rows[i][2];
    c.fillRect(x + 46, y, bw * clamp(rows[i][1], 0, 1), 4);
    c.globalAlpha = 0.55; c.fillStyle = C.bone;
    c.textAlign = 'right';
    c.fillText(Math.round(rows[i][1]*100) + '%', x + 46 + bw + 44, y + 8);
    c.globalAlpha = 1;
    c.textAlign = 'left';
  }
}

function bLorenz(c, box, t, b){
  const pts = GEN.lorenz, n = pts.length;
  const reveal = Math.floor(n * EASE.out(clamp((t - 0.6) / 7.0, 0, 1)));
  if (reveal < 2) return;
  const rot = t * 0.16;
  const tilt = 0.42 + 0.05*Math.sin(t*0.4);
  const S = box.w / 62;
  const cx = box.x + box.w*0.52, cy = box.y + box.h*0.52;

  /* trailing polyline, batched single-path render */
  const tailEnd = Math.max(0, reveal - 90);
  let prev = null;
  c.save();

  /* 1. cool tail path */
  if (tailEnd > 1){
    c.beginPath();
    for (let i=0; i<tailEnd; i++){
      const p = pts[i];
      const rx = p[0]*Math.cos(rot) - p[2]*Math.sin(rot);
      const rz = p[0]*Math.sin(rot) + p[2]*Math.cos(rot);
      const k = 1 / (1 + rz * 0.018);
      const x = cx + (rx - 2) * S * k;
      const y = cy + ((p[2] - 25) * tilt + rz * 0.9) * S * k;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      prev = [x, y];
    }
    c.strokeStyle = C.bone;
    c.lineWidth = 0.8;
    c.globalAlpha = 0.28;
    c.stroke();
  }

  /* 2. hot head path */
  c.beginPath();
  let headStarted = false;
  for (let i = tailEnd; i < reveal; i++){
    const p = pts[i];
    const rx = p[0]*Math.cos(rot) - p[2]*Math.sin(rot);
    const rz = p[0]*Math.sin(rot) + p[2]*Math.cos(rot);
    const k = 1 / (1 + rz * 0.018);
    const x = cx + (rx - 2) * S * k;
    const y = cy + ((p[2] - 25) * tilt + rz * 0.9) * S * k;
    if (!headStarted){
      if (prev) c.moveTo(prev[0], prev[1]);
      else c.moveTo(x, y);
      headStarted = true;
    }
    c.lineTo(x, y);
    prev = [x, y];
  }
  c.strokeStyle = C.accent;
  c.lineWidth = 1.8;
  c.globalAlpha = 0.88;
  c.stroke();
  c.restore();

  /* the head */
  if (prev){
    c.fillStyle = C.accent;
    c.beginPath(); c.arc(prev[0], prev[1], 3.2 + 2*b.kick, 0, TAU); c.fill();
    c.globalAlpha = 0.25;
    c.beginPath(); c.arc(prev[0], prev[1], 14 + 8*b.kick, 0, TAU); c.fill();
    c.globalAlpha = 1;
  }

  /* scanning plane */
  const sweep = ((t*0.45) % 1);
  const sx = box.x + box.w * sweep;
  c.globalAlpha = 0.16;
  c.strokeStyle = C.accent; c.lineWidth = 1;
  c.beginPath(); c.moveTo(sx, box.y); c.lineTo(sx, box.y + box.h); c.stroke();
  c.globalAlpha = 0.05;
  c.fillStyle = C.accent;
  c.fillRect(sx - 40, box.y, 40, box.h);
  c.globalAlpha = 1;

  /* tick ring around the head */
  if (prev){
    for (let i=0;i<48;i++){
      const a = i/48*TAU + t*0.3;
      const r0 = 54, r1 = 60 + (i%4===0 ? 8 : 0);
      line(prev[0] + Math.cos(a)*r0, prev[1] + Math.sin(a)*r0,
           prev[0] + Math.cos(a)*r1, prev[1] + Math.sin(a)*r1,
           C.bone, 1, 0.22);
    }
  }
}

function bTypedCommand(c, G, t){
  const str = 'world.execute(me);';
  const start = 9.4, cps = 1/0.105;
  const n = clamp(Math.floor((t - start) * cps), 0, str.length);
  const x = G.x(0), y = G.y(10) + 34;
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = '600 26px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = C.accent; c.globalAlpha = 0.9;
  c.fillText('>', x, y);
  c.fillStyle = C.bone; c.globalAlpha = 0.95;
  const shown = str.slice(0, n);
  c.fillText(shown, x + 26, y);
  c.font = '600 26px "JetBrains Mono",Consolas,monospace';
  const w2 = c.measureText(shown).width;
  if (Math.floor(t*3) % 2 === 0) c.fillRect(x + 30 + w2, y - 20, 12, 24);
  c.globalAlpha = 1;
}

function bHatch(c, x, y, w, h, gap, alpha){
  c.globalAlpha = alpha;
  c.strokeStyle = C.bone; c.lineWidth = 1;
  c.beginPath();
  for (let i = -h; i < w; i += gap){
    c.moveTo(x + i, y + h);
    c.lineTo(x + i + h, y);
  }
  c.stroke();
  c.globalAlpha = 1;
}

function world01d(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);

  /* --- watermark --- */
  c.save();
  c.font = '800 210px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = C.bone; c.globalAlpha = 0.022;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('EXECUTE', W*0.55, H*0.34);
  c.globalAlpha = 0.014;
  c.fillText('ME', W*0.82, H*0.62);
  c.restore();

  gridFurniture(c, G, t, 1);
  for (let i=0;i<G.cols;i+=4) G.cross(i, 0, 8, C.bone, 0.3);
  for (let r=0;r<G.rows;r+=3) G.cross(0, r, 8, C.bone, 0.3);

  /* --- attractor --- */
  const box = G.cell(6, 1, 16, 9);
  bLorenz(c, box, t, b);

  /* --- boot log --- */
  const lines = [
    ['init   kernel/world ......... ok', C.bone],
    ['mount  /dev/null ............ ok', C.bone],
    ['spawn  agent.dsh ............ ok', C.bone],
    ['load   persona.json ......... ok', C.bone],
    ['bind   you -> god ........... ok', C.bone],
    ['load   love ................. ??', C.red]
  ];
  for (let i=0;i<lines.length;i++){
    const a = stagger(t, i*0.45 + 0.3, 0.35, 0.6);
    if (a <= 0) continue;
    const x = G.x(0) - (1-a)*16;
    c.font = '10px "JetBrains Mono",Consolas,monospace';
    c.textAlign = 'left'; c.fillStyle = lines[i][1];
    c.globalAlpha = a * 0.85;
    c.fillText(lines[i][0], x, G.y(2 + i) + 12);
    c.globalAlpha = a * 0.35;
    c.fillText('0x' + (0xA0 + i*7).toString(16).toUpperCase(), G.x(4) + 20, G.y(2 + i) + 12);
    c.globalAlpha = 1;
  }

  bTelemetry(c, G, t, b);

  /* --- tags --- */
  G.tag('DSH/0xA1', 0, 0, 2, 11);
  G.text('BOOT SEQUENCE', 3, 0, 10, C.bone, 0.55, 2.4);
  G.text(fmtTime(0.222 + t), 21, 0, 10, C.bone, 0.4, 1.6);
  G.text('frame ' + pad3(s.frame % 1000), 21, 1, 9, C.bone, 0.3, 1.0);

  /* --- right rail --- */
  const rx = W - 40;
  c.textAlign = 'right';
  c.font = '9px "JetBrains Mono",Consolas,monospace';
  const rail = ['SYS', 'KERNEL 6.1', 'MEM 24.0', 'VRAM 24.0', 'PID 3882'];
  for (let i=0;i<rail.length;i++){
    c.fillStyle = C.bone; c.globalAlpha = 0.22;
    c.fillText(rail[i], rx, 760 + i*16);
  }
  c.globalAlpha = 1;
  c.textAlign = 'left';

  /* --- hatch + crop marks --- */
  bHatch(c, W-300, H-180, 260, 140, 9, 0.05);
  c.globalAlpha = 0.3; c.strokeStyle = C.accent; c.lineWidth = 2;
  const m = 14;
  [[26,26,1,1],[W-26,26,-1,1],[26,H-26,1,-1],[W-26,H-26,-1,-1]].forEach(function(p){
    c.beginPath();
    c.moveTo(p[0]+p[2]*m, p[1]+p[3]*6); c.lineTo(p[0], p[1]); c.lineTo(p[0]+p[2]*6, p[1]+p[3]*m);
    c.stroke();
  });
  c.globalAlpha = 1;

  /* --- typed command + status --- */
  bTypedCommand(c, G, t);
  const st = stagger(t, 2.2, 0.4, 0.8);
  if (st > 0){
    G.text('boot ' + Math.round(clamp(t/3, 0, 1)*100) + '%', 16, 10, 10, C.bone, 0.45*st, 1.2);
    G.text(b.index % 4 === 0 ? 'BEAT' : '', 22, 10, 10, C.accent, 0.8*st, 1.2);
    for (let i=0;i<4;i++){
      const on = (b.index % 4) === i;
      c.globalAlpha = on ? 0.9 : 0.16;
      c.fillStyle = on ? C.accent : C.bone;
      c.fillRect(G.x(22) + i*12, G.y(10) + 18, 7, 7);
    }
    c.globalAlpha = 1;
  }
}

SCENE_REGISTRY[1] = function(c, s){ world01d(c, s); };
