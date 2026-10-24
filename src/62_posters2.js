
/* ============================================================
   62 · POSTERS II — the recipe applied across the film
   ============================================================ */
function pGround(c, dark, lx, ly){
  c.fillStyle = dark ? '#0B0B0D' : PST.paper;
  c.fillRect(0, 0, W, H);
  if (!dark){
    c.fillStyle = 'rgba(20,19,15,0.07)';
    for (let y=10; y<H; y+=16)
      for (let x=10 + ((y/16)%2)*8; x<W; x+=16){
        c.beginPath(); c.arc(x, y, 1.1, 0, TAU); c.fill();
      }
    c.fillStyle = 'rgba(255,255,255,0.34)';
    c.beginPath(); c.arc(lx, ly, 520, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.26)';
    c.beginPath(); c.arc(lx, ly, 330, 0, TAU); c.fill();
  }
  c.strokeStyle = dark ? 'rgba(240,240,242,0.30)' : 'rgba(20,19,15,0.30)';
  c.lineWidth = 2;
  const inset = 34, len = 26;
  [[inset,inset,1,1],[W-inset,inset,-1,1],[W-inset,H-inset,-1,-1],[inset,H-inset,1,-1]].forEach(function(m){
    c.beginPath();
    c.moveTo(m[0]+m[2]*8, m[1]+m[3]*8); c.lineTo(m[0]+m[2]*(8+len), m[1]+m[3]*8);
    c.moveTo(m[0]+m[2]*8, m[1]+m[3]*8); c.lineTo(m[0]+m[2]*8, m[1]+m[3]*(8+len));
    c.stroke();
  });
}

function pWord(c, word, opts){
  opts = opts || {};
  const maxW = opts.maxW || 1740;
  const col = opts.col || PST.ink;
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  let size = opts.size || 200;
  c.font = '700 ' + size + 'px "Times New Roman",Georgia,serif';
  while (c.measureText(word).width > maxW && size > 36){
    size -= 6;
    c.font = '700 ' + size + 'px "Times New Roman",Georgia,serif';
  }
  const x = W*0.5, y = opts.y || H*0.90;
  c.save(); c.globalAlpha = 0.9; c.fillStyle = opts.shadow || PST.accent;
  c.fillText(word, x + 7, y + 7); c.restore();
  c.save(); c.globalAlpha = 0.96; c.fillStyle = col;
  c.fillText(word, x, y); c.restore();
}

function pMeta(c, dark, left, right){
  c.textAlign = 'left';
  c.font = '11px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = dark ? '#F0F0F2' : PST.ink;
  c.globalAlpha = 0.5;
  c.fillText(left, 46, 46);
  if (right){ c.textAlign = 'right'; c.fillText(right, W - 46, 46); }
  c.globalAlpha = 1; c.textAlign = 'left';
}

/* three colour passes + one solid pass */
function pInk(c, fn, m, dark){
  const offs = [[m, m*0.35], [-m*0.5, m*0.8], [m*1.7, m*0.95]];
  const cols = dark ? ['#7A2B22', '#3B4A46', '#5A4A22'] : [PST.warm, PST.grey, PST.accent];
  for (let i=0;i<3;i++){
    c.save(); c.translate(offs[i][0], offs[i][1]);
    c.globalAlpha = 0.5; c.globalCompositeOperation = 'multiply';
    fn(c, cols[i]); c.restore();
  }
  c.save(); fn(c, dark ? '#F0F0F2' : PST.ink); c.restore();
}

/* ---------- 02 · PLACE ---------- */
function world02p(c, s){
  const t = s.lt, b = s.beat;
  pGround(c, true, W*0.5, H*0.36);
  const m = 4 + b.kick * 5;
  const bx = W*0.22, by = H*0.16, bw = W*0.56, bh = H*0.42;
  pInk(c, function(cc, col){
    cc.globalAlpha = 0.85;
    cc.save();
    cc.beginPath(); cc.rect(bx, by, bw, bh); cc.clip();
    cc.globalAlpha = 0.55;
    cc.drawImage(RD_CANVAS, bx + (t*18)%20 - 20, by, bw + 40, bh);
    cc.restore();
    cc.globalAlpha = 1;
    cc.strokeStyle = col; cc.lineWidth = 2;
    cc.strokeRect(bx, by, bw, bh);
  }, m, true);
  pWord(c, 'PLACE', { y: H*0.88, col: '#F0F0F2', shadow: '#7A2B22' });
  pMeta(c, true, 'R2 · 5184 cells · two attractors', 'make it a place');
}

