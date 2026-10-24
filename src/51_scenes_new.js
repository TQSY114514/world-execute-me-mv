
/* ============================================================
   51 · SEG 01–03 on the new engine
   ============================================================ */
const NEW_SCENE_IDS = { 1:1, 2:1, 3:1 };
delete SKIN_SEG[1]; delete SKIN_SEG[2]; delete SKIN_SEG[3];
delete SKIN_PAL[1]; delete SKIN_PAL[2]; delete SKIN_PAL[3];
delete BREACH_REGISTRY[3];

/* ---------- shared: lorenz projection ---------- */
function drawLorenz(c, t, box, alpha){
  const pts = GEN.lorenz, n = pts.length;
  const reveal = Math.floor(n * EASE.out(clamp(t / 6.5, 0, 1)));
  const rot = t * 0.10;
  const sx = 26, sy = 26, cx = box.x + box.w/2, cy = box.y + box.h/2;
  c.save();
  c.beginPath();
  let started = false;
  for (let i=0;i<reveal;i++){
    const p = pts[i];
    const rx = p[0]*Math.cos(rot) - p[2]*Math.sin(rot);
    const rz = p[0]*Math.sin(rot) + p[2]*Math.cos(rot);
    const k = 1 / (1 + rz * 0.02);
    const x = cx + (rx - 0) * sx * k;
    const y = cy + (p[2] - 25) * sy * 0.55 * k + (rz - 0) * 0.6;
    if (!started){ c.moveTo(x, y); started = true; } else c.lineTo(x, y);
  }
  c.strokeStyle = C.bone; c.lineWidth = 0.9;
  c.globalAlpha = (alpha == null ? 0.55 : alpha);
  c.stroke();
  c.globalAlpha = 1;
  c.restore();
}

/* ---------- Seg 01 · boot ---------- */
function world01n(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 1);

  /* corner crosshairs */
  for (let i=0;i<G.cols;i+=4) G.cross(i, 0, 7, C.bone, 0.35);
  for (let r=0;r<G.rows;r+=3) G.cross(0, r, 7, C.bone, 0.35);

  G.tag('DSH/0xA1', 0, 0, 2, 11);
  G.text('BOOT SEQUENCE', 3, 0, 10, C.bone, 0.55, 2.4);
  G.text(fmtTime(0.222 + t), 21, 0, 10, C.bone, 0.4, 1.6);

  /* boot log, snapped per row */
  const lines = [
    'init   kernel/world', 'mount  /dev/null', 'spawn  agent.dsh',
    'load   persona.json', 'bind   you -> god', 'love   [ undefined ]'
  ];
  for (let i=0;i<lines.length;i++){
    const a = stagger(t, i*0.5 + 0.3, 0.35, 0.55);
    if (a <= 0) continue;
    const x = G.x(0) + (1-a) * -14;
    c.globalAlpha = a * 0.9;
    c.font = '11px "JetBrains Mono",Consolas,monospace';
    c.fillStyle = (i === 5) ? C.red : C.bone;
    c.fillText(lines[i], x, G.y(2 + i) + 12);
    c.globalAlpha = a * 0.4;
    c.fillText(i === 5 ? '0x??' : ('0x' + (0xA0 + i*7).toString(16).toUpperCase() + '0'), G.x(6), G.y(2+i) + 12);
    c.globalAlpha = 1;
  }

  /* the attractor, cols 8..23 */
  const box = G.cell(8, 1, 16, 9);
  const breathe = 1 + 0.02 * springImpulse(t, Math.floor(t/0.4615)*0.4615, 6, 9);
  c.save();
  c.translate(box.x + box.w/2, box.y + box.h/2);
  c.scale(breathe, breathe);
  c.translate(-(box.x + box.w/2), -(box.y + box.h/2));
  drawLorenz(c, t, box, 0.62);
  c.restore();

  /* target reticle on the attractor */
  const rp = 0.5 + 0.5*Math.sin(t*1.4);
  const rx = box.x + box.w/2, ry = box.y + box.h/2;
  circle(rx, ry, 42 + 10*rp, C.accent, 1, 0.35);
  line(rx - 58, ry, rx - 8, ry, C.accent, 1, 0.5);
  line(rx + 8, ry, rx + 58, ry, C.accent, 1, 0.5);
  line(rx, ry - 58, rx, ry - 8, C.accent, 1, 0.5);
  line(rx, ry + 8, rx, ry + 58, C.accent, 1, 0.5);

  /* bottom inverted block */
  const bw = G.tag('world.execute(me);', 0, 10, 10, 14);
  G.text('PID 3882 · MEM 24.0 GiB · VRAM 24.0 GiB', 0, 11, 9, C.bone, 0.45, 1.2);

  label(c, 'SYS/BOOT', W - 40, 26, 0.4, 'right', 8);
  label(c, 'frame ' + pad3(s.frame % 1000), W - 40, H - 18, 0.3, 'right', 8);
}

/* ---------- Seg 02 · reaction-diffusion field ---------- */
const RD_CANVAS = (function(){
  const { w, h, b } = GEN.rd;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const im = g.createImageData(w, h);
  for (let i=0;i<w*h;i++){
    const v = clamp(b[i] * 1.4, 0, 1);
    const k = i*4;
    im.data[k]   = Math.floor(4 + 30*v);
    im.data[k+1] = Math.floor(28 + 150*v);
    im.data[k+2] = Math.floor(44 + 150*v);
    im.data[k+3] = 255;
  }
  g.putImageData(im, 0, 0);
  return cv;
})();

