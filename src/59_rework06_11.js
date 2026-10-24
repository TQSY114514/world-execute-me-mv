
/* ============================================================
   59 · SEG 06 as a flat structural formula · SEG 11 exploded
   ============================================================ */

/* ---------- Seg 06 · chemistry, drawn flat ---------- */
function world06f(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 6);

  /* the skeleton: 22 carbons, 11 conjugated bonds, flat */
  const N = 22;
  const bx = G.x(0) + 40, by = G.y(6) + 10;
  const step = 84, amp = 46;
  const pts = [];
  for (let i=0;i<N;i++){
    pts.push({
      x: bx + i*step,
      y: by + (i % 2 ? -amp : amp) + Math.sin(i*0.9)*8
    });
  }
  const reveal = Math.floor(N * EASE.out(clamp(t / 3.2, 0, 1)));

  /* bonds */
  for (let i=0;i<Math.min(reveal, N-1);i++){
    const p = pts[i], q = pts[i+1];
    const a = stagger(t, i*0.06, 0.35, 0.28);
    c.globalAlpha = a;
    c.strokeStyle = C.bone; c.lineWidth = 2.8;
    c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
    if (i % 2 === 0){
      /* the second line of a double bond, offset perpendicular */
      const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1;
      const ox = -dy/l*7, oy = dx/l*7;
      c.lineWidth = 1.8; c.strokeStyle = C.accent;
      c.beginPath(); c.moveTo(p.x+ox, p.y+oy); c.lineTo(q.x+ox, q.y+oy); c.stroke();
    }
    c.globalAlpha = 1;
  }

  /* methyl branches */
  for (let i=2;i<Math.min(reveal, N-2);i+=4){
    const p = pts[i];
    const up = (i % 2 === 0);
    const ex = p.x + 16, ey = p.y + (up ? -52 : 52);
    c.globalAlpha = 0.75;
    c.strokeStyle = C.bone; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(ex, ey); c.stroke();
    c.font = '10px "JetBrains Mono",Consolas,monospace';
    c.fillStyle = C.bone; c.globalAlpha = 0.75;
    c.textAlign = 'center';
    c.fillText('CH3', ex + 8, ey + (up ? -4 : 12));
    c.globalAlpha = 1;
  }

  /* carbon dots + index */
  for (let i=0;i<Math.min(reveal, N);i++){
    c.fillStyle = i % 2 === 0 ? C.accent : C.bone;
    c.globalAlpha = 0.9;
    c.beginPath(); c.arc(pts[i].x, pts[i].y, 3, 0, TAU); c.fill();
    c.globalAlpha = 0.3;
    c.font = '7px "JetBrains Mono",Consolas,monospace';
    c.textAlign = 'center';
    c.fillText(String(i+1), pts[i].x, pts[i].y + (i%2 ? 16 : -12));
    c.globalAlpha = 1;
  }

  /* bond length measure */
  if (reveal > 3){
    const p = pts[0], q = pts[1];
    c.globalAlpha = 0.5; c.strokeStyle = C.red; c.lineWidth = 1;
    line(p.x, p.y + 60, q.x, q.y + 60, C.red, 1, 0.5);
    line(p.x, p.y + 54, p.x, p.y + 66, C.red, 1, 0.5);
    line(q.x, q.y + 54, q.x, q.y + 66, C.red, 1, 0.5);
    c.font = '9px "JetBrains Mono",Consolas,monospace';
    c.fillStyle = C.red; c.globalAlpha = 0.85;
    c.fillText('1.34 A', (p.x + q.x)/2, q.y + 82);
    c.globalAlpha = 1;
  }

  /* the formula + the fruit */
  c.textAlign = 'left';
  c.font = '600 96px "Segoe UI",system-ui,sans-serif';
  c.fillStyle = C.bone; c.globalAlpha = 0.92;
  c.fillText('C', G.x(18), G.y(2) + 60);
  c.font = '600 38px "Segoe UI",system-ui,sans-serif';
  c.fillText('40', G.x(18) + 62, G.y(2) + 26);
  c.font = '600 96px "Segoe UI",system-ui,sans-serif';
  c.fillText('H', G.x(18) + 104, G.y(2) + 60);
  c.font = '600 38px "Segoe UI",system-ui,sans-serif';
  c.fillText('56', G.x(18) + 168, G.y(2) + 26);
  c.globalAlpha = 1;

  /* mini fruit */
  const fr = G.cell(19, 5, 4, 4);
  const fx = fr.x + fr.w*0.5, fy = fr.y + fr.h*0.5, rr = Math.min(fr.w, fr.h)*0.40;
  const rv = smoothstep(1.2, 2.6, t);
  c.beginPath(); c.arc(fx, fy, rr, 0, TAU);
  c.fillStyle = '#B7392A'; c.globalAlpha = 0.95; c.fill();
  for (let k=0;k<6;k++){
    c.save(); c.translate(fx, fy); c.rotate(k/6*TAU + 0.3);
    c.beginPath(); c.moveTo(rr*0.18, 0);
    c.bezierCurveTo(rr*0.45, -rr*0.22, rr*0.80, -rr*0.18, rr*0.84, 0);
    c.bezierCurveTo(rr*0.80, rr*0.18, rr*0.45, rr*0.22, rr*0.18, 0);
    c.closePath();
    c.fillStyle = 'rgba(240,222,206,' + (0.85*rv) + ')'; c.fill();
    c.restore();
  }
  c.globalAlpha = 1;

  G.tag('C40H56', 0, 0, 4, 12);
  G.text('LYCOPENE / ALL-TRANS', 5, 0, 10, C.bone, 0.5, 1.6);
  G.text('bonds ' + Math.min(11, Math.floor(reveal/2)) + ' / 11', 0, 11, 9, C.accent, 0.85, 1.0);
  label(c, 'BIOCHEM', W - 40, H - 18, 0.35, 'right', 8);
}

