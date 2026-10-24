
/* ============================================================
   61 · POSTER — a plate: paper + giant word + misregistered motif
   ============================================================ */
const PST = {
  paper: '#F2EFE7',
  ink:   '#14130F',
  accent:'#C8452E',
  warm:  '#E8A33D',
  grey:  '#8C8778'
};

/* draw fn three times, out of register, like a print run */
function misregister(c, fn, m, cols){
  const offs = [[m, m*0.35], [-m*0.55, m*0.8], [m*1.7, m*0.95]];
  for (let i=0;i<offs.length;i++){
    c.save();
    c.translate(offs[i][0], offs[i][1]);
    c.globalCompositeOperation = 'multiply';
    c.globalAlpha = 0.55;
    fn(c, cols[i]);
    c.restore();
  }
  c.save();
  fn(c, cols[3]);
  c.restore();
}

/* the giant word at the bottom, full width, with its shadow plate */
function giantWord(c, word, t, opts){
  opts = opts || {};
  const maxW = opts.maxW || 1740;
  const col = opts.col || PST.ink;
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  let size = opts.size || 210;
  c.font = '700 ' + size + 'px "Times New Roman",Georgia,serif';
  while (c.measureText(word).width > maxW && size > 40){
    size -= 6;
    c.font = '700 ' + size + 'px "Times New Roman",Georgia,serif';
  }
  const x = W*0.5, y = opts.y || H*0.90;
  /* shadow plate */
  c.save();
  c.globalAlpha = opts.alpha == null ? 0.9 : opts.alpha;
  c.fillStyle = PST.accent;
  c.fillText(word, x + 7, y + 7);
  c.restore();
  c.save();
  c.globalAlpha = opts.alpha == null ? 0.95 : opts.alpha;
  c.fillStyle = col;
  c.fillText(word, x, y);
  c.restore();
  return size;
}

function posterGround(c, lx, ly, dark){
  c.fillStyle = dark ? '#0B0B0D' : PST.paper;
  c.fillRect(0, 0, W, H);
  if (!dark){
    /* dot screen */
    c.fillStyle = 'rgba(20,19,15,0.07)';
    for (let y=10; y<H; y+=16){
      for (let x=10 + ((y/16)%2)*8; x<W; x+=16){
        c.beginPath(); c.arc(x, y, 1.1, 0, TAU); c.fill();
      }
    }
    /* one pool of light, two flat steps */
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath(); c.arc(lx, ly, 520, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.28)';
    c.beginPath(); c.arc(lx, ly, 330, 0, TAU); c.fill();
  }
  /* crop marks */
  c.strokeStyle = dark ? 'rgba(240,240,242,0.35)' : 'rgba(20,19,15,0.35)';
  c.lineWidth = 2; c.globalAlpha = 0.8;
  const inset = 34, len = 26;
  [[inset,inset,1,1],[W-inset,inset,-1,1],[W-inset,H-inset,-1,-1],[inset,H-inset,1,-1]].forEach(function(m){
    c.beginPath();
    c.moveTo(m[0]+m[2]*8, m[1]+m[3]*8); c.lineTo(m[0]+m[2]*(8+len), m[1]+m[3]*8);
    c.moveTo(m[0]+m[2]*8, m[1]+m[3]*8); c.lineTo(m[0]+m[2]*8, m[1]+m[3]*(8+len));
    c.stroke();
  });
  c.beginPath(); c.arc(W*0.5, H-inset, 8, 0, TAU); c.stroke();
  c.globalAlpha = 1;
}

