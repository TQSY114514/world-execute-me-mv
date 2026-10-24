
/* ============================================================
   56 · SEG 05 — deep current / scope / phasor / bridge
   ============================================================ */
function scopeTrace(c, box, t, phase, amp, rect){
  const N = 1400;
  c.beginPath();
  for (let i=0;i<=N;i++){
    const u = i/N;
    let v = Math.sin((u*6 - t*1.15 + phase) * TAU);
    if (rect) v = Math.abs(v);
    const y = box.y + box.h*0.5 + v * box.h*0.34 * amp;
    if (i === 0) c.moveTo(box.x + u*box.w, y); else c.lineTo(box.x + u*box.w, y);
  }
}

function drawPhasor(c, cx, cy, r, t, angle){
  c.globalAlpha = 0.35;
  c.strokeStyle = C.bone; c.lineWidth = 1;
  c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
  c.globalAlpha = 0.16;
  line(cx - r - 12, cy, cx + r + 12, cy, C.bone, 1, 0.5);
  line(cx, cy - r - 12, cx, cy + r + 12, C.bone, 1, 0.5);
  c.globalAlpha = 1;

  const ex = cx + Math.cos(angle)*r, ey = cy - Math.sin(angle)*r;
  line(cx, cy, ex, ey, C.accent, 2, 0.95);
  c.fillStyle = C.accent;
  c.beginPath(); c.arc(ex, ey, 3.2, 0, TAU); c.fill();
  c.globalAlpha = 0.5;
  c.strokeStyle = C.accent; c.lineWidth = 1;
  c.beginPath(); c.arc(cx, cy, r*0.35, -angle, 0); c.stroke();
  c.globalAlpha = 1;
  c.font = '9px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = C.accent; c.globalAlpha = 0.8;
  c.fillText((angle/TAU*360).toFixed(0) + '\u00b0', cx + r*0.42, cy - 8);
  c.globalAlpha = 1;
}

function drawBridge(c, x, y, w, h){
  /* a full-wave rectifier, drawn as a schematic */
  c.globalAlpha = 0.55;
  c.strokeStyle = C.bone; c.lineWidth = 1.2;
  c.strokeRect(x, y, w, h);
  /* diamond */
  const cx = x + w*0.5, cy = y + h*0.5, r = Math.min(w, h)*0.30;
  c.beginPath();
  c.moveTo(cx, cy - r); c.lineTo(cx + r, cy); c.lineTo(cx, cy + r); c.lineTo(cx - r, cy);
  c.closePath(); c.stroke();
  /* diode marks */
  [[cx, cy - r, 0], [cx + r, cy, 1], [cx, cy + r, 0], [cx - r, cy, 1]].forEach(function(p){
    c.beginPath();
    c.moveTo(p[0] - 5, p[1] - 5); c.lineTo(p[0] + 5, p[1] - 5);
    c.moveTo(p[0] - 5, p[1] + 5); c.lineTo(p[0] + 5, p[1] + 5);
    c.stroke();
    c.beginPath();
    c.moveTo(p[0] - 4, p[1] + 5); c.lineTo(p[0], p[1] - 5); c.lineTo(p[0] + 4, p[1] + 5);
    c.stroke();
  });
  c.globalAlpha = 1;
}

function world05d(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 5);

  /* --- scope --- */
  const box = G.cell(1, 1, 15, 7);
  c.save();
  c.beginPath(); c.rect(box.x, box.y, box.w, box.h); c.clip();

  /* persistence: 6 ghost traces */
  for (let k=5;k>=0;k--){
    c.globalAlpha = 0.05 + (5-k)*0.02;
    c.strokeStyle = C.bone; c.lineWidth = 1;
    scopeTrace(c, box, t - k*0.06, 0, 1, false);
    c.stroke();
  }
  c.globalAlpha = 1;

  /* the live trace: AC then rectified */
  const rectAmt = smoothstep(4.6, 5.6, t);
  c.strokeStyle = C.accent; c.lineWidth = 1.8; c.globalAlpha = 0.95;
  scopeTrace(c, box, t, 0, 1 - rectAmt*0.25, rectAmt > 0.5);
  c.stroke();
  c.globalAlpha = 1;

  /* graticule */
  c.globalAlpha = 0.10;
  for (let i=1;i<10;i++) line(box.x + box.w*i/10, box.y, box.x + box.w*i/10, box.y + box.h, C.bone, 1, 0.6);
  for (let j=1;j<6;j++) line(box.x, box.y + box.h*j/6, box.x + box.w, box.y + box.h*j/6, C.bone, 1, 0.6);
  c.globalAlpha = 1;
  c.restore();

  /* --- spectrum --- */
  const sp = G.cell(1, 8, 15, 2);
  const bars = 56;
  for (let i=0;i<bars;i++){
    const u = i/bars;
    const amp = Math.exp(-u*3.2) * (0.55 + 0.45*Math.sin(t*3 + i*0.6));
    const hh = sp.h * amp * (0.4 + 0.6*b.kick);
    c.globalAlpha = 0.55;
    c.fillStyle = i > bars*0.72 ? C.accent : C.bone;
    c.fillRect(sp.x + i*(sp.w/bars), sp.y + sp.h - hh, (sp.w/bars)*0.62, hh);
  }
  c.globalAlpha = 1;
  line(sp.x, sp.y + sp.h, sp.x + sp.w, sp.y + sp.h, C.bone, 1, 0.2);

  /* --- phasor + bridge --- */
  const ph = G.cell(17, 1, 6, 5);
  drawPhasor(c, ph.x + ph.w*0.5, ph.y + ph.h*0.48, Math.min(ph.w, ph.h)*0.30, t, t*2.4);

  const br = G.cell(17, 6, 6, 3);
  drawBridge(c, br.x, br.y, Math.min(br.w, 320), 150);

  /* --- readouts --- */
  const rx = G.x(17), ry = G.y(9) + 18;
  const rows = [
    ['Vrms', (230 * (0.98 + 0.02*Math.sin(t))).toFixed(1) + ' V'],
    ['f', '50.00 Hz'],
    ['phase', ((t*2.4)/TAU*360 % 360).toFixed(1) + '\u00b0'],
    ['ripple', (rectAmt > 0.5 ? (2.4 + 0.6*Math.sin(t*5)).toFixed(2) : '--') + ' %']
  ];
  for (let i=0;i<rows.length;i++){
    c.font = '9px "JetBrains Mono",Consolas,monospace';
    c.textAlign = 'left'; c.fillStyle = C.bone; c.globalAlpha = 0.4;
    c.fillText(rows[i][0], rx, ry + i*22);
    c.textAlign = 'right'; c.fillStyle = C.accent; c.globalAlpha = 0.9;
    c.fillText(rows[i][1], rx + 300, ry + i*22);
    c.globalAlpha = 1; c.textAlign = 'left';
  }

  G.tag(rectAmt > 0.5 ? 'DC' : 'AC', 0, 0, 3, 12);
  G.text(rectAmt > 0.5 ? 'rectified \u00b7 full wave' : 'alternating \u00b7 50 Hz', 4, 0, 10, C.bone, 0.5, 1.2);
  G.text('beam 1400 samples', 0, 11, 9, C.bone, 0.35, 1.0);
  label(c, 'CURRENT', W - 40, H - 18, 0.35, 'right', 8);
}

SCENE_REGISTRY[5] = function(c, s){ world05d(c, s); };
