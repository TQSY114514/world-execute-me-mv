
/* ============================================================
   47 · PLATES — flat-ink pictures, not diagrams
   ============================================================ */
function facePath(c, x, y, w, h){
  const P = function(u, v){ return [x + u*w, y + v*h]; };
  c.beginPath();
  c.moveTo.apply(c, P(0.355, 0.020));
  c.bezierCurveTo.apply(c, P(0.520,0.020).concat(P(0.600,0.100)).concat(P(0.615,0.245)));
  c.bezierCurveTo.apply(c, P(0.620,0.300).concat(P(0.598,0.335)).concat(P(0.612,0.365)));
  c.bezierCurveTo.apply(c, P(0.660,0.400).concat(P(0.735,0.445)).concat(P(0.735,0.478)));
  c.bezierCurveTo.apply(c, P(0.735,0.505).concat(P(0.665,0.505)).concat(P(0.628,0.518)));
  c.bezierCurveTo.apply(c, P(0.655,0.535).concat(P(0.668,0.552)).concat(P(0.645,0.565)));
  c.bezierCurveTo.apply(c, P(0.662,0.578).concat(P(0.665,0.596)).concat(P(0.638,0.612)));
  c.bezierCurveTo.apply(c, P(0.622,0.645).concat(P(0.600,0.675)).concat(P(0.556,0.695)));
  c.bezierCurveTo.apply(c, P(0.500,0.720).concat(P(0.440,0.735)).concat(P(0.405,0.775)));
  c.lineTo.apply(c, P(0.375, 0.860));
  c.lineTo.apply(c, P(0.360, 1.020));
  c.lineTo.apply(c, P(0.100, 1.020));
  c.bezierCurveTo.apply(c, P(0.090,0.780).concat(P(0.055,0.620)).concat(P(0.075,0.460)));
  c.bezierCurveTo.apply(c, P(0.095,0.260).concat(P(0.200,0.060)).concat(P(0.355,0.020)));
  c.closePath();
}

/* the paper of a plate: dot screen, one flat pool of light, crop marks */
function plateGround(c, lx, ly, base){
  c.fillStyle = base || C.bg; c.fillRect(0, 0, W, H);
  /* light pool: two flat steps, no gradient */
  if (lx != null){
    c.globalAlpha = 0.035; c.fillStyle = C.bone;
    c.beginPath(); c.arc(lx, ly, 560, 0, TAU); c.fill();
    c.globalAlpha = 0.028;
    c.beginPath(); c.arc(lx, ly, 340, 0, TAU); c.fill();
    c.globalAlpha = 1;
  }
  /* 45-degree dot screen */
  c.fillStyle = 'rgba(240,240,242,0.05)';
  c.beginPath();
  for (let j=0, yy=12; yy<H; yy+=24, j++){
    const rad = 1.0 + 1.4 * (yy / H);
    for (let xx = 12 + (j%2)*12; xx < W; xx += 24){
      c.moveTo(xx + rad, yy); c.arc(xx, yy, rad, 0, TAU);
    }
  }
  c.fill();
  /* crop marks + registration target */
  c.globalAlpha = 0.35; c.strokeStyle = C.bone; c.lineWidth = 2;
  const inset = 34, len = 26;
  [[inset,inset,1,1],[W-inset,inset,-1,1],[W-inset,H-inset,-1,-1],[inset,H-inset,1,-1]].forEach(function(m){
    c.beginPath();
    c.moveTo(m[0]+m[2]*8, m[1]+m[3]*8); c.lineTo(m[0]+m[2]*(8+len), m[1]+m[3]*8);
    c.moveTo(m[0]+m[2]*8, m[1]+m[3]*8); c.lineTo(m[0]+m[2]*8, m[1]+m[3]*(8+len));
    c.stroke();
  });
  c.beginPath(); c.arc(W/2, H-inset, 8, 0, TAU); c.stroke();
  c.beginPath(); c.moveTo(W/2-15, H-inset); c.lineTo(W/2+15, H-inset);
  c.moveTo(W/2, H-inset-15); c.lineTo(W/2, H-inset+15); c.stroke();
  c.globalAlpha = 1;
}

