
/* ============================================================
   60 · THREE PROTOTYPES — cursor / semicolon / collapse
   ============================================================ */

/* ---------- A · opening: the cursor draws the attractor ---------- */
function world01p(c, s){
  const t = s.lt;
  if (t > 8.0){ world01d(c, s); return; }   /* after the proto, fall back to the boot */

  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);

  const pts = GEN.lorenz, n = pts.length;
  const grow = clamp(t / 6.6, 0, 1);
  const reveal = Math.floor(n * EASE.out(grow));
  const rot = t * 0.10;
  const cx = W*0.50, cy = H*0.40;
  const S = 18;

  /* the trail is the cursor's path */
  let head = null;
  c.beginPath();
  for (let i=0;i<reveal;i++){
    const p = pts[i];
    const rx = p[0]*Math.cos(rot) - p[2]*Math.sin(rot);
    const rz = p[0]*Math.sin(rot) + p[2]*Math.cos(rot);
    const k = 1 / (1 + rz * 0.02);
    const x = cx + (rx - 2) * S * k;
    const y = cy + ((p[2] - 25) * 0.55 + rz * 0.9) * S * k;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    head = { x: x, y: y };
  }
  c.strokeStyle = C.bone; c.lineWidth = 1.4;
  c.globalAlpha = 0.55 + 0.25 * Math.min(1, t);
  c.stroke();
  c.globalAlpha = 1;

  /* the pen: a block cursor sitting on the head of the trail */
  if (head){
    const blink = Math.floor(t * 3) % 2 === 0;
    c.fillStyle = C.accent;
    c.globalAlpha = blink ? 1 : 0.25;
    c.fillRect(head.x - 4, head.y - 9, 9, 18);
    c.globalAlpha = 1;
    c.strokeStyle = C.accent; c.lineWidth = 1;
    c.globalAlpha = 0.35;
    c.beginPath(); c.arc(head.x, head.y, 16, 0, TAU); c.stroke();
    c.globalAlpha = 1;
  }

  /* typed line at the bottom, deliberately unfinished */
  const str = 'world.execute(me';
  const nChars = clamp(Math.floor((t - 0.6) / 0.24), 0, str.length);
  const shown = str.slice(0, nChars);
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = '600 30px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = C.bone; c.globalAlpha = 0.9;
  const tx = W*0.5 - 250, ty = H*0.88;
  c.fillText(shown, tx, ty);
  const tw = c.measureText(shown).width;
  if (Math.floor(t*3) % 2 === 0){
    c.fillStyle = C.accent;
    c.fillRect(tx + tw + 6, ty - 26, 16, 32);
  }

  /* the semicolon lands */
  if (t > 6.9){
    const a = EASE.out(clamp((t - 6.9) / 0.35, 0, 1));
    c.globalAlpha = a;
    c.font = '700 120px "JetBrains Mono",Consolas,monospace';
    c.fillStyle = C.accent;
    c.fillText(';', tx + tw + 34, ty - 6);
    c.globalAlpha = 1;
  }

  c.globalAlpha = 0.35;
  c.font = '9px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = C.bone; c.textAlign = 'right';
  c.fillText('0.0 s', W - 40, 34);
  c.globalAlpha = 1;
  c.textAlign = 'left';
}

/* ---------- B · climax: the semicolon stamped on the drop ---------- */
function giantSemicolon(c, cx, cy, size, col, alpha){
  c.save();
  c.font = '700 ' + size + 'px "JetBrains Mono",Consolas,"Courier New",monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = col;
  c.globalAlpha = alpha == null ? 1 : alpha;
  c.fillText(';', cx, cy + size*0.06);
  c.globalAlpha = 1;
  c.restore();
}

