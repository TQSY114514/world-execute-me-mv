
/* ============================================================
   58 · SEG 12 — deep ontology (superquadrics)
   ============================================================ */
function spow(v, e){ return Math.sign(v) * Math.pow(Math.abs(v), e); }

function superPoint(u, v, e1, e2, lob){
  const cu = Math.cos(u), su = Math.sin(u);
  const cv = Math.cos(v), sv = Math.sin(v);
  let x = spow(cv, e1) * spow(cu, e2);
  let y = spow(sv, e1);
  let z = spow(cv, e1) * spow(su, e2);
  const r = 1 + lob * Math.cos(6*u);     /* six chambers, like a fruit */
  return [x*r, y*0.92, z*r];
}

function world12d(c, s){
  const t = s.lt, b = s.beat, shot = s.shot || 0;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 12);

  /* a contact sheet of poses: 5 x 3 */
  const COLS = 5, ROWS = 3;
  const sheet = G.cell(0, 1, 17, 9);
  const cw = sheet.w / COLS, chh = sheet.h / ROWS;
  const states = [
    { n: 'EGGPLANT', e1: 0.72, e2: 0.86, lob: 0 },
    { n: 'TOMATO',   e1: 0.55, e2: 0.55, lob: 0.055 },
    { n: 'CAT',      e1: 0.95, e2: 0.95, lob: 0.012 },
    { n: 'SPHERE',   e1: 1.00, e2: 1.00, lob: 0 },
    { n: 'CUBE',     e1: 0.18, e2: 0.18, lob: 0 },
    { n: 'STAR',     e1: 0.60, e2: 0.60, lob: 0.16 }
  ];

  for (let r=0;r<ROWS;r++){
    for (let q=0;q<COLS;q++){
      const idx = r*COLS + q;
      const st = states[idx % states.length];
      const ox = sheet.x + q*cw + cw/2, oy = sheet.y + r*chh + chh/2;
      const seeded = (hash2(q, r) - 0.5) * 0.5;
      const ry = seeded + t*0.10 + idx*0.4;
      const rx = 0.30 + 0.12*Math.sin(t*0.5 + idx);
      const R = Math.min(cw, chh) * 0.30;
      const isHero = (idx === (shot % (COLS*ROWS)));

      c.strokeStyle = C.bone; c.globalAlpha = isHero ? 0.35 : 0.12;
      c.strokeRect(sheet.x + q*cw + 3, sheet.y + r*chh + 3, cw - 6, chh - 6);
      c.globalAlpha = 1;

      const N = isHero ? 14 : 8;
      for (let i=0;i<=N;i++){
        const v = -Math.PI/2 + Math.PI*i/N;
        c.beginPath();
        for (let j=0;j<=N*2;j++){
          const uu = -Math.PI + TAU*j/(N*2);
          const p = superPoint(uu, v, st.e1, st.e2, st.lob);
          const pr = project([p[0]*R, p[1]*R, p[2]*R], rx, ry, 1400, ox, oy);
          if (j === 0) c.moveTo(pr.x, pr.y); else c.lineTo(pr.x, pr.y);
        }
        c.strokeStyle = isHero ? C.accent : C.bone;
        c.globalAlpha = isHero ? 0.55 : 0.22;
        c.lineWidth = 1;
        c.stroke();
      }
      c.globalAlpha = 1;

      c.font = '7px "JetBrains Mono",Consolas,monospace';
      c.fillStyle = isHero ? C.accent : C.bone;
      c.globalAlpha = isHero ? 0.95 : 0.3;
      c.textAlign = 'left';
      c.fillText(st.n, sheet.x + q*cw + 8, sheet.y + r*chh + 15);
      c.textAlign = 'right';
      c.fillText('e1 ' + st.e1.toFixed(2), sheet.x + q*cw + cw - 8, sheet.y + r*chh + 15);
      c.globalAlpha = 1;
    }
  }

  /* the hero cell, enlarged, on the right */
  const hero = states[(shot % (COLS*ROWS)) % states.length];
  const hb = G.cell(18, 2, 5, 6);
  const hx = hb.x + hb.w*0.5, hy = hb.y + hb.h*0.5, HR = Math.min(hb.w, hb.h)*0.32;
  const hry = t*0.42 + 0.6, hrx = 0.36;
  for (let i=0;i<=20;i++){
    const v = -Math.PI/2 + Math.PI*i/20;
    c.beginPath();
    for (let j=0;j<=40;j++){
      const uu = -Math.PI + TAU*j/40;
      const p = superPoint(uu, v, hero.e1, hero.e2, hero.lob);
      const pr = project([p[0]*HR, p[1]*HR, p[2]*HR], hrx, hry, 1400, hx, hy);
      if (j === 0) c.moveTo(pr.x, pr.y); else c.lineTo(pr.x, pr.y);
    }
    c.strokeStyle = C.accent; c.globalAlpha = 0.35;
    c.lineWidth = 1; c.stroke();
  }
  c.globalAlpha = 1;

  const rows = [
    ['hero', hero.n],
    ['e1', hero.e1.toFixed(2)],
    ['e2', hero.e2.toFixed(2)],
    ['cells', String(COLS*ROWS)]
  ];
  for (let i=0;i<rows.length;i++){
    c.font = '9px "JetBrains Mono",Consolas,monospace';
    c.textAlign = 'left'; c.fillStyle = C.bone; c.globalAlpha = 0.42;
    c.fillText(rows[i][0], G.x(18), G.y(9) + i*20);
    c.textAlign = 'right'; c.fillStyle = C.accent; c.globalAlpha = 0.85;
    c.fillText(rows[i][1], G.x(18) + 200, G.y(9) + i*20);
    c.globalAlpha = 1; c.textAlign = 'left';
  }

  G.tag('x^e1 \u00b7 z^e2', 0, 0, 5, 11);
  G.text('CONTACT SHEET', 6, 0, 10, C.bone, 0.5, 2.2);
  label(c, 'ONTOLOGY', W - 40, H - 18, 0.35, 'right', 8);
}

SCENE_REGISTRY[12] = function(c, s){ world12d(c, s); };
NEW_SCENE_IDS[12] = 1;
delete SKIN_PAL[12]; delete SKIN_SEG[12];
