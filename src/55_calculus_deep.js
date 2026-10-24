
/* ============================================================
   55 · SEG 03 — deep calculus
   ============================================================ */
const CALC = {
  f: function(x){ return 0.55*x*x - 0.35; },
  d1: function(x){ return 1.10*x; },
  d2: function(x){ return 1.10; }
};

function calcAxes(c, box, map, t){
  /* major / minor graph paper */
  c.globalAlpha = 0.10; c.strokeStyle = C.grid; c.lineWidth = 1;
  for (let x = -2; x <= 2; x += 0.5){
    const X = map.px(x);
    c.beginPath(); c.moveTo(X, box.y); c.lineTo(X, box.y + box.h); c.stroke();
  }
  for (let y = -1; y <= 2.2; y += 0.5){
    const Y = map.py(y);
    c.beginPath(); c.moveTo(box.x, Y); c.lineTo(box.x + box.w, Y); c.stroke();
  }
  c.globalAlpha = 0.22;
  line(box.x, map.py(0), box.x + box.w, map.py(0), C.bone, 1, 0.5);
  line(map.px(0), box.y, map.px(0), box.y + box.h, C.bone, 1, 0.5);
  c.globalAlpha = 1;

  /* axis numbers */
  c.font = '9px "JetBrains Mono",Consolas,monospace';
  c.textAlign = 'center'; c.fillStyle = C.bone; c.globalAlpha = 0.35;
  for (let x = -2; x <= 2; x += 0.5){
    if (Math.abs(x) < 1e-6) continue;
    c.fillText(x.toFixed(1), map.px(x), map.py(0) + 14);
  }
  c.textAlign = 'right';
  for (let y = -1; y <= 2; y += 0.5){
    if (Math.abs(y) < 1e-6) continue;
    c.fillText(y.toFixed(1), map.px(0) - 8, map.py(y) + 3);
  }
  c.globalAlpha = 1; c.textAlign = 'left';
}