/* ---------- 03 · TANGENT ---------- */
function world03p(c, s){
  const t = s.lt, b = s.beat;
  pGround(c, false, W*0.55, H*0.34);
  const m = 3 + b.kick * 4;
  const cx = W*0.55, cy = H*0.36, S = 300;
  const f = function(x){ return 0.55*x*x - 0.35; };
  const d = function(x){ return 1.1*x; };
  const x0 = -1.2 + 1.8*(0.5 + 0.5*Math.sin(t*0.5));
  pInk(c, function(cc, col){
    cc.strokeStyle = col; cc.lineWidth = 1.6;
    cc.beginPath();
    for (let i=0;i<=200;i++){
      const x = -1.8 + 3.6*i/200;
      const X = cx + x*S*0.62, Y = cy - f(x)*S*0.45;
      if (i===0) cc.moveTo(X,Y); else cc.lineTo(X,Y);
    }
    cc.stroke();
    const X0 = cx + x0*S*0.62, Y0 = cy - f(x0)*S*0.45, mm = d(x0);
    cc.lineWidth = 2.4;
    cc.beginPath();
    cc.moveTo(X0 - 180, Y0 + 180*mm*0.72);
    cc.lineTo(X0 + 180, Y0 - 180*mm*0.72);
    cc.stroke();
    cc.beginPath(); cc.arc(X0, Y0, 6, 0, TAU); cc.fillStyle = col; cc.fill();
    const R = Math.pow(1+mm*mm, 1.5) / 1.1;
    cc.beginPath(); cc.arc(X0 + 0, Y0 - R*S*0.45*0.0 - R*0.0, R*S*0.45, 0, TAU);
    cc.lineWidth = 1; cc.globalAlpha = 0.5; cc.stroke();
  }, m, false);
  pWord(c, 'TANGENT', { y: H*0.88, size: 190 });
  pMeta(c, false, "f(x) = 0.55x² − 0.35 · f'(x) = 1.1x", 'secants → 7');
}

/* ---------- 06 · C40H56 ---------- */
function world06p(c, s){
  const t = s.lt, b = s.beat;
  pGround(c, false, W*0.5, H*0.32);
  const m = 3 + b.kick * 4;
  const N = 16, bx = W*0.16, by = H*0.34, step = 108, amp = 46;
  pInk(c, function(cc, col){
    cc.strokeStyle = col; cc.lineWidth = 2.6;
    for (let i=0;i<N-1;i++){
      const x1 = bx + i*step, y1 = by + (i%2 ? -amp : amp);
      const x2 = bx + (i+1)*step, y2 = by + ((i+1)%2 ? -amp : amp);
      cc.beginPath(); cc.moveTo(x1,y1); cc.lineTo(x2,y2); cc.stroke();
      if (i % 2 === 0){
        cc.lineWidth = 1.6;
        cc.beginPath(); cc.moveTo(x1, y1-8); cc.lineTo(x2, y2-8); cc.stroke();
        cc.lineWidth = 2.6;
      }
      cc.fillStyle = col;
      cc.beginPath(); cc.arc(x1, y1, 4, 0, TAU); cc.fill();
    }
  }, m, false);
  /* the fruit */
  c.beginPath(); c.arc(W*0.84, H*0.34, 92, 0, TAU);
  c.fillStyle = '#C8452E'; c.fill();
  for (let k=0;k<6;k++){
    c.save(); c.translate(W*0.84, H*0.34); c.rotate(k/6*TAU);
    c.beginPath(); c.ellipse(44, 0, 30, 14, 0, 0, TAU);
    c.fillStyle = 'rgba(242,239,231,0.9)'; c.fill();
    c.restore();
  }
  pWord(c, 'C₄₀H₅₆', { y: H*0.88, size: 190 });
  pMeta(c, false, 'lycopene · 11 conjugated bonds', 'tomato');
}

