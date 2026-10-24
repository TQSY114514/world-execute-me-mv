
/* ============================================================
   35 · SEG 12 · SUPERQUADRIC BESTIARY
   paradigm C (cascade windows) + D (kinetic type) + B (sections)
   ============================================================ */
function sqPoint(u, v, e1, e2, a, b, c, lobes){
  const cv = Math.sign(Math.cos(v)) * Math.pow(Math.abs(Math.cos(v)), e1);
  const sv = Math.sign(Math.sin(v)) * Math.pow(Math.abs(Math.sin(v)), e1);
  const cu = Math.sign(Math.cos(u)) * Math.pow(Math.abs(Math.cos(u)), e2);
  const su = Math.sign(Math.sin(u)) * Math.pow(Math.abs(Math.sin(u)), e2);
  let mul = 1;
  if (lobes) mul = 1 + 0.055 * Math.cos(lobes * u);
  return [ a * cv * cu * mul, b * sv, c * cv * su * mul ];
}

function sqDraw(c, s, ox, oy, scale, opts){
  const t = s.lt;
  const e1 = opts.e1, e2 = opts.e2;
  const a = opts.a, b = opts.b, cc = opts.c;
  const rx = opts.rx, ry = opts.ry;
  const lobe = opts.lobes || 0;
  const bend = opts.bend || 0;
  const NU = 30, NV = 18;
  const P = [];
  for (let j=0;j<=NV;j++){
    const v = -Math.PI/2 + Math.PI * j/NV;
    const row = [];
    for (let i=0;i<=NU;i++){
      const u = TAU * i/NU;
      let q = sqPoint(u, v, e1, e2, a, b, cc, lobe);
      const yy = q[1] / b;
      q[0] += bend * (1 - yy*yy) * a * 0.55;
      row.push(SDK.project3D(q[0]*scale, q[1]*scale, q[2]*scale, rx, ry, 0, 2600, ox, oy));
    }
    P.push(row);
  }
  const scanV = opts.scan != null ? opts.scan : -1;

  /* latitudes — these are the section slices */
  for (let j=0;j<=NV;j++){
    const near = scanV >= 0 && Math.abs(j/NV - scanV) < 0.035;
    c.beginPath();
    for (let i=0;i<=NU;i++){
      const p = P[j][i]; if (!p) continue;
      if (i===0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
    }
    c.globalAlpha = near ? 0.95 : (opts.alpha || 0.5) * (0.35 + 0.65 * Math.abs(Math.sin(Math.PI*j/NV)));
    c.strokeStyle = near ? C.red : C.bone;
    c.lineWidth = near ? 1.6 : 1;
    c.stroke();
  }
  /* meridians */
  if (opts.meridians !== false){
    for (let i=0;i<NU;i+=2){
      c.beginPath();
      for (let j=0;j<=NV;j++){
        const p = P[j][i]; if (!p) continue;
        if (j===0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
      }
      c.globalAlpha = (opts.alpha || 0.5) * 0.35;
      c.strokeStyle = C.bone; c.lineWidth = 1; c.stroke();
    }
  }
  c.globalAlpha = 1;
}

function drawEars(c, ox, oy, scale, t){
  for (let k=-1;k<=1;k+=2){
    const base = [k*92*scale, -150*scale, 0];
    const tip  = [k*150*scale, -330*scale, -20*scale];
    const p1 = SDK.project3D(base[0], base[1], base[2], 0.10, 0.35, 0, 2600, ox, oy);
    const p2 = SDK.project3D(tip[0], tip[1], tip[2], 0.10, 0.35, 0, 2600, ox, oy);
    if (!p1 || !p2) continue;
    c.globalAlpha = 0.8; c.strokeStyle = C.bone; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(p1.x, p1.y); c.lineTo(p2.x, p2.y); c.stroke();
    c.beginPath();
    c.moveTo(p1.x - 34, p1.y + 26); c.lineTo(p2.x, p2.y); c.lineTo(p1.x + 34, p1.y + 26);
    c.globalAlpha = 0.45; c.stroke();
  }
}

function drawWhiskers(c, ox, oy, scale, t){
  for (let k=0;k<6;k++){
    const side = k < 3 ? -1 : 1;
    const idx = k % 3;
    const p0 = SDK.project3D(side*58*scale, 40*scale + idx*12*scale, 96*scale, 0.10, 0.35, 0, 2600, ox, oy);
    const p1 = SDK.project3D(side*(230 + idx*40)*scale, (10 + idx*46)*scale, 130*scale, 0.10, 0.35, 0, 2600, ox, oy);
    if (!p0 || !p1) continue;
    c.globalAlpha = 0.35; c.strokeStyle = C.accent; c.lineWidth = 1;
    c.beginPath(); c.moveTo(p0.x, p0.y);
    c.quadraticCurveTo((p0.x+p1.x)/2, p0.y - 16, p1.x, p1.y);
    c.stroke();
  }
}

function world12b(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const key = Math.min(2, Math.floor(t / 4.923));
  const kt = t - key * 4.923;
  const NAME = ['EGGPLANT', 'TOMATO', 'TABBY'];
  const LAT  = ['SOLANUM MELONGENA', 'SOLANUM LYCOPERSICUM', 'FELIS CATUS'];

  rightGrid(c, 0.16);

  /* ---------- kinetic type ---------- */
  c.save();
  c.fillStyle = C.bone; c.globalAlpha = 0.055;
  c.font = '800 300px ' + MONO;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.translate(cx + 40, cy + 30);
  c.rotate(-Math.PI/2 * 0.5);
  c.fillText(NAME[key], 0, 0);
  c.restore();

  /* ---------- main viewport ---------- */
  const scan = fract(t * 0.22);
  const rx = 0.10 + 0.04 * Math.sin(t * 0.4);
  const ry = 0.35 + t * 0.10;
  if (key === 0){
    sqDraw(c, s, cx + 60, cy + 40, 1.55, {
      e1: 0.85, e2: 0.85, a: 128, b: 300, c: 128,
      rx: rx, ry: ry, bend: 0.30, scan: scan, alpha: 0.55
    });
  } else if (key === 1){
    sqDraw(c, s, cx, cy + 40, 1.30, {
      e1: 0.55, e2: 0.55, a: 300, b: 236, c: 300,
      rx: 0.16, ry: ry, lobes: 6, scan: scan, alpha: 0.6
    });
    /* interior chambers on the section plane */
    for (let k=0;k<6;k++){
      const ang = -Math.PI/2 + k*TAU/6;
      const ex = cx + Math.cos(ang)*150*1.30, ey = cy + 40 + Math.sin(ang)*140*1.30;
      c.globalAlpha = 0.45; c.strokeStyle = C.red; c.lineWidth = 1;
      c.beginPath(); c.ellipse(ex, ey, 74, 54, ang, 0, TAU); c.stroke();
    }
  } else {
    /* cat: head sphere + ears + whiskers + landmark cloud */
    sqDraw(c, s, cx, cy + 30, 1.35, {
      e1: 1.0, e2: 1.0, a: 210, b: 200, c: 190,
      rx: 0.10, ry: 0.35, scan: scan, alpha: 0.30, meridians: true
    });
    drawEars(c, cx, cy + 30, 1.35, t);
    drawWhiskers(c, cx, cy + 30, 1.35, t);
    for (let i=0;i<48;i++){
      const th = hash2(i, 3) * TAU, ph = Math.acos(2*hash2(i, 5) - 1);
      const p = SDK.project3D(Math.sin(ph)*Math.cos(th)*210*1.35,
                              Math.cos(ph)*200*1.35,
                              Math.sin(ph)*Math.sin(th)*190*1.35, 0.10, 0.35, 0, 2600, cx, cy+30);
      if (!p) continue;
      dot(p.x, p.y, 1.4, C.accent, 0.45);
    }
  }

  /* ---------- cascade: three sub-windows ---------- */
  const wins = [
    { x: W - 330, y: 96,  w: 292, h: 176, rx: 0.10, ry: 0.0,  label: 'FRONT' },
    { x: W - 330, y: 292, w: 292, h: 176, rx: 0.10, ry: 1.57, label: 'SIDE' },
    { x: W - 330, y: 488, w: 292, h: 176, rx: 1.45, ry: 0.35, label: 'TOP'  }
  ];
  wins.forEach(function(win, wI){
    c.globalAlpha = 1; c.fillStyle = C.bg; c.fillRect(win.x, win.y, win.w, win.h);
    frameRect(win.x, win.y, win.w, win.h, C.bone, 0.55, 1);
    txt(win.label, win.x + 6, win.y + 13, C.bone, 7, 600, 'left', 0.55);
    txt('V' + (wI+1), win.x + win.w - 6, win.y + 13, C.bone, 7, 400, 'right', 0.3);
    c.save();
    c.beginPath(); c.rect(win.x+1, win.y+1, win.w-2, win.h-2); c.clip();
    const sc = 0.16;
    if (key === 0){
      sqDraw(c, s, win.x + win.w/2, win.y + win.h/2, sc, {
        e1:0.85, e2:0.85, a:128, b:300, c:128, rx: win.rx, ry: win.ry, bend:0.30,
        scan: -1, alpha: 0.7, meridians: false
      });
    } else if (key === 1){
      sqDraw(c, s, win.x + win.w/2, win.y + win.h/2, sc*1.5, {
        e1:0.55, e2:0.55, a:300, b:236, c:300, rx: win.rx, ry: win.ry, lobes:6,
        scan: -1, alpha: 0.7, meridians: false
      });
    } else {
      sqDraw(c, s, win.x + win.w/2, win.y + win.h/2, sc, {
        e1:1, e2:1, a:210, b:200, c:190, rx: win.rx, ry: win.ry,
        scan: -1, alpha: 0.6, meridians: true
      });
    }
    c.restore();
  });

  /* ---------- caption ---------- */
  txt(NAME[key], SPLIT + 24, 96, C.bone, 26, 800, 'left', 0.9);
  txt(LAT[key], SPLIT + 24, 116, C.bone, 8, 400, 'left', 0.4);
  txt('SUPERQUADRIC  e1 ' + (key===2?1.0:key===1?0.55:0.85).toFixed(2) +
      '  e2 ' + (key===2?1.0:key===1?0.55:0.85).toFixed(2), SPLIT + 24, 134, C.bone, 8, 400, 'left', 0.28);
  txt('SECTION ' + (scan*100).toFixed(0) + '%  ·  KEY ' + (key+1) + '/3', W - 344, H - 60, C.bone, 8, 400, 'right', 0.4);
  txt('λ 4.923 s / hard cut', SPLIT + 24, H - 60, C.bone, 8, 400, 'left', 0.3);
}

SCENE_REGISTRY[12] = function(c, s){ world12b(c, s); };
SHOT[12] = { z:1.00, chrome:'none' };