function world03d(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 3);

  const box = G.cell(2, 1, 16, 9);
  const map = {
    px: function(x){ return box.x + (x + 2.25)/(4.5) * box.w; },
    py: function(y){ return box.y + box.h - (y + 1.15)/(3.6) * box.h; }
  };
  calcAxes(c, box, map, t);

  /* --- the moving point: steps once per bar, springs into place --- */
  const bar = Math.floor(t / 1.846);
  const xa = -1.75 + 3.5 * (0.5 + 0.5*Math.sin(bar * 1.1));
  const xb = -1.75 + 3.5 * (0.5 + 0.5*Math.sin((bar+1) * 1.1));
  const k = clamp((t % 1.846) / 0.26, 0, 1);
  const x0 = xa + (xb - xa) * EASE.out(k);
  const y0 = CALC.f(x0), m0 = CALC.d1(x0);
  const X0 = map.px(x0), Y0 = map.py(y0);

  /* --- the curve --- */
  c.beginPath();
  for (let i=0;i<=900;i++){
    const x = -2.2 + 4.4*i/900;
    const X = map.px(x), Y = map.py(CALC.f(x));
    if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
  }
  c.strokeStyle = C.bone; c.lineWidth = 1.6; c.globalAlpha = 0.85; c.stroke();
  c.globalAlpha = 1;

  /* --- secants: h halves each bar --- */
  const secN = Math.min(7, bar % 8);
  for (let i=0;i<=secN;i++){
    const h = 0.85 * Math.pow(0.5, i);
    const x1 = x0 + h;
    const y1 = CALC.f(x1);
    const a = stagger(t % 1.846, i*0.055, 0.4, 0.3) * (1 - i/(secN+2));
    if (a <= 0) continue;
    c.globalAlpha = 0.08 + a*0.42;
    c.strokeStyle = i === secN ? C.accent : C.bone;
    c.lineWidth = i === secN ? 1.6 : 1;
    c.beginPath();
    c.moveTo(map.px(x0 - 0.40), map.py(y0 - 0.40*(y1-y0)/Math.max(h,1e-6)));
    c.lineTo(map.px(x0 + 0.55), map.py(y0 + 0.55*(y1-y0)/Math.max(h,1e-6)));
    c.stroke();
  }
  c.globalAlpha = 1;

  /* --- tangent + normal + osculating circle --- */
  const R = Math.pow(1 + m0*m0, 1.5) / Math.abs(CALC.d2(x0));
  const nx = -m0, ny = 1;
  const nl = Math.hypot(nx, ny) || 1;
  const ccx = X0 + (nx/nl) * R * (box.h/3.6);
  const ccy = Y0 + (ny/nl) * R * (box.h/3.6);
  /* curvature: a short arc, not a frame-eating circle */
  const sang = Math.atan2(Y0 - ccy, X0 - ccx);
  c.globalAlpha = 0.30;
  c.strokeStyle = C.accent; c.lineWidth = 1.4;
  c.beginPath();
  c.arc(ccx, ccy, Math.min(R * (box.h/3.6), 900), sang - 0.55, sang + 0.55);
  c.stroke();
  c.globalAlpha = 1;

  const tx = 300, ty = 300 * m0;
  line(X0 - tx, Y0 + ty, X0 + tx, Y0 - ty, C.accent, 2, 0.95);

  /* delta triangle */
  const hh = 0.55;
  const X1 = map.px(x0 + hh), Y1 = map.py(CALC.f(x0 + hh));
  c.globalAlpha = 0.5;
  line(X0, Y0, X1, Y0, C.red, 1, 0.8);
  line(X1, Y0, X1, Y1, C.red, 1, 0.8);
  c.globalAlpha = 1;
  c.font = '9px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = C.red; c.globalAlpha = 0.9;
  c.fillText('dx', (X0 + X1)/2 - 6, Y0 - 6);
  c.fillText('dy', X1 + 6, (Y0 + Y1)/2);
  c.globalAlpha = 1;

  /* the point */
  circle(X0, Y0, 4.5, C.accent, 1, 1);
  circle(X0, Y0, 14 + 4*b.kick, C.accent, 1, 0.35);

  /* --- readouts --- */
  const rx = G.x(19);
  const rows = [
    ['x', x0.toFixed(4)],
    ['f(x)', y0.toFixed(4)],
    ["f'(x)", m0.toFixed(4)],
    ["f''(x)", CALC.d2(x0).toFixed(4)],
    ['R', R.toFixed(3)],
    ['dx', '0.5500'],
    ['dy', (CALC.f(x0+hh) - y0).toFixed(4)],
    ['slope', ((CALC.f(x0+hh) - y0)/hh).toFixed(4)]
  ];
  for (let i=0;i<rows.length;i++){
    const a = stagger(t, i*0.16, 0.4, 0.5);
    c.font = '9px "JetBrains Mono",Consolas,monospace';
    c.textAlign = 'left'; c.fillStyle = C.bone; c.globalAlpha = 0.45*a;
    c.fillText(rows[i][0], rx, G.y(3) + i*30);
    c.textAlign = 'right'; c.fillStyle = i < 5 ? C.accent : C.bone;
    c.globalAlpha = 0.9*a;
    c.fillText(rows[i][1], rx + 250, G.y(3) + i*30);
    c.globalAlpha = 1;
    c.textAlign = 'left';
  }

  /* secant counter tag */
  G.tag('SECANTS ' + secN + ' / 7', 19, 1, 6, 10);
  G.text('h = ' + (0.85*Math.pow(0.5, secN)).toFixed(5), 19, 2, 9, C.accent, 0.9, 1.0);

  G.tag('f(x) = 0.55x^2 - 0.35', 0, 0, 6, 11);
  G.text('SLOPE FIELD', 7, 0, 10, C.bone, 0.45, 2.0);
  label(c, 'CALCULUS', W - 40, H - 18, 0.35, 'right', 8);
}

SCENE_REGISTRY[3] = function(c, s){ world03d(c, s); };