/* ---------- 12 · ONTOLOGY ---------- */
function world12p(c, s){
  const t = s.lt, b = s.beat;
  pGround(c, false, W*0.55, H*0.32);
  const m = 4 + b.kick * 5;
  const cx = W*0.55, cy = H*0.34;
  const states = [[0.72,0.86,0],[0.55,0.55,0.06],[0.95,0.95,0.01]];
  const k = Math.floor(t/1.846) % 3;
  pInk(c, function(cc, col){
    for (let n=0;n<3;n++){
      const st = states[(k+n)%3];
      const R = 150 - n*34;
      cc.strokeStyle = col; cc.globalAlpha = 0.9 - n*0.2;
      for (let i=0;i<=12;i++){
        const v = -Math.PI/2 + Math.PI*i/12;
        cc.beginPath();
        for (let j=0;j<=28;j++){
          const u = -Math.PI + TAU*j/28;
          const p = superPoint(u, v, st[0], st[1], st[2]);
          const pr = project([p[0]*R, p[1]*R, p[2]*R], 0.38, t*0.22 + n*0.7, 1400, cx, cy);
          if (j===0) cc.moveTo(pr.x, pr.y); else cc.lineTo(pr.x, pr.y);
        }
        cc.lineWidth = 1;
        cc.stroke();
      }
      cc.globalAlpha = 1;
    }
  }, m, false);
  pWord(c, 'ONTOLOGY', { y: H*0.88, size: 190 });
  pMeta(c, false, 'x^e1 · z^e2 · the form is negotiable', 'e1 = ' + states[k][0]);
}

/* ---------- 13 · RECURSE ---------- */
function world13p(c, s){
  const t = s.lt, b = s.beat;
  pGround(c, true, W*0.5, H*0.34);
  const m = 5 + b.kick * 6;
  const cx = W*0.5, cy = H*0.32;
  pInk(c, function(cc0, col){
    let cc = cc0;
    for (let n=0;n<4;n++){
      const R = 230 * Math.pow(0.62, n);
      const w = R, h = R*0.54;
      cc.strokeStyle = col; cc.lineWidth = 1.6; cc.globalAlpha = 1 - n*0.2;
      cc.beginPath();
      cc.moveTo(cx-w, cy); cc.quadraticCurveTo(cx, cy-h*1.5, cx+w, cy);
      cc.quadraticCurveTo(cx, cy+h*1.5, cx-w, cy);
      cc.stroke();
      cc.beginPath(); cc.arc(cx, cy, h*0.9, 0, TAU); cc.stroke();
      cc.beginPath(); cc.arc(cx, cy, h*0.34, 0, TAU);
      cc.fillStyle = col; cc.fill();
      cc.globalAlpha = 1;
    }
  }, m, true);
  pWord(c, 'RECURSE', { y: H*0.88, col: '#F0F0F2', shadow: '#7A2B22' });
  pMeta(c, true, 'depth ∞ · one eye at every level', '162.7 s');
}

/* ---------- 17 · PLEASE ---------- */
function world17p(c, s){
  const t = s.lt, b = s.beat;
  pGround(c, false, W*0.5, H*0.30);
  const m = 3 + b.kick * 4;
  pInk(c, function(cc, col){
    /* the audience */
    cc.fillStyle = col;
    for (let i=0;i<11;i++){
      const x = W*(0.06 + 0.88*i/10);
      const s2 = 1 - Math.abs(i-5)/9;
      const r = 16 + 12*s2;
      cc.beginPath(); cc.arc(x, H*0.42 - r*0.2, r, 0, TAU); cc.fill();
      cc.beginPath();
      cc.moveTo(x - r*2.1, H*0.58); cc.quadraticCurveTo(x, H*0.40, x + r*2.1, H*0.58);
      cc.closePath(); cc.fill();
    }
    /* the rings of the plea */
    cc.strokeStyle = col; cc.lineWidth = 1.2;
    for (let ring=0; ring<4; ring++){
      const rr = 120 + ring*74;
      cc.globalAlpha = 0.55 - ring*0.1;
      cc.beginPath(); cc.ellipse(W*0.5, H*0.26, rr*1.5, rr*0.6, 0, 0, TAU); cc.stroke();
    }
    cc.globalAlpha = 1;
  }, m, false);
  pWord(c, 'PLEASE', { y: H*0.88, size: 210 });
  pMeta(c, false, '8,100,000,000 recipients', 'no ack required');
}

SCENE_REGISTRY[2]  = function(c, s){ world02p(c, s); };
SCENE_REGISTRY[6]  = function(c, s){ world06p(c, s); };
SCENE_REGISTRY[17] = function(c, s){ world17p(c, s); };
[2,6,17].forEach(function(id){ NEW_SCENE_IDS[id] = 1; delete BREACH_REGISTRY[id]; });
delete BREACH_REGISTRY[9]; delete BREACH_REGISTRY[11];