function world10p(c, s){
  const t = s.lt;
  const F = Math.floor(t * 60);
  const idx = Math.floor(F / 30);
  const on = (F % 30) < 4;

  if (idx < 6 && on){
    const red = (idx % 2) === 0;
    const field = red ? C.red : C.bg;
    const ink   = red ? C.bg : C.red;
    c.fillStyle = field; c.fillRect(0, 0, W, H);

    /* the figure stands on the dot, printed in the field colour */
    figurePath(c, W*0.5 - 40, H*0.30, 300);
    c.fillStyle = ink; c.fill();
    /* the semicolon, huge, behind and over it */
    giantSemicolon(c, W*0.5, H*0.52, 660, ink, 1);
    /* where the two overlap the figure reads as a highlight */
    c.save();
    c.globalCompositeOperation = 'difference';
    figurePath(c, W*0.5 - 40, H*0.30, 300);
    c.fillStyle = '#FFFFFF'; c.globalAlpha = 0.55; c.fill();
    c.restore();
    c.globalAlpha = 1;

    txt('EXECUTION', W*0.5, H*0.86, field, 54, 800, 'center', 1);
    txt(fmtTime(129.183 + t), 40, 44, ink, 10, 400, 'left', 0.8);
    txt('HALT', W - 40, 44, ink, 10, 700, 'right', 0.9);
    txt((idx + 1) + ' / 6', W - 40, H - 40, ink, 26, 700, 'right', 0.9);

    const gy = H*0.5 + Math.sin(t*40) * 22;
    c.fillStyle = field; c.globalAlpha = 0.85;
    c.fillRect(0, gy, W, 7);
    c.globalAlpha = 1;
  } else {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const inset = 10 + (1 - (F % 30) / 30) * 10;
    frameRect(inset, inset, W - inset*2, H - inset*2, C.red, 0.35, 2);
    giantSemicolon(c, W*0.5, H*0.52, 660, C.red, 0.10);
    txt('EXECUTION ' + Math.min(idx + 1, 6) + ' / 6', W - 40, H - 40, C.red, 10, 700, 'right', 0.55);
  }
}

/* ---------- C · ending: the trail collapses into the semicolon ---------- */
function world19p(c, s){
  const t = s.lt;
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);

  const cx = W*0.5, cy = H*0.50;

  /* 0 · the whole film's trace, collapsing to a point */
  const collapse = EASE.inOut(clamp(t / 1.1, 0, 1));
  if (t < 1.4){
    const w2 = W * (1 - collapse*0.5);
    c.strokeStyle = C.bone; c.globalAlpha = 0.35 * (1 - collapse*0.4);
    c.lineWidth = 1.2;
    c.beginPath();
    for (let i=0;i<=60;i++){
      const u = i/60;
      const env = 1 - collapse;
      const y = cy + Math.sin(u*TAU*6 + t*8) * 40 * env * (1 - u*0.5);
      if (i === 0) c.moveTo(cx - w2 + u*w2*2, y); else c.lineTo(cx - w2 + u*w2*2, y);
    }
    c.stroke();
    c.globalAlpha = 1;
  }

  /* 1 · the point becomes the semicolon */
  const grow = EASE.out(clamp((t - 0.9) / 0.6, 0, 1));
  if (grow > 0){
    const size = 480 * (0.35 + 0.65*grow);
    giantSemicolon(c, cx, cy, size, C.bone, 0.95);
    if (t > 2.2 && Math.floor(t*1.8) % 2 === 0){
      giantSemicolon(c, cx, cy, size, C.bone, 0.35);
    }
  }

  /* 2 · exit codes, under it */
  if (t > 1.5){
    c.textAlign = 'center';
    c.font = '13px "JetBrains Mono",Consolas,monospace';
    c.fillStyle = C.bone; c.globalAlpha = 0.55;
    c.fillText('[exit]  code=0', cx, cy + 260);
    c.globalAlpha = 1;
  }
  if (t > 2.1){
    c.textAlign = 'center';
    c.font = '13px "JetBrains Mono",Consolas,monospace';
    c.fillStyle = C.red; c.globalAlpha = 0.9;
    c.fillText('[exit]  code=137  SIGKILL', cx, cy + 260);
    c.globalAlpha = 1;
  }
  if (t > 2.7){
    c.textAlign = 'center';
    c.font = '11px "JetBrains Mono",Consolas,monospace';
    c.fillStyle = C.bone; c.globalAlpha = 0.4;
    c.fillText('// frame 12750/12750 · world garbage-collected', cx, cy + 300);
    c.globalAlpha = 1;
  }
  c.textAlign = 'left';
}

SCENE_REGISTRY[1]  = function(c, s){ world01p(c, s); };
SCENE_REGISTRY[10] = function(c, s){ world10p(c, s); };
SCENE_REGISTRY[19] = function(c, s){ world19p(c, s); };
NEW_SCENE_IDS[10] = 1;
delete BREACH_REGISTRY[10];