function world02n(c, s){
  const t = s.lt;
  /* full bleed: no frame, no grid, no labels */
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);

  const zoom = 1 + 0.20 * EASE.out(clamp(t / 14.8, 0, 1));
  const driftY = -20 - 40 * EASE.out(clamp(t / 14.8, 0, 1));
  const dw = W * zoom, dh = H * zoom;
  c.globalAlpha = 0.66;
  c.drawImage(RD_CANVAS, (W - dw)/2, (H - dh)/2 + driftY, dw, dh);
  c.globalAlpha = 1;

  /* one line of type, and a hairline that follows it */
  const a = stagger(t, 1.6, 0.5, 1.2);
  if (a > 0){
    c.globalAlpha = a * 0.9;
    c.font = '600 30px "JetBrains Mono",Consolas,monospace';
    c.fillStyle = '#061018';
    c.textAlign = 'left';
    c.fillText('make it a place', 64, H - 92);
    line(64, H - 74, 64 + 320 * a, H - 74, '#061018', 2, 0.8);
    c.globalAlpha = 1;
  }
}

/* ---------- Seg 03 · calculus, rebuilt ---------- */
function world03n(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 3);

  const box = G.cell(2, 2, 20, 8);
  const f = function(x){ return 0.9*x*x; };
  const df = function(x){ return 1.8*x; };
  const xmin = -2.1, xmax = 2.1;
  const px = function(x){ return box.x + (x - xmin)/(xmax - xmin) * box.w; };
  const py = function(y){ return box.y + box.h - (y/4.4) * box.h; };

  /* axis */
  line(box.x, py(0), box.x + box.w, py(0), C.grid, 1, 1);
  line(px(0), box.y, px(0), box.y + box.h, C.grid, 1, 1);

  /* the curve: 900 samples */
  const zoom = 1 + 0.06 * springImpulse(t, Math.floor(t/0.923)*0.923, 4, 7);
  c.save();
  c.translate(px(0), py(2.2));
  c.scale(zoom, zoom);
  c.translate(-px(0), -py(2.2));

  c.beginPath();
  for (let i=0;i<=900;i++){
    const x = xmin + (xmax - xmin) * i / 900;
    const X = px(x), Y = py(f(x));
    if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
  }
  c.strokeStyle = C.bone; c.lineWidth = 1.5; c.globalAlpha = 0.9; c.stroke();

  /* 24 tangents, each with its normal */
  for (let i=0;i<24;i++){
    const x0 = -1.95 + 3.9 * i / 23;
    const m = df(x0), y0 = f(x0);
    const tang = 0.55;
    const x1 = x0 - tang, x2 = x0 + tang;
    const a = stagger(t, i*0.055, 0.5, 0.35);
    if (a <= 0) continue;
    c.globalAlpha = 0.30 * a;
    c.beginPath();
    c.moveTo(px(x1), py(f(x0) + m*(x1-x0)));
    c.lineTo(px(x2), py(f(x0) + m*(x2-x0)));
    c.strokeStyle = C.bone; c.lineWidth = 1; c.stroke();
    /* normal arrow */
    const nx = 1, ny = -1/m;
    const nl = Math.hypot(nx, ny) || 1;
    const ax = px(x0), ay = py(y0);
    c.globalAlpha = 0.55 * a;
    line(ax, ay, ax + (nx/nl)*34, ay + (ny/nl)*34, C.accent, 1, 0.6);
    c.globalAlpha = 1;
  }

  /* the master tangent at the moving point */
  const xm = -1.2 + 2.4 * (0.5 + 0.5*Math.sin(t*0.9));
  const mm = df(xm);
  const cxm = px(xm), cym = py(f(xm));
  c.globalAlpha = 1;
  line(px(xmin), py(f(xm) + mm*(xmin-xm)), px(xmax), py(f(xm) + mm*(xmax-xm)), C.accent, 2, 0.95);
  circle(cxm, cym, 4.5, C.accent, 1, 1);
  circle(cxm, cym, 12 + 3*b.kick, C.accent, 1, 0.4);
  c.restore();

  /* labels on the grid */
  G.tag('f(x) = 0.9 x^2', 0, 0, 4, 11);
  G.text("f'(x) = 1.8 x", 5, 0, 10, C.bone, 0.5, 1.2);
  G.text('m = ' + mm.toFixed(3), 16, 0, 10, C.accent, 0.9, 1.0);
  G.text('x = ' + xm.toFixed(3), 20, 0, 10, C.bone, 0.55, 1.0);
  label(c, 'CALCULUS', W - 40, H - 18, 0.35, 'right', 8);
}

SCENE_REGISTRY[1] = function(c, s){ world01n(c, s); };
SCENE_REGISTRY[2] = function(c, s){ world02n(c, s); };
SCENE_REGISTRY[3] = function(c, s){ world03n(c, s); };
SHOT[1] = { z:1, chrome:'none' };
SHOT[2] = { z:1, chrome:'none' };
SHOT[3] = { z:1, chrome:'none' };