/* a row of heads and shoulders — the audience */
function crowdRow(c, baseY, count, scale, col, alpha){
  c.save();
  c.globalAlpha = alpha == null ? 0.75 : alpha;
  c.fillStyle = col;
  for (let i=0;i<count;i++){
    const u = i/(count-1);
    const persp = 0.70 + 0.50 * Math.pow(Math.abs(u - 0.5) * 2, 1.3);
    const s = scale * persp;
    const x = W * (0.03 + 0.94 * u);
    const hy = baseY - 118 * s;

    /* shoulders */
    c.beginPath();
    c.moveTo(x - 92*s, baseY + 60*s);
    c.quadraticCurveTo(x - 78*s, hy + 26*s, x, hy + 30*s);
    c.quadraticCurveTo(x + 78*s, hy + 26*s, x + 92*s, baseY + 60*s);
    c.closePath();
    c.fill();
    /* head */
    c.beginPath();
    c.ellipse(x, hy, 31*s, 37*s, 0, 0, TAU);
    c.fill();
  }
  c.restore();
}

/* a standing figure, front view — head, neck, torso, arms, legs */
function figurePath(c, x0, top, H){
  const u = function(v){ return top + v*H; };
  const w = function(v){ return v*H; };
  /* head */
  c.moveTo(x0 + w(0.050), u(0.066));
  c.ellipse(x0, u(0.066), w(0.050), w(0.066), 0, 0, TAU);
  /* neck */
  c.rect(x0 - w(0.021), u(0.128), w(0.042), w(0.048));
  /* shoulders + torso + hips, one shape (a coat: arms hidden) */
  c.moveTo(x0 - w(0.136), u(0.222));
  c.quadraticCurveTo(x0 - w(0.096), u(0.168), x0 - w(0.026), u(0.163));
  c.lineTo(x0 + w(0.026), u(0.163));
  c.quadraticCurveTo(x0 + w(0.096), u(0.168), x0 + w(0.136), u(0.222));
  c.lineTo(x0 + w(0.104), u(0.320));
  c.lineTo(x0 + w(0.090), u(0.455));
  c.lineTo(x0 + w(0.098), u(0.575));
  c.lineTo(x0 - w(0.098), u(0.575));
  c.lineTo(x0 - w(0.090), u(0.455));
  c.lineTo(x0 - w(0.104), u(0.320));
  c.closePath();
  /* legs */
  c.moveTo(x0 - w(0.092), u(0.582));
  c.lineTo(x0 - w(0.014), u(0.582));
  c.lineTo(x0 - w(0.024), u(1.02));
  c.lineTo(x0 - w(0.082), u(1.02));
  c.closePath();
  c.moveTo(x0 + w(0.014), u(0.582));
  c.lineTo(x0 + w(0.092), u(0.582));
  c.lineTo(x0 + w(0.082), u(1.02));
  c.lineTo(x0 + w(0.024), u(1.02));
  c.closePath();
}

/* the execution plate: one person, a word too big for the room */
function plateExecution(c, t, red){
  const field = red ? C.red : C.bg;
  const ink   = red ? C.bg : C.bone;
  const word  = red ? C.bone : C.red;

  plateGround(c, W*0.5, H*0.46, field);

  /* the word, printed behind the body */
  txt('EXECUTION', W*0.50, H*0.585, word, 186, 800, 'center', 1);
  txt('world.execute(me);', W*0.50, H*0.700, word, 24, 400, 'center', 0.55);

  /* the figure */
  figurePath(c, W*0.50, H*0.075, 940);
  c.fillStyle = ink;
  c.fill();

  /* what is printed on the body */
  c.save();
  figurePath(c, W*0.50, H*0.075, 940);
  c.clip();
  txt('SIGKILL', W*0.50, H*0.290, field, 22, 800, 'center', 0.95);
  txt('PID 3882', W*0.50, H*0.322, field, 11, 400, 'center', 0.6);
  txt('1010 0110 1101 0010', W*0.50, H*0.800, field, 11, 400, 'center', 0.5);
  c.restore();
}

/* the broadcast plate: an audience, seen from the stage */
function plateCrowd(c, t, cover){
  crowdRow(c, H * 0.94, 11, 1.05, C.bone, 0.62);
  crowdRow(c, H * 1.06, 5, 1.75, C.bone, 0.78);
}