/* ---------- Seg 11 · SANDBOX as a poster ---------- */
function world11p(c, s){
  const t = s.lt, b = s.beat;
  posterGround(c, W*0.62, H*0.38, false);

  /* the motif: an exploded cube, small, high */
  const cx = W*0.60, cy = H*0.36, R = 190;
  const gap = 0.4 + 0.9 * EASE.out(clamp((t - 0.8) / 3.5, 0, 1));
  const ry = 0.62 + t*0.12, rx = 0.42;
  const drawCube = function(cc, col){
    const N = 2;
    for (let oct=0; oct<8; oct++){
      const ox=(oct&1?1:-1)*gap*0.5, oy=(oct&2?1:-1)*gap*0.5, oz=(oct&4?1:-1)*gap*0.5;
      for (let f=0; f<6; f++){
        for (let i=0;i<N;i++) for (let j=0;j<N;j++){
          const u0=i/N, u1=(i+1)/N, v0=j/N, v1=(j+1)/N;
          const face = function(u,v){
            let p;
            if (f===0) p=[-0.5+u,-0.5+v,-0.5]; else if (f===1) p=[-0.5+u,-0.5+v,0.5];
            else if (f===2) p=[-0.5,-0.5+u,-0.5+v]; else if (f===3) p=[0.5,-0.5+u,-0.5+v];
            else if (f===4) p=[-0.5+u,-0.5,-0.5+v]; else p=[-0.5+u,0.5,-0.5+v];
            return [p[0]*R + ox*R*1.3, p[1]*R + oy*R*1.3, p[2]*R + oz*R*1.3];
          };
          const a=project(face(u0,v0),rx,ry,1400,cx,cy), bb=project(face(u1,v0),rx,ry,1400,cx,cy);
          const d=project(face(u1,v1),rx,ry,1400,cx,cy), e=project(face(u0,v1),rx,ry,1400,cx,cy);
          cc.strokeStyle = col; cc.lineWidth = 1.4;
          cc.beginPath(); cc.moveTo(a.x,a.y); cc.lineTo(bb.x,bb.y); cc.lineTo(d.x,d.y); cc.lineTo(e.x,e.y); cc.closePath(); cc.stroke();
        }
      }
    }
  };
  misregister(c, drawCube, 5, [PST.warm, PST.grey, PST.accent, PST.ink]);

  /* a single red hairline under the motif */
  line(W*0.30, H*0.62, W*0.90, H*0.62, PST.ink, 1, 0.5);

  giantWord(c, 'SANDBOX', t, { y: H*0.90, size: 200 });

  /* meta, tiny, top-left */
  c.textAlign = 'left'; c.font = '11px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = PST.ink; c.globalAlpha = 0.55;
  c.fillText('chroot /sandbox', 44, 46);
  c.fillText('8 octants · 432 faces · egress none', 44, 64);
  c.globalAlpha = 1;
}

/* ---------- Seg 09 · DOPAMINE as a poster ---------- */
function world09p(c, s){
  const t = s.lt, b = s.beat;
  posterGround(c, W*0.5, H*0.40, false);

  const cx = W*0.50, cy = H*0.38;
  const bi = Math.floor(t / 0.4615);
  const shock = springImpulse(t, bi*0.4615, 2.2, 5);
  const R = 110 + 300*clamp((t % 4.6)/4.6, 0, 1);

  const drawBurst = function(cc, col){
    for (let i=0;i<260;i++){
      const a = hash2(i,1) * TAU;
      const rr = Math.pow(hash2(i,2), 0.62) * 330;
      const push = Math.exp(-Math.abs(rr - R)/80) * 34 * shock;
      const x = cx + Math.cos(a) * (rr + push);
      const y = cy + Math.sin(a) * (rr + push) * 0.72;
      cc.fillStyle = col;
      const sz = 2 + 4*(1 - rr/360);
      cc.fillRect(x, y, sz, sz);
    }
  };
  misregister(c, drawBurst, 4, [PST.warm, PST.grey, PST.accent, PST.ink]);

  giantWord(c, 'DOPAMINE', t, { y: H*0.90, size: 200 });

  c.textAlign = 'left'; c.font = '11px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = PST.ink; c.globalAlpha = 0.55;
  c.fillText('900 particles · one release', 44, 46);
  c.textAlign = 'right';
  c.fillText('resonance ' + (0.5 + shock*0.5).toFixed(3), W - 44, 46);
  c.globalAlpha = 1; c.textAlign = 'left';
}

SCENE_REGISTRY[11] = function(c, s){ world11p(c, s); };
SCENE_REGISTRY[9]  = function(c, s){ world09p(c, s); };
NEW_SCENE_IDS[9] = 1;
