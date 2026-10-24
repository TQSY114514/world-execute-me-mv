
/* ============================================================
   57 · SEG 11 — deep sandbox
   ============================================================ */
function project(p, rx, ry, dist, cx, cy){
  const ca = Math.cos(ry), sa = Math.sin(ry);
  const cb = Math.cos(rx), sb = Math.sin(rx);
  const x1 = p[0]*ca - p[2]*sa;
  const z1 = p[0]*sa + p[2]*ca;
  const y1 = p[1]*cb - z1*sb;
  const z2 = p[1]*sb + z1*cb;
  const k = dist / (dist + z2);
  return { x: cx + x1*k, y: cy + y1*k, d: k, z: z2 };
}

function world11d(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 11);

  const box = G.cell(2, 1, 15, 9);
  const cx = box.x + box.w*0.5, cy = box.y + box.h*0.52;
  const R = Math.min(box.w, box.h) * 0.30;
  const ry = t*0.22, rx = 0.42 + 0.10*Math.sin(t*0.35);
  const breath = 1 + 0.035 * springImpulse(t, Math.floor(t/0.4615)*0.4615, 5, 8);

  /* --- the box, subdivided per face (8x8 -> 384 quads) --- */
  const N = 8;
  const faces = [
    function(u,v){ return [-1 + 2*u, -1 + 2*v, -1]; },
    function(u,v){ return [-1 + 2*u, -1 + 2*v,  1]; },
    function(u,v){ return [-1, -1 + 2*u, -1 + 2*v]; },
    function(u,v){ return [ 1, -1 + 2*u, -1 + 2*v]; },
    function(u,v){ return [-1 + 2*u, -1, -1 + 2*v]; },
    function(u,v){ return [-1 + 2*u,  1, -1 + 2*v]; }
  ];
  c.lineWidth = 1;
  for (let f=0; f<6; f++){
    for (let i=0;i<N;i++){
      for (let j=0;j<N;j++){
        const u0 = i/N, u1 = (i+1)/N, v0 = j/N, v1 = (j+1)/N;
        const pts = [
          project(faces[f](u0,v0).map(function(q){ return q*R*breath; }), rx, ry, 1400, cx, cy),
          project(faces[f](u1,v0).map(function(q){ return q*R*breath; }), rx, ry, 1400, cx, cy),
          project(faces[f](u1,v1).map(function(q){ return q*R*breath; }), rx, ry, 1400, cx, cy),
          project(faces[f](u0,v1).map(function(q){ return q*R*breath; }), rx, ry, 1400, cx, cy)
        ];
        const depth = (pts[0].d + pts[1].d + pts[2].d + pts[3].d) * 0.25;
        const edge = (i===0 || j===0 || i===N-1 || j===N-1);
        c.globalAlpha = clamp((depth - 0.55) * 1.6, 0.03, 0.5);
        c.strokeStyle = edge ? C.bone : C.grid;
        c.beginPath();
        c.moveTo(pts[0].x, pts[0].y);
        c.lineTo(pts[1].x, pts[1].y);
        c.lineTo(pts[2].x, pts[2].y);
        c.lineTo(pts[3].x, pts[3].y);
        c.closePath();
        c.stroke();
      }
    }
  }
  c.globalAlpha = 1;

  /* --- inner cage --- */
  const Ri = R * 0.44;
  const ic = [];
  for (let i=0;i<8;i++){
    ic.push(project([(i&1?1:-1)*Ri, (i&2?1:-1)*Ri, (i&4?1:-1)*Ri], rx, ry, 1400, cx, cy));
  }
  c.globalAlpha = 0.5;
  c.strokeStyle = C.accent; c.lineWidth = 1;
  const E = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
  for (let i=0;i<E.length;i++){
    const a = ic[E[i][0]], bb = ic[E[i][1]];
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(bb.x, bb.y); c.stroke();
  }
  c.globalAlpha = 1;

  /* --- particles bouncing inside the cage --- */
  for (let i=0;i<160;i++){
    const sp = 0.55 + hash2(i,1)*0.9;
    const px = Math.sin(t*sp*1.7 + hash2(i,2)*TAU) * Ri * 0.9;
    const py = Math.sin(t*sp*2.1 + hash2(i,3)*TAU) * Ri * 0.9;
    const pz = Math.sin(t*sp*1.3 + hash2(i,4)*TAU) * Ri * 0.9;
    const p = project([px, py, pz], rx, ry, 1400, cx, cy);
    c.globalAlpha = 0.25 + 0.55*p.d;
    c.fillStyle = i % 11 === 0 ? C.accent : C.bone;
    c.fillRect(p.x, p.y, 1.6, 1.6);
  }
  c.globalAlpha = 1;

  /* --- containment sphere: 3 great circles + rings --- */
  c.globalAlpha = 0.16;
  c.strokeStyle = C.bone; c.lineWidth = 1;
  for (let k=0;k<3;k++){
    c.beginPath();
    for (let i=0;i<=120;i++){
      const a = i/120*TAU;
      const v = [Math.cos(a)*R, Math.sin(a)*R, 0];
      if (k === 1){ const tmp = v[1]; v[1] = v[2]; v[2] = tmp; }
      if (k === 2){ const tmp = v[0]; v[0] = v[2]; v[2] = tmp; }
      const p = project(v, rx, ry, 1400, cx, cy);
      if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
    }
    c.stroke();
  }
  c.globalAlpha = 1;

  /* --- scan plane --- */
  const sweep = (t*0.30) % 1;
  const sy = box.y + box.h * sweep;
  c.globalAlpha = 0.10;
  c.fillStyle = C.accent;
  c.fillRect(box.x, sy, box.w, 2);
  c.globalAlpha = 0.22;
  line(box.x, sy, box.x + box.w, sy, C.accent, 1, 0.5);
  c.globalAlpha = 1;

  /* --- telemetry --- */
  const rx2 = G.x(18);
  const rows = [
    ['seccomp', 'ENFORCED'],
    ['syscalls', String(12000 + Math.floor(t*7))],
    ['denied', String(Math.floor(t*1.4))],
    ['mmaps', '1,024'],
    ['threads', '1'],
    ['exits', String(Math.floor(t/4))]
  ];
  for (let i=0;i<rows.length;i++){
    const a = stagger(t, i*0.14, 0.35, 0.6);
    c.font = '9px "JetBrains Mono",Consolas,monospace';
    c.textAlign = 'left'; c.fillStyle = C.bone; c.globalAlpha = 0.42*a;
    c.fillText(rows[i][0], rx2, G.y(3) + i*26);
    c.textAlign = 'right'; c.fillStyle = C.accent;
    c.globalAlpha = 0.85*a;
    c.fillText(rows[i][1], rx2 + 210, G.y(3) + i*26);
    c.globalAlpha = 1; c.textAlign = 'left';
  }

  /* syscall log */
  c.font = '8px "JetBrains Mono",Consolas,monospace';
  for (let i=0;i<14;i++){
    const v = Math.floor(hash2(i, 7) * 255);
    c.globalAlpha = 0.10 + 0.10 * ((i + Math.floor(t*3)) % 4 === 0 ? 1 : 0);
    c.fillStyle = C.bone; c.textAlign = 'left';
    c.fillText('0x' + ('0' + v.toString(16)).slice(-2) + '  ' +
               ['open','read','write','mmap','exit','ioctl'][i % 6],
               G.x(18), G.y(7) + i*15);
  }
  c.globalAlpha = 1;

  G.tag('chroot /sandbox', 0, 0, 6, 11);
  G.text('PID 3882 · ns 1 · no egress', 7, 0, 10, C.bone, 0.45, 1.0);
  G.text('cells 384 · particles 160', 0, 11, 9, C.bone, 0.35, 1.0);
  label(c, 'SANDBOX', W - 40, H - 18, 0.35, 'right', 8);
}

SCENE_REGISTRY[11] = function(c, s){ world11d(c, s); };
NEW_SCENE_IDS[11] = 1;
delete SKIN_PAL[11]; delete SKIN_SEG[11];
