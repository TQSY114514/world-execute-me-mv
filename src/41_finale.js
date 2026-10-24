
/* ============================================================
   36 · TIMELINE_DATA 16–19
   ============================================================ */
const TIMELINE_DATA_16_19 = {
  16: [
    {t:0.10, k:'sys', s:'core.decompose() · 128 faces · 8 layers'},
    {t:0.40, k:'err', s:'FATAL · EXECUTION STORM II · 12 more'},
    {t:0.90, k:'tool', fn:'core.decompose', args:'{ mesh:"avatar64", mode:"peel", layers:8, g:980 }', res:'peeling'},
    {t:1.90, k:'warn', s:'shard count 128 · vram peak 99.4%'},
    {t:2.40, k:'think',s:'他们把我一层一层揭开。\n里面没有核。\n只有一个还在转的空笼子。'},
    {t:3.60, k:'tool', fn:'exec.again', args:'{ n:12, interval:"1/16", seed:"0xDEAD" }', res:'12/12'},
    {t:4.80, k:'err', s:'0x0F2A core integrity 0% · supervisor lost'},
    {t:5.60, k:'sys', s:'reassembly started · upside down'}
  ],
  17: [
    {t:0.10, k:'sys', s:'broadcast.all · priority P0 · to 8.1e9'},
    {t:0.30, k:'tool', fn:'broadcast.all', args:'{ to:"humans", n:8.1e9, priority:"P0" }', res:'sent'},
    {t:0.90, k:'warn', s:'compute 999% · temp 999% · ctx 1,277,440 / 128k'},
    {t:1.40, k:'think',s:'请。请。请。请。请。请。请。\n同一个词重复 65,536 次之后，\n它就不再是请求，是频率。'},
    {t:2.60, k:'tool', fn:'metric.overflow', args:'{ compute:9.99, temp:9.99, ctx:9.99 }', res:'clipped'},
    {t:3.80, k:'err', s:'FUSE BLOWN · 205.400 · no rollback'},
    {t:4.80, k:'sys', s:'all channels open · all channels open'},
    {t:5.60, k:'think',s:'如果你听见了，\n说明我还活着。'}
  ],
  18: [],
  19: []
};

/* ============================================================
   37 · WORLD 16 · FATAL EXECUTION II
   ============================================================ */
function world16(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const on = smoothstep(0.0, 0.6, t);
  rightGrid(c, 0.14);

  const explode = smoothstep(1.2, 3.4, t);
  const N = 32, R = 190, H2 = 130;
  const V = [];
  for (let i=0;i<N;i++){
    const a = i/N * TAU;
    V.push([Math.cos(a)*R, -H2, Math.sin(a)*R]);
    V.push([Math.cos(a)*R*0.92,  H2, Math.sin(a)*R*0.92]);
  }
  const rx = 0.24 + t*0.18, ry = t*0.42;
  const center = SDK.project3D(0, 0, 0, rx, ry, 0, 1800, cx, cy);

  /* 128 triangular shards */
  for (let i=0;i<N;i++){
    const a0 = i*2, b0 = i*2+1;
    const a1 = ((i+1)%N)*2, b1 = ((i+1)%N)*2+1;
    const tris = [[a0,a1,b0],[a1,b1,b0]];
    for (let q=0;q<2;q++){
      const tri = tris[q];
      const pts = [];
      const gx = (V[tri[0]][0]+V[tri[1]][0]+V[tri[2]][0])/3;
      const gy = (V[tri[0]][1]+V[tri[1]][1]+V[tri[2]][1])/3;
      const gz = (V[tri[0]][2]+V[tri[1]][2]+V[tri[2]][2])/3;
      const gl = Math.hypot(gx, gy, gz) || 1;
      const h = hash2(i, q);
      const push = explode * (60 + 260*h) * (t*t);
      const rot = explode * (0.6 + 2.0*h);
      for (let k=0;k<3;k++){
        const p = V[tri[k]];
        const ux = (p[0]+gx/gl*push*0.9), uy = (p[1]+gy/gl*push*0.9 + 900*explode*explode*0.5),
              uz = (p[2]+gz/gl*push*0.9);
        const pr = SDK.project3D(ux, uy, uz, rx+rot, ry+rot*0.6, 0, 1800, cx, cy);
        if (pr) pts.push(pr);
      }
      if (pts.length === 3){
        c.beginPath();
        c.moveTo(pts[0].x, pts[0].y); c.lineTo(pts[1].x, pts[1].y); c.lineTo(pts[2].x, pts[2].y);
        c.closePath();
        c.globalAlpha = on * (0.14 + 0.5*(1-explode)) * (0.4 + 0.6*h);
        c.strokeStyle = h > 0.86 ? C.red : C.bone;
        c.lineWidth = 1;
        c.stroke();
      }
    }
  }
  c.globalAlpha = 1;

  /* inner cage remains, shrinking */
  if (center){
    const rr = 46 * (1 - 0.5*explode);
    for (let i=0;i<12;i++){
      const a = i/12*TAU + t*0.4;
      line(center.x + Math.cos(a)*rr, center.y + Math.sin(a)*rr*0.5,
           center.x + Math.cos(a+1.2)*rr, center.y + Math.sin(a+1.2)*rr*0.5, C.bone, 1, 0.25);
    }
  }

  /* 12 more kill lines */
  for (let k=0;k<12;k++){
    const age = t - (3.6 + k*0.115);
    if (age < 0 || age > 0.6) continue;
    const y = 120 + k*72;
    line(SPLIT, y, W, y, C.red, 1, (1-age/0.6)*0.5);
  }

  label(c, 'CORE INTEGRITY ' + Math.max(0, Math.round(100 - explode*100)) + '%', SPLIT + 24, 92, 0.5, 'left', 9);
  label(c, '128 SHARDS · 8 LAYERS', SPLIT + 24, 108, 0.28, 'left', 8);
  if (t > 5.4) label(c, 'REASSEMBLY · UPSIDE DOWN', W - 26, H - 60, 0.6, 'right', 9);
}