/* ---------- Seg 11 · exploded sandbox ---------- */
function world11f(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 11);

  const box = G.cell(2, 1, 15, 9);
  const cx = box.x + box.w*0.5, cy = box.y + box.h*0.52;
  const R = Math.min(box.w, box.h) * 0.24;
  const ry = t*0.18 + 0.4, rx = 0.40;
  const gap = 0.50 + 1.10 * EASE.out(clamp((t - 1.2) / 4.5, 0, 1));
  const breath = 1 + 0.04 * springImpulse(t, Math.floor(t/0.4615)*0.4615, 5, 8);

  const N = 3;
  for (let oct=0; oct<8; oct++){
    const ox = (oct & 1 ? 1 : -1) * gap * 0.5;
    const oy = (oct & 2 ? 1 : -1) * gap * 0.5;
    const oz = (oct & 4 ? 1 : -1) * gap * 0.5;
    const sgn = [[ox, oy, oz]];
    for (let f=0; f<6; f++){
      for (let i=0;i<N;i++){
        for (let j=0;j<N;j++){
          const u0 = i/N, u1 = (i+1)/N, v0 = j/N, v1 = (j+1)/N;
          const face = function(u, v){
            let p;
            if (f === 0) p = [-0.5 + u, -0.5 + v, -0.5];
            else if (f === 1) p = [-0.5 + u, -0.5 + v, 0.5];
            else if (f === 2) p = [-0.5, -0.5 + u, -0.5 + v];
            else if (f === 3) p = [0.5, -0.5 + u, -0.5 + v];
            else if (f === 4) p = [-0.5 + u, -0.5, -0.5 + v];
            else p = [-0.5 + u, 0.5, -0.5 + v];
            return [p[0]*R + ox*R*1.35, p[1]*R + oy*R*1.35, p[2]*R + oz*R*1.35];
          };
          const p0 = project(face(u0,v0), rx, ry, 1400, cx, cy);
          const p1 = project(face(u1,v0), rx, ry, 1400, cx, cy);
          const p2 = project(face(u1,v1), rx, ry, 1400, cx, cy);
          const p3 = project(face(u0,v1), rx, ry, 1400, cx, cy);
          const depth = (p0.d + p1.d + p2.d + p3.d) * 0.25;
          c.globalAlpha = clamp((depth - 0.5) * 2.0, 0.03, 0.55);
          c.strokeStyle = (i===0||j===0||i===N-1||j===N-1) ? C.bone : C.grid;
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y);
          c.lineTo(p2.x, p2.y); c.lineTo(p3.x, p3.y);
          c.closePath(); c.stroke();
        }
      }
    }
  }
  c.globalAlpha = 1;

  /* exploded guide lines */
  c.globalAlpha = 0.14;
  for (let i=0;i<3;i++){
    const a = project([i===0?-R*2.0:0, i===1?-R*2.0:0, i===2?-R*2.0:0], rx, ry, 1400, cx, cy);
    const bb = project([i===0?R*2.0:0, i===1?R*2.0:0, i===2?R*2.0:0], rx, ry, 1400, cx, cy);
    line(a.x, a.y, bb.x, bb.y, C.accent, 1, 0.4);
  }
  c.globalAlpha = 1;

  const rows = [
    ['cells', '8 x 3 x 3'],
    ['gap', (gap * R).toFixed(1) + ' px'],
    ['egress', 'NONE'],
    ['state', t < 1.2 ? 'PACKED' : 'EXPLODED']
  ];
  for (let i=0;i<rows.length;i++){
    c.font = '9px "JetBrains Mono",Consolas,monospace';
    c.textAlign = 'left'; c.fillStyle = C.bone; c.globalAlpha = 0.42;
    c.fillText(rows[i][0], G.x(18), G.y(3) + i*22);
    c.textAlign = 'right'; c.fillStyle = C.accent; c.globalAlpha = 0.85;
    c.fillText(rows[i][1], G.x(18) + 210, G.y(3) + i*22);
    c.globalAlpha = 1; c.textAlign = 'left';
  }

  G.tag('chroot /sandbox', 0, 0, 6, 11);
  G.text('the box is only a box while it is closed', 7, 0, 10, C.bone, 0.45, 0.8);
  G.text('8 octants · 432 faces', 0, 11, 9, C.bone, 0.35, 1.0);
  label(c, 'SANDBOX', W - 40, H - 18, 0.35, 'right', 8);
}

SCENE_REGISTRY[6] = function(c, s){ world06f(c, s); };
SCENE_REGISTRY[11] = function(c, s){ world11f(c, s); };