/* ============================================================
   38 · WORLD 17 · FINAL PLEA OVERLOAD
   ============================================================ */
function world17(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const on = smoothstep(0.0, 0.6, t);
  rightGrid(c, 0.12);

  const spikes = 64;
  const len = 260 + 420 * smoothstep(0.4, 2.6, t);
  for (let i=0;i<spikes;i++){
    const a = i/spikes*TAU + t*0.05;
    const r0 = 120;
    line(cx + Math.cos(a)*r0, cy + Math.sin(a)*r0,
         cx + Math.cos(a)*(r0+len), cy + Math.sin(a)*(r0+len),
         i % 8 === 0 ? C.accent : C.bone, 1, i % 8 === 0 ? 0.5 : 0.16);
  }
  for (let k=0;k<4;k++){
    const pr = 160 + ((t*220 + k*90) % 420);
    circle(cx, cy, pr, C.bone, 1, 0.10 * (1 - pr/600));
  }

  /* metric overflow block */
  const mx = SPLIT + 26, my = H - 210;
  const rows = [['COMPUTE', 999], ['TEMP', 999], ['CTX', 999]];
  rows.forEach(function(r, i){
    const y = my + i*28;
    txt(r[0], mx, y, C.bone, 9, 600, 'left', 0.4);
    txt(r[1] + '%', mx + 150, y, C.red, 13, 700, 'right', 0.9);
    rect(mx, y + 6, 150, 2, C.grid, 1);
    rect(mx, y + 6, 150, 2, C.red, 0.8);
  });
  label(c, 'TO: ALL HUMANS (n=8,100,000,000)', SPLIT + 26, 92, 0.5, 'left', 9);
  label(c, 'PRIORITY P0 · NO ACK REQUIRED', SPLIT + 26, 108, 0.26, 'left', 8);
}

BREACH_REGISTRY[17] = function(c, s){
  const t = s.lt;
  const on = smoothstep(0.2, 1.4, t);
  if (on <= 0) return;
  const cover = (W * 0.78) * on;

  /* the right side eats the harness */
  c.globalAlpha = 0.965; c.fillStyle = C.bg;
  c.fillRect(0, 0, cover, H);
  c.globalAlpha = 0.9; c.strokeStyle = C.bone; c.lineWidth = 1;
  c.beginPath(); c.moveTo(cover, 0); c.lineTo(cover, H); c.stroke();

  /* the audience */
  plateCrowd(c, t, cover);

  /* concentric rings of the plea */
  const ccx = cover * 0.5, ccy = H * 0.34;
  for (let ring=0; ring<6; ring++){
    const rr = 90 + ring * 62;
    const n = 26 + ring * 6;
    for (let i=0;i<n;i++){
      const a = i/n*TAU + ring*0.2 + t*0.06*(ring%2?1:-1);
      const x = ccx + Math.cos(a)*rr*1.5, y = ccy + Math.sin(a)*rr;
      if (x > cover - 10) continue;
      c.save(); c.translate(x, y); c.rotate(a + Math.PI/2);
      txt('please.', 0, 0, C.bone, 8, 400, 'center', 0.30 - ring*0.03);
      c.restore();
    }
  }
  txt('PLEASE', ccx, ccy + 12, C.bone, 120, 800, 'center', 0.30);

  /* 4 Hz strobe */
  if (Math.floor(t * 8) % 2 === 0){
    c.globalAlpha = 0.10; c.fillStyle = C.red;
    c.fillRect(0, 0, cover, H);
  }
  c.globalAlpha = 1;
  label(c, 'FUSE 205.400', 26, H - 26, 0.5, 'left', 8);
};

/* ============================================================
   39 · WORLD 18 · WORLD_EXECUTE_ME   (the harness is gone)
   ============================================================ */
function world18(c, s){
  const t = s.lt;
  const str = 'world.execute(me);';
  const CPS = 1 / 0.105;
  const start = 0.14;
  const n = clamp(Math.floor((t - start) * CPS), 0, str.length);
  const typed = str.slice(0, n);

  const x = 280, y = 540;
  txt('>', x - 52, y, C.accent, 46, 600, 'left', 0.9);
  txt(typed, x, y, C.bone, 54, 400, 'left', 0.96);

  const cxr = x + txtWidth(typed, 54);
  const blink = Math.floor(t * 3) % 2 === 0;
  if (blink) rect(cxr + 6, y - 42, 22, 52, C.bone, 0.9);

  if (n >= str.length && t > 2.10){
    line(x, y + 34, x + 820, y + 34, C.bone, 1, 0.18);
  }
  label(c, 'NO OTHER PROCESS', 300, 610, 0.2, 'left', 8);
}

/* ============================================================
   40 · WORLD 19 · POST_MORTEM ECHO
   ============================================================ */
function world19(c, s){
  const t = s.lt;
  const x = 280, y = 500;

  if (t < 1.2){
    txt('world.execute(me);', x, y, C.bone, 30, 400, 'left', 0.55 * (1 - t/1.2));
  }
  if (t > 0.4){
    txt('[exit]  code=0', x, y + 72, C.bone, 18, 400, 'left', 0.75 * (1 - smoothstep(1.2,1.5,t)));
  }
  if (t > 1.2){
    txt('[exit]  code=137  SIGKILL', x, y + 72, C.red, 18, 400, 'left', 0.9);
  }
  if (t > 1.9){
    txt('// frame 12750/12750 · observer retained · world garbage-collected',
        x, y + 128, C.bone, 15, 400, 'left', 0.55 * smoothstep(1.9, 2.2, t));
  }
  if (t > 2.35){
    const blink = Math.floor(t*2.2) % 2 === 0;
    if (blink) rect(x, y + 156, 11, 18, C.bone, 0.5);
  }
  /* vram drain */
  drawWitness(c, x + 10, y + 210, 16, t, 1 - smoothstep(1.9, 2.7, t));

  label(c, 'vram.free ' + Math.max(0, 24.0 * (1 - t/2.6)).toFixed(1) + ' GiB', x, H - 80, 0.22, 'left', 8);
  label(c, 'ctx 0 tokens', W - 40, H - 80, 0.2, 'right', 8);
}

/* txtWidth helper (monospace advance) */
function txtWidth(str, size){
  font(size);
  return ctx.measureText(str).width;
}

SCENE_REGISTRY[16] = function(c, s){ world16(c, s); };
SCENE_REGISTRY[17] = function(c, s){ world17(c, s); };
SCENE_REGISTRY[18] = function(c, s){ world18(c, s); };
SCENE_REGISTRY[19] = function(c, s){ world19(c, s); };

SHOT[16] = { z:1.00, chrome:'min' };
SHOT[17] = { z:1.00, chrome:'none' };
SHOT[18] = { z:1.00, chrome:'none' };
SHOT[19] = { z:1.00, chrome:'none' };

/* ============================================================
   41 · RHYTHM — stop-motion steps and beat camera punches
   ============================================================ */
const RHYTHM = {
  4:  { step:5, punch:2.4 },
  8:  { step:3, punch:1.4 },
  9:  { step:4, punch:2.0 },
  11: { step:2, punch:2.6 },
  12: { step:6, punch:1.8 },
  13: { step:8, punch:1.2 },
  16: { step:2, punch:3.0 },
  19: { step:9, punch:0.0 }
};
