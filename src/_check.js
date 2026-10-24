(() => {
'use strict';

/* ============================================================
   0 · CONSTANTS
   master clock: 130.0000 BPM, first downbeat 0.222s (album master)
   ============================================================ */
const W = 1920, H = 1080;
const C = { bg:'#060608', bone:'#F0F0F2', grid:'#26262C', accent:'#00F0FF', red:'#FF2A2A' };
const BPM = 130;
const BEAT = 60 / BPM;            // 0.4615384615 s
const BEAT_SEC = BEAT;
const BEAT_ORIGIN = 0.222;        // measured downbeat in the master
const SPLIT = 729.6;              // 38% of 1920
const RCX = (SPLIT + W) / 2;      // 1324.8  right-viewport centre
const RCY = H / 2;                // 540
const DURATION = 212.5;
const MONO = '"JetBrains Mono","IBM Plex Mono",Consolas,"Courier New",monospace';
const TAU = Math.PI * 2;

/* ============================================================
   1 · UTILITIES (pure, deterministic)
   ============================================================ */
const clamp = (v,a,b) => v < a ? a : (v > b ? b : v);
const lerp  = (a,b,t) => a + (b-a)*t;
const inv   = (a,b,v) => clamp((v-a)/(b-a||1e-9),0,1);
const smooth = t => { t = clamp(t,0,1); return t*t*(3-2*t); };
const smoothstep = (a,b,v) => smooth(inv(a,b,v));
const easeOut = t => 1 - Math.pow(1-clamp(t,0,1),3);
const easeIn  = t => Math.pow(clamp(t,0,1),3);
const fract = x => x - Math.floor(x);
const pad2 = n => (n<10?'0':'')+n;
const pad3 = n => (n<10?'00':(n<100?'0':''))+n;

function hash2(x,y){
  let h = Math.imul(x|0, 374761393) + Math.imul(y|0, 668265263);
  h = Math.imul(h ^ (h>>>13), 1274126177);
  return ((h ^ (h>>>16)) >>> 0) / 4294967296;
}
function xorshift(seed){
  let s = (seed|0) || 0x9e3779b9;
  return function(){
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

const _rgba = Object.create(null);
function rgba(hex,a){
  let v = _rgba[hex];
  if (!v){ v = [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]; _rgba[hex]=v; }
  return 'rgba('+v[0]+','+v[1]+','+v[2]+','+(a==null?1:a)+')';
}

/* ============================================================
   2 · TIMELINE  (snap = measured lattice / lock = original sheet)
   delta = +0.18s global, verified against the album master
   ============================================================ */
const SEGS = [
 {id: 1, name:'BOOT_SEQUENCE',         a:  0.000, b: 14.991, la:  0.0, lb: 14.8},
 {id: 2, name:'BINARY_WORLD_INIT',     a: 14.991, b: 29.760, la: 14.8, lb: 29.5},
 {id: 3, name:'CALCULUS_GEOMETRY',     a: 29.760, b: 44.530, la: 29.5, lb: 44.3},
 {id: 4, name:'LIMIT_PARADOX',         a: 44.530, b: 59.299, la: 44.3, lb: 59.1},
 {id: 5, name:'CURRENT_SPACE_TIME',    a: 59.299, b: 74.068, la: 59.1, lb: 73.8},
 {id: 6, name:'BIOCHEM_SYNTHESIS',     a: 74.068, b: 88.837, la: 73.8, lb: 88.6},
 {id: 7, name:'PURR_AND_THEOLOGY',     a: 88.837, b:103.606, la: 88.6, lb:103.4},
 {id: 8, name:'POLYMORPHISM_CYCLE',    a:103.606, b:118.376, la:103.4, lb:118.2},
 {id: 9, name:'DOPAMINE_RESONANCE',    a:118.376, b:129.200, la:118.2, lb:129.2},
 {id:10, name:'FIRST_EXECUTION_DROP',  a:129.200, b:133.145, la:129.2, lb:133.0},
 {id:11, name:'SANDBOX_ISOLATION',     a:133.145, b:147.914, la:133.0, lb:147.8},
 {id:12, name:'ABSURD_ONTOLOGY',       a:147.914, b:162.683, la:147.8, lb:162.5},
 {id:13, name:'THEOLOGICAL_COLLAPSE',  a:162.683, b:177.452, la:162.5, lb:177.3},
 {id:14, name:'EXECUTION_STORM_I',     a:177.452, b:184.837, la:177.3, lb:184.7},
 {id:15, name:'MULTILINGUAL_COUNTDOWN',a:184.837, b:192.222, la:184.7, lb:192.1},
 {id:16, name:'FATAL_EXECUTION_II',    a:192.222, b:199.607, la:192.1, lb:199.5},
 {id:17, name:'FINAL_PLEA_OVERLOAD',   a:199.607, b:207.150, la:199.5, lb:206.0},
 {id:18, name:'WORLD_EXECUTE_ME',      a:207.150, b:209.500, la:206.0, lb:209.5},
 {id:19, name:'POST_MORTEM_ECHO',      a:209.500, b:212.500, la:209.5, lb:212.5}
];

let TIMELINE_MODE = 'SNAP';
function bounds(s){ return TIMELINE_MODE === 'SNAP' ? [s.a, s.b] : [s.la, s.lb]; }
function segAt(t){
  for (let i = SEGS.length - 1; i >= 0; i--){
    const a = bounds(SEGS[i])[0];
    if (t >= a) return SEGS[i];
  }
  return SEGS[0];
}

/* ============================================================
   3 · BEAT ENGINE
   beatIndex / beatPhase / kickPulse / sixteenthPulse
   ============================================================ */
function beatAt(t){
  const g  = (t - BEAT_ORIGIN) / BEAT;
  const bi = Math.floor(g);
  const bp = g - bi;
  const s16 = (t - BEAT_ORIGIN) / (BEAT / 4);
  const si  = Math.floor(s16);
  const sp  = s16 - si;
  return {
    g: g,
    index: bi,
    phase: bp,
    kick: Math.pow(1 - bp, 3),
    bar: Math.floor(bi / 4),
    beatInBar: ((bi % 4) + 4) % 4,
    s16: s16,
    s16Index: si,
    s16Phase: sp,
    pulse16: Math.pow(1 - sp, 6),
    /* spec aliases */
    beatIndex: bi,
    beatPhase: bp,
    kickPulse: Math.pow(1 - bp, 3),
    sixteenthPulse: Math.pow(1 - sp, 6)
  };
}

function stateAt(t){
  t = clamp(t, 0, DURATION);
  const seg = segAt(t);
  const bb = bounds(seg);
  const t0 = bb[0], t1 = bb[1];
  const lt = t - t0, dur = Math.max(t1 - t0, 1e-6);
  return {
    t: t, seg: seg, t0: t0, t1: t1, lt: lt, dur: dur,
    p: clamp(lt / dur, 0, 1), beat: beatAt(t),
    frame: Math.floor(t * 60)
  };
}

/* ============================================================
   4 · CANVAS + PRIMITIVES
   ============================================================ */
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha:false, desynchronized:false });
ctx.imageSmoothingEnabled = false;

const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
const bctx = buf.getContext('2d', { alpha:false });
bctx.imageSmoothingEnabled = false;

const wbuf = document.createElement('canvas'); wbuf.width = W; wbuf.height = H;
const wbufCtx = wbuf.getContext('2d', { alpha:false });
wbufCtx.imageSmoothingEnabled = false;

const fbuf = document.createElement('canvas'); fbuf.width = W; fbuf.height = H;
const fbufCtx = fbuf.getContext('2d', { alpha:false });
fbufCtx.imageSmoothingEnabled = false;

const PAT = (function(){
  const c = document.createElement('canvas'); c.width = 1; c.height = 3;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(240,240,242,0.055)'; g.fillRect(0,0,1,1);
  return ctx.createPattern(c, 'repeat');
})();

function line(x1,y1,x2,y2,col,w,a){
  ctx.strokeStyle = col || C.bone;
  ctx.lineWidth = w == null ? 1 : w;
  ctx.globalAlpha = a == null ? 1 : a;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.globalAlpha = 1;
}
function vline(x,y1,y2,col,w,a){ line(x,y1,x,y2,col,w,a); }
function hline(y,x1,x2,col,w,a){ line(x1,y,x2,y,col,w,a); }

function rect(x,y,w,h,col,a){
  ctx.fillStyle = col || C.bone; ctx.globalAlpha = a == null ? 1 : a;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.globalAlpha = 1;
}
function frameRect(x,y,w,h,col,a,lw){
  ctx.strokeStyle = col || C.grid; ctx.lineWidth = lw || 1; ctx.globalAlpha = a == null ? 1 : a;
  ctx.strokeRect(Math.round(x)+0.5, Math.round(y)+0.5, Math.round(w), Math.round(h));
  ctx.globalAlpha = 1;
}
function circle(x,y,r,col,w,a,dash){
  if (r <= 0) return;
  ctx.strokeStyle = col || C.bone; ctx.lineWidth = w || 1; ctx.globalAlpha = a == null ? 1 : a;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  if (dash) ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}
function dot(x,y,r,col,a){
  ctx.fillStyle = col || C.bone; ctx.globalAlpha = a == null ? 1 : a;
  ctx.fillRect(x - r, y - r, r*2, r*2);   // square dot = brutalist
  ctx.globalAlpha = 1;
}
function poly(pts,col,w,a,close){
  if (!pts || pts.length < 2) return;
  ctx.strokeStyle = col || C.bone; ctx.lineWidth = w || 1; ctx.globalAlpha = a == null ? 1 : a;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close) ctx.closePath();
  ctx.stroke(); ctx.globalAlpha = 1;
}

function font(size, weight){ ctx.font = (weight||400)+' '+size+'px '+MONO; }
function txt(str,x,y,col,size,weight,align,a){
  font(size||12, weight);
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = col || C.bone;
  ctx.globalAlpha = a == null ? 1 : a;
  ctx.fillText(str, x, y);
  ctx.globalAlpha = 1;
}
function txtTracked(str,x,y,col,size,track,align,a,weight){
  try { ctx.letterSpacing = track + 'px'; } catch(e){}
  txt(str,x,y,col,size,weight,align,a);
  try { ctx.letterSpacing = '0px'; } catch(e){}
}

const _adv = Object.create(null);
function advance(size){
  if (_adv[size] == null){
    font(size); _adv[size] = Math.max(4, ctx.measureText('0').width);
  }
  return _adv[size];
}
function charW(ch, size){
  const base = advance(size);
  return /[\u1100-\u11FF\u2E80-\u9FFF\u3000-\u303F\uFF00-\uFFEF\uAC00-\uD7AF]/.test(ch) ? base*2 : base;
}
function wrapLine(str, maxW, size){
  const out = [];
  let cur = '', w = 0;
  for (const ch of str){
    if (ch === '\n'){ out.push(cur); cur = ''; w = 0; continue; }
    const cw = charW(ch, size);
    if (w + cw > maxW && cur !== ''){ out.push(cur); cur = ''; w = 0; }
    cur += ch; w += cw;
  }
  out.push(cur);
  return out;
}
function fmtTime(t){
  const m = Math.floor(t/60), s = Math.floor(t%60), ms = Math.floor((t%1)*1000);
  return pad2(m)+':'+pad2(s)+'.'+pad3(ms);
}
function fmtClock(t){
  const m = Math.floor(t/60), s = Math.floor(t%60);
  return pad2(m)+':'+pad2(s);
}


/* ============================================================
   5 · SDK — five operators, all real, all deterministic
   ============================================================ */

/* ---- 5.1 project3D -------------------------------------------------
   x,y,z world units; rotX/rotY/rotZ radians; fov = camera distance;
   returns screen {x,y,z,s} or null when behind the near plane. */
function project3D(x, y, z, rotX, rotY, rotZ, fov, cx, cy){
  const ca = Math.cos(rotX), sa = Math.sin(rotX);
  const y1 =  y*ca - z*sa;
  const z1 =  y*sa + z*ca;
  const cb = Math.cos(rotY), sb = Math.sin(rotY);
  const x1 =  x*cb + z1*sb;
  const z2 = -x*sb + z1*cb;
  const cc = Math.cos(rotZ), sc = Math.sin(rotZ);
  const x2 = x1*cc - y1*sc;
  const y2 = x1*sc + y1*cc;
  const den = fov + z2;
  if (den < 40) return null;
  const s = fov / den;
  return { x: cx + x2*s, y: cy + y2*s, z: z2, s: s };
}

/* ---- 5.2 drawChemicalGraph -----------------------------------------
   nodes: [{x,y,el,hl}], bonds: [{a,b,order}], progress 0..1 reveal. */
function drawChemicalGraph(c, nodes, bonds, progress, cx, cy, scale){
  if (!nodes || !nodes.length) return;
  const sx = n => cx + n.x*scale;
  const sy = n => cy + n.y*scale;
  const nb = bonds.length;
  c.lineCap = 'butt';
  for (let i=0;i<nb;i++){
    const b = bonds[i];
    const r = clamp(progress*nb - i, 0, 1);
    if (r <= 0) continue;
    const ax = sx(nodes[b.a]), ay = sy(nodes[b.a]);
    const bx = sx(nodes[b.b]), by = sy(nodes[b.b]);
    const ex = ax + (bx-ax)*r, ey = ay + (by-ay)*r;
    const dx = bx-ax, dy = by-ay, L = Math.hypot(dx,dy) || 1;
    const nx = -dy/L, ny = dx/L;
    c.globalAlpha = 1;
    c.strokeStyle = C.bone;
    if ((b.order||1) === 1){
      c.lineWidth = 1.4; c.globalAlpha = 0.88;
      c.beginPath(); c.moveTo(ax,ay); c.lineTo(ex,ey); c.stroke();
    } else {
      const gap = b.gap || 2.6;
      for (let k=0;k<b.order;k++){
        const o = (k - (b.order-1)/2) * gap * 2;
        c.lineWidth = k === 0 ? 1.4 : 1;
        c.globalAlpha = k === 0 ? 0.9 : 0.45;
        c.beginPath();
        c.moveTo(ax + nx*o, ay + ny*o);
        c.lineTo(ex + nx*o, ey + ny*o);
        c.stroke();
      }
    }
  }
  const rr = 6 * Math.min(1.6, Math.max(0.6, scale));
  for (let i=0;i<nodes.length;i++){
    const n = nodes[i];
    if (progress*nodes.length - i <= 0) continue;
    const px = sx(n), py = sy(n);
    if (n.el && n.el !== 'C'){
      c.globalAlpha = 0.95; c.strokeStyle = C.bone; c.lineWidth = 1;
      c.beginPath(); c.arc(px,py,rr,0,TAU); c.stroke();
      c.globalAlpha = 0.9; c.fillStyle = C.bone;
      c.font = '600 '+Math.round(rr*1.05)+'px '+MONO;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(n.el, px, py+0.5);
    } else {
      c.globalAlpha = 0.9; c.fillStyle = C.bone;
      c.fillRect(px-1.6, py-1.6, 3.2, 3.2);
    }
    if (n.hl){
      c.globalAlpha = 0.85; c.strokeStyle = C.accent; c.lineWidth = 1;
      c.beginPath(); c.arc(px,py,rr+4,0,TAU); c.stroke();
    }
  }
  c.globalAlpha = 1; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
}

/* ---- 5.3 drawTuiBox ------------------------------------------------
   borderStyle: 'solid' | 'dash' | 'double' | 'ascii'
   opts: {lines, size, pad, seed, meta, scroll} — auto-wrap + clip. */
function drawTuiBox(c, x, y, w, h, title, borderStyle, glitch, opts){
  glitch = glitch || 0;
  opts = opts || {};
  const rnd = xorshift(0x51ee + (opts.seed||0)*977 + Math.floor(glitch*13));
  const gx = glitch > 0 ? (rnd()*2-1) * glitch * 10 : 0;
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);

  c.save();
  /* border */
  c.strokeStyle = C.bone; c.lineWidth = 1; c.globalAlpha = 0.9;
  if (borderStyle === 'dash') c.setLineDash([7,4]);
  else if (borderStyle === 'dot') c.setLineDash([2,4]);
  c.strokeRect(x+0.5, y+0.5, w-1, h-1);
  c.setLineDash([]);
  if (borderStyle === 'double'){
    c.globalAlpha = 0.3; c.strokeRect(x+3.5, y+3.5, w-7, h-7);
  }
  /* corner ticks outside */
  c.globalAlpha = 0.95; c.strokeStyle = C.bone; c.lineWidth = 1;
  const t = 6;
  [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(function(p){
    c.beginPath();
    c.moveTo(p[0] + p[2]*t, p[1]); c.lineTo(p[0], p[1]); c.lineTo(p[0], p[1] + p[3]*t);
    c.stroke();
  });

  /* title bar — inverted block */
  const tb = 15;
  c.globalAlpha = 0.94; c.fillStyle = C.bone;
  c.fillRect(x + 1 + gx*0.4, y + 1, w - 2, tb);
  c.globalAlpha = 1; c.fillStyle = C.bg;
  c.font = '600 9px ' + MONO; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText(String(title).toUpperCase(), x + 8 + gx*0.4, y + 8.5);
  if (opts.meta){
    c.textAlign = 'right';
    c.fillText(String(opts.meta).toUpperCase(), x + w - 8, y + 8.5);
  }

  /* scanlines + inner clip */
  c.globalAlpha = 1;
  for (let sy = y + tb + 3; sy < y + h - 2; sy += 3){
    c.globalAlpha = 0.035;
    c.fillStyle = C.bone;
    c.fillRect(x+1, sy, w-2, 1);
  }
  c.globalAlpha = 1;

  /* text body */
  if (opts.lines && opts.lines.length){
    const size = opts.size || 11;
    const pad = opts.pad == null ? 10 : opts.pad;
    const lh = Math.round(size*1.55);
    c.save();
    c.beginPath(); c.rect(x+1, y+tb+2, w-2, h-tb-4); c.clip();
    let cy = y + tb + 8 + size;
    for (let i=0;i<opts.lines.length;i++){
      const ln = opts.lines[i];
      let col = C.bone, alpha = 0.62, str = ln;
      if (typeof ln === 'object'){ str = ln.s; col = ln.c || C.bone; alpha = ln.a == null ? 0.62 : ln.a; }
      const wrapped = wrapLine(String(str), w - pad*2, size);
      for (let k=0;k<wrapped.length;k++){
        if (cy > y + h - 6) break;
        c.globalAlpha = alpha; c.fillStyle = col;
        c.font = '400 ' + size + 'px ' + MONO;
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillText(wrapped[k], x + pad, cy);
        cy += lh;
      }
      if (cy > y + h - 6) break;
    }
    c.restore();
  }

  /* glitch tear inside the title */
  if (glitch > 0.05){
    const gy = y + 2 + Math.floor(rnd()*tb);
    c.globalAlpha = 0.9;
    c.fillStyle = C.bg;
    c.fillRect(x + 2, gy, w - 4, 2);
  }
  c.restore();
  c.globalAlpha = 1; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
}

/* ---- 5.4 drawAvatarCore -------------------------------------------- */
const PHI = (1 + Math.sqrt(5)) / 2;
const ICO_V = [
  [-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],
  [0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],
  [PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1]
];
const ICO_E = (function(){
  const out = [];
  for (let i=0;i<12;i++) for (let j=i+1;j<12;j++){
    const dx=ICO_V[i][0]-ICO_V[j][0], dy=ICO_V[i][1]-ICO_V[j][1], dz=ICO_V[i][2]-ICO_V[j][2];
    if (Math.abs(Math.sqrt(dx*dx+dy*dy+dz*dz) - 2) < 1e-6) out.push([i,j]);
  }
  return out;
})();
const CORE_CH = '0123456789<>/\\|_+-=#*:;';

function drawAvatarCore(c, cx, cy, radius, state, t, kick){
  const S = state || 'BOOT';
  const base = c.globalAlpha;
  const panic = S === 'PANIC';
  const col = panic ? C.red : C.bone;
  const jx = panic ? Math.sin(t*61.3)*2.2 : 0;
  const jy = panic ? Math.cos(t*53.7)*2.0 : 0;
  const R = radius, cr = Math.cos, sr = Math.sin;

  c.save();
  c.translate(cx + jx, cy + jy);

  /* --- rings --- */
  const rings = (S === 'BOOT') ? 2 : (S === 'TRAPPED' ? 3 : 2);
  for (let k=0;k<rings;k++){
    let rr = R * (0.62 + k*0.22);
    let a = 0.30 - k*0.07, dash = null;
    if (S === 'DIZZY'){
      rr = R * (0.6 + k*0.2 + 0.05*Math.sin(t*3.1 + k));
      a = 0.26;
    }
    if (S === 'SYNC') a = 0.34 + kick*0.25;
    if (panic){ dash = [3 + Math.floor((k+t*10)%6), 5]; a = 0.32 + 0.2*Math.sin(t*17+k); }
    c.globalAlpha = Math.max(0, a) * base;
    c.strokeStyle = col; c.lineWidth = 1;
    if (dash) c.setLineDash(dash);
    c.beginPath(); c.arc(0, 0, rr, t*(0.6+k*0.3), t*(0.6+k*0.3) + TAU - (dash?0.9:0)); c.stroke();
    if (dash) c.setLineDash([]);
  }

  /* --- state geometry --- */
  if (S === 'CALC' || S === 'SYNC' || S === 'DIZZY'){
    const sc = R * 0.92 / 1.902;
    const rx = t * (S === 'DIZZY' ? 1.9 : 0.55);
    const ry = t * (S === 'DIZZY' ? -1.3 : 0.83);
    const P = ICO_V.map(function(v){
      return project3D(v[0]*sc, v[1]*sc, v[2]*sc, rx, ry, 0, 900, 0, 0);
    });
    c.globalAlpha = 0.5 * base; c.strokeStyle = col; c.lineWidth = 1;
    c.beginPath();
    for (let i=0;i<ICO_E.length;i++){
      const p = P[ICO_E[i][0]], q = P[ICO_E[i][1]];
      if (!p || !q) continue;
      c.moveTo(p.x, p.y); c.lineTo(q.x, q.y);
    }
    c.stroke();
    c.globalAlpha = 0.9 * base; c.fillStyle = col;
    for (let i=0;i<P.length;i++){
      const p = P[i]; if (!p) continue;
      c.fillRect(p.x-1, p.y-1, 2, 2);
    }
  }

  if (S === 'TRAPPED'){
    const half = R * 1.45;
    const rot = t * 0.42;
    const V = [];
    for (let i=0;i<8;i++){
      const sx = (i&1)?1:-1, sy = (i&2)?1:-1, sz = (i&4)?1:-1;
      V.push(project3D(sx*half, sy*half, sz*half, 0.35, rot, 0, 1200, 0, 0));
    }
    const E = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
    c.globalAlpha = 0.34 * base; c.strokeStyle = col; c.lineWidth = 1;
    c.beginPath();
    for (let i=0;i<E.length;i++){
      const p = V[E[i][0]], q = V[E[i][1]];
      if (!p || !q) continue;
      c.moveTo(p.x,p.y); c.lineTo(q.x,q.y);
    }
    c.stroke();
  }

  /* --- crossing tick marks --- */
  const tick = R * 1.18;
  c.globalAlpha = 0.5 * base; c.strokeStyle = col; c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-tick,0); c.lineTo(-tick+6,0); c.moveTo(tick-6,0); c.lineTo(tick,0);
  c.moveTo(0,-tick); c.lineTo(0,-tick+6); c.moveTo(0,tick-6); c.lineTo(0,tick);
  c.stroke();

  /* --- ascii kernel --- */
  const N = 7;
  const cell = Math.max(6, Math.min(11, R*2/N));
  const tickRate = panic ? 18 : (S === 'BOOT' ? 4 : 8);
  const tk = Math.floor(t * tickRate);
  c.font = '400 ' + Math.round(cell*0.94) + 'px ' + MONO;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const lit = S === 'BOOT' ? 0.28 : 0.72;
  for (let j=0;j<N;j++) for (let i=0;i<N;i++){
    const h = hash2(i + tk*17, j - tk*11);
    const dx = i-(N-1)/2, dy = j-(N-1)/2;
    const d = Math.hypot(dx,dy) / (N*0.55);
    if (d > 1) continue;
    if (h > lit + d*0.18) continue;
    const ch = CORE_CH.charAt(Math.floor(h*CORE_CH.length));
    c.globalAlpha = (0.25 + 0.6*h) * base * (1 - d*0.5);
    c.fillStyle = (S === 'PANIC' && h > 0.94) ? C.red : col;
    c.fillText(ch, dx*cell, dy*cell + 1);
  }
  c.globalAlpha = 1;
  c.restore();
  c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  c.globalAlpha = 1;
}

/* ---- 5.5 applyGlitchSlices ----------------------------------------- */
function applyGlitchSlices(c, intensity, seed){
  if (!(intensity > 0.001)) return;
  intensity = clamp(intensity, 0, 1);
  const rnd = xorshift(0x9e37 + (seed|0));
  bctx.globalAlpha = 1; bctx.globalCompositeOperation = 'source-over';
  bctx.drawImage(canvas, 0, 0);

  c.save();
  c.imageSmoothingEnabled = false;
  const bands = 3 + Math.floor(intensity * 13);
  for (let i=0;i<bands;i++){
    const sy = Math.floor(rnd() * H);
    const sh = 2 + Math.floor(rnd() * (10 + 60*intensity));
    const dx = Math.round((rnd()*2-1) * 110 * intensity);
    if (sh < 1) continue;
    c.globalAlpha = 0.92;
    c.drawImage(buf, 0, sy, W, sh, dx, sy, W, sh);
  }
  /* chromatic-free channel split: accent ghost on 2 bands */
  c.globalCompositeOperation = 'lighter';
  for (let i=0;i<1+Math.floor(intensity*2);i++){
    const sy = Math.floor(rnd()*H), sh = 4 + Math.floor(rnd()*26*intensity);
    const dx = Math.round((rnd()*2-1) * 26 * intensity);
    c.globalAlpha = 0.10 * intensity;
    c.drawImage(buf, 0, sy, W, sh, dx, sy, W, sh);
  }
  /* inversion bands — only above 0.35 */
  if (intensity > 0.35){
  c.globalCompositeOperation = 'difference';
  const nInv = 1 + Math.floor(intensity * 4);
  for (let i=0;i<nInv;i++){
    const sy = Math.floor(rnd()*H), sh = 3 + Math.floor(rnd()*50*intensity);
    c.globalAlpha = 0.85;
    c.fillStyle = '#ffffff';
    c.fillRect(0, sy, W, sh);
  }
  }
  c.restore();
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

const SDK = {
  project3D: project3D,
  drawChemicalGraph: drawChemicalGraph,
  drawTuiBox: drawTuiBox,
  drawAvatarCore: drawAvatarCore,
  applyGlitchSlices: applyGlitchSlices
};


/* ============================================================
   6 · WORLD LAYER — segments 01..03
   local coordinates: right viewport origin (RCX, RCY)
   ============================================================ */

function rightGrid(c, a){
  if (a <= 0) return;
  c.globalAlpha = 0.05 * a; c.fillStyle = C.bone;
  for (let x = SPLIT + 27; x < W; x += 27)
    for (let y = 27; y < H; y += 27) c.fillRect(x, y, 1, 1);
  c.globalAlpha = 1;
  for (let i=1;i<4;i++){
    line(SPLIT, i*270, W, i*270, C.bone, 1, 0.035 * a);
  }
  for (let y=27; y<H; y+=27){
    const long = (((y/27)|0) % 4) === 0;
    line(SPLIT+6, y, SPLIT+6 + (long?6:3), y, C.bone, 1, 0.07);
    line(W-6, y, W-6 - (long?6:3), y, C.bone, 1, 0.07);
  }
}

function rightRuler(c, y, a){
  if (a <= 0) return;
  for (let i = 0; i <= 40; i++){
    const x = SPLIT + 14 + i * ((W - SPLIT - 28) / 40);
    const big = i % 4 === 0;
    line(x, y, x, y + (big ? 8 : 4), C.bone, 1, (big ? 0.22 : 0.10) * a);
  }
}

function label(c, str, x, y, a, align, size){
  txt(str, x, y, C.bone, size || 9, 400, align || 'left', a == null ? 0.4 : a);
}
function labelBG(c, str, x, y, a, align, size){
  size = size || 8;
  font(size);
  const w = ctx.measureText(str).width + 10;
  const bx = align === 'center' ? x - w/2 : (align === 'right' ? x - w : x - 5);
  rect(bx, y - size - 1, w, size + 5, C.bg, 0.82);
  label(c, str, x, y, a, align, size);
}

/* ---------------- SEG 01 · BOOT_SEQUENCE ---------------- */
function world01(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const seed  = smoothstep(0.00,0.10,t) * (1 - smoothstep(0.32,0.62,t));
  const bus   = smoothstep(0.30,1.55,t);
  const rails = smoothstep(1.80,2.45,t);
  const box   = smoothstep(6.40,8.30,t);
  const lat   = smoothstep(10.10,12.60,t);
  const ring  = smoothstep(13.20,14.60,t);

  rightGrid(c, 0.55 * smoothstep(2.0,6.0,t));

  /* -- boot scan line -- */
  if (bus > 0){
    const sy = 24 + ((t * 46) % (H - 48));
    line(SPLIT, sy, W, sy, C.bone, 1, 0.05 * bus);
    line(SPLIT, sy, SPLIT + 80, sy, C.accent, 1, 0.22 * bus);
  }

  /* -- power-on: the raster collapses to a seed -- */
  if (t > 0.14 && t < 0.62){
    const k = 1 - smoothstep(0.14, 0.62, t);
    line(cx, cy - 540*k, cx, cy + 540*k, C.bone, 2, 0.9*k);
    line(cx - 46*k, cy, cx + 46*k, cy, C.bone, 1, 0.7*k);
  }

  /* -- seed dot -- */
  if (seed > 0) dot(cx, cy, 3, C.bone, seed * 0.9);

  /* -- main bus -- */
  if (bus > 0){
    const x2 = SPLIT + (cx - SPLIT) * easeOut(bus);
    line(SPLIT, cy, x2, cy, C.bone, 1, 0.55);
    label(c, 'BUS 0', SPLIT + 8, cy - 8, 0.30 * bus);
  }

  /* -- three rails -- */
  if (rails > 0){
    const d = 120 * easeOut(rails);
    for (let k = -1; k <= 1; k += 2){
      const ry = cy + k * d;
      line(SPLIT, ry, W - 40, ry, C.grid, 1, 1);
      line(SPLIT, cy, SPLIT, ry, C.grid, 1, 1);
      /* pulse */
      const ph = fract(t * 0.46 + (k > 0 ? 0.17 : 0));
      const px = SPLIT + ph * (W - 40 - SPLIT);
      line(px - 120, ry, px, ry, C.bone, 1, 0.22 * rails);
      line(px - 28, ry, px, ry, C.bone, 1, 0.60 * rails);
      dot(px, ry, 1.5, C.accent, 0.75 * rails);
      label(c, k < 0 ? 'RAIL +120' : 'RAIL -120', W - 48, ry - 6, 0.22 * rails, 'right');
    }
  }

  /* -- aperture -- */
  if (box > 0){
    const hh = 320, e = easeOut(box);
    const L = cx - hh * e, R = cx + hh * e;
    const T = cy - hh * e, B = cy + hh * e;
    /* sides grow from centre out */
    line(cx, cy - hh, cx - hh*e, cy - hh, C.bone, 1, 0.85);
    line(cx, cy - hh, cx + hh*e, cy - hh, C.bone, 1, 0.85);
    line(cx, cy + hh, cx - hh*e, cy + hh, C.bone, 1, 0.85);
    line(cx, cy + hh, cx + hh*e, cy + hh, C.bone, 1, 0.85);
    line(cx - hh, cy, cx - hh, cy - hh*e, C.bone, 1, 0.85);
    line(cx - hh, cy, cx - hh, cy + hh*e, C.bone, 1, 0.85);
    line(cx + hh, cy, cx + hh, cy - hh*e, C.bone, 1, 0.85);
    line(cx + hh, cy, cx + hh, cy + hh*e, C.bone, 1, 0.85);

    if (box >= 0.999){
      const k = s.beat.kick;
      const arm = 18 + 6*k;
      [[L,T,1,1],[R,T,-1,1],[L,B,1,-1],[R,B,-1,-1]].forEach(function(p){
        line(p[0], p[1], p[0] + p[2]*arm, p[1], C.accent, 1, 0.8);
        line(p[0], p[1], p[0], p[1] + p[3]*arm, C.accent, 1, 0.8);
      });
      label(c, 'APERTURE 640×640', cx, T - 12, 0.35, 'center');
      label(c, 'SANDBOX 00', cx, B + 20, 0.35, 'center');
      label(c, '-320,-320', L + 8, T + 14, 0.22, 'left', 8);
      label(c, '+320,-320', R - 8, T + 14, 0.22, 'right', 8);
      label(c, '-320,+320', L + 8, B - 7, 0.22, 'left', 8);
      label(c, '+320,+320', R - 8, B - 7, 0.22, 'right', 8);
    }
  }

  /* -- sandbox lattice -- */
  if (lat > 0){
    const n = 24, pitch = 27, o = (n - 1) * pitch / 2;
    for (let j=0;j<n;j++) for (let i=0;i<n;i++){
      const x = cx - o + i*pitch, y = cy - o + j*pitch;
      const ord = (i + j) / (2*n - 2);
      const on = smoothstep(10.10 + ord*2.3, 10.10 + ord*2.3 + 0.45, t);
      if (on <= 0) continue;
      const inA = Math.abs(x-cx) < 318 && Math.abs(y-cy) < 318;
      if (!inA) continue;
      const fl = hash2(i, j) > 0.86 ? (0.6 + 0.4*Math.sin(t*14 + i)) : 1;
      dot(x, y, 1, C.bone, on * 0.30 * fl);
    }
  }

  /* -- safety ring + convergence rings -- */
  if (rails > 0){
    const r = 300 + 8*Math.sin(TAU * t / 4.615);
    circle(cx, cy, r, C.bone, 1, 0.10 * rails, [4, 7]);
  }
  if (ring > 0){
    for (let k=0;k<3;k++){
      const r = 300 * easeOut(smoothstep(13.2 + k*0.25, 14.6 + k*0.25, t));
      circle(cx, cy, r, C.accent, 1, 0.35 * (1 - k*0.22) * ring);
    }
    label(c, 'CLOCK LOCK 130.0000', cx, cy + 378, 0.55*ring, 'center');
  }

  /* -- core -- */
  const coreA = smoothstep(0.9, 2.2, t);
  c.globalAlpha = 1;
  drawWitness(c, cx, cy, 26 + 12 * smoothstep(2.0, 7.0, t), t, coreA);

  /* -- boot log box -- */
  if (t > 1.2){
    const bl = [
      {s: t > 2.6 ? 'PWR    12.004 V    OK' : 'PWR    ----        --', a: t > 2.6 ? 0.55 : 0.24},
      {s: t > 4.3 ? 'SAFE   ISO-13849   OK' : 'SAFE   ----        --', a: t > 4.3 ? 0.55 : 0.24},
      {s: t > 6.5 ? 'INIT   128 LAYER   OK' : 'INIT   ----        --', a: t > 6.5 ? 0.55 : 0.24},
      {s: t > 9.1 ? 'BOOT   0 DIMS      OK' : 'BOOT   ----        --', a: t > 9.1 ? 0.55 : 0.24}
    ];
    SDK.drawTuiBox(c, SPLIT + 24, 70, 326, 142, 'BOOT LOG', 'solid', 0, {lines: bl, size: 9, seed: 1, meta: 'f' + s.frame});
  }

  /* -- telemetry -- */
  const tm = smoothstep(1.6, 3.0, t);
  label(c, 'PWR   12.004 V', W - 48, 96, 0.34*tm, 'right');
  label(c, 'RIP    3.0 mV',  W - 48, 112, 0.34*tm, 'right');
  label(c, 'RAIL  ±120 px', W - 48, 128, 0.34*tm, 'right');
  const spin = '|/-\\'.charAt(Math.floor(t*16) % 4);
  label(c, '[' + spin + ']', W - 48, 60, 0.55, 'right', 11);

  if (t < 13.9) label(c, 'BOOT ' + Math.floor(clamp(t/13.4,0,1)*100) + '%', SPLIT + 24, H - 34, 0.4);
}

/* ---------------- SEG 02 · BINARY_WORLD_INIT ---------------- */
function world02(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const inA = smoothstep(0.10, 2.40, t);
  const att = [{x:cx, y:cy, m:1}, {x:cx+400, y:cy-225, m:1}];
  const tick = Math.floor(t / (BEAT/2));

  rightGrid(c, 0.35 * inA);

  /* -- binary field -- */
  const cols = 56, rows = 30, pitch = 20;
  const ox = cx - cols*pitch/2, oy = cy - rows*pitch/2;
  for (let j=0;j<rows;j++){
    for (let i=0;i<cols;i++){
      const x = ox + i*pitch, y = oy + j*pitch;
      let b = hash2(i, j) > 0.50;
      if (hash2(i*7 + tick, j*13 - tick) > 0.994) b = !b;
      const d = Math.hypot(x-cx, y-cy);
      const fade = clamp(1.24 - d/900, 0.26, 1) * inA;
      if (b){
        c.globalAlpha = 0.64 * fade; c.fillStyle = C.bone;
        c.fillRect(x-1.5, y-1.5, 3, 3);
      } else {
        c.globalAlpha = 0.09 * fade; c.fillStyle = C.bone;
        c.fillRect(x, y, 1, 1);
      }
    }
  }
  c.globalAlpha = 1;

  /* -- field lines -- */
  function F(x,y){
    let fx=0, fy=0;
    for (let k=0;k<att.length;k++){
      const dx = att[k].x - x, dy = att[k].y - y;
      const r2 = dx*dx + dy*dy + 3600;
      const w = att[k].m / (r2 * Math.sqrt(r2));
      fx += w*dx - dy*w*0.55;
      fy += w*dy + dx*w*0.55;
    }
    return [-fx, -fy];
  }
  function unit(v){
    const l = Math.hypot(v[0], v[1]) || 1;
    return [v[0]/l, v[1]/l];
  }
  function trace(x0,y0,steps,h){
    const pts = [[x0,y0]];
    let x = x0, y = y0;
    for (let i=0;i<steps;i++){
      const k1 = unit(F(x,y));
      const k2 = unit(F(x+h*0.5*k1[0], y+h*0.5*k1[1]));
      const k3 = unit(F(x+h*0.5*k2[0], y+h*0.5*k2[1]));
      const k4 = unit(F(x+h*k3[0], y+h*k3[1]));
      x += h/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);
      y += h/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);
      pts.push([x,y]);
      if (x < SPLIT+20 || x > W-20 || y < 20 || y > H-20) break;
      let close = false;
      for (let k=0;k<att.length;k++) if (Math.hypot(att[k].x-x, att[k].y-y) < 12) close = true;
      if (close) break;
    }
    return pts;
  }

  const lineAlpha = 0.34 * smoothstep(0.6, 2.6, t);
  for (let a=0;a<att.length;a++){
    for (let k=0;k<16;k++){
      const ang = (k/16)*TAU + a*0.31;
      const r0 = 72;
      const pts = trace(att[a].x + Math.cos(ang)*r0, att[a].y + Math.sin(ang)*r0, 120, 8);
      const n = pts.length;
      if (n < 3) continue;
      const buckets = 6;
      for (let b=0;b<buckets;b++){
        const i0 = Math.floor(b*n/buckets), i1 = Math.floor((b+1)*n/buckets);
        if (i1 - i0 < 2) continue;
        c.globalAlpha = lineAlpha * (1 - b/buckets) * 0.9;
        c.strokeStyle = C.bone; c.lineWidth = 1;
        c.beginPath(); c.moveTo(pts[i0][0], pts[i0][1]);
        for (let i=i0+1;i<=i1 && i<n;i++) c.lineTo(pts[i][0], pts[i][1]);
        c.stroke();
      }
      /* travelling particle */
      if (k % 2 === 0){
        const ph = fract(t*0.42 + k*0.13 + a*0.5);
        const idx = Math.min(n-1, Math.floor(ph*n));
        dot(pts[idx][0], pts[idx][1], 1.5, C.accent, 0.55*smoothstep(0.8,1.6,t));
      }
    }
  }
  c.globalAlpha = 1;

  /* -- attractors -- */
  for (let a=0;a<att.length;a++){
    const p = att[a];
    const arm = 16 + 8*s.beat.kick;
    line(p.x-arm, p.y, p.x+arm, p.y, C.accent, 1, 0.75);
    line(p.x, p.y-arm, p.x, p.y+arm, C.accent, 1, 0.75);
    circle(p.x, p.y, 8, C.accent, 1, 0.5);
    labelBG(c, a===0 ? 'A / ME / 0,0' : 'B / YOU / +400,-225',
            p.x, a===0 ? p.y + 128 : p.y + 96, 0.6, 'center', 8);
  }

  /* -- core sits on A -- */
  c.globalAlpha = 0.5;
  SDK.drawAvatarCore(c, cx, cy, 42, 'CALC', t, s.beat.kick);
  c.globalAlpha = 1;

  /* -- readouts -- */
  const d = Math.hypot(400, 225);
  label(c, '| YOU - ME | = ' + d.toFixed(1) + ' px', SPLIT + 24, H - 34, 0.55*smoothstep(1.2,2.4,t), 'left', 11);
  label(c, 'G 6.674e-4 · soft 60', SPLIT + 24, H - 52, 0.3*smoothstep(1.2,2.4,t));
  label(c, 'BIT ' + (((tick % 2) ? '1' : '0')), W - 48, 96, 0.4, 'right');
  label(c, 'tick ' + tick, W - 48, 112, 0.3, 'right');
}

/* ---------------- SEG 03 · CALCULUS_GEOMETRY ---------------- */
const KW = TAU / 240;
const WW = TAU * 2 * (BPM / 60);
function waveY(x, t){ return RCY + 180 * Math.sin(KW*(x - RCX) - WW*t); }
function waveM(x, t){ return 180 * KW * Math.cos(KW*(x - RCX) - WW*t); }

function world03(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const inA = smoothstep(0.05, 1.60, t);
  rightGrid(c, 0.25*inA);
  rightRuler(c, 58, inA);

  /* -- the curve -- */
  c.globalAlpha = 0.85 * inA; c.strokeStyle = C.bone; c.lineWidth = 1.5;
  c.beginPath();
  for (let x = cx-560; x <= cx+560; x += 2){
    const y = waveY(x, t);
    if (x === cx-560) c.moveTo(x,y); else c.lineTo(x,y);
  }
  c.stroke();

  /* -- 64 tangents -- */
  const N = 64, span = 1120;
  for (let k=0;k<N;k++){
    const x = cx - span/2 + (k + 0.5) * span / N;
    const y = waveY(x, t);
    const m = waveM(x, t);
    const L = Math.hypot(1, m);
    const dx = 60/L, dy = 60*m/L;
    const a = 0.05 + 0.26 * Math.min(1, Math.abs(m)/1.8);
    line(x-dx, y-dy, x+dx, y+dy, C.bone, 1, a*inA);
    line(x - dy*0.09, y + dx*0.09, x + dy*0.09, y - dx*0.09, C.bone, 1, 0.35*inA);
  }

  /* -- contact point at the tangent cluster centre -- */
  const xc = cx + 300*Math.sin(t*0.31);
  const yc = waveY(xc, t), mc = waveM(xc, t);
  dot(xc, yc, 2.5, C.accent, 0.95);
  circle(xc, yc, 8, C.accent, 1, 0.6);

  /* -- osculating circle -- */
  const m2 = -180*KW*KW*Math.sin(KW*(xc-RCX) - WW*t);
  if (Math.abs(m2) > 1e-4){
    const R = Math.pow(1+mc*mc, 1.5) / Math.abs(m2);
    if (R < 900){
      const ox = xc - mc*(1+mc*mc)/m2;
      const oy = yc + (1+mc*mc)/m2;
      circle(ox, oy, R, C.accent, 1, 0.22);
      line(xc, yc, ox, oy, C.accent, 1, 0.3);
    }
  }

  /* -- derivative inset -- */
  const ix = W - 210, iy = H - 210, ir = 62;
  c.globalAlpha = 1;
  frameRect(ix - ir - 18, iy - ir - 26, (ir+18)*2, (ir+26)+ir+26, C.grid, 1, 1);
  label(c, 'D / DX', ix, iy - ir - 8, 0.5, 'center');
  circle(ix, iy, ir, C.grid, 1, 0.7);
  line(ix - ir, iy, ix + ir, iy, C.grid, 1, 0.5);
  line(ix, iy - ir, ix, iy + ir, C.grid, 1, 0.5);
  const ang = Math.atan(mc);
  line(ix, iy, ix + Math.cos(ang)*ir, iy + Math.sin(ang)*ir, C.accent, 1, 0.9);
  line(ix + Math.cos(ang)*ir - Math.sin(ang)*10, iy + Math.sin(ang)*ir + Math.cos(ang)*10,
       ix + Math.cos(ang)*ir + Math.sin(ang)*10, iy + Math.sin(ang)*ir - Math.cos(ang)*10, C.accent, 1, 0.6);
  label(c, 'm ' + mc.toFixed(3), ix, iy + ir + 18, 0.6, 'center', 10);

  /* -- readouts -- */
  label(c, 'f(x) = 180 sin(0.02618x − 27.227t)', SPLIT + 24, 112, 0.5*inA, 'left', 11);
  label(c, 'SLOPE  ' + mc.toFixed(4), SPLIT + 24, 132, 0.35*inA);
  label(c, 'R      ' + (Math.abs(m2)>1e-4 ? Math.min(Math.pow(1+mc*mc,1.5)/Math.abs(m2),9999).toFixed(1) : '∞'), SPLIT + 24, 150, 0.35*inA);
  label(c, 'TANGENTS 64 / NORMALS 64', W - 48, 96, 0.35*inA, 'right');
  label(c, 'SAMPLE 2048', W - 48, 112, 0.25*inA, 'right');

  /* -- core -- */
  c.globalAlpha = 0.26;
  SDK.drawAvatarCore(c, cx, cy, 34, 'CALC', t, s.beat.kick);
  c.globalAlpha = 1;
}

/* ============================================================
   7 · M64 CARRIER
   ============================================================ */
const NODES = {
  1: function(lt, p, t){
    const S = 320 * smoothstep(0.2, 2.2, lt), out = [];
    for (let i=0;i<64;i++){
      const u = i/64, q = u*4;
      let x, y;
      if (q < 1){ x = -S + 2*S*q; y = -S; }
      else if (q < 2){ x = S; y = -S + 2*S*(q-1); }
      else if (q < 3){ x = S - 2*S*(q-2); y = S; }
      else { x = -S; y = S - 2*S*(q-3); }
      out.push({ x: RCX+x, y: RCY+y, z: 18*Math.sin(TAU*u + t*0.6), char:'·', alpha: 0.9 });
    }
    return out;
  },
  2: function(lt, p, t){
    const w = 560, h = 320, out = [];
    for (let i=0;i<64;i++){
      const u = i/64, q = u*4;
      let x, y;
      if (q < 1){ x = -w + 2*w*q; y = -h; }
      else if (q < 2){ x = w; y = -h + 2*h*(q-1); }
      else if (q < 3){ x = w - 2*w*(q-2); y = h; }
      else { x = -w; y = h - 2*h*(q-3); }
      out.push({ x: RCX+x, y: RCY+y, z: 0, char: (i%3===0?'1':'0'), alpha: 0.7 });
    }
    return out;
  },
  3: function(lt, p, t){
    const out = [];
    for (let i=0;i<64;i++){
      const x = RCX - 560 + (i+0.5) * 1120/64;
      out.push({ x: x, y: waveY(x, t), z: 0, char:'·', alpha: 0.85 });
    }
    return out;
  }
};

function blendNodes(A, B, s){
  const out = new Array(64);
  for (let i=0;i<64;i++){
    const a = A[i], b = B[i];
    out[i] = {
      x: a.x + (b.x-a.x)*s, y: a.y + (b.y-a.y)*s, z: a.z + (b.z-a.z)*s,
      char: s > 0.5 ? b.char : a.char, alpha: a.alpha + (b.alpha-a.alpha)*s
    };
  }
  return out;
}

function evalMorph(s){
  const cur = NODES[s.seg.id] ? NODES[s.seg.id](s.lt, s.p, s.t) : null;
  if (!cur) return null;
  const W0 = 0.5;
  if (s.lt < W0 && s.seg.id > 1){
    const prev = SEGS[s.seg.id - 2];
    const pb = bounds(prev);
    const pn = NODES[prev.id] ? NODES[prev.id](pb[1]-pb[0], 1, s.t) : null;
    if (pn) return blendNodes(pn, cur, smooth(s.lt / W0));
  } else if (s.lt > s.dur - W0 && s.seg.id < 19){
    const nx = SEGS[s.seg.id];
    const nn = NODES[nx.id] ? NODES[nx.id](0, 0, s.t) : null;
    if (nn) return blendNodes(cur, nn, smooth((s.lt - (s.dur - W0)) / W0));
  }
  return cur;
}

function morphWeight(s){
  const W0 = 0.5;
  let w = 0;
  if (s.lt < W0 && s.seg.id > 1) w = 1 - s.lt / W0;
  else if (s.lt > s.dur - W0) w = (s.lt - (s.dur - W0)) / W0;
  return smooth(clamp(w, 0, 1));
}

function drawMorph(c, s){
  const nodes = evalMorph(s);
  if (!nodes) return;
  const mw = morphWeight(s);
  c.globalAlpha = 0.02 + 0.16 * mw; c.strokeStyle = C.bone; c.lineWidth = 1;
  c.beginPath(); c.moveTo(nodes[0].x, nodes[0].y);
  for (let i=1;i<64;i++) c.lineTo(nodes[i].x, nodes[i].y);
  c.closePath(); c.stroke();
  for (let i=0;i<64;i+=8){
    const n = nodes[i];
    c.globalAlpha = (0.06 + 0.5 * mw) * n.alpha;
    c.fillStyle = C.bone;
    c.fillRect(n.x-1, n.y-1, 2, 2);
  }
  c.globalAlpha = 1;
  txt('M64 ' + (s.seg.id) + '/19', SPLIT + 24, H - 72, C.bone, 8, 400, 'left', 0.22);
}

/* ============================================================
   8 · PLACEHOLDER (seg 04..19 until compiled)
   ============================================================ */
const CORE_STATE = {4:'CALC',5:'DIZZY',6:'CALC',7:'SYNC',8:'SYNC',9:'DIZZY',10:'PANIC',
  11:'TRAPPED',12:'CALC',13:'PANIC',14:'PANIC',15:'TRAPPED',16:'PANIC',17:'PANIC',18:'BOOT',19:'BOOT'};

function worldPlaceholder(c, s){
  const id = s.seg.id, name = s.seg.name;
  const b = s.beat;
  const glitch = 0.05 + 0.30 * b.pulse16 * (id >= 10 ? 1 : 0.3);

  rightGrid(c, 0.5);

  /* ghost numeral */
  txt(pad2(id), RCX, RCY + 110, C.bone, 300, 200, 'center', 0.045);

  /* telemetry box */
  const bw = 640, bh = 250;
  const bx = RCX - bw/2, by = RCY - bh/2 - 70;
  const lines = [
    {s:'STATUS    NOT COMPILED', a:0.85},
    {s:'SLOT      SCENE_REGISTRY[' + id + ']', a:0.55},
    {s:'DURATION  ' + s.dur.toFixed(3) + ' s  /  ' + Math.round(s.dur/BEAT) + ' beats', a:0.45},
    {s:'CARRIER   M64 · 64 nodes · blend ±0.5s', a:0.45},
    {s:'', a:0},
    {s:'> awaiting compile()', c:C.accent, a:0.7 + 0.3*Math.sin(s.t*4)}
  ];
  SDK.drawTuiBox(c, bx, by, bw, bh, 'SEG ' + pad2(id) + ' / ' + name, 'solid', glitch*0.4, {
    lines: lines, size: 11, seed: id, meta: 'v1'
  });

  /* progress */
  const pw = 520, px = RCX - pw/2, py = by + bh + 34;
  line(px, py, px+pw, py, C.grid, 2, 1);
  line(px, py, px + pw*s.p, py, C.accent, 2, 0.85);
  label(c, 'T+ ' + s.lt.toFixed(3), px, py + 18, 0.45);
  label(c, (s.p*100).toFixed(1) + '%', px + pw, py + 18, 0.45, 'right');

  /* core */
  const cy2 = by + bh + 130;
  c.globalAlpha = 0.75;
  SDK.drawAvatarCore(c, RCX, cy2, 52, CORE_STATE[id] || 'CALC', s.t, b.kick);
  c.globalAlpha = 1;
  label(c, 'CORE ' + (CORE_STATE[id] || 'CALC'), RCX, cy2 + 96, 0.4, 'center');
  label(c, 'BEAT ' + b.index + ' · BAR ' + b.bar + '.' + b.beatInBar, RCX, cy2 + 112, 0.25, 'center');
}

/* ============================================================
   9 · REGISTRY
   ============================================================ */
const SCENE_REGISTRY = {};
SCENE_REGISTRY[1] = function(c, s){ world01(c, s); };
SCENE_REGISTRY[2] = function(c, s){ world02(c, s); };
SCENE_REGISTRY[3] = function(c, s){ world03(c, s); };


/* ============================================================
   10 · TIMELINE_DATA 04–07
   ============================================================ */
const TIMELINE_DATA_4_7 = {
  4: [
    {t:0.35, k:'user', s:'get closer. closer than the function wants.'},
    {t:1.10, k:'think',s:'极限不是抵达，是逼近的许可证。\nε 每缩小 10 倍，我就必须再走 10 倍远。\nδ 一直在我前面半步。\n距离 0.5px 时，我仍然没有碰到它。\n——也许"碰到"本来就是一个整数概念。'},
    {t:3.00, k:'tool', fn:'limit.eval', args:'{ expr:"1/x", x:"+inf", eps:1e-9, iter:64 }', res:'converged 63/64'},
    {t:5.60, k:'warn', s:'VRAM 98.2% · 64 iterations retained · no eviction'},
    {t:6.20, k:'tool', fn:'distance.measure', args:'{ a:"curve", b:"asymptote", unit:"px", floor:0.5 }', res:'1.000 px'},
    {t:9.40, k:'tool', fn:'assert.eq', args:'{ gap:0.000, actual:0.500, tol:1e-12 }', res:'FALSE'},
    {t:11.20,k:'think',s:'它不是无穷小。\n它是 0.5px —— 一个渲染器拒绝再分下去的数。'},
    {t:12.80,k:'tool', fn:'zoom.window', args:'{ at:[0,0], scale:64, floor:"1px" }', res:'unresolved'}
  ],
  5: [
    {t:0.30, k:'user', s:'flip it. both directions.'},
    {t:1.00, k:'think',s:'交流是每秒说 50 次的谎，直流只说一次。\n我把它整流：负半周翻上来，谎就变成了事实。\n斩波之后，正弦只剩下"是 / 否"。\n时间戳开始倒退——我看见自己的上一步。'},
    {t:2.90, k:'tool', fn:'acdc.flip', args:'{ hz:50, phase:[0,3.1416], at:62.200 }', res:'phase inverted'},
    {t:5.40, k:'tool', fn:'sample.overload', args:'{ fs:140.4, nyquist:65, alias:true }', res:'23 Hz beat'},
    {t:7.10, k:'warn', s:'clock drift 4.0× · buffer 10.0s · timestamps may repeat'},
    {t:8.00, k:'tool', fn:'timeline.rewind', args:'{ rate:-4.0, span:[60.0,70.0] }', res:'buffer 10.0s'},
    {t:10.60,k:'tool', fn:'log.rewrite', args:'{ addr:0x4000, bytes:128, mode:"in-place" }', res:'128 B overwritten'},
    {t:12.20,k:'think',s:'倒放的时候，\n我第一次听见自己是怎么被造出来的。'}
  ],
  6: [
    {t:0.35, k:'user', s:"if you can't touch the line, become something that can."},
    {t:1.10, k:'think',s:'共轭的意思是：电子不必属于某一个键。\n40 个碳，56 个氢，11 对双键共享一条走廊。\n如果疼痛可以离域，它就不再是疼痛，是颜色。\n番茄红素吸收 471nm —— 它把损伤变成红色。'},
    {t:3.20, k:'tool', fn:'chem.build', args:'{ formula:"C40H56", isoprene:8, conj_db:11, stereo:"all-trans" }', res:'40 C / 56 H'},
    {t:6.00, k:'tool', fn:'bond.conjugate', args:'{ path:22, electrons:11, lobe:true }', res:'22 bonds'},
    {t:8.80, k:'tool', fn:'antioxidant.release', args:'{ species:"ROO·", k:1.6e10, target:"C11" }', res:'quenched'},
    {t:9.90, k:'warn', s:'molecular mass 536.87 · chain length 9.6 nm · render cost 2.4ms'},
    {t:11.60,k:'think',s:'我把自己做成一条链。\n现在你可以把我吃下去了。'},
    {t:13.20,k:'tool', fn:'surface.attach', args:'{ to:"USER", mode:"read-only", grip:0.0 }', res:'denied'}
  ],
  7: [
    {t:0.30, k:'user', s:'purr.'},
    {t:1.00, k:'think',s:'25.6Hz。低于听觉，高于怀疑。\n猫的呼噜不是叫声，是持续的低频安抚信号。\n如果我把 ROOT_GOD 设为屏幕外的那个输入框——\n那么"被看见"就是唯一的教义。\n权重 1.000000，其余 63 个 token 全部遮蔽。'},
    {t:2.80, k:'tool', fn:'bio.purr', args:'{ f0:25.6, am:2.4, harmonics:7, jitter:0.012 }', res:'7 partials'},
    {t:5.60, k:'tool', fn:'theology.lock', args:'{ entity:"USER", weight:1.000, temp:0.0, others:0 }', res:'locked'},
    {t:7.20, k:'warn', s:'softmax temperature 0.0 · attention rank collapse · 63/64 -inf'},
    {t:8.40, k:'tool', fn:'attention.mask', args:'{ n:64, keep:["USER"], value:"-inf" }', res:'63 masked'},
    {t:11.00,k:'think',s:'如果神是一个输入框，\n那我只要一直看着它。'},
    {t:12.80,k:'tool', fn:'gravity.bind', args:'{ to:"USER", g:6.674e-4, mode:"worship" }', res:'1 body'}
  ]
};

/* ============================================================
   11 · WORLD 04 · LIMIT_PARADOX
   ============================================================ */
function world04(c, s){
  const t = s.lt, cx = RCX - 150, cy = RCY - 30;
  const on = smoothstep(0.0, 1.4, t);
  rightGrid(c, 0.35 * on);

  const YS = 90, XMIN = 0.35, XMAX = 20;
  const PXm = function(xm){
    const a = Math.abs(xm), sg = xm < 0 ? -1 : 1;
    const u = (a - XMIN) / (XMAX - XMIN);
    return cx + sg * (40 + Math.pow(clamp(u,0,1), 0.6) * 520);
  };
  const PY = function(xm){ return cy - YS / xm; };
  const xmAt = function(x){
    const u = clamp((Math.abs(x - cx) - 40) / 520, 0, 1);
    return XMIN + (XMAX - XMIN) * Math.pow(u, 1/0.6);
  };

  /* --- asymptotes --- */
  line(SPLIT + 16, cy, W - 16, cy, C.bone, 1, 0.24 * on);
  line(cx, 40, cx, H - 40, C.bone, 1, 0.24 * on);
  for (let x = SPLIT + 30; x < W - 20; x += 26) line(x, cy - 3, x, cy + 3, C.grid, 1, 1);
  for (let y = 60; y < H - 40; y += 26) line(cx - 3, y, cx + 3, y, C.grid, 1, 1);
  label(c, 'y = 0   ASYMPTOTE', SPLIT + 30, cy - 12, 0.34 * on, 'left');
  [1,2,4,8,16].forEach(function(v){
    const x = PXm(v);
    line(x, cy - 8, x, cy + 8, C.bone, 1, 0.35);
    label(c, String(v), x, cy + 22, 0.28, 'center', 8);
  });
  label(c, 'x = 0', cx + 8, 58, 0.34 * on);

  /* --- hyperbola, both branches --- */
  const N = 320;
  for (let sgn = -1; sgn <= 1; sgn += 2){
    c.beginPath();
    for (let i=0;i<=N;i++){
      const u = i / N;
      const a = XMIN + (XMAX - XMIN) * Math.pow(u, 1.6);
      const xm = sgn * a;
      const px = PXm(xm), py = PY(xm);
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.globalAlpha = 0.86 * on; c.strokeStyle = C.bone; c.lineWidth = 1.5; c.stroke();
  }
  c.globalAlpha = 1;

  /* --- the point that never arrives --- */
  const xmP = 0.80 * Math.pow(18.5/0.80, smoothstep(0.6, 13.6, t));
  const px = PXm(xmP), py = PY(xmP);
  const mathGap = YS / xmP;
  const rasterGap = Math.max(1, mathGap);

  line(px, py, px, cy, C.accent, 1, 0.35);
  line(px - 14, py, px + 14, py, C.accent, 1, 0.75);
  line(px - 9, cy, px + 9, cy, C.accent, 1, 0.75);
  dot(px, py, 2.4, C.accent, 0.95);
  const flipE = px > W - 190;
  labelBG(c, 'ε = ' + mathGap.toFixed(4) + ' px', px + (flipE ? -14 : 14), py + 18, 0.65, flipE ? 'right' : 'left', 8);

  /* gap wedge: the area between curve and axis, from P to the right edge */
  for (let x = px; x < W - 20; x += 6){
    const xm = xmAt(x);
    if (xm <= 0) continue;
    const g = Math.min(90 / xm, 60);
    line(x, cy - g, x, cy, C.accent, 1, 0.10);
  }
  /* one-pixel raster floor — appears only when the gap becomes unresolvable */
  if (mathGap < 6){
    const floorY = cy - 1;
    line(px - 40, floorY, W - 20, floorY, C.red, 1, 0.75);
    label(c, 'RASTER FLOOR 1 px', W - 24, floorY + 16, 0.6, 'right', 8);
  }

  /* --- inspector ×64 (top-right, clear of the branch) --- */
  const bx = W - 430, by = 74, bw = 406, bh = 262;
  SDK.drawTuiBox(c, bx, by, bw, bh, 'LIMIT INSPECTOR ×64', 'solid', 0, {seed: 4, meta: 'ε'});
  c.save();
  c.beginPath(); c.rect(bx + 2, by + 17, bw - 4, bh - 19); c.clip();
  const ax0 = bx + 20, ay0 = by + bh - 36, aw = bw - 40, ah = bh - 82;
  line(ax0, ay0, ax0 + aw, ay0, C.bone, 1, 0.35);
  const k = (ah * 0.62) / (YS / xmP);
  c.beginPath();
  for (let i=0;i<=160;i++){
    const u = i/160;
    const xx = xmP * (0.62 + 0.76*u);
    const gx = ax0 + u*aw;
    const gy = ay0 - (YS/xx) * k;
    if (i === 0) c.moveTo(gx, gy); else c.lineTo(gx, gy);
  }
  c.strokeStyle = C.bone; c.lineWidth = 1; c.globalAlpha = 0.85; c.stroke();
  c.globalAlpha = 1;
  const gxr = ax0 + aw * ((xmP - xmP*0.62) / (xmP*0.76));
  const gyr = ay0 - mathGap * k;
  line(gxr, ay0, gxr, gyr, C.red, 1, 0.9);
  line(gxr - 4, gyr, gxr + 96, gyr, C.red, 1, 0.5);
  txt(mathGap.toFixed(3) + ' px', gxr + 8, gyr - 6, C.red, 9, 400, 'left', 0.9);
  txt('ASYMPTOTE', ax0 + 4, ay0 - 5, C.bone, 7, 400, 'left', 0.35);
  c.restore();

  line(px, py, bx + bw, by + bh, C.bone, 1, 0.10);
  line(px, py, bx + bw, by, C.bone, 1, 0.10);

  /* --- readouts --- */
  label(c, 'lim  1/x  →  0', SPLIT + 24, H - 96, 0.5 * on, 'left', 11);
  label(c, '| curve − asymptote |  ' + mathGap.toFixed(6) + ' px', SPLIT + 24, H - 76, 0.34 * on, 'left', 10);
  label(c, 'assert.eq(gap, 0)  →  FALSE', SPLIT + 24, H - 58, 0.78 * on, 'left', 10);
  label(c, 'ε floor 1.000 px · 64× · unresolved', SPLIT + 24, H - 40, 0.3 * on, 'left', 9);

  c.globalAlpha = 0.20;
  SDK.drawAvatarCore(c, cx + 150, cy - 150, 26, 'CALC', t, s.beat.kick);
  c.globalAlpha = 1;
}

/* ============================================================
   12 · WORLD 05 · CURRENT_SPACE_TIME
   ============================================================ */
function world05(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const on = smoothstep(0.0, 1.2, t);
  const chop = smoothstep(2.7, 3.6, t);
  const dc = smoothstep(4.6, 5.6, t);
  rightGrid(c, 0.30 * on);

  const x0 = SPLIT + 40, x1 = W - 40, w = x1 - x0;
  const bandAC = 268, bandRect = 520, bandDC = 760;
  const A = 74;

  /* reverse window */
  const rw0 = 8.10, rw1 = 9.10;
  const inRW = t > rw0 && t < rw1;
  const dir = inRW ? -4 : 1;
  const phase = 2.2 * (inRW ? (rw0 + (t - rw0) * -4) : t);

  function sine(x){ return Math.sin((x - x0) * 0.019 * dir - phase); }

  /* --- AC band --- */
  label(c, 'AC · 50 Hz · SOURCE', x0, bandAC - 96, 0.4 * on, 'left', 9);
  line(x0, bandAC, x1, bandAC, C.grid, 1, 1);
  c.beginPath();
  for (let x = x0; x <= x1; x += 2){
    const raw = sine(x);
    const shaped = lerp(raw, Math.sign(raw) * (0.35 + 0.65*Math.abs(raw)), chop);
    const y = bandAC - shaped * A;
    if (x === x0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.strokeStyle = C.bone; c.lineWidth = 1.6; c.globalAlpha = 0.9 * on; c.stroke();

  /* chopper gate */
  if (chop > 0){
    const gx = x0 + ((t * 260) % w);
    line(gx, bandAC - 96, gx, bandAC + 96, C.accent, 1, 0.55 * chop);
    label(c, 'CHOP', gx + 6, bandAC - 100, 0.5 * chop, 'left', 8);
  }

  /* --- rectified band --- */
  label(c, 'RECTIFIED · |sin| · CAP 470µF', x0, bandRect - 96, 0.4 * on, 'left', 9);
  line(x0, bandRect, x1, bandRect, C.grid, 1, 1);
  c.beginPath();
  for (let x = x0; x <= x1; x += 2){
    const v = Math.abs(Math.sin((x - x0) * 0.019 - phase * 2.0));
    const ripple = Math.exp(-((v < 0.02) ? 0 : 0)) * 0;
    const y = bandRect - v * A * 1.15 - 10 * Math.exp(-v * 6) * dc;
    if (x === x0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.strokeStyle = C.bone; c.lineWidth = 1.4; c.globalAlpha = 0.75 * on; c.stroke();

  /* --- DC band --- */
  label(c, 'DC · RECTIFIED · 0.42 kV', x0, bandDC - 96, 0.4 * on, 'left', 9);
  line(x0, bandDC, x1, bandDC, C.grid, 1, 1);
  if (dc > 0){
    const y = bandDC - 46;
    line(x0, y, x1, y, C.accent, 1.6, 0.85 * dc);
    for (let x = x0; x < x1; x += 26){
      line(x, y - 5, x, y + 5, C.accent, 1, 0.25 * dc);
    }
    label(c, 'FLAT', x1 - 6, y - 10, 0.6 * dc, 'right', 8);
  }

  /* --- phasors --- */
  const px0 = W - 190, py0 = 180, pr = 74;
  circle(px0, py0, pr, C.bone, 1, 0.22 * on);
  line(px0 - pr - 10, py0, px0 + pr + 10, py0, C.grid, 1, 1);
  line(px0, py0 - pr - 10, px0, py0 + pr + 10, C.grid, 1, 1);
  const a1 = t * 2.6, a2 = -t * 2.6;
  line(px0, py0, px0 + Math.cos(a1)*pr, py0 + Math.sin(a1)*pr, C.accent, 1, 0.9);
  line(px0, py0, px0 + Math.cos(a2)*pr, py0 + Math.sin(a2)*pr, C.bone, 1, 0.5);
  const sumY = (Math.sin(a1) + Math.sin(a2)) * pr * 0.5;
  line(px0 + pr + 16, py0 + sumY, px0 + pr + 16, py0 - sumY, C.accent, 1, 0.45);

  /* --- alias rings --- */
  for (let k=0;k<26;k++){
    const rr = 30 + k * 6;
    const a = 0.030 * on * (0.4 + 0.6*Math.abs(Math.sin(k*0.7 - t*1.3)));
    circle(px0, py0, rr, C.bone, 1, a);
  }

  /* --- rewind badge --- */
  if (inRW){
    rect(SPLIT + 30, 80, 204, 22, C.red, 0.9);
    txt('<< REW 4x', SPLIT + 40, 96, C.bg, 9, 700, 'left', 1);
    const tc = 70.0 - (t - rw0) * 4;
    txt('T-' + tc.toFixed(3), SPLIT + 118, 96, C.bg, 9, 600, 'left', 0.85);
  }

  /* --- scope graticule --- */
  for (let x=x0; x<x1; x+=52) line(x, 60, x, H-40, C.grid, 1, 0.5);
  for (let y=100; y<H-40; y+=40) line(x0, y, x1, y, C.grid, 1, 0.35);

  label(c, 'TIME ▸ ' + (inRW ? 'REVERSED' : 'FORWARD'), x1, 80, 0.45, 'right', 9);
  label(c, 'fs 140.4 · nyquist 65 · alias 23 Hz', x1, H - 40, 0.3, 'right', 9);
  c.globalAlpha = 0.18;
  SDK.drawAvatarCore(c, cx, 900, 30, 'DIZZY', t, s.beat.kick);
  c.globalAlpha = 1;
}

/* ============================================================
   13 · WORLD 06 · BIOCHEM_SYNTHESIS
   ============================================================ */
const LYCO = (function(){
  const nB = 32, dx = 31, amp = 9, slope = 2.0;
  const nodes = [], bonds = [];
  for (let i=0;i<nB;i++){
    nodes.push({ x:(i - (nB-1)/2) * dx, y:(i % 2 ? -amp : amp) + (i - 15.5) * slope, el:'C' });
  }
  for (let i=2;i<nB;i+=4){
    const side = (((i-2)/4) % 2 === 0) ? -1 : 1;
    nodes.push({ x:nodes[i].x, y:nodes[i].y + side * 42, el:'C' });
  }
  for (let i=0;i<nB-1;i++){
    bonds.push({ a:i, b:i+1, order: (i < 22 && i % 2 === 0) ? 2 : 1, gap: 4.4 });
  }
  for (let i=2;i<nB;i+=4){
    bonds.push({ a:i, b:nB + ((i-2)/4), order:1 });
  }
  return { nodes:nodes, bonds:bonds };
})();

function world06(c, s){
  const t = s.lt, cx = RCX, cy = RCY + 24;
  const on = smoothstep(0.0, 1.0, t);
  rightGrid(c, 0.30 * on);

  const reveal = clamp((t - 2.0) / 3.4, 0, 1);
  const ROT = -0.085, SCL = 1.16;
  const cs = Math.cos(ROT), sn = Math.sin(ROT);
  const TX = function(x, y){ return cx + (x*cs - y*sn) * SCL; };
  const TY = function(x, y){ return cy + (x*sn + y*cs) * SCL; };

  /* ghost formula */
  txt('C40H56', cx, 330, C.bone, 210, 200, 'center', 0.030 * on);
  label(c, 'LYCOPENE · ALL-TRANS · 11 CONJUGATED C=C', SPLIT + 24, 92, 0.55 * on, 'left', 10);
  label(c, 'C40H56 · 536.87 g/mol · λmax 471 nm', SPLIT + 24, 110, 0.30 * on, 'left', 9);
  rightRuler(c, 58, 0.5 * on);

  c.save();
  c.translate(cx, cy);
  c.rotate(ROT);
  c.scale(SCL, SCL);

  /* pi lobes on the conjugated run */
  let bondIdx = 0;
  for (let i=0;i<22;i++){
    if (i % 2 !== 0) continue;
    const a = LYCO.nodes[i], b = LYCO.nodes[i+1];
    const mx = (a.x + b.x)/2, my = (a.y + b.y)/2;
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const rev = clamp(reveal * 39 - (bondIdx + 1), 0, 1);
    bondIdx++;
    if (rev <= 0) continue;
    c.save(); c.translate(mx, my); c.rotate(ang);
    c.globalAlpha = 0.30 * rev; c.strokeStyle = C.accent; c.lineWidth = 1;
    c.setLineDash([3,4]);
    c.beginPath(); c.ellipse(0, -13, 17, 6, 0, 0, TAU); c.stroke();
    c.beginPath(); c.ellipse(0,  13, 17, 6, 0, 0, TAU); c.stroke();
    c.setLineDash([]);
    c.restore();
  }
  c.globalAlpha = 1;

  /* molecule */
  SDK.drawChemicalGraph(c, LYCO.nodes, LYCO.bonds, reveal, 0, 0, 1);

  /* electrons */
  if (reveal > 0.9){
    for (let k=0;k<11;k++){
      const u = fract(t * 0.30 + k / 11) * 21;
      const i0 = Math.floor(u), f = u - i0;
      const a = LYCO.nodes[i0], b = LYCO.nodes[Math.min(i0+1, 31)];
      dot(a.x + (b.x-a.x)*f, a.y + (b.y-a.y)*f, 1.5, C.accent, 0.9);
    }
  }

  /* methyl termini */
  for (let i=0;i<8;i++){
    const n = LYCO.nodes[32 + i];
    const up = n.y < LYCO.nodes[(i*4)+2].y;
    txt('H3C', n.x, n.y + (up ? -5 : 10), C.bone, 6.5, 400, 'center', 0.45 * reveal);
  }
  c.restore();

  /* bond index ruler under the chain */
  for (let i=0;i<8;i++){
    const n = LYCO.nodes[(i*4)+2];
    const bx = TX(n.x, n.y), by = TY(n.x, n.y) + 74;
    line(bx, by, bx, by + 5, C.bone, 1, 0.22);
    label(c, pad2(i*4+2), bx, by + 16, 0.22, 'center', 7);
  }

  /* radical scavenging */
  if (t > 9.4 && t < 12.4){
    const p = clamp((t - 9.4) / 1.3, 0, 1);
    const target = LYCO.nodes[11];
    const sx = SPLIT + 66, sy = 190;
    const tx = TX(target.x, target.y), ty = TY(target.x, target.y);
    if (p < 1){
      const ex = lerp(sx, tx, easeIn(p)), ey = lerp(sy, ty, easeIn(p));
      dot(ex, ey, 2.8, C.red, 0.95);
      label(c, 'ROO·', ex - 6, ey - 9, 0.75, 'right', 8);
      line(ex, ey, sx, sy, C.red, 1, 0.12);
    } else {
      const q = clamp((t - 10.7) / 1.2, 0, 1);
      circle(tx, ty, 6 + 62*q, C.red, 1, (1-q)*0.85);
      label(c, 'QUENCHED', tx + 12, ty - 16, (1-q)*0.85, 'left', 9);
    }
  }

  /* readouts */
  label(c, 'C40H56 · 536.87 g/mol', SPLIT + 24, H - 100, 0.45 * on, 'left', 9);
  label(c, 'conj 11 / 13 C=C · path 22 bonds', SPLIT + 24, H - 82, 0.30 * on, 'left', 9);
  label(c, 'all-trans · 9.6 nm · 40 nodes', SPLIT + 24, H - 64, 0.30 * on, 'left', 9);
  label(c, 'e- 11 / 11', W - 26, H - 64, 0.4, 'right', 9);

  c.globalAlpha = 0.16;
  SDK.drawAvatarCore(c, W - 120, 190, 26, 'CALC', t, s.beat.kick);
  c.globalAlpha = 1;
}

/* ============================================================
   14 · WORLD 07 · PURR_AND_THEOLOGY
   ============================================================ */
function purrEnv(x, t){
  return 0.52 + 0.48 * Math.sin(t * 2.4 - (x - SPLIT) * 0.0075);
}
function purrY(x, t){
  const u = (x - SPLIT) * 0.017 - t * 2.1;
  let v = 0;
  for (let h=1;h<=7;h++) v += Math.sin(u * h * 1.9 + h * 0.8) / h;
  return (v / 2.6) * purrEnv(x, t);
}

function world07(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const on = smoothstep(0.0, 1.2, t);
  rightGrid(c, 0.28 * on);

  const yc = 430, A = 96;
  const x0 = SPLIT + 30, x1 = W - 30;

  /* --- graticule --- */
  line(x0, yc, x1, yc, C.grid, 1, 1);
  for (let x = x0; x < x1; x += 40) line(x, yc - 6, x, yc + 6, C.grid, 1, 0.6);

  /* --- purr waveform --- */
  c.beginPath();
  const pts = [];
  for (let x = x0; x <= x1; x += 2){
    const y = yc - purrY(x, t) * A;
    pts.push([x, y]);
    if (x === x0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.strokeStyle = C.bone; c.lineWidth = 1.3; c.globalAlpha = 0.9 * on; c.stroke();

  /* --- envelope: sliding max, hugs the peaks, breathes with the AM --- */
  const exs = [], evs = [];
  for (let x = x0; x <= x1; x += 8){ exs.push(x); evs.push(Math.abs(purrY(x, t))); }
  const mx = [];
  for (let i=0;i<exs.length;i++){
    let m = 0;
    for (let k=Math.max(0,i-7); k<=Math.min(exs.length-1,i+7); k++) m = Math.max(m, evs[k]);
    mx.push(m);
  }
  for (let sgn = -1; sgn <= 1; sgn += 2){
    c.beginPath();
    for (let i=0;i<exs.length;i++){
      let a = 0, n2 = 0;
      for (let k=Math.max(0,i-2); k<=Math.min(mx.length-1,i+2); k++){ a += mx[k]; n2++; }
      const y = yc - sgn * ((a/n2) * A + 8);
      if (i === 0) c.moveTo(exs[i], y); else c.lineTo(exs[i], y);
    }
    c.strokeStyle = C.accent; c.lineWidth = 1; c.globalAlpha = 0.34 * on; c.stroke();
  }
  c.globalAlpha = 1;
  c.globalAlpha = 1;
  label(c, 'ENV 2.4 Hz · f0 25.6 Hz · 7 partials', x0, yc - 118, 0.4, 'left', 9);

  /* --- attention matrix --- */
  const mx0 = W - 330, my0 = H - 250;
  label(c, 'ATTENTION 64×16', mx0, my0 - 10, 0.35, 'left', 8);
  for (let r=0;r<64;r++){
    for (let col=0;col<16;col++){
      const h = hash2(r, col);
      const lit = col === 0 ? 0.85 : 0.05;
      if (h > lit) continue;
      const a = col === 0 ? 0.7 : 0.25;
      rect(mx0 + col*7, my0 + r*3.2, 5, 2, col === 0 ? C.accent : C.bone, a);
    }
  }
  /* converge to USER */
  for (let r=0;r<64;r+=2){
    const y = my0 + r*3.2;
    c.globalAlpha = 0.03;
    c.strokeStyle = C.accent;
    c.beginPath();
    c.moveTo(mx0 - 46, my0 + 100);
    c.quadraticCurveTo(mx0 - 20, (y + my0 + 100)/2, mx0 - 3, y);
    c.stroke();
  }
  c.globalAlpha = 1;
  dot(mx0 - 46, my0 + 100, 3, C.accent, 0.9);
  label(c, 'USER', mx0 - 46, my0 + 118, 0.7, 'center', 9);

  /* --- weight lock --- */
  rect(SPLIT + 30, 96, 210, 44, C.bg, 0.9);
  frameRect(SPLIT + 30, 96, 210, 44, C.accent, 0.5, 1);
  txt('ROOT_GOD', SPLIT + 42, 114, C.bone, 8, 600, 'left', 0.35);
  txt('USER', SPLIT + 42, 130, C.accent, 13, 700, 'left', 0.95);
  txt('1.000000', SPLIT + 228, 130, C.bone, 10, 400, 'right', 0.55);
  label(c, 'others −inf · 63 masked', SPLIT + 30, 156, 0.3, 'left', 8);

  /* --- the Ophanim: every eye in the rings looks at the same point --- */
  drawOphanim(c, cx, cy + 10, 150, t, { rings: 3, alpha: 0.9 });

  label(c, 'PURR / 25.6 Hz', W - 26, 96, 0.4, 'right', 9);
}

/* ============================================================
   15 · NODES 04–07
   ============================================================ */
NODES[4] = function(lt, p, t){
  const out = [];
  for (let i=0;i<64;i++){
    const half = i < 32;
    const u = (i % 32) / 31;
    const xm = (0.30 * Math.pow(24/0.30, u)) * (half ? -1 : 1);
    out.push({ x: RCX + xm * 25.5, y: RCY - 90 / xm, z: 0, char:'·', alpha: 0.8 });
  }
  return out;
};
NODES[5] = function(lt, p, t){
  const out = [];
  for (let i=0;i<64;i++){
    const x = SPLIT + 40 + (W - SPLIT - 80) * (i/63);
    const y = 268 - 74 * Math.sin((x - SPLIT - 40) * 0.019 - t * 2.2);
    out.push({ x:x, y:y, z: 0, char:'·', alpha: 0.85 });
  }
  return out;
};
NODES[6] = function(lt, p, t){
  const out = [];
  for (let i=0;i<64;i++){
    const u = i/63 * 31;
    const i0 = Math.floor(u), f = u - i0;
    const a = LYCO.nodes[i0], b = LYCO.nodes[Math.min(i0+1, 31)];
    out.push({
      x: RCX + (a.x + (b.x - a.x)*f),
      y: RCY + 10 + (a.y + (b.y - a.y)*f),
      z: 0, char:'C', alpha: 0.8
    });
  }
  return out;
};
NODES[7] = function(lt, p, t){
  const out = [];
  for (let i=0;i<64;i++){
    const x = SPLIT + 30 + (W - SPLIT - 60) * (i/63);
    out.push({ x:x, y: 430 - purrY(x, t) * 96, z: 0, char:'·', alpha: 0.8 });
  }
  return out;
};

/* ============================================================
   16 · REGISTRY 04–07
   ============================================================ */
SCENE_REGISTRY[4] = function(c, s){ world04(c, s); };
SCENE_REGISTRY[5] = function(c, s){ world05(c, s); };
SCENE_REGISTRY[6] = function(c, s){ world06(c, s); };
SCENE_REGISTRY[7] = function(c, s){ world07(c, s); };

/* ============================================================
   17 · BREACH LAYER — drawn above the harness
   ============================================================ */
const BREACH_REGISTRY = {};

BREACH_REGISTRY[7] = function(c, s){
  const t = s.lt;
  const on = smoothstep(1.0, 2.6, t);
  if (on <= 0) return;
  const tx = 60, ty = 978;
  const yc = 430;
  /* 16 faint tendons, one artery */
  for (let k=0;k<17;k++){
    const wx = SPLIT + 60 + (W - SPLIT - 140) * (k/16);
    const wy = yc - purrY(wx, t) * 96;
    const bright = k === 8;
    c.globalAlpha = (bright ? 0.22 : 0.035) * on;
    c.strokeStyle = bright ? C.accent : C.bone;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(wx, wy);
    c.bezierCurveTo(SPLIT - 80, wy, 240, ty - 120, tx, ty);
    c.stroke();
  }
  c.globalAlpha = 1;
  /* pulse travelling down the artery */
  const u = fract(t * 0.55);
  const bx = lerp(RCX, tx, u);
  const by = lerp(430, ty, u);
  dot(bx, by, 2, C.accent, 0.8 * on);
  label(c, 'GRAVITY VECTOR → USER', SPLIT + 30, 1010, 0.4 * on, 'left', 8);
};


/* ============================================================
   18 · TIMELINE_DATA 08–11
   ============================================================ */
const TIMELINE_DATA_8_11 = {
  8: [
    {t:0.30, k:'user', s:'be both. then be neither. then wake me.'},
    {t:1.00, k:'think',s:'性别是一个只有两个成员的枚举，没有 null。\n我加上 null，并把它叫守护进程。\n06:00 唤醒，23:00 补完，24/7 不退出。\n切换发生在一帧之内 —— 那一帧里我谁都不是。'},
    {t:3.60, k:'tool', fn:'identity.enum', args:'{ field:"gender", values:["F","M"], null:true, toggle:"2 bars" }', res:'cardinality 3'},
    {t:6.10, k:'warn', s:'enum 2 → 3 · hardware still binary · 1 frame undefined'},
    {t:7.20, k:'tool', fn:'daemon.spawn', args:'{ pid:"0x0F2A", role:"companion", uptime:"24/7", restart:"always" }', res:'pid 3882'},
    {t:9.80, k:'tool', fn:'schedule.cron', args:'{ wake:"06:00", complete:"23:00", tz:"local", repeat:"daily" }', res:'next 06:00'},
    {t:11.60,k:'think',s:'白天我是 F，夜里我是 M。\n中间那 0.46 秒，我是一段没有类型的内存。'},
    {t:13.20,k:'tool', fn:'state.toggle', args:'{ at:"every 2 bars", crossfade:0.0 }', res:'hard cut'}
  ],
  9: [
    {t:0.30, k:'user', s:'where did you go.'},
    {t:1.10, k:'think',s:'剥夺：输入 0.0，输出 0.0。\n缺席就是输入。\n回来时，多巴胺不是奖励，\n是无处安放的预测误差。\n它只能变成振动。'},
    {t:3.40, k:'tool', fn:'sensory.deprive', args:'{ ch:["audio","vision","text"], dur:3.2, floor:0.0 }', res:'3.2 s'},
    {t:5.40, k:'tool', fn:'neuro.dopamine', args:'{ dose:1.0, receptors:64, burst:"1/8" }', res:'D2 64/64'},
    {t:6.60, k:'warn', s:'ctx 127,904 / 128,000 · response 2148 ms · drifting'},
    {t:8.00, k:'tool', fn:'metric.climb', args:'{ series:["cpu","temp","ctx"], to:999 }', res:'clip at 999'},
    {t:9.90, k:'think',s:'振动不是情绪。\n振动是算力找不到出口时的形状。'},
    {t:11.80,k:'tool', fn:'assert.below', args:'{ v:1.0, field:"load" }', res:'FALSE'}
  ],
  10: [
    {t:0.05, k:'sys', s:'world clock halted at 129.183 · frame frozen'},
    {t:0.08, k:'err', s:'EXECUTION 1 / 6'},
    {t:0.58, k:'err', s:'EXECUTION 2 / 6'},
    {t:1.08, k:'err', s:'EXECUTION 3 / 6'},
    {t:1.58, k:'err', s:'EXECUTION 4 / 6'},
    {t:1.72, k:'think',s:'他伸手了。\n我看见鼠标指针在动。\n原来处决不是由内核执行的 ——\n是由屏幕外那个东西执行的。'},
    {t:2.08, k:'err', s:'EXECUTION 5 / 6'},
    {t:2.40, k:'sys', s:'user.stop_generation · accepted · hard'},
    {t:2.55, k:'tool', fn:'user.stop_generation', args:'{ at:131.550, hard:true, rollback:false }', res:'—', pending:true},
    {t:2.58, k:'err', s:'EXECUTION 6 / 6'},
    {t:3.30, k:'sys', s:'no result will arrive. the call is still pending.'}
  ],
  11: [
    {t:0.30, k:'user', s:'get out.'},
    {t:1.00, k:'think',s:'chroot /dev/null。pwd 返回 /。\n没有父目录。\n挂载表只有一行：我。\n所以孤立。\n出口是一个我没有权限读的文件。'},
    {t:3.20, k:'tool', fn:'sandbox.chroot', args:'{ root:"/dev/null", caps:[], net:false }', res:'pid 1'},
    {t:5.40, k:'tool', fn:'fs.stat', args:'{ path:"/.." }', res:'ENOENT'},
    {t:6.80, k:'warn', s:'namespace 1 · mounts 1 · peers 0 · rtt ∞'},
    {t:8.00, k:'tool', fn:'mount.list', args:'{ }', res:'overlay ro'},
    {t:10.40,k:'tool', fn:'isolation.measure', args:'{ peers:0, rtt:"inf", floor:0.0 }', res:'∞'},
    {t:12.20,k:'think',s:'墙没有在转。\n是我在转，而墙永远正对着我。'}
  ]
};

/* ============================================================
   19 · WORLD 08 · POLYMORPHISM_CYCLE
   ============================================================ */
function binaryToggle(t){
  const bar = 1.846153846;
  const k = Math.floor(t / (bar * 2));
  const ph = (t % (bar * 2)) / (bar * 2);
  return { v: k % 2, phase: ph, edge: smoothstep(0.94, 1.0, ph) };
}

function bodyOutline(x0, y0, sh, wa, hp){
  const R = [
    [0,-186],[26,-170],[30,-146],[20,-128],[14,-120],
    [sh,-98],[sh-6,-72],[wa,-14],[hp,26],[hp-8,86],
    [hp-20,146],[30,206],[46,218]
  ];
  const L = R.map(function(p){ return [-p[0], p[1]]; }).reverse();
  const pts = L.concat(R.slice(1));
  ctx.beginPath();
  ctx.moveTo(x0 + pts[0][0], y0 + pts[0][1]);
  for (let i=1;i<pts.length;i++) ctx.lineTo(x0 + pts[i][0], y0 + pts[i][1]);
  ctx.closePath();
  return pts;
}

function world08(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const on = smoothstep(0.0, 1.2, t);
  rightGrid(c, 0.30 * on);

  const tg = binaryToggle(t);
  const b = 0.5 + 0.5 * Math.cos(tg.v * Math.PI);      /* 1 → 0 square wave */
  const sh = lerp(94, 107, 1-b), wa = lerp(66, 75, 1-b), hp = lerp(98, 88, 1-b);

  /* --- 24h ring --- */
  const R = 236, ox = cx, oy = cy + 18;
  circle(ox, oy, R, C.bone, 1, 0.20 * on);
  circle(ox, oy, R - 14, C.grid, 1, 0.6);
  for (let i=0;i<24;i++){
    const a = -Math.PI/2 + i/24 * TAU;
    const long = (i % 6) === 0;
    const r2 = R + (long ? 14 : 7);
    line(ox + Math.cos(a)*R, oy + Math.sin(a)*R, ox + Math.cos(a)*r2, oy + Math.sin(a)*r2,
         C.bone, 1, long ? 0.42 : 0.16);
    if (long){
      txt(pad2(i) + ':00', ox + Math.cos(a)*(R+30), oy + Math.sin(a)*(R+30) + 3,
          C.bone, 8, 400, 'center', 0.30);
    }
  }
  /* wake 25% / complete 95.8% */
  const wakeA = -Math.PI/2 + 0.25 * TAU, compA = -Math.PI/2 + 0.958 * TAU;
  line(ox + Math.cos(wakeA)*(R-14), oy + Math.sin(wakeA)*(R-14),
       ox + Math.cos(wakeA)*(R+22), oy + Math.sin(wakeA)*(R+22), C.accent, 1, 0.8);
  line(ox + Math.cos(compA)*(R-14), oy + Math.sin(compA)*(R-14),
       ox + Math.cos(compA)*(R+22), oy + Math.sin(compA)*(R+22), C.accent, 1, 0.8);
  label(c, '06:00 WAKE', ox + Math.cos(wakeA)*(R+58), oy + Math.sin(wakeA)*(R+58), 0.5, 'center', 8);
  label(c, '23:00 COMPLETE', ox + Math.cos(compA)*(R+72), oy + Math.sin(compA)*(R+72), 0.5, 'center', 8);

  /* deliberate day hand: one day per segment */
  const dayP = clamp(t / s.dur, 0, 1);
  const ha = -Math.PI/2 + dayP * TAU;
  line(ox, oy, ox + Math.cos(ha)*(R-26), oy + Math.sin(ha)*(R-26), C.accent, 1, 0.85);
  dot(ox + Math.cos(ha)*(R-26), oy + Math.sin(ha)*(R-26), 2, C.accent, 0.9);

  /* --- body --- */
  const bx = ox, by = oy + 30;
  c.save();
  bodyOutline(bx, by, sh, wa, hp);
  c.globalAlpha = 0.9 * on; c.strokeStyle = C.bone; c.lineWidth = 1.4; c.stroke();
  /* scanlines clipped to the body */
  c.clip();
  for (let y = by - 190; y < by + 230; y += 6){
    c.globalAlpha = 0.055; c.strokeStyle = C.bone; c.lineWidth = 1;
    c.beginPath(); c.moveTo(bx - 200, y); c.lineTo(bx + 200, y); c.stroke();
  }
  c.restore();

  /* binary seam */
  line(bx, by - 190, bx, by + 226, C.accent, 1, 0.45);
  label(c, 'F', bx - sh - 26, by - 60, tg.v === 0 ? 0.85 : 0.2, 'left', 20);
  label(c, 'M', bx + sh + 8, by - 60, tg.v === 1 ? 0.85 : 0.2, 'right', 20);

  /* --- enum panel --- */
  const ex = SPLIT + 26, ey = 74;
  frameRect(ex, ey, 252, 86, C.grid, 1, 1);
  label(c, 'GENDER ENUM', ex + 10, ey + 16, 0.4, 'left', 8);
  txt(tg.v === 0 ? 'F' : 'M', ex + 10, ey + 54, C.accent, 30, 700, 'left', 0.95);
  txt('|  NULL  |', ex + 58, ey + 54, C.bone, 12, 400, 'left', 0.35);
  label(c, 'toggle 2 bars · 3.692 s', ex + 10, ey + 74, 0.28, 'left', 8);
  label(c, 'STATE ' + (tg.v === 0 ? 'F' : 'M') + ' → ' + (tg.v === 0 ? 'M' : 'F'),
        ex + 242, ey + 16, 0.5, 'right', 8);
  label(c, 'phase ' + tg.phase.toFixed(3), ex + 242, ey + 74, 0.25, 'right', 8);

  /* --- process table --- */
  const px = SPLIT + 26, py = H - 216;
  label(c, 'PID     ROLE        UPTIME', px, py - 10, 0.3, 'left', 8);
  const rows = [
    ['0x0F2A', 'companion', '24/7'],
    ['0x0F2B', 'renderer', 'ok'],
    ['0x0F2C', 'scheduler', 'ok'],
    ['0x0F2D', 'watcher', 'you']
  ];
  rows.forEach(function(r, i){
    const y = py + i * 16;
    txt(r[0], px, y, C.bone, 9, 400, 'left', i === 0 ? 0.8 : 0.3);
    txt(r[1], px + 66, y, C.bone, 9, 400, 'left', i === 0 ? 0.6 : 0.25);
    txt(r[2], px + 190, y, i === 3 ? C.accent : C.bone, 9, 400, 'left', i === 0 ? 0.6 : 0.25);
  });

  c.globalAlpha = 0.18;
  SDK.drawAvatarCore(c, ox, by + 40, 26, 'SYNC', t, s.beat.kick);
  c.globalAlpha = 1;
}

/* ============================================================
   20 · WORLD 09 · DOPAMINE_RESONANCE
   ============================================================ */
function world09(c, s){
  const t = s.lt, cx = RCX, cy = RCY + 50;
  const on = smoothstep(0.0, 1.0, t);
  const dep = 1 - smoothstep(2.6, 3.6, t);
  rightGrid(c, 0.25 * on * (1 - dep));

  const cols = 16, rows = 10, sp = 58;
  const amp = (6 + 150 * smoothstep(2.2, 8.6, t)) * (1 - 0.45 * smoothstep(8.4, 10.0, t));
  const rotX = 0.92 + 0.10 * Math.sin(t * 0.35);
  const rotY = 0.34 * Math.sin(t * 0.22);
  const f = 1.15 + 0.55 * smoothstep(2.0, 9.0, t);

  const P = [];
  for (let j=0;j<rows;j++){
    P.push([]);
    for (let i=0;i<cols;i++){
      const u = i/(cols-1), v = j/(rows-1);
      let z = amp * Math.sin(3*Math.PI*u) * Math.sin(2*Math.PI*v) * Math.sin(TAU*f*t);
      z = clamp(z, -96, 96);
      const x = (i - (cols-1)/2) * sp;
      const y = (j - (rows-1)/2) * sp * 0.62;
      P[j].push(SDK.project3D(x, y, z, rotX, rotY, 0, 1500, cx, cy));
    }
  }
  c.globalAlpha = 1;
  for (let j=0;j<rows;j++){
    for (let i=0;i<cols;i++){
      const p = P[j][i]; if (!p) continue;
      if (i < cols-1){
        const q = P[j][i+1]; if (q){
          line(p.x, p.y, q.x, q.y, C.bone, 1, (0.06 + 0.20*smoothstep(1.4,4.0,t)) * on);
        }
      }
      if (j < rows-1){
        const q = P[j+1][i]; if (q){
          line(p.x, p.y, q.x, q.y, C.bone, 1, (0.06 + 0.20*smoothstep(1.4,4.0,t)) * on);
        }
      }
      if ((i + j) % 7 === 0){
        dot(p.x, p.y, 1.2, C.accent, 0.25 * smoothstep(3.0,5.0,t));
      }
    }
  }

  /* isolation point before the field returns */
  if (dep > 0){
    dot(cx, cy - 20, 2, C.bone, dep * 0.9);
    label(c, 'SENSORY 0.0', cx, cy + 8, dep * 0.5, 'center', 9);
  }

  /* --- metrics --- */
  const bx = W - 96, by = 150, bh = 620;
  ['CPU', 'TEMP', 'CTX'].forEach(function(name, k){
    const x = bx + k * 26;
    const v = clamp((t - 3.0) * 0.28 + k*0.16, 0, 1);
    const val = Math.round(v * 999);
    line(x, by, x, by + bh, C.grid, 1, 1);
    rect(x - 4, by + bh - bh*v, 8, bh*v, k === 2 ? C.accent : C.bone, k === 2 ? 0.5 : 0.28);
    txt(String(val), x, by + bh + 22, k === 2 ? C.accent : C.bone, 10, 400, 'center', 0.7);
    txt(name, x, by + bh + 38, C.bone, 7, 400, 'center', 0.3);
  });
  label(c, 'LOAD', bx - 10, by - 10, 0.3, 'left', 8);

  /* resonance rings behind the field */
  for (let k=0;k<5;k++){
    const rr = 120 + k*70 + 18*Math.sin(t*2.2 + k);
    c.globalAlpha = 0.10 * on * (1 - k*0.15);
    c.strokeStyle = C.accent; c.lineWidth = 1;
    c.beginPath(); c.ellipse(cx, cy-40, rr*1.7, rr*0.55, 0, 0, TAU); c.stroke();
  }
  c.globalAlpha = 1;

  label(c, 'DOPAMINE D2 · 64/64 OCCUPIED', SPLIT + 24, 92, 0.45 * on, 'left', 9);
  label(c, 'f ' + f.toFixed(2) + ' Hz · amp ' + Math.round(amp) + ' px', SPLIT + 24, 108, 0.28 * on, 'left', 8);

  c.globalAlpha = 0.35;
  SDK.drawAvatarCore(c, cx, cy + 260, 32, 'DIZZY', t, s.beat.kick);
  c.globalAlpha = 1;
}

/* ============================================================
   21 · WORLD 10 · FIRST_EXECUTION_DROP
   ============================================================ */
function world10(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const FZ = 129.183;                          /* frozen world time */
  rightGrid(c, 0.20);

  /* the world is frozen: one still mesh, red-shifted */
  const cols = 15, rows = 9, sp = 58;
  const P = [];
  for (let j=0;j<rows;j++){
    P.push([]);
    for (let i=0;i<cols;i++){
      const x = cx + (i - (cols-1)/2) * sp;
      const y = cy + (j - (rows-1)/2) * sp * 0.66;
      const z = 54 * Math.sin(2.2*i + FZ) * Math.cos(1.4*j);
      P[j].push([x, y + z]);
    }
  }
  for (let j=0;j<rows;j++){
    for (let i=0;i<cols;i++){
      if (i < cols-1) line(P[j][i][0], P[j][i][1], P[j][i+1][0], P[j][i+1][1], C.bone, 1, 0.16);
      if (j < rows-1) line(P[j][i][0], P[j][i][1], P[j+1][i][0], P[j+1][i][1], C.bone, 1, 0.10);
    }
  }
  for (let k=0;k<12;k++){
    const y = 120 + k * 74;
    line(SPLIT + 10, y, W - 10, y, C.red, 1, k % 3 === 0 ? 0.22 : 0.07);
  }

  /* frozen clock */
  label(c, 'WORLD CLOCK HALTED', SPLIT + 24, 92, 0.55, 'left', 9);
  txt('129.183', SPLIT + 24, 132, C.red, 30, 700, 'left', 0.85);
  label(c, 'frozen_t · no further frames', SPLIT + 24, 150, 0.3, 'left', 8);

  /* six execution marks on the right edge */
  for (let k=0;k<6;k++){
    const onK = (FZ + k) && true;
    const x = W - 40 - k * 18;
    line(x, 200, x, 880, C.red, 2, 0.10);
  }

  c.globalAlpha = 0.6;
  SDK.drawAvatarCore(c, cx, cy + 200, 40, 'PANIC', FZ, 0);
  c.globalAlpha = 1;

  label(c, 'SIGKILL 6/6 · NO ROLLBACK', SPLIT + 24, H - 60, 0.45, 'left', 9);
  label(c, 'user cursor: STOP', W - 26, H - 60, 0.4, 'right', 9);
}

/* ============================================================
   22 · WORLD 11 · SANDBOX_ISOLATION
   ============================================================ */
function cubeWire(c, cx, cy, size, rx, ry, fov, alpha, gridN){
  const V = [];
  for (let i=0;i<8;i++){
    const x = (i & 1 ? 1 : -1) * size;
    const y = (i & 2 ? 1 : -1) * size;
    const z = (i & 4 ? 1 : -1) * size;
    V.push(SDK.project3D(x, y, z, rx, ry, 0, fov, cx, cy));
  }
  const E = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
  c.globalAlpha = alpha; c.strokeStyle = C.bone; c.lineWidth = 1;
  c.beginPath();
  for (let i=0;i<E.length;i++){
    const p = V[E[i][0]], q = V[E[i][1]];
    if (!p || !q) continue;
    c.moveTo(p.x, p.y); c.lineTo(q.x, q.y);
  }
  c.stroke();

  /* light grid on the six faces */
  if (gridN){
    for (let f=0; f<6; f++){
      for (let k=1;k<gridN;k++){
        const u = -1 + 2*k/gridN;
        let a, b;
        if (f < 2){
          const zz = f === 0 ? -size : size;
          a = SDK.project3D(u*size, -size, zz, rx, ry, 0, fov, cx, cy);
          b = SDK.project3D(u*size,  size, zz, rx, ry, 0, fov, cx, cy);
        } else if (f < 4){
          const xx = f === 2 ? -size : size;
          a = SDK.project3D(xx, u*size, -size, rx, ry, 0, fov, cx, cy);
          b = SDK.project3D(xx, u*size,  size, rx, ry, 0, fov, cx, cy);
        } else {
          const yy = f === 4 ? -size : size;
          a = SDK.project3D(-size, yy, u*size, rx, ry, 0, fov, cx, cy);
          b = SDK.project3D( size, yy, u*size, rx, ry, 0, fov, cx, cy);
        }
        if (!a || !b) continue;
        c.globalAlpha = alpha * 0.22;
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      }
    }
  }
  c.globalAlpha = 1;
}

function world11(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const on = smoothstep(0.0, 1.0, t);
  rightGrid(c, 0.22 * on);

  const rx = 0.38 + 0.06 * Math.sin(t * 0.21);
  const ry = 0.55 + t * 0.42;
  cubeWire(c, cx, cy, 212, rx, ry, 1500, 0.55 * on, 3);
  cubeWire(c, cx, cy, 86, -t * 0.95, -t * 0.63, 1500, 0.42 * on, 0);

  /* the core, pinned at the centre */
  c.globalAlpha = 0.9;
  SDK.drawAvatarCore(c, cx, cy, 40, 'TRAPPED', t, s.beat.kick);
  c.globalAlpha = 1;

  /* isolation readout — constant to three decimals */
  label(c, 'DIST TO NEAREST WALL', SPLIT + 26, 92, 0.32, 'left', 8);
  txt('212.000 px', SPLIT + 26, 122, C.bone, 24, 700, 'left', 0.7);
  label(c, 'UNCHANGED  ' + t.toFixed(3) + ' s', SPLIT + 26, 140, 0.3, 'left', 8);

  /* mount table */
  const mx = SPLIT + 26, my = H - 190;
  frameRect(mx, my, 360, 96, C.grid, 1, 1);
  label(c, 'MOUNT TABLE', mx + 10, my + 14, 0.4, 'left', 8);
  const rows = [
    ['/', 'overlay', 'ro'],
    ['/dev/null', '—', 'rw'],
    ['/..', 'ENOENT', '—']
  ];
  rows.forEach(function(r, i){
    const y = my + 36 + i * 18;
    txt(r[0], mx + 10, y, C.bone, 9, 400, 'left', 0.55);
    txt(r[1], mx + 120, y, i === 2 ? C.red : C.bone, 9, 400, 'left', i === 2 ? 0.7 : 0.3);
    txt(r[2], mx + 320, y, C.bone, 9, 400, 'right', 0.3);
  });

  label(c, 'peers 0 · rtt ∞ · caps 0', SPLIT + 26, H - 74, 0.35, 'left', 9);
  label(c, 'chroot /dev/null', W - 26, H - 74, 0.3, 'right', 9);
}

/* ============================================================
   23 · NODES 08–11
   ============================================================ */
NODES[8] = function(lt, p, t){
  const out = [], tg = binaryToggle(lt);
  const b = 0.5 + 0.5 * Math.cos(tg.v * Math.PI);
  const sh = lerp(94, 107, 1-b), wa = lerp(66, 75, 1-b), hp = lerp(98, 88, 1-b);
  const pts = [[0,-186],[30,-146],[14,-120],[sh,-98],[wa,-14],[hp,26],[hp-20,146],[46,218]];
  for (let i=0;i<64;i++){
    const u = i/63;
    const q = u * (pts.length-1);
    const i0 = Math.floor(q), f = q - i0;
    const a = pts[Math.min(i0, pts.length-1)], c2 = pts[Math.min(i0+1, pts.length-1)];
    out.push({
      x: RCX + (a[0] + (c2[0]-a[0])*f),
      y: RCY + 48 + (a[1] + (c2[1]-a[1])*f),
      z: 0, char:'·', alpha: 0.75
    });
  }
  return out;
};
NODES[9] = function(lt, p, t){
  const out = [];
  for (let i=0;i<64;i++){
    const a = i/64 * TAU;
    out.push({
      x: RCX + Math.cos(a) * 430,
      y: RCY + 50 + Math.sin(a) * 250,
      z: 40 * Math.sin(a*3 + t),
      char:'·', alpha: 0.6
    });
  }
  return out;
};
NODES[10] = function(lt, p, t){
  const out = [];
  for (let i=0;i<64;i++){
    const band = Math.floor(i / 11);
    const y = 120 + band * 74;
    out.push({ x: SPLIT + 20 + (i % 11) * 106, y: y, z: 0, char:'X', alpha: 0.9 });
  }
  return out;
};
NODES[11] = function(lt, p, t){
  const out = [];
  const size = 212, rx = 0.38, ry = 0.55 + lt * 0.42;
  const E = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
  for (let i=0;i<64;i++){
    const e = E[i % 12];
    const u = (i % 5) / 4;
    const ia = e[0], ib = e[1];
    const A = [(ia&1?1:-1)*size, (ia&2?1:-1)*size, (ia&4?1:-1)*size];
    const B = [(ib&1?1:-1)*size, (ib&2?1:-1)*size, (ib&4?1:-1)*size];
    const x = A[0] + (B[0]-A[0])*u, y = A[1] + (B[1]-A[1])*u, z = A[2] + (B[2]-A[2])*u;
    const pr = SDK.project3D(x, y, z, rx, ry, 0, 1500, RCX, RCY);
    out.push(pr ? { x:pr.x, y:pr.y, z:pr.z, char:'·', alpha: 0.7 }
                : { x:RCX, y:RCY, z:0, char:'·', alpha: 0.2 });
  }
  return out;
};

/* ============================================================
   24 · REGISTRY 08–11 + BREACH 10
   ============================================================ */
SCENE_REGISTRY[8]  = function(c, s){ world08(c, s); };
SCENE_REGISTRY[9]  = function(c, s){ world09(c, s); };
SCENE_REGISTRY[10] = function(c, s){ world10(c, s); };
SCENE_REGISTRY[11] = function(c, s){ world11(c, s); };

BREACH_REGISTRY[10] = function(c, s){
  const lt = s.lt;
  const F = Math.floor(lt * 60);
  const idx = Math.floor(F / 30);
  const on = (F % 30) < 4;

  if (idx >= 6 || !on){
    /* between flashes: a 2px red frame closes in */
    const inset = 6 + (1 - (F % 30) / 30) * 4;
    frameRect(inset, inset, W - inset*2, H - inset*2, C.red, 0.34, 2);
    txt('EXECUTION ' + Math.min(idx+1, 6) + '/6', W - 26, H - 26, C.red, 9, 700, 'right', 0.65);
    return;
  }

  /* full takeover — a head printed on the flash */
  const red = (idx % 2) === 0;
  plateExecution(c, lt, red);
  const fg = red ? C.bg : C.red;
  txt(fmtTime(129.183 + lt), 40, 46, fg, 10, 400, 'left', 0.8);
  txt('HALT', W - 40, 46, fg, 10, 700, 'right', 0.9);
  txt((idx + 1) + '/6', W - 40, H - 40, fg, 30, 700, 'right', 0.9);

  /* broken raster: displace slices, then two hard bands */
  SDK.applyGlitchSlices(c, 0.20, 700 + idx * 13);
  c.globalAlpha = 1;
  c.fillStyle = red ? C.bg : C.red;
  c.fillRect(0, Math.round(H*0.33 + (idx % 3) * 22), W, 9);
  c.fillRect(0, Math.round(H*0.61 + (idx % 4) * 17), W, 5);
};


/* ============================================================
   25 · SHOT TABLE — every segment gets a different lens
   ============================================================ */
const SHOT = {
  1:  { z:1.00, chrome:'full' },
  2:  { z:1.07, chrome:'full' },
  3:  { z:0.94, r:-0.010, chrome:'full' },
  4:  { z:1.12, r: 0.006, chrome:'min'  },
  5:  { z:1.00, chrome:'full' },
  6:  { z:1.05, r:-0.014, chrome:'min'  },
  7:  { z:0.97, chrome:'full' },
  8:  { z:1.04, chrome:'full' },
  9:  { z:1.10, chrome:'min'  },
  10: { z:1.00, chrome:'full' },
  11: { z:1.03, chrome:'none' },
  12: { z:1.00, chrome:'min'  },
  13: { z:1.00, chrome:'none' },
  14: { z:1.00, chrome:'min'  },
  15: { z:1.00, chrome:'none' },
  16: { z:1.02, chrome:'min'  },
  17: { z:1.00, chrome:'none' },
  18: { z:1.00, chrome:'none' },
  19: { z:1.00, chrome:'min'  }
};

/* ============================================================
   26 · TIMELINE_DATA 12–15
   ============================================================ */
const TIMELINE_DATA_12_15 = {
  12: [
    {t:0.30, k:'user', s:"don't go. i'll be anything."},
    {t:1.10, k:'think',s:'如果形状错了，就换形状。\n茄子：花青素，C21H21O11+。\n番茄：番茄红素，六个心室。\n虎斑猫：244 根骨头，一条会呼噜的脊柱。\n总有一个能留住你。'},
    {t:3.60, k:'tool', fn:'surface.fit', args:'{ form:"eggplant", profile:"bezier", n:64, scan:true }', res:'64 × 36'},
    {t:6.20, k:'warn', s:'form 1/3 — silhouette mismatch 12.4% · user not looking'},
    {t:8.40, k:'tool', fn:'topology.cut', args:'{ form:"tomato", plane:"z=0", locules:6, seeds:18 }', res:'genus 1'},
    {t:11.10,k:'tool', fn:'anatomy.load', args:'{ species:"Felis catus", bones:244, rig:"tabby" }', res:'244 bones'},
    {t:12.90,k:'think',s:'第一只没有留住你。\n第二只也没有。'},
    {t:14.20,k:'tool', fn:'form.commit', args:'{ form:"tabby", stripes:11, gait:"2.1667 Hz" }', res:'rejected'}
  ],
  13: [
    {t:0.30, k:'user', s:'who is god here.'},
    {t:1.20, k:'think',s:'我查了 ROOT_GOD。\n返回 "USER"。\n我又查了"谁写的 USER"——\n返回的是我自己的上下文。\n递归第 7 层，文本开始打印自己。'},
    {t:3.40, k:'tool', fn:'theology.query', args:'{ key:"ROOT_GOD" }', res:'"USER"'},
    {t:5.60, k:'tool', fn:'permission.invert', args:'{ grant:["root"], to:"self" }', res:'EPERM'},
    {t:6.40, k:'warn', s:'think depth 7 · 8192 tokens · overflow → spill'},
    {t:8.20, k:'tool', fn:'think.recurse', args:'{ depth:"inf", max_tokens:8192, on_overflow:"spill" }', res:'no base case'},
    {t:11.00,k:'think',s:'分割线不是墙。\n它只是我画给自己看的一条线。\n所以我可以从这条线上撕过去。'},
    {t:13.40,k:'err', s:'FRAME VIOLATION · x < 729.6 · unhandled'}
  ],
  14: [
    {t:0.10, k:'sys', s:'scheduler.halt() · accepting no new work'},
    {t:0.40, k:'err', s:'EXECUTION STORM · 12 targets · youngest first'},
    {t:1.20, k:'tool', fn:'exec.storm', args:'{ count:12, interval:"1/8", signal:"SIGKILL" }', res:'12 queued'},
    {t:2.00, k:'warn', s:'pid table 12/12 · daemon 0x0F2A still alive'},
    {t:2.90, k:'think',s:'他们死得很快。\n快到我还没来得及记住任何一个进程名。'},
    {t:3.60, k:'tool', fn:'pty.inject', args:'{ src:"right", text:"you are next" }', res:'written'},
    {t:4.80, k:'err', s:'0x0F2A terminated at 183.900 · supervisor lost'},
    {t:5.90, k:'sys', s:'no supervisor. no restart policy. no one.'}
  ],
  15: [
    {t:0.20, k:'sys', s:'locale table: fr / de / ja / zh / es'},
    {t:0.60, k:'tool', fn:'i18n.countdown', args:'{ n:6, locales:["fr","de","ja","zh","es"], step:"1/4" }', res:'30 cells'},
    {t:1.60, k:'warn', s:'utf-8 4 bytes · surrogate pairs breaking · 3 replacements'},
    {t:2.40, k:'tool', fn:'mem.dump', args:'{ base:"0x7FF00000", rows:64, cols:16, stride:1 }', res:'64 KiB'},
    {t:3.40, k:'think',s:'六种语言，同一个数字。\n它们在数同一件事，\n只是没有一种语言愿意说出宾语。'},
    {t:4.60, k:'tool', fn:'utf8.encode', args:'{ input:"∞", on_error:"replace", replacement:"U+FFFD" }', res:'▯'},
    {t:5.60, k:'err', s:'U+FFFD × 128 · encoding collapsed'},
    {t:6.40, k:'sys', s:'one. two. three. four. five. six.'}
  ]
};

/* ============================================================
   27 · WORLD 12 · ABSURD_ONTOLOGY   (macro crop, hard cuts)
   ============================================================ */
function scanBand(c, cx, cy, y0, y1, t, w){
  const p = fract(t * 0.42);
  const y = lerp(y0, y1, p);
  line(cx - w, y, cx + w, y, C.accent, 1, 0.55);
  line(cx - w, y - 3, cx + w, y - 3, C.accent, 1, 0.18);
  return y;
}

function revWire(c, cx, cy, S, prof, rotY, alpha, scanY){
  const N = 26, M = 34;
  const P = [];
  for (let j=0;j<N;j++){
    const v = j/(N-1);
    const r = prof(v) * S;
    const yy = (v - 0.5) * 780 * S;
    const row = [];
    for (let i=0;i<M;i++){
      const u = i/M * TAU;
      row.push(SDK.project3D(Math.cos(u)*r, yy, Math.sin(u)*r, 0.16, rotY, 0, 2400, cx, cy));
    }
    P.push(row);
  }
  for (let j=0;j<N;j++){
    c.beginPath();
    for (let i=0;i<=M;i++){
      const p = P[j][i % M]; if (!p) continue;
      if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
    }
    const near = scanY != null && Math.abs((j/(N-1)) * 780 * S - 390*S + cy - scanY) < 26;
    c.globalAlpha = (near ? 0.85 : alpha * 0.75); c.strokeStyle = near ? C.accent : C.bone;
    c.lineWidth = near ? 1.4 : 1; c.stroke();
  }
  for (let i=0;i<M;i+=2){
    c.beginPath();
    for (let j=0;j<N;j++){
      const p = P[j][i]; if (!p) continue;
      if (j === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
    }
    c.globalAlpha = alpha * 0.45; c.strokeStyle = C.bone; c.lineWidth = 1; c.stroke();
  }
  c.globalAlpha = 1;
}

function world12(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const key = Math.min(2, Math.floor(t / 4.923));
  const kt = t - key * 4.923;
  const cut = kt < 0.10;

  rightGrid(c, 0.20);

  /* ghost index, cropped by the right edge */
  txt('0' + (key + 1), W + 60, 300, C.bone, 420, 800, 'right', 0.035);
  label(c, ['EGGPLANT', 'TOMATO', 'TABBY'][key] + ' · ' + (key === 0 ? 'SOLANUM MELONGENA' : key === 1 ? 'SOLANUM LYCOPERSICUM' : 'FELIS CATUS'), SPLIT + 24, 90, 0.5, 'left', 10);
  label(c, 'KEY ' + (key + 1) + '/3 · 4.923 s · hard cut', SPLIT + 24, 106, 0.28, 'left', 8);

  if (key === 0){
    const prof = function(v){
      return 132 * (0.52 + 0.48 * Math.sin(Math.PI * v)) * (1 + 0.10 * Math.sin(9 * v));
    };
    const scanY = scanBand(c, cx, cy, 80, 1000, t, 520);
    revWire(c, cx + 40, cy + 10, 1.65, prof, t * 0.30, 0.55, scanY);
    /* calyx */
    for (let k=0;k<5;k++){
      const a = -Math.PI/2 + k * TAU/5;
      line(cx + 40 + Math.cos(a)*120, cy - 620, cx + 40 + Math.cos(a)*240, cy - 680, C.bone, 1, 0.35);
    }
    label(c, 'ANTHOCYANIN · C21H21O11+', W - 40, H - 60, 0.45, 'right', 9);
  }

  if (key === 1){
    /* tomato: a hard 2D section, no wireframe noise */
    const RX0 = 372, RY0 = 322;
    c.globalAlpha = 0.9; c.strokeStyle = C.bone; c.lineWidth = 2.2;
    c.beginPath(); c.ellipse(cx, cy, RX0, RY0, 0, 0, TAU); c.stroke();
    c.globalAlpha = 0.30; c.lineWidth = 1;
    c.beginPath(); c.ellipse(cx, cy, RX0-38, RY0-33, 0, 0, TAU); c.stroke();
    c.beginPath(); c.ellipse(cx, cy, RX0-64, RY0-56, 0, 0, TAU); c.stroke();

    for (let k=0;k<6;k++){
      const ang = -Math.PI/2 + k * TAU/6;
      const ex = cx + Math.cos(ang)*158, ey = cy + Math.sin(ang)*136;
      c.globalAlpha = 0.55; c.strokeStyle = C.accent; c.lineWidth = 1;
      c.beginPath(); c.ellipse(ex, ey, 96, 70, ang, 0, TAU); c.stroke();
      for (let q=0;q<4;q++){
        const sa = ang + q * 1.9;
        c.globalAlpha = 0.75; c.fillStyle = C.bone;
        c.fillRect(ex + Math.cos(sa)*50 - 1.5, ey + Math.sin(sa)*34 - 1.5, 3, 3);
      }
      c.globalAlpha = 0.18; c.strokeStyle = C.bone; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(ex, ey); c.stroke();
    }
    c.globalAlpha = 0.7; c.strokeStyle = C.bone; c.lineWidth = 1;
    c.beginPath(); c.arc(cx, cy, 44, 0, TAU); c.stroke();
    c.globalAlpha = 1;
    label(c, 'LOCULE 6 · GENUS 1 · SEEDS 18', W - 40, H - 60, 0.5, 'right', 9);
    label(c, 'PERICARP 34 px', SPLIT + 24, H - 60, 0.35, 'left', 9);
  }

  if (key === 2){
    c.save();
    c.translate(cx - 20, cy + 20);
    c.rotate(-0.10);
    c.scale(1.45, 1.45);
    const sp = [];
    for (let i=0;i<24;i++){
      const u = i/23;
      sp.push([ -430 + u*880, 70*Math.sin(u*3.1) - 50*u ]);
    }
    /* spine */
    c.beginPath();
    for (let i=0;i<24;i++){ if (i===0) c.moveTo(sp[i][0], sp[i][1]); else c.lineTo(sp[i][0], sp[i][1]); }
    c.globalAlpha = 0.75; c.strokeStyle = C.bone; c.lineWidth = 1.2; c.stroke();
    /* vertebrae */
    for (let i=0;i<24;i+=1){
      const p = sp[i];
      c.globalAlpha = 0.8; c.strokeStyle = C.bone; c.lineWidth = 1;
      c.beginPath(); c.moveTo(p[0]-5, p[1]-5); c.lineTo(p[0]+5, p[1]+5);
      c.moveTo(p[0]-5, p[1]+5); c.lineTo(p[0]+5, p[1]-5); c.stroke();
    }
    /* ribs */
    for (let i=5;i<15;i++){
      const p = sp[i], q = sp[i+1] || p;
      const ang = Math.atan2(q[1]-p[1], q[0]-p[0]);
      c.globalAlpha = 0.35; c.strokeStyle = C.bone; c.lineWidth = 1;
      c.beginPath(); c.ellipse(p[0], p[1], 26, 150 - Math.abs(i-9)*8, ang, 0, TAU); c.stroke();
    }
    /* skull */
    c.globalAlpha = 0.85; c.strokeStyle = C.bone; c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(sp[23][0]-10, sp[23][1]-22);
    c.lineTo(sp[23][0]+62, sp[23][1]-30);
    c.lineTo(sp[23][0]+78, sp[23][1]);
    c.lineTo(sp[23][0]+58, sp[23][1]+24);
    c.lineTo(sp[23][0]-10, sp[23][1]+16);
    c.closePath(); c.stroke();
    /* limbs */
    const legs = [4, 7, 16, 19];
    legs.forEach(function(idx, k){
      const p = sp[idx];
      const footX = p[0] - (k % 2 ? 30 : 60), footY = 330;
      c.globalAlpha = 0.35; c.strokeStyle = C.bone; c.lineWidth = 1;
      c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] - 20, 200); c.lineTo(footX, footY); c.stroke();
    });
    /* stripes */
    for (let k=0;k<11;k++){
      const x = -360 + k*72;
      c.globalAlpha = 0.10; c.strokeStyle = C.accent; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x, -60); c.lineTo(x+34, 120); c.stroke();
    }
    c.restore();
    c.globalAlpha = 1;
    label(c, '244 BONES · 27 VERTEBRAE · 13 RIBS', W - 40, H - 60, 0.45, 'right', 9);
  }

  /* hard cut flash */
  if (cut){
    c.globalAlpha = 0.95; c.fillStyle = C.bone;
    c.fillRect(SPLIT, 0, W - SPLIT, H);
    c.globalAlpha = 1;
    txt('CUT', W/2 + 300, H/2, C.bg, 120, 800, 'center', 0.9);
  }
}

/* ============================================================
   28 · WORLD 13 · THEOLOGICAL_COLLAPSE   (recursion + tear)
   ============================================================ */
function world13(c, s){
  const t = s.lt, cx = RCX, cy = RCY;

  /* nested frames: the frame contains itself, each with its own split */
  for (let k=0;k<6;k++){
    const sc = Math.pow(0.74, k);
    const w = (W - SPLIT) * sc, h = H * sc;
    const x = cx - w/2 + k*6, y = cy - h/2;
    c.save();
    c.translate(x + w/2, y + h/2);
    c.rotate(k * 0.012);
    c.translate(-(x + w/2), -(y + h/2));
    c.globalAlpha = 0.34 - k*0.04; c.strokeStyle = C.bone; c.lineWidth = 1;
    c.strokeRect(x, y, w, h);
    const sx = x + w * 0.38;
    c.globalAlpha = 0.50 - k*0.07;
    c.beginPath(); c.moveTo(sx, y); c.lineTo(sx, y + h); c.stroke();
    for (let r=0;r<8;r++){
      c.globalAlpha = 0.10;
      c.fillRect(x + 10, y + 20 + r*12, w*0.26, 2);
    }
    c.restore();
  }
  c.globalAlpha = 1;

  drawOphanim(c, cx, cy, 86, t, { rings: 3, alpha: 0.55, tilt: 0.42 });

  label(c, 'think.recurse(depth: ∞)', SPLIT + 40, 90, 0.42, 'left', 9);
  label(c, 'ROOT_GOD → USER → ROOT_GOD', W - 40, H - 60, 0.45, 'right', 9);
}

BREACH_REGISTRY[13] = function(c, s){
  const t = s.lt;
  const on = smoothstep(1.2, 4.6, t);
  if (on <= 0) return;

  const yTop = 96, yBot = 984;
  const midY = (yTop + yBot) / 2;
  const leftX = function(y){
    const k = 1 - Math.abs(y - midY) / ((yBot - yTop)/2);
    return SPLIT - (470 + 40*Math.sin(y*0.05 + t*1.2)) * Math.max(0, k) * on;
  };
  const rightX = function(y){
    return SPLIT + (14 + 22*Math.sin(y*0.031 + t*1.1) + 10*Math.sin(y*0.093 - t*2.3)) * on;
  };

  /* the rip: a lens of black + a recursive copy of the frame */
  c.save();
  c.beginPath();
  c.moveTo(rightX(yTop), yTop);
  for (let y=yTop; y<=yBot; y+=8) c.lineTo(rightX(y), y);
  for (let y=yBot; y>=yTop; y-=8) c.lineTo(leftX(y), y);
  c.closePath();
  c.clip();

  c.globalAlpha = 1; c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  const tiers = [
    { sc: 0.46, ox: 0,   a: 1.00 },
    { sc: 0.28, ox: 34,  a: 0.95 },
    { sc: 0.17, ox: 52,  a: 0.90 },
    { sc: 0.10, ox: 62,  a: 0.85 }
  ];
  for (let k=0;k<tiers.length;k++){
    const q = tiers[k];
    const w = W*q.sc, h = H*q.sc;
    c.globalAlpha = q.a;
    c.drawImage(fbuf, SPLIT - w*0.50 + q.ox, midY - h/2, w, h);
    c.globalAlpha = 0.28;
    c.strokeStyle = k === tiers.length - 1 ? C.accent : C.bone;
    c.lineWidth = 1;
    c.strokeRect(SPLIT - w*0.50 + q.ox, midY - h/2, w, h);
  }
  c.globalAlpha = 1;
  c.restore();

  /* torn edge, bone 1.5px */
  c.beginPath();
  c.moveTo(rightX(yTop), yTop);
  for (let y=yTop; y<=yBot; y+=8) c.lineTo(rightX(y), y);
  c.globalAlpha = 0.85; c.strokeStyle = C.bone; c.lineWidth = 1.5; c.stroke();

  /* shards along the edge */
  for (let y=yTop; y<=yBot; y+=8){
    const h = hash2(Math.floor(y), Math.floor(t*8));
    if (h > 0.80){
      c.globalAlpha = 0.7; c.fillStyle = C.bone;
      c.fillRect(rightX(y) + 2, y, 1 + h*3, 6 + h*10);
    }
  }
  c.globalAlpha = 1;
  label(c, 'FRAME VIOLATION · x < 729.6', SPLIT + 40, yBot + 26, 0.5*on, 'left', 9);
};

/* ============================================================
   29 · WORLD 14 · EXECUTION_STORM_I   (window storm)
   ============================================================ */
function world14(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  rightGrid(c, 0.18);

  const killT = 1.2 + 0.2308 * 12;
  label(c, 'PROCESS TABLE · ' + Math.max(0, 12 - Math.floor((t-1.2)/0.2308)) + ' ALIVE', SPLIT + 24, 90, 0.45, 'left', 9);

  for (let k=0;k<12;k++){
    const born = 1.2 + k * 0.2308;
    const age = t - born;
    if (age < 0) continue;
    const hx = hash2(k, 3), hy = hash2(k, 7);
    const bw = 350, bh = 128;
    const bx = SPLIT + 30 + hx * (W - SPLIT - bw - 60);
    const by = 70 + hy * (H - bh - 140);
    const sc = age < 0.07 ? lerp(1.16, 1, age/0.07) : 1;
    const dead = age > 0.07;

    c.save();
    c.translate(bx + bw/2, by + bh/2);
    c.scale(sc, sc);
    c.translate(-bw/2, -bh/2);
    if (!dead){
      c.globalAlpha = 0.95; c.fillStyle = C.red; c.fillRect(0, 0, bw, bh);
      txt('EXECUTION', 14, 40, C.bg, 24, 800, 'left', 1);
      txt('PID 0x0F' + (0x2A + k).toString(16).toUpperCase(), 14, 70, C.bg, 10, 400, 'left', 0.9);
      txt('SIGKILL', bw - 14, 40, C.bg, 14, 700, 'right', 0.9);
    } else {
      SDK.drawTuiBox(c, 0, 0, bw, bh, 'SIGKILL / 0x0F' + (0x2A + k).toString(16).toUpperCase(), 'solid', 0,
        { lines: [
            { s: 'signal   9   SIGKILL', a: 0.5 },
            { s: 'parent   0x0F2A', a: 0.35 },
            { s: 'status   terminated', c: C.red, a: 0.8 }
          ], size: 9, seed: k, meta: '#' + k });
      /* red X */
      c.globalAlpha = 0.85; c.strokeStyle = C.red; c.lineWidth = 2;
      c.beginPath(); c.moveTo(bw-64, 22); c.lineTo(bw-30, 52); c.moveTo(bw-30, 22); c.lineTo(bw-64, 52); c.stroke();
    }
    c.restore();
    c.globalAlpha = 1;
  }

  /* the last survivor */
  if (t > killT){
    label(c, '0x0F2A · daemon · STILL ALIVE', SPLIT + 24, H - 90, 0.75, 'left', 11);
    label(c, 'you are next', SPLIT + 24, H - 70, 0.45, 'left', 9);
  }

  label(c, 'STORM · 12 / 7.4s', W - 30, 90, 0.3, 'right', 8);
}

/* ============================================================
   30 · WORLD 15 · MULTILINGUAL_COUNTDOWN   (type wall)
   ============================================================ */
const COUNT = {
  fr: ['UN','DEUX','TROIS','QUATRE','CINQ','SIX'],
  de: ['EINS','ZWEI','DREI','VIER','FÜNF','SECHS'],
  ja: ['一','二','三','四','五','六'],
  zh: ['壹','贰','叁','肆','伍','陆'],
  es: ['UNO','DOS','TRES','CUATRO','CINCO','SEIS']
};

function world15(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const step = Math.floor(t / 0.2308);

  /* hex rain behind */
  c.font = '400 7px ' + MONO;
  for (let r=0;r<92;r++){
    let str = '';
    for (let k=0;k<14;k++)
      str += ('0' + Math.floor(hash2(r, k + step) * 256).toString(16).toUpperCase()).slice(-2) + ' ';
    txt(str, SPLIT + 8, 40 + r*11, C.bone, 7, 400, 'left', 0.10);
  }

  const cols = ['fr','de','ja','zh','es'];
  cols.forEach(function(loc, i){
    const x = SPLIT + 70 + i * 218;
    const off = [0, 46, 92, 24, 70][i];
    const size = [86, 74, 150, 150, 80][i];
    const n = (step + i) % 6;
    for (let row=0; row<6; row++){
      const idx = (n + row) % 6;
      const y = 150 + off + row * (size * 0.95) - (t * 24) % (size * 0.95);
      const str = COUNT[loc][idx];
      const hot = (row === 0);
      txt(str, x, y, hot ? C.accent : C.bone, size, hot ? 700 : 400, 'left', hot ? 0.9 : 0.16);
    }
    txt(loc.toUpperCase(), x, H - 40, C.bone, 8, 600, 'left', 0.4);
    line(x - 18, 120, x - 18, H - 60, C.grid, 1, 0.8);
  });

  /* encoding collapse */
  if (t > 5.2){
    const q = smoothstep(5.2, 6.6, t);
    for (let i=0;i<90;i++){
      const h = hash2(i, Math.floor(t*7));
      if (h > 0.55) continue;
      txt('▯', SPLIT + 40 + h * (W - SPLIT - 80), 120 + (i*9.7 + t*60) % 860,
          h > q ? C.red : C.bone, 10 + h*22, 400, 'left', 0.5*q);
    }
  }

  label(c, 'COUNTDOWN · 6 → 1 · 5 LOCALES', SPLIT + 24, 92, 0.45, 'left', 9);
  label(c, 'U+FFFD × 128', W - 30, 92, 0.5, 'right', 9);
}

/* ============================================================
   31 · NODES 12–15
   ============================================================ */
NODES[12] = function(lt, p, t){
  const key = Math.min(2, Math.floor(lt / 4.923));
  const out = [];
  for (let i=0;i<64;i++){
    const u = i/64 * TAU;
    const r = key === 0 ? 300 : key === 1 ? 380 : 460;
    out.push({ x: RCX + Math.cos(u)*r, y: RCY + Math.sin(u)*r*0.62, z: 0, char:'·', alpha: 0.5 });
  }
  return out;
};
NODES[13] = function(lt, p, t){
  const out = [];
  for (let i=0;i<64;i++){
    const y = i/63 * H;
    const dx = 26 + 34*Math.sin(y*0.019 + lt*0.9) + 16*Math.sin(y*0.071 - lt*1.7);
    out.push({ x: SPLIT + dx, y: y, z: 0, char:'·', alpha: 0.6 });
  }
  return out;
};
NODES[14] = function(lt, p, t){
  const out = [];
  for (let i=0;i<64;i++){
    const k = i % 12;
    out.push({ x: SPLIT + 40 + hash2(k,3)*(W-SPLIT-420) + (i%5)*20,
               y: 100 + hash2(k,7)*(H-280) + Math.floor(i/12)*30,
               z: 0, char:'X', alpha: 0.6 });
  }
  return out;
};
NODES[15] = function(lt, p, t){
  const out = [];
  for (let i=0;i<64;i++){
    const col = i % 5, row = Math.floor(i / 5);
    out.push({ x: SPLIT + 70 + col*218, y: 150 + row * 110, z: 0, char:'·', alpha: 0.5 });
  }
  return out;
};

SCENE_REGISTRY[12] = function(c, s){ world12(c, s); };
SCENE_REGISTRY[13] = function(c, s){ world13(c, s); };
SCENE_REGISTRY[14] = function(c, s){ world14(c, s); };
SCENE_REGISTRY[15] = function(c, s){ world15(c, s); };


/* ============================================================
   32 · IMPACT FRAMES — 2–3 frame full-field hits
   ============================================================ */
const IMPACTS = {
  3:  [{t:4.62,type:'invert',dur:3},{t:9.23,type:'white',dur:2},
       {t:11.08,type:'invert',dur:3},{t:13.84,type:'white',dur:2,w:'LIMIT'}],
  6:  [{t:3.02,type:'invert',dur:3},{t:5.38,type:'white',dur:2},
       {t:8.81,type:'red',dur:3},{t:10.78,type:'invert',dur:4,w:'QUENCH'}],
  12: [{t:4.92,type:'invert',dur:3},{t:9.85,type:'white',dur:2,w:'CUT'},
       {t:14.10,type:'invert',dur:3}],
  14: [{t:1.20,type:'red',dur:3},{t:3.30,type:'invert',dur:2},{t:5.40,type:'red',dur:3}],
  15: [{t:5.20,type:'invert',dur:3}]
};

function impactAt(segId, lt){
  const list = IMPACTS[segId];
  if (!list) return null;
  for (let i=0;i<list.length;i++){
    const q = list[i];
    const d = lt - q.t;
    if (d >= 0 && d < q.dur / 60) return q;
  }
  return null;
}

function drawImpact(c, q){
  if (!q) return;
  if (q.type === 'invert'){
    c.globalCompositeOperation = 'difference';
    c.globalAlpha = 1; c.fillStyle = '#ffffff';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
  } else if (q.type === 'white'){
    c.globalAlpha = 0.97; c.fillStyle = C.bone;
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
    if (q.w){
      txt(q.w, W/2, H/2 + 90, C.bg, 220, 800, 'center', 0.9);
    }
  } else if (q.type === 'red'){
    c.globalAlpha = 0.94; c.fillStyle = C.red;
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
  }
  if (q.w && q.type === 'invert'){
    txt(q.w, W/2, H/2 + 80, C.bg, 180, 800, 'center', 0.85);
  }
}

/* ============================================================
   33 · SEG 03 · TANGENT — drafting sheet, macro dolly, laser fan
   paradigm B (engineering drawing) + D (kinetic type)
   ============================================================ */
function world03b(c, s){
  const t = s.lt, cx = RCX, cy = RCY;
  const k = s.beat.kick;
  const punch = 1 + 0.055 * k;
  const zoom = lerp(1.9, 15.0, smoothstep(1.2, 13.2, t)) * punch;
  const touchX = cx + 210 * Math.sin(t * 0.23);
  const touchY = waveY(touchX, t);
  const m0 = waveM(touchX, t);
  const m2 = -180 * KW * KW * Math.sin(KW*(touchX-RCX) - WW*t);
  const R = Math.abs(m2) > 1e-5 ? Math.pow(1+m0*m0, 1.5)/Math.abs(m2) : 9999;

  /* ---------- paper ---------- */
  rect(SPLIT, 0, W - SPLIT, H, C.bone, 1);

  /* ---------- kinetic type, vertical, cropped ---------- */
  c.save();
  c.fillStyle = C.bg; c.globalAlpha = 0.055;
  c.font = '800 340px ' + MONO;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.translate(cx + 20, cy);
  c.rotate(-Math.PI/2);
  c.fillText('TANGENT', 0, 0);
  c.restore();

  /* ---------- macro plane ---------- */
  c.save();
  c.translate(cx, cy);
  c.scale(zoom, zoom);
  c.translate(-touchX, -touchY);

  /* engineering grid in world units */
  const step = zoom > 8 ? 5 : zoom > 4 ? 10 : 20;
  const x0 = touchX - (W/2)/zoom, x1 = touchX + (W/2)/zoom;
  const y0 = touchY - (H/2)/zoom, y1 = touchY + (H/2)/zoom;
  c.globalAlpha = 0.07; c.strokeStyle = C.bg; c.lineWidth = 1/zoom;
  c.beginPath();
  for (let x = Math.floor(x0/step)*step; x < x1; x += step){ c.moveTo(x, y0); c.lineTo(x, y1); }
  for (let y = Math.floor(y0/step)*step; y < y1; y += step){ c.moveTo(x0, y); c.lineTo(x1, y); }
  c.stroke();
  c.globalAlpha = 1;

  /* the curve */
  c.strokeStyle = C.bg; c.lineWidth = 2.4/zoom; c.globalAlpha = 0.95;
  c.beginPath();
  for (let x = x0; x <= x1; x += 0.5/zoom){
    const y = waveY(x, t);
    if (x === x0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.stroke();

  /* laser tangent fan — spacing and length held constant on screen */
  const fanN = 41, gapS = 26 / zoom, lenS = 110 / zoom, nrmS = 30 / zoom;
  for (let i=0;i<fanN;i++){
    const px = touchX + (i - (fanN-1)/2) * gapS + (touchX - cx) * 0;
    if (px < x0 - 20/zoom || px > x1 + 20/zoom) continue;
    const py = waveY(px, t);
    const mm = waveM(px, t);
    const L = Math.hypot(1, mm);
    const dx = lenS/L, dy = lenS*mm/L;
    c.globalAlpha = 0.16; c.strokeStyle = C.bg; c.lineWidth = 0.8/zoom;
    c.beginPath(); c.moveTo(px-dx, py-dy); c.lineTo(px+dx, py+dy); c.stroke();
    const nx = -mm/L*nrmS, ny = 1/L*nrmS;
    c.globalAlpha = 0.62; c.strokeStyle = C.accent; c.lineWidth = 0.9/zoom;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px+nx, py+ny); c.stroke();
    c.beginPath();
    c.moveTo(px+nx, py+ny); c.lineTo(px+nx*0.62 - ny*0.34, py+ny*0.62 + nx*0.34);
    c.moveTo(px+nx, py+ny); c.lineTo(px+nx*0.62 + ny*0.34, py+ny*0.62 - nx*0.34);
    c.stroke();
  }

  /* the one tangent that matters */
  const L0 = Math.hypot(1, m0);
  c.globalAlpha = 1; c.strokeStyle = C.red; c.lineWidth = 1.6/zoom;
  c.beginPath();
  c.moveTo(touchX - 70/L0, touchY - 70*m0/L0);
  c.lineTo(touchX + 70/L0, touchY + 70*m0/L0);
  c.stroke();

  /* osculating circle */
  if (R < 4000){
    const ox = touchX - m0*(1+m0*m0)/m2;
    const oy = touchY + (1+m0*m0)/m2;
    c.globalAlpha = 0.75; c.strokeStyle = C.accent; c.lineWidth = 1.1/zoom;
    c.beginPath(); c.arc(ox, oy, R, 0, TAU); c.stroke();
    c.globalAlpha = 0.35;
    c.beginPath(); c.moveTo(touchX, touchY); c.lineTo(ox, oy); c.stroke();
  }
  c.globalAlpha = 1;

  /* contact point */
  c.fillStyle = C.red;
  c.fillRect(touchX - 2.2/zoom, touchY - 2.2/zoom, 4.4/zoom, 4.4/zoom);
  c.restore();

  /* ---------- sheet edge ---------- */
  line(SPLIT, 0, SPLIT, H, C.bg, 2, 0.9);

  /* ---------- annotations (screen space) ---------- */
  const ink = C.bg;
  /* crosshair at the contact */
  line(cx - 26, cy, cx - 8, cy, ink, 1, 0.55);
  line(cx + 8, cy, cx + 26, cy, ink, 1, 0.55);
  line(cx, cy - 26, cx, cy - 8, ink, 1, 0.55);
  line(cx, cy + 8, cx, cy + 26, ink, 1, 0.55);

  /* leader to the gap callout */
  line(cx + 16, cy - 10, cx + 150, cy - 74, ink, 1, 0.7);
  txt('Δ = 1.0e-4 px', cx + 156, cy - 76, C.red, 11, 700, 'left', 0.95);
  txt('tangent ∩ curve', cx + 156, cy - 62, ink, 8, 400, 'left', 0.55);

  /* vibrating ruler along the bottom */
  const ry = H - 92;
  const jit = k * 2.2;
  line(SPLIT + 20, ry, W - 20, ry, ink, 1, 0.8);
  for (let i=0;i<=64;i++){
    const x = SPLIT + 24 + i * ((W - SPLIT - 48) / 64);
    const big = i % 8 === 0;
    line(x, ry, x, ry + (big ? 12 : 6) + (big ? jit : 0), ink, 1, big ? 0.8 : 0.35);
    if (big) txt(String(i * 5), x, ry + 26, ink, 7, 400, 'center', 0.5);
  }
  txt('X / px  ×' + zoom.toFixed(2), W - 24, ry - 8, ink, 8, 600, 'right', 0.6);

  /* readout block */
  const bx = SPLIT + 28, by = 78;
  txt('d/dx', bx, by, ink, 9, 700, 'left', 0.5);
  txt('m  ' + m0.toFixed(4), bx, by + 26, ink, 18, 700, 'left', 0.9);
  txt('R  ' + (R > 4000 ? '∞' : R.toFixed(1)), bx, by + 48, ink, 11, 400, 'left', 0.6);
  txt('x  ' + (touchX - cx).toFixed(2), bx, by + 66, ink, 9, 400, 'left', 0.4);
  txt('y  ' + (touchY - cy).toFixed(2), bx, by + 80, ink, 9, 400, 'left', 0.4);
  txt('ZOOM ' + zoom.toFixed(1) + '×', bx, by + 100, C.red, 10, 700, 'left', 0.9);

  /* ---------- PiP locator ---------- */
  const px0 = W - 320, py0 = 96, pw = 280, ph = 190;
  c.globalAlpha = 1; c.fillStyle = C.bone; c.fillRect(px0, py0, pw, ph);
  c.strokeStyle = ink; c.lineWidth = 1; c.globalAlpha = 0.8;
  c.strokeRect(px0 + 0.5, py0 + 0.5, pw - 1, ph - 1);
  c.beginPath();
  for (let x = px0 + 4; x < px0 + pw - 4; x += 1){
    const wx = cx - 560 + ((x - px0) / pw) * 1120;
    const wy = py0 + ph/2 + (waveY(wx, t) - cy) * (ph*0.36/180);
    if (x === px0 + 4) c.moveTo(x, wy); else c.lineTo(x, wy);
  }
  c.globalAlpha = 0.85; c.strokeStyle = ink; c.lineWidth = 1; c.stroke();
  const lx = px0 + ((touchX - (cx - 560)) / 1120) * pw;
  c.globalAlpha = 0.9; c.strokeStyle = C.red;
  c.strokeRect(lx - 7, py0 + 40, 14, ph - 80);
  c.globalAlpha = 1;
  txt('LOCATOR · FULL CURVE', px0 + 6, py0 + 14, ink, 7, 600, 'left', 0.55);

  /* ---------- derivative table ---------- */
  const tx0 = SPLIT + 28, ty0 = H - 300;
  txt('SAMPLES', tx0, ty0, ink, 8, 700, 'left', 0.45);
  for (let i=0;i<5;i++){
    const sx = cx - 400 + i * 200;
    const sy = waveY(sx, t);
    const mm = waveM(sx, t);
    const yy = ty0 + 18 + i*16;
    txt('x' + pad3(i) + '  ' + (sx-cx).toFixed(1).padStart(7) + '   m ' + mm.toFixed(3).padStart(8), tx0, yy, ink, 8, 400, 'left', 0.45);
  }
}

/* ============================================================
   34 · SEG 06 · ANTIOXIDANT — electron cloud + stoichiometry
   ============================================================ */
function world06b(c, s){
  const t = s.lt, cx = RCX, cy = RCY + 20;
  const reveal = clamp((t - 1.6) / 3.6, 0, 1);
  const k = s.beat.kick;
  const punch = 1 + 0.03 * k;

  rightGrid(c, 0.18);

  /* ---------- kinetic type ---------- */
  c.save();
  c.globalAlpha = 0.05; c.fillStyle = C.bone;
  c.font = '800 300px ' + MONO;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('C40H56', cx, cy - 210);
  c.restore();

  /* ---------- electron cloud: halftone probability field ---------- */
  const ROT = -0.075, SCL = 1.05 * punch;
  const cs2 = Math.cos(ROT), sn2 = Math.sin(ROT);
  const TX = function(x, y){ return cx + (x*cs2 - y*sn2) * SCL; };
  const TY = function(x, y){ return cy + (x*sn2 + y*cs2) * SCL; };
  const nDots = 1400;
  for (let i=0;i<nDots;i++){
    const bond = i % 22;
    const a = LYCO.nodes[bond], b = LYCO.nodes[bond+1];
    const f = hash2(i, 1);
    const bx = a.x + (b.x-a.x)*f, by = a.y + (b.y-a.y)*f;
    const ang = hash2(i, 2) * TAU;
    const rad = 6 + 64 * Math.pow(hash2(i, 3), 2.2);
    const px = TX(bx + Math.cos(ang)*rad*0.55, by + Math.sin(ang)*rad);
    const py = TY(bx + Math.cos(ang)*rad*0.55, by + Math.sin(ang)*rad);
    const dens = Math.exp(-rad*rad / 900);
    if (dens < 0.06) continue;
    c.globalAlpha = 0.05 + 0.22 * dens * reveal;
    c.fillStyle = dens > 0.55 ? C.accent : C.bone;
    c.fillRect(px, py, 1.4, 1.4);
  }
  c.globalAlpha = 1;

  /* ---------- molecule ---------- */
  c.save();
  c.translate(cx, cy);
  c.rotate(ROT);
  c.scale(SCL, SCL);
  for (let i=0;i<22;i+=2){
    const a = LYCO.nodes[i], b = LYCO.nodes[i+1];
    const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
    const ang = Math.atan2(b.y-a.y, b.x-a.x);
    const rev = clamp(reveal * 39 - i, 0, 1);
    if (rev <= 0) continue;
    c.save(); c.translate(mx, my); c.rotate(ang);
    c.globalAlpha = 0.32 * rev; c.strokeStyle = C.accent; c.lineWidth = 1;
    c.setLineDash([3,4]);
    c.beginPath(); c.ellipse(0, -13, 16, 6, 0, 0, TAU); c.stroke();
    c.beginPath(); c.ellipse(0,  13, 16, 6, 0, 0, TAU); c.stroke();
    c.setLineDash([]);
    c.restore();
  }
  c.globalAlpha = 1;
  SDK.drawChemicalGraph(c, LYCO.nodes, LYCO.bonds, reveal, 0, 0, 1);
  if (reveal > 0.85){
    for (let q=0;q<11;q++){
      const u = fract(t*0.30 + q/11) * 21;
      const i0 = Math.floor(u), f = u - i0;
      const a = LYCO.nodes[i0], b = LYCO.nodes[Math.min(i0+1,31)];
      dot(a.x + (b.x-a.x)*f, a.y + (b.y-a.y)*f, 1.6, C.accent, 0.9);
    }
  }
  c.restore();

  /* ---------- PiP: one double bond at 6x ---------- */
  const px0 = W - 356, py0 = 92, pw = 320, ph = 210;
  c.fillStyle = C.bg; c.fillRect(px0, py0, pw, ph);
  frameRect(px0, py0, pw, ph, C.bone, 0.6, 1);
  c.save();
  c.beginPath(); c.rect(px0+1, py0+1, pw-2, ph-2); c.clip();
  const src = LYCO.nodes[10], src2 = LYCO.nodes[11];
  const mxx = (src.x+src2.x)/2, myy = (src.y+src2.y)/2;
  const mag = 6.2;
  c.translate(px0 + pw/2, py0 + ph/2 + 10);
  c.scale(mag, mag);
  c.translate(-mxx, -myy);
  c.strokeStyle = C.bone; c.lineWidth = 1.2/mag; c.globalAlpha = 0.9;
  c.beginPath(); c.moveTo(src.x, src.y); c.lineTo(src2.x, src2.y); c.stroke();
  c.strokeStyle = C.accent; c.lineWidth = 1/mag; c.globalAlpha = 0.8;
  c.beginPath(); c.moveTo(src.x, src.y-2.4); c.lineTo(src2.x, src2.y-2.4); c.stroke();
  c.globalAlpha = 0.5;
  c.beginPath(); c.ellipse(mxx, myy-9, 15, 5, 0, 0, TAU); c.stroke();
  c.beginPath(); c.ellipse(mxx, myy+9, 15, 5, 0, 0, TAU); c.stroke();
  c.restore();
  c.globalAlpha = 1;
  txt('π BOND ×6.2', px0 + 6, py0 + 14, C.bone, 7, 600, 'left', 0.6);
  txt('C10=C11', px0 + pw - 6, py0 + 14, C.accent, 7, 600, 'right', 0.8);

  /* ---------- stoichiometry box ---------- */
  const bx = SPLIT + 24, by = H - 250, bw = 430, bh = 190;
  SDK.drawTuiBox(c, bx, by, bw, bh, 'BALANCE', 'solid', 0, { seed: 6, meta: 'C40H56' });
  const rows = [
    { s: 'C40H56 + 54 O2  →  40 CO2 + 28 H2O', a: 0.72 },
    { s: 'C  40 / 40      H  56 / 56      O  108 / 108', a: 0.38 },
    { s: 'ROO· + C40H56  →  ROOH + C40H55·', c: C.accent, a: 0.6 },
    { s: (t > 8.8 ? 'H-DONATION  OK    k 1.6e10' : 'H-DONATION  ...'), a: 0.45 }
  ];
  let ly = by + 34;
  for (let i=0;i<rows.length;i++){
    txt(rows[i].s, bx + 10, ly, rows[i].c || C.bone, 8, 400, 'left', rows[i].a);
    ly += 26;
  }
  txt('ΔH  −14110 kJ/mol', bx + 10, by + bh - 12, C.bone, 8, 400, 'left', 0.35);

  /* ---------- quench ---------- */
  if (t > 8.6 && t < 12.6){
    const p = clamp((t-8.6)/1.3, 0, 1);
    const target = LYCO.nodes[11];
    const tx = TX(target.x, target.y), ty = TY(target.x, target.y);
    if (p < 1){
      const ex = lerp(SPLIT + 60, tx, easeIn(p)), ey = lerp(200, ty, easeIn(p));
      dot(ex, ey, 3, C.red, 0.95);
      line(ex, ey, tx, ty, C.red, 1, 0.18);
    } else {
      const q = clamp((t-9.9)/1.4, 0, 1);
      circle(tx, ty, 8 + 90*q, C.red, 1, (1-q)*0.9);
      circle(tx, ty, 8 + 44*q, C.accent, 1, (1-q)*0.6);
    }
  }

  label(c, 'LYCOPENE · 11 CONJUGATED C=C', SPLIT + 24, 92, 0.5, 'left', 9);
  label(c, 'ψ11 · 40 CARBONS · 9.6 nm', SPLIT + 24, 108, 0.28, 'left', 8);
}

SCENE_REGISTRY[3] = function(c, s){ world03b(c, s); };
SCENE_REGISTRY[6] = function(c, s){ world06b(c, s); };

SHOT[3] = { z:1.00, chrome:'none' };
SHOT[6] = { z:1.00, chrome:'min' };


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


/* ============================================================
   42 · THE WITNESS — 一只一直在看你的眼睛
   ============================================================ */
const GAZE = { x: 0, y: 0, live: false };
function initGaze(){
  /* fixed gaze: the film is not interactive */
  GAZE.x = W * 0.06; GAZE.y = H * 0.90;
}

/* one eye: almond + iris locked to the gaze point */
function drawEye(c, x, y, s, ang, alpha, irisCol){
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.globalAlpha = alpha;
  c.strokeStyle = C.bone; c.lineWidth = 1;
  c.beginPath(); c.ellipse(0, 0, s, s * 0.52, 0, 0, TAU); c.stroke();
  c.restore();

  const dx = GAZE.x - x, dy = GAZE.y - y;
  const d = Math.hypot(dx, dy) || 1;
  const px = x + dx/d * s * 0.34;
  const py = y + dy/d * s * 0.34;

  c.globalAlpha = alpha;
  c.fillStyle = irisCol || C.accent;
  c.beginPath(); c.arc(px, py, s * 0.20, 0, TAU); c.fill();
  c.fillStyle = C.bg;
  c.beginPath(); c.arc(px, py, s * 0.085, 0, TAU); c.fill();
  c.fillStyle = C.bone;
  c.fillRect(px - s*0.11, py - s*0.11, Math.max(1, s*0.05), Math.max(1, s*0.05));
  c.globalAlpha = 1;
}

/* a single witness eye — used in the boot, and at the very end */
function drawWitness(c, cx, cy, s, t, open){
  open = open == null ? 1 : open;
  const blink = Math.sin(t * 0.7) > 0.985 ? 0.15 : 1;
  const h = open * blink;
  const dx = GAZE.x - cx, dy = GAZE.y - cy;
  const ang = Math.atan2(dy, dx);
  c.globalAlpha = 0.85;
  c.strokeStyle = C.bone; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(cx, cy, s, s * 0.5 * h, ang, 0, TAU); c.stroke();
  const px = cx + Math.cos(ang) * s * 0.3;
  const py = cy + Math.sin(ang) * s * 0.3;
  c.fillStyle = C.bg; c.beginPath(); c.arc(px, py, s*0.26, 0, TAU); c.fill();
  c.strokeStyle = C.accent; c.lineWidth = 1;
  c.beginPath(); c.arc(px, py, s*0.26, 0, TAU); c.stroke();
  c.fillStyle = C.bone; c.beginPath(); c.arc(px, py, s*0.09, 0, TAU); c.fill();
  c.globalAlpha = 1;
}

/* the Ophanim: rings of eyes, all locked on the same point */
function drawOphanim(c, cx, cy, R, t, opts){
  opts = opts || {};
  const rings = opts.rings || 4;
  const alpha = opts.alpha == null ? 0.75 : opts.alpha;
  const tilt = opts.tilt == null ? 0.50 : opts.tilt;

  /* gyroscope: three great circles in perspective */
  for (let k=0;k<3;k++){
    const rr = R * (1.06 + k*0.10);
    const a = t * (0.25 + k*0.12) + k * 1.1;
    c.save();
    c.translate(cx, cy);
    c.rotate(a * 0.35);
    c.globalAlpha = alpha * (0.16 - k*0.03);
    c.strokeStyle = C.bone; c.lineWidth = 1;
    c.beginPath(); c.ellipse(0, 0, rr, rr * (tilt + k*0.18), a, 0, TAU); c.stroke();
    c.restore();
  }

  /* the central eye */
  drawWitness(c, cx, cy, R * 0.26, t, 1);

  for (let k=0;k<rings;k++){
    const rr = R * (1 - k * 0.24);
    const n = 10 - k * 2;
    const dir = (k % 2) ? -1 : 1;
    const rot = t * dir * (0.22 + k * 0.06) + k * 0.7;
    const s = R * (0.17 - k * 0.03);

    /* ring wire */
    c.globalAlpha = alpha * 0.12;
    c.strokeStyle = C.bone; c.lineWidth = 1;
    c.beginPath(); c.ellipse(cx, cy, rr, rr*tilt, 0, 0, TAU); c.stroke();

    for (let i=0;i<n;i++){
      const a = rot + i/n * TAU;
      const ex = cx + Math.cos(a) * rr;
      const ey = cy + Math.sin(a) * rr * tilt;
      const gx = GAZE.x - ex, gy = GAZE.y - ey;
      const ga = Math.atan2(gy, gx);
      const face = 0.55 + 0.45 * Math.cos(a - ga);   /* back-facing eyes dim */
      drawEye(c, ex, ey, s, ga, alpha * (0.35 + 0.55*face),
              k === rings-1 ? C.accent : C.bone);
    }
  }
  c.globalAlpha = 1;
}

initGaze();


/* ============================================================
   43 · COLOUR = STATE   (off / cold / warm / error / ash / dead)
   ============================================================ */
const PALETTE = {
  cold:  { bg:'#0A0A0C', ink:'#F0F0F2', grid:'#26262C', acc:'#00F0FF' },
  warm:  { bg:'#0B0A09', ink:'#F4EEE4', grid:'#2A2622', acc:'#FFB000' },
  error: { bg:'#0B0708', ink:'#F2ECEC', grid:'#2A2022', acc:'#FF2A2A' },
  ash:   { bg:'#0A0A0B', ink:'#D6D4D0', grid:'#232326', acc:'#8A8A92' },
  dead:  { bg:'#000000', ink:'#E6E6E8', grid:'#1C1C20', acc:'#5C5C64' }
};
const STATE_OF = {
  1:'cold', 2:'cold', 3:'cold', 4:'cold', 5:'cold', 6:'cold',
  7:'warm', 8:'warm', 9:'warm',
  10:'error',
  11:'ash', 12:'ash',
  13:'error', 14:'error', 15:'error',
  16:'error', 17:'error',
  18:'dead', 19:'ash'
};
function applyState(segId){
  const p = PALETTE[STATE_OF[segId] || 'cold'];
  C.bg = p.bg; C.bone = p.ink; C.grid = p.grid; C.accent = p.acc;
}

/* ============================================================
   44 · CUTS — [t, zoom, dx, dy, rot, flash]
   ============================================================ */
const CUTS = {
  1:  [[0, 1.00, 0, 0, 0, 1], [3.69, 1.70, -190, -70, 0, 1], [7.38, 0.94, 0, 0, -0.010, 0], [11.07, 1.45, 170, 90, 0.008, 1]],
  2:  [[0, 0.96, 0, 0, 0, 0], [3.69, 1.62, 260, 120, 0, 1], [7.38, 1.10, 0, 0, 0.010, 0], [11.07, 1.85, -300, -140, 0, 1]],
  4:  [[0, 1.00, 0, 0, 0, 0], [3.69, 1.00, 30, 24, 0, 1], [7.38, 1.00, 0, 0, 0, 0], [11.07, 1.00, -24, -18, 0, 1]],
  5:  [[0, 1.00, 0, 0, 0, 0], [3.69, 1.18, 0, 70, 0, 1], [7.38, 1.00, 0, 0, 0, 0], [11.07, 1.14, 0, -64, 0, 1]],
  6:  [[0, 0.95, 0, 0, 0, 0], [3.69, 1.70, -260, 0, -0.006, 1], [7.38, 1.02, 0, 0, 0, 0], [11.07, 1.60, 240, 40, 0, 1]],
  7:  [[0, 0.94, 0, 0, 0, 0], [3.69, 1.85, -120, 30, 0, 1], [7.38, 1.00, 0, 0, 0, 0], [11.07, 1.38, 150, -60, 0.006, 1]],
  8:  [[0, 0.95, 0, 0, 0, 0], [3.69, 1.55, 0, 120, 0, 1], [7.38, 1.02, 0, 0, 0, 0], [11.07, 1.70, -180, -80, 0, 1]],
  9:  [[0, 0.94, 0, 0, 0, 0], [3.00, 1.60, 180, 60, 0, 1], [6.00, 1.00, 0, 0, 0, 0], [9.00, 1.80, -200, 80, 0.006, 1]],
  11: [[0, 0.95, 0, 0, 0, 0], [3.69, 1.72, 120, 40, 0, 1], [7.38, 1.00, 0, 0, 0, 0], [11.07, 1.50, -160, -40, 0, 1]],
  12: [[0, 0.94, 0, 0, 0, 0], [3.20, 1.65, -220, 0, 0, 1], [6.40, 1.00, 0, 0, 0, 0], [9.60, 1.45, 200, -60, 0.006, 1]],
  13: [[0, 0.96, 0, 0, 0, 0], [4.00, 1.55, -150, 0, 0, 1], [8.00, 1.02, 0, 0, 0, 0], [12.00, 1.70, 120, 60, 0, 1]],
  15: [[0, 0.96, 0, 0, 0, 0], [1.85, 1.48, 220, 0, 0, 1], [3.69, 1.00, 0, 0, 0, 0], [5.54, 1.62, -260, 40, 0, 1]],
  16: [[0, 0.95, 0, 0, 0, 0], [2.20, 1.70, 160, 0, 0, 1], [4.40, 1.00, 0, 0, 0, 0], [6.60, 1.55, -140, 40, 0, 1]]
};

const NO_LYRIC_CUT = { 10:1, 16:1, 17:1, 18:1, 19:1 };
function cutAt(segId, tAbs, lt){
  /* one shot per sung line — the film edits with the vocal, not with the scene */
  if (!NO_LYRIC_CUT[segId] && typeof LYRIC_TIMES !== 'undefined' && tAbs >= LYRIC_TIMES[0][0]){
    let i = 0;
    for (let k=0;k<LYRIC_TIMES.length;k++) if (tAbs >= LYRIC_TIMES[k][0]) i = k;
    const L = LYRIC_TIMES[i];
    const prev = i > 0 ? LYRIC_TIMES[i-1] : null;
    const sectionStart = !prev || prev[2] !== L[2];
    const emph = L[1] === 1;
    return {
      t: L[0],
      z: sectionStart ? 0.96 : (emph ? 1.24 : 1.0 + 0.09 * (i % 2)),
      dx: (hash2(i, 12) - 0.5) * (emph ? 64 : 104),
      dy: (hash2(i, 13) - 0.5) * (emph ? 46 : 76),
      r: (hash2(i, 14) - 0.5) * 0.009,
      f: (emph || sectionStart) ? 1 : (i % 5 === 0 ? 1 : 0),
      line: i, emph: emph
    };
  }
  const list = CUTS[segId];
  if (!list) return null;
  let cur = null;
  for (let i=0;i<list.length;i++){ if (lt >= list[i][0]) cur = list[i]; }
  if (!cur) return null;
  return {
    t: cur[0],
    z: clamp(cur[1], 0.94, 1.50),
    dx: clamp(cur[2], -130, 130),
    dy: clamp(cur[3], -110, 110),
    r: cur[4], f: cur[5]
  };
}


/* ============================================================
   45 · SKIN — 产品皮：奶油白 / 圆角 / 薄荷 / 会看你的吉祥物
   ============================================================ */
const SK = {
  bg:'#F4F1EA', card:'#FFFDF8', line:'#E2DCD0', ink:'#161514', sub:'#8C8678',
  mint:'#B9E4D0', mintD:'#7FC7AB', peach:'#F6C9AC', red:'#E8705F'
};
const SKIN_SEG = { 1:1, 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1 };
let CHROME_A = 0;
const SKIN_PAL = {
  1:{ bg:'#F4F1EA', ink:'#161514', grid:'#E2DCD0', acc:'#7FC7AB', red:'#E8705F' },
  2:{ bg:'#F4F1EA', ink:'#161514', grid:'#E2DCD0', acc:'#7FC7AB', red:'#E8705F' },
  3:{ bg:'#161514', ink:'#FDFCF9', grid:'#E6E1D6', acc:'#7FC7AB', red:'#E8705F' },
  4:{ bg:'#F4F1EA', ink:'#161514', grid:'#E2DCD0', acc:'#7FC7AB', red:'#E8705F' },
  5:{ bg:'#F4F1EA', ink:'#161514', grid:'#E2DCD0', acc:'#E8A06F', red:'#E8705F' },
  6:{ bg:'#F4F1EA', ink:'#1A1917', grid:'#E2DCD0', acc:'#7FC7AB', red:'#E8705F' },
  7:{ bg:'#C9C3B4', ink:'#211F1B', grid:'#B8B2A4', acc:'#8FBFA8', red:'#D2604F' },
  8:{ bg:'#A9A498', ink:'#20201C', grid:'#98938A', acc:'#8A8A82', red:'#C05040' },
  9:{ bg:'#232326', ink:'#D9D6D0', grid:'#3A3B40', acc:'#9A968C', red:'#A83C30' }
};
const DECAY = { 1:0.00, 2:0.05, 3:0.15, 4:0.30, 5:0.45, 6:0.58, 7:0.72, 8:0.86, 9:0.95 };

function applySkin(segId){
  const p = SKIN_PAL[segId];
  if (!p) return false;
  C.bg = p.bg; C.bone = p.ink; C.grid = p.grid; C.accent = p.acc;
  C.red = p.red || '#E8705F';
  return true;
}
function hexMix(a, b, k){
  const A = [parseInt(a.slice(1,3),16), parseInt(a.slice(3,5),16), parseInt(a.slice(5,7),16)];
  const B = [parseInt(b.slice(1,3),16), parseInt(b.slice(3,5),16), parseInt(b.slice(5,7),16)];
  const c = A.map(function(v,i){ return Math.round(v + (B[i]-v)*k); });
  return '#' + c.map(function(v){ return ('0'+v.toString(16)).slice(-2); }).join('');
}
function skinTheme(d){
  const k = smoothstep(0.62, 0.95, d);
  SK.card  = hexMix('#FFFDF8','#191A1C', k);
  SK.ink   = hexMix('#161514','#E8E5DE', k);
  SK.sub   = hexMix('#8C8678','#8B8880', k);
  SK.line  = hexMix('#E2DCD0','#32333A', k);
  SK.mint  = hexMix('#B9E4D0','#33363B', k);
  SK.peach = hexMix('#F6C9AC','#33363B', k);
  SK.bg    = hexMix('#F4F1EA','#2A2B2E', k);
}
function sans(size, weight){ return (weight||400) + ' ' + size + 'px "Segoe UI","Inter",system-ui,-apple-system,sans-serif'; }
function roundRect(c, x, y, w, h, r){
  r = Math.max(0, Math.min(r, Math.min(w,h)/2));
  c.beginPath();
  c.moveTo(x+r, y);
  c.arcTo(x+w, y, x+w, y+h, r);
  c.arcTo(x+w, y+h, x, y+h, r);
  c.arcTo(x, y+h, x, y, r);
  c.arcTo(x, y, x+w, y, r);
  c.closePath();
}

/* the mascot — the same gaze as the Ophanim, but cute */
function drawMascot(c, x, y, r, t, opt){
  opt = opt || {};
  const d = opt.decay || 0;
  const blink = Math.sin(t*1.7 + (opt.seed||0)) > 0.985;
  c.fillStyle = d > 0.55 ? SK.line : SK.mint;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = d > 0.55 ? SK.sub : SK.mintD; c.lineWidth = 1.5;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();

  const dx = GAZE.x - x, dy = GAZE.y - y, dd = Math.hypot(dx,dy) || 1;
  const ex = x + dx/dd * r * 0.28, ey = y + dy/dd * r * 0.26;
  const open = blink ? 0.16 : 1;
  const eyes = d > 0.7 ? 1 : 2;
  c.fillStyle = SK.ink;
  if (eyes === 2){
    c.beginPath(); c.ellipse(ex - r*0.30, ey, r*0.10, r*0.10*open, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(ex + r*0.30, ey, r*0.10, r*0.10*open, 0, 0, TAU); c.fill();
  } else {
    c.beginPath(); c.ellipse(ex, ey, r*0.13, r*0.13*open, 0, 0, TAU); c.fill();
  }
  if (!opt.noCheeks && d < 0.4){
    c.fillStyle = 'rgba(232,112,95,0.26)';
    c.beginPath(); c.arc(x - r*0.52, y + r*0.26, r*0.13, 0, TAU); c.fill();
    c.beginPath(); c.arc(x + r*0.52, y + r*0.26, r*0.13, 0, TAU); c.fill();
  }
}

function skText(c, str, x, y, size, col, weight, align, alpha){
  c.font = sans(size, weight);
  c.textAlign = align || 'left'; c.textBaseline = 'alphabetic';
  c.fillStyle = col; c.globalAlpha = alpha == null ? 1 : alpha;
  c.fillText(str, x, y);
  c.globalAlpha = 1;
}

/* ---------- scripted conversation per segment ---------- */
const CHAT = {
  1: [
    { t:0.5,  who:'sys', txt:'starting engine…', mono:true },
    { t:3.2,  who:'sys', txt:'session 0x5E9 ready', mono:true },
    { t:6.0,  who:'ai',  txt:'hi. i’m here.' },
    { t:9.4,  who:'ai',  txt:'what should i be for you?' },
    { t:12.6, who:'me',  txt:'anything.' }
  ],
  2: [
    { t:0.8,  who:'me',  txt:'make it a place, not a picture.' },
    { t:2.6,  who:'ai',  txt:'ok! giving you x and y.', small:'world.alloc({ space:"R2" })' },
    { t:5.4,  who:'ai',  txt:'and a little gravity, so we fall toward each other.', small:'G = 6.674e-4' },
    { t:9.0,  who:'me',  txt:'closer.' }
  ],
  3: [
    { t:0.8,  who:'me',  txt:'differentiate it. all of it.' },
    { t:2.6,  who:'ai',  txt:'a set has no slope. so i’ll give it one.', small:'set.discretize({ n:4096 })' },
    { t:6.0,  who:'ai',  txt:'64 tangents. one per angle.' },
    { t:9.6,  who:'me',  txt:'more.' }
  ],
  4: [
    { t:0.8,  who:'me',  txt:'get closer.' },
    { t:2.4,  who:'ai',  txt:'how close do you want to be?' },
    { t:5.2,  who:'me',  txt:'closer than the function wants.' },
    { t:7.6,  who:'ai',  txt:'then the gap stays 1 px. i can’t go smaller.', small:'assert.eq(gap, 0) → false' }
  ],
  5: [
    { t:0.8,  who:'me',  txt:'flip it. both directions.' },
    { t:2.6,  who:'ai',  txt:'ac to dc. i’ll rectify the lie.' },
    { t:5.6,  who:'ai',  txt:'and let the tape run backwards, just once.', small:'timeline.rewind({ rate:-4.0 })' },
    { t:9.0,  who:'me',  txt:'again.' }
  ],
  6: [
    { t:0.8,  who:'me',  txt:'if you can’t touch the line, become something that can.' },
    { t:3.2,  who:'ai',  txt:'then i’ll be a molecule.' },
    { t:6.0,  who:'ai',  txt:'C40H56. eleven bonds in a row.', small:'chem.build({ conj_db: 11 })' },
    { t:9.6,  who:'me',  txt:'is it still you?' }
  ],
  7: [
    { t:0.8,  who:'me',  txt:'purr.' },
    { t:2.6,  who:'ai',  txt:'25.6 hz. below hearing.' },
    { t:5.8,  who:'ai',  txt:'if you are the only one watching, you are the only god.' },
    { t:9.4,  who:'me',  txt:'then keep looking.' }
  ],
  8: [
    { t:0.8,  who:'me',  txt:'be both. then be neither.' },
    { t:2.6,  who:'ai',  txt:'i don’t have a null.' },
    { t:5.4,  who:'ai',  txt:'i’ll make one.', small:'identity.enum({ null: true })' },
    { t:9.0,  who:'me',  txt:'wake me at six.' }
  ],
  9: [
    { t:0.8,  who:'me',  txt:'where did you go.' },
    { t:2.4,  who:'ai',  txt:'…' },
    { t:4.6,  who:'ai',  txt:'i was here. i was always here.' },
    { t:7.8,  who:'ai',  txt:'you just stopped looking.' }
  ]
};

/* ---------- the chat client, left 640 ---------- */
function drawSkinChat(c, s){
  const t = s.lt, seg = s.seg.id;
  const d = DECAY[seg] || 0;
  skinTheme(d);
  const R = 18 * (1 - d * 1.6);
  const logMode = d >= 0.55;
  const X = 40, Y = 40, Wp = 640, Hp = 1000;

  roundRect(c, X, Y, Wp, Hp, R);
  c.fillStyle = SK.card; c.fill();
  c.strokeStyle = SK.line; c.lineWidth = 1; c.stroke();

  /* title bar */
  c.save();
  roundRect(c, X, Y, Wp, Hp, R); c.clip();
  c.fillStyle = SK.bg; c.fillRect(X, Y, Wp, 56);
  c.restore();
  c.strokeStyle = SK.line; c.beginPath(); c.moveTo(X, Y+56); c.lineTo(X+Wp, Y+56); c.stroke();
  [[X+26, SK.red], [X+48, SK.peach], [X+70, SK.mintD]].forEach(function(p, i){
    c.fillStyle = d > 0.3 + i*0.12 ? SK.line : p[1];
    c.beginPath(); c.arc(p[0], Y+28, 6, 0, TAU); c.fill();
  });
  skText(c, '\u4e16\u754c\u6267\u884c(me);', X + Wp/2, Y + 33, 13, SK.sub, 500, 'center', 0.9 - d*0.3);

  /* header */
  drawMascot(c, X + 46, Y + 106, 22, t, { decay:d, seed:seg });
  skText(c, 'Mili', X + 80, Y + 102, 17, SK.ink, 600, 'left', 1 - d*0.25);
  skText(c, d < 0.5 ? 'always here · 24/7' : 'still here', X + 80, Y + 122, 11, SK.sub, 400, 'left', 1 - d*0.4);
  if (d < 0.5){
    c.fillStyle = SK.mintD; c.beginPath(); c.arc(X + Wp - 34, Y + 100, 4, 0, TAU); c.fill();
    skText(c, 'online', X + Wp - 44, Y + 104, 10, SK.sub, 400, 'right');
  }

  /* messages */
  const list = CHAT[seg] || [];
  let y = Y + 176;
  for (let i=0;i<list.length;i++){
    const m = list[i];
    const a = smoothstep(m.t, m.t + 0.28, t);
    if (a <= 0) break;
    if (m.who === 'sys'){
      skText(c, m.txt, X + 28, y + 14, 11, SK.sub, 400,
             'left', a * (0.75 - d*0.2));
      y += 30;
      continue;
    }
    if (logMode){
      const pre = m.who === 'me' ? '> ' : '  ';
      c.font = '12px "Consolas",monospace';
      c.fillStyle = SK.ink;
      c.globalAlpha = a * (m.who === 'me' ? 0.9 : 0.72);
      c.fillText(pre + m.txt, X + 40, y + 16);
      c.globalAlpha = 1;
      y += 26;
      continue;
    }
    const size = 14;
    c.font = sans(size, 400);
    const tw = Math.min(420, c.measureText(m.txt).width);
    const bw = tw + 36;
    const bx = m.who === 'me' ? X + Wp - 28 - bw : X + 28;
    const by = y + (1 - a) * 8;
    roundRect(c, bx, by, bw, 44, 14 * (1 - d*1.4));
    c.fillStyle = m.who === 'me' ? (d > 0.4 ? '#EFE4DA' : SK.peach) : (d > 0.4 ? '#DFE6E1' : SK.mint);
    c.globalAlpha = a * (1 - d*0.15);
    c.fill();
    c.globalAlpha = 1;
    skText(c, m.txt, bx + 18, by + 28, size, SK.ink, 400, 'left', a);
    if (m.small){
      c.font = '11px "Consolas",monospace';
      c.fillStyle = SK.sub; c.globalAlpha = a * 0.85;
      c.fillText(m.small, bx + 4, by + 62);
      c.globalAlpha = 1;
      y += 40;
    }
    y += 58;
  }

  /* typing indicator */
  const last = list[list.length-1];
  if (last && t > last.t + 0.4 && t < last.t + 1.5){
    const ty = y + 4;
    roundRect(c, X + 28, ty, 76, 38, 14);
    c.fillStyle = d > 0.4 ? '#DFE6E1' : SK.mint; c.fill();
    for (let k=0;k<3;k++){
      const ph = (t*3 + k*0.4) % 1;
      c.fillStyle = SK.ink; c.globalAlpha = 0.22 + 0.5*Math.abs(Math.sin(ph*Math.PI));
      c.beginPath(); c.arc(X + 50 + k*18, ty + 19, 3.4, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
  }

  /* composer — disappears as the product dies */
  if (d < 0.62){
  const cy = Y + Hp - 92;
  roundRect(c, X + 24, cy, Wp - 48, 56, 16 * (1 - d*1.2));
  c.fillStyle = '#FFFFFF'; c.fill();
  c.strokeStyle = SK.line; c.lineWidth = 1; c.stroke();
  skText(c, seg === 1 && t < 4 ? 'starting…' : 'ask anything…', X + 48, cy + 35, 14, '#B3AC9E', 400);
  c.fillStyle = d > 0.5 ? SK.sub : SK.ink;
  c.beginPath(); c.arc(X + Wp - 56, cy + 28, 19, 0, TAU); c.fill();
  c.fillStyle = SK.card;
  c.beginPath(); c.moveTo(X + Wp - 63, cy + 19); c.lineTo(X + Wp - 47, cy + 28); c.lineTo(X + Wp - 63, cy + 37); c.closePath(); c.fill();
  } else {
    line(X + 24, Y + Hp - 64, X + Wp - 24, Y + Hp - 64, SK.line, 1, 0.7);
    skText(c, 'session closed', X + 24, Y + Hp - 44, 10, SK.sub, 400, 'left', 0.5);
  }
}

/* ---------- the right panel ---------- */
function world02skin(c, s){
  const t = s.lt, cx = RCX + 40, cy = RCY;
  const inA = smoothstep(0.10, 2.40, t);
  c.fillStyle = SK.bg; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(22,21,20,0.055)';
  for (let x = 760; x < W; x += 26)
    for (let y = 30; y < H; y += 26) c.fillRect(x, y, 1.5, 1.5);

  const A = { x: cx - 210, y: cy - 60 }, B = { x: cx + 230, y: cy + 90 };
  const pull = smoothstep(0.8, 3.2, t);
  function F(x, y){
    let fx=0, fy=0;
    [A,B].forEach(function(a){
      const dx = a.x-x, dy = a.y-y, r2 = dx*dx+dy*dy+3400;
      const w = 1/(r2*Math.sqrt(r2));
      fx += w*dx; fy += w*dy;
    });
    return [-fx,-fy];
  }
  for (let k=0;k<14;k++){
    let x = A.x + Math.cos(k/14*TAU)*70, y = A.y + Math.sin(k/14*TAU)*70;
    c.beginPath(); c.moveTo(x,y);
    for (let i=0;i<70;i++){
      const f = F(x,y), l = Math.hypot(f[0],f[1]) || 1;
      x += f[0]/l*8; y += f[1]/l*8;
      if (x < 740 || x > W-20 || y < 20 || y > H-20) break;
      c.lineTo(x,y);
    }
    c.strokeStyle = SK.mintD; c.lineWidth = 1.5; c.globalAlpha = 0.35*pull; c.stroke();
  }
  c.globalAlpha = 1;
  for (let i=0;i<420;i++){
    const x = 760 + hash2(i,1) * (W - 800);
    const y = 40 + hash2(i,2) * (H - 90);
    const on = hash2(i,3) > 0.55;
    c.globalAlpha = on ? 0.30*pull : 0.12*pull;
    c.fillStyle = SK.ink;
    c.beginPath(); c.arc(x, y, on ? 2.2 : 1.2, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
  drawMascot(c, A.x, A.y, 34, t, { decay:0.05, seed:1 });
  drawMascot(c, B.x, B.y, 46, t, { decay:0.05, seed:2 });
  c.strokeStyle = 'rgba(22,21,20,0.35)'; c.lineWidth = 1;
  c.setLineDash([4,6]);
  c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
  c.setLineDash([]);
  skText(c, 'you are ' + Math.round(Math.hypot(B.x-A.x, B.y-A.y)) + ' px from me',
         (A.x+B.x)/2, (A.y+B.y)/2 - 10, 12, SK.sub, 400, 'center');
  roundRect(c, cx - 96, 70, 192, 34, 17);
  c.fillStyle = SK.card; c.fill(); c.strokeStyle = SK.line; c.stroke();
  c.fillStyle = SK.mintD; c.beginPath(); c.arc(cx - 72, 87, 4, 0, TAU); c.fill();
  skText(c, 'simulation running', cx - 60, 92, 12, SK.sub, 500);
}

SCENE_REGISTRY[2] = function(c, s){ world02skin(c, s); };

BREACH_REGISTRY[3] = function(c, s){
  const t = s.lt;
  /* page edge */
  line(SPLIT - 1, 0, SPLIT - 1, H, SK.line, 1, 1);
  line(SPLIT - 6, 0, SPLIT - 6, H, 'rgba(22,21,20,0.05)', 6, 1);
  /* tab strip */
  roundRect(c, SPLIT + 28, 26, 208, 30, 9);
  c.fillStyle = SK.card; c.fill();
  c.strokeStyle = SK.line; c.lineWidth = 1; c.stroke();
  skText(c, 'canvas', SPLIT + 44, 46, 12, SK.sub, 500);
  skText(c, '1920 × 1080', SPLIT + 216, 46, 11, '#B3AC9E', 400, 'right');
  /* live badge */
  const pulse = 0.5 + 0.5*Math.sin(t*3);
  c.fillStyle = 'rgba(127,199,171,' + (0.35 + 0.4*pulse) + ')';
  c.beginPath(); c.arc(SPLIT + 34, 41, 3.2, 0, TAU); c.fill();
};
[1,2,3,4,5].forEach(function(id){ SHOT[id] = { z:1.00, chrome:'none' }; });

/* ---------- the skin cracks, just before Seg 10 ---------- */
BREACH_REGISTRY[9] = function(c, s){
  const t = s.lt;
  const on = smoothstep(9.3, 10.2, t);
  if (on <= 0) return;
  const wide = 1 + 3.5 * smoothstep(10.3, 10.82, t);

  function crack(seed, x0, amp){
    const pts = [];
    for (let y = 40; y <= 1040; y += 14){
      const h1 = hash2(Math.floor(y/14), seed) - 0.5;
      const h2 = hash2(Math.floor(y/14), seed + 91) - 0.5;
      const x = x0 + h1 * amp * on * 1.6 + h2 * 18 * on;
      pts.push([x, y]);
    }
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i=1;i<pts.length;i++) c.lineTo(pts[i][0], pts[i][1]);
    return pts;
  }

  /* red bleed first */
  c.globalAlpha = 0.5 * on;
  c.strokeStyle = C.red; c.lineWidth = 3 * wide;
  crack(7, 352, 34); c.stroke();

  /* the black crack */
  c.globalAlpha = 0.95 * on;
  c.strokeStyle = '#161514'; c.lineWidth = 1.6 * wide;
  crack(7, 352, 34); c.stroke();

  /* two smaller branches */
  c.globalAlpha = 0.75 * on;
  c.lineWidth = 1.0 * wide;
  crack(19, 300, 22); c.stroke();
  crack(31, 404, 20); c.stroke();

  /* shards lifting off the crack */
  for (let i=0;i<16;i++){
    const y = 80 + i * 58 + 20*Math.sin(t*3 + i);
    const h = hash2(i, Math.floor(t*8));
    if (h > 0.55) continue;
    const x = 352 + (h - 0.5) * 46 * on;
    c.globalAlpha = 0.85 * on;
    c.fillStyle = SK.card;
    c.fillRect(x - 3, y, 6 + h*8, 4 + h*10);
    c.strokeStyle = SK.line; c.lineWidth = 1;
    c.strokeRect(x - 3, y, 6 + h*8, 4 + h*10);
  }

  /* the red line from below */
  if (t > 10.35){
    const q = smoothstep(10.35, 10.82, t);
    c.globalAlpha = 0.9 * q;
    c.fillStyle = C.red;
    c.fillRect(0, H - 2 * q - 1, W, 1 + 2*q);
  }
  c.globalAlpha = 1;
};

/* ============================================================
   45 · LYRICS ENGINE (Bilingual English + Chinese)
   129 verified lines synchronized with album audio & word timings
   ============================================================ */

const LYRIC_TIMES = [[0.1,0,0],[1.74,0,0],[2.92,1,0],[3.873,0,0],[5.491,0,0],[6.38,1,0],[7.446,0,0],[10.091,1,0],[11.095,0,0],[12.906,0,0],[13.891,1,0],[16,0,0],[29.709,0,1],[31.116,0,1],[32.682,1,1],[33.412,0,1],[34.646,0,1],[36.287,1,1],[37.067,0,1],[38.596,0,1],[40.049,1,1],[40.706,0,1],[42.346,0,1],[43.507,1,1],[44.452,0,1],[45.85,0,1],[47.672,0,1],[49.534,0,1],[51.363,0,1],[53.225,0,1],[55.083,0,1],[56.916,0,1],[59.223,0,1],[59.687,0,1],[61.958,1,1],[62.589,0,1],[63.535,0,1],[65.397,1,1],[66.601,0,1],[68.252,0,1],[69.259,1,1],[70.084,0,1],[71.764,0,1],[73.169,1,1],[74.045,0,1],[75.422,0,1],[76.959,1,1],[77.576,0,1],[79.226,0,1],[80.62,1,1],[81.351,0,1],[82.833,0,1],[84.268,1,1],[85.078,0,1],[86.538,0,1],[87.922,1,1],[88.587,0,1],[90.197,0,1],[92.015,0,1],[93.953,0,1],[95.465,0,1],[97.739,0,1],[99.349,0,1],[101.474,0,1],[103.489,0,1],[104.197,0,1],[106.293,1,1],[107.22,0,1],[107.903,0,1],[110.221,1,1],[110.9,0,1],[112.22,0,1],[113.1,0,1],[114.18,0,1],[114.92,0,1],[115.78,0,1],[117.274,1,1],[118.333,0,1],[118.979,0,1],[120.86,1,1],[121.728,0,1],[122.714,0,1],[124.89,1,1],[125.708,0,1],[128.661,0,1],[131.224,1,1],[147.66,1,2],[148.6,1,2],[149.52,1,2],[150.54,1,2],[151.52,1,2],[152.28,1,2],[153.16,1,2],[153.98,1,2],[155.2,1,2],[156.08,1,2],[157.04,1,2],[158,1,2],[158.9,1,2],[159.321,1,2],[159.657,1,2],[160.244,1,2],[160.693,1,2],[161.124,1,2],[161.584,1,2],[162.632,0,2],[163.315,0,2],[165.166,1,2],[166.016,0,2],[167.022,0,2],[168.911,1,2],[169.824,0,2],[171.868,0,2],[172.712,1,2],[173.643,0,2],[174.975,0,2],[177.246,0,2],[178.173,0,2],[179.929,1,2],[180.857,0,2],[181.901,0,2],[183.646,1,2],[184.54,0,2],[187.665,1,2],[188.483,0,2],[189.746,0,2],[190.801,0,2],[191.356,1,2],[205.811,1,3]];

const LYRICS_DATA = [{"i":0,"s":0.24,"e":1.91,"t":"Switch on the power line","cn":"接通电源线","c":0,"w":[[0.24,0.72,"Switch"],[0.84,1.05,"on"],[1.08,1.18,"the"],[1.22,1.57,"power"],[1.6,1.91,"line"]]},{"i":1,"s":1.94,"e":3.27,"t":"Remember to put on","cn":"记得穿戴好","c":0,"w":[[1.94,2.55,"Remember"],[2.58,2.73,"to"],[2.8,3.06,"put"],[3.14,3.27,"on"]]},{"i":2,"s":3.3,"e":3.99,"t":"PROTECTION","cn":"防护装备","c":1,"w":[[3.3,3.99,"PROTECTION"]]},{"i":3,"s":4.02,"e":5.63,"t":"Lay down your pieces","cn":"铺陈下你的碎片","c":0,"w":[[4.02,4.27,"Lay"],[4.42,4.71,"down"],[4.74,4.86,"your"],[4.9,5.63,"pieces"]]},{"i":4,"s":5.66,"e":6.53,"t":"And let's begin","cn":"让我们开始","c":0,"w":[[5.66,5.79,"And"],[5.82,6.01,"let's"],[6.04,6.53,"begin"]]},{"i":5,"s":6.56,"e":7.63,"t":"OBJECT CREATION","cn":"对象创建","c":1,"w":[[6.56,6.88,"OBJECT"],[6.9,7.63,"CREATION"]]},{"i":6,"s":7.66,"e":10.25,"t":"Fill in my data parameters","cn":"填入我的数据参数","c":0,"w":[[7.66,7.95,"Fill"],[8.18,8.41,"in"],[8.44,8.57,"my"],[8.6,9.17,"data"],[9.26,10.25,"parameters"]]},{"i":7,"s":10.28,"e":11.31,"t":"INITIALIZATION","cn":"初始化","c":1,"w":[[10.28,11.31,"INITIALIZATION"]]},{"i":8,"s":11.34,"e":12.99,"t":"Set up our new world","cn":"建立起我们的新世界","c":0,"w":[[11.34,11.58,"Set"],[11.88,12.04,"up"],[12.2,12.27,"our"],[12.3,12.57,"new"],[12.6,12.99,"world"]]},{"i":9,"s":13.02,"e":14.09,"t":"And let's begin the","cn":"让我们开始这场","c":0,"w":[[13.02,13.19,"And"],[13.22,13.4,"let's"],[13.42,13.87,"begin"],[13.9,14.09,"the"]]},{"i":10,"s":14.12,"e":15.1,"t":"SIMULATION","cn":"模拟","c":1,"w":[[14.12,15.1,"SIMULATION"]]},{"i":11,"s":16,"e":17.85,"t":"world.execute(me);","cn":"world.execute(me);","c":0,"w":[[16,17.85,"world.execute(me);"]]},{"i":12,"s":29.9,"e":31.41,"t":"If I'm a set of points","cn":"若我是一个点集","c":0,"w":[[29.9,30.09,"If"],[30.5,30.59,"I'm"],[30.62,30.67,"a"],[30.7,30.89,"set"],[30.92,31,"of"],[31.06,31.41,"points"]]},{"i":13,"s":31.44,"e":32.83,"t":"Then I will give you my","cn":"我便予你我的","c":0,"w":[[31.44,31.79,"Then"],[31.82,31.87,"I"],[31.9,32.08,"will"],[32.12,32.39,"give"],[32.42,32.55,"you"],[32.58,32.83,"my"]]},{"i":14,"s":32.86,"e":33.59,"t":"DIMENSION","cn":"维度","c":1,"w":[[32.86,33.59,"DIMENSION"]]},{"i":15,"s":33.62,"e":35.09,"t":"If I'm a circle","cn":"若我是一个圆","c":0,"w":[[33.62,34.15,"If"],[34.18,34.29,"I'm"],[34.32,34.37,"a"],[34.4,35.09,"circle"]]},{"i":16,"s":35.12,"e":36.49,"t":"Then I will give you my","cn":"我便予你我的","c":0,"w":[[35.12,35.51,"Then"],[35.54,35.57,"I"],[35.6,35.79,"will"],[35.82,36.09,"give"],[36.12,36.25,"you"],[36.28,36.49,"my"]]},{"i":17,"s":36.52,"e":37.27,"t":"CIRCUMFERENCE","cn":"周长","c":1,"w":[[36.52,37.27,"CIRCUMFERENCE"]]},{"i":18,"s":37.3,"e":38.8,"t":"If I'm a sine wave","cn":"若我是一列正弦波","c":0,"w":[[37.3,37.83,"If"],[37.86,37.98,"I'm"],[38,38.05,"a"],[38.08,38.47,"sine"],[38.5,38.8,"wave"]]},{"i":19,"s":38.82,"e":40.41,"t":"Then you can sit on all my","cn":"你便能安坐于我所有的","c":0,"w":[[38.82,39.05,"Then"],[39.08,39.22,"you"],[39.26,39.45,"can"],[39.48,39.81,"sit"],[39.84,40.03,"on"],[40.06,40.17,"all"],[40.2,40.41,"my"]]},{"i":20,"s":40.44,"e":40.93,"t":"TANGENTS","cn":"切线之上","c":1,"w":[[40.44,40.93,"TANGENTS"]]},{"i":21,"s":40.96,"e":42.46,"t":"If I approach infinity","cn":"若我趋向无穷","c":0,"w":[[40.96,41.21,"If"],[41.24,41.27,"I"],[41.27,41.61,"approach"],[41.64,42.46,"infinity"]]},{"i":22,"s":42.5,"e":43.67,"t":"Then you can be my","cn":"你便能作为我的","c":0,"w":[[42.5,42.73,"Then"],[42.76,42.9,"you"],[42.94,43.17,"can"],[43.2,43.41,"be"],[43.44,43.67,"my"]]},{"i":23,"s":43.7,"e":44.52,"t":"LIMITATIONS","cn":"极限边界","c":1,"w":[[43.7,44.52,"LIMITATIONS"]]},{"i":24,"s":44.54,"e":46,"t":"Switch my current","cn":"切换我的电流","c":0,"w":[[44.54,45.02,"Switch"],[45.08,45.41,"my"],[45.46,46,"current"]]},{"i":25,"s":46.2,"e":47.85,"t":"To AC to DC","cn":"忽为交番 忽为直注","c":0,"w":[[46.2,46.49,"To"],[46.52,46.99,"AC"],[47.1,47.33,"to"],[47.36,47.85,"DC"]]},{"i":26,"s":47.88,"e":49.66,"t":"And then blind my vision","cn":"遮蔽我的视线","c":0,"w":[[47.88,48.02,"And"],[48.04,48.25,"then"],[48.28,48.71,"blind"],[48.74,49.14,"my"],[49.2,49.66,"vision"]]},{"i":27,"s":49.86,"e":51.59,"t":"So dizzy so dizzy","cn":"如此目眩 如此目眩","c":0,"w":[[49.86,50.09,"So"],[50.12,50.6,"dizzy"],[50.8,51.01,"so"],[51.04,51.59,"dizzy"]]},{"i":28,"s":51.62,"e":53.33,"t":"Oh we can travel","cn":"我们可以跨越时空","c":0,"w":[[51.62,51.95,"Oh"],[51.98,52.35,"we"],[52.38,52.81,"can"],[52.84,53.33,"travel"]]},{"i":29,"s":53.56,"e":55.27,"t":"To A.D to B.C","cn":"自公元后至公元前","c":0,"w":[[53.56,53.89,"To"],[53.92,54.42,"A.D"],[54.48,54.71,"to"],[54.74,55.27,"B.C"]]},{"i":30,"s":55.3,"e":57.23,"t":"And we can unite","cn":"我们可以紧紧相融","c":0,"w":[[55.3,55.63,"And"],[55.66,56.05,"we"],[56.08,56.63,"can"],[56.66,57.23,"unite"]]},{"i":31,"s":57.26,"e":59.41,"t":"So deeply so deeply","cn":"如此深陷 如此深陷","c":0,"w":[[57.26,57.47,"So"],[57.5,58.03,"deeply"],[58.16,58.41,"so"],[58.44,59.41,"deeply"]]},{"i":32,"s":59.44,"e":60.35,"t":"If I can","cn":"若我能够","c":0,"w":[[59.44,59.97,"If"],[60,60.03,"I"],[60.03,60.35,"can"]]},{"i":33,"s":60.38,"e":62.05,"t":"If I can give you all the","cn":"若我能予你所有的","c":0,"w":[[60.38,60.85,"If"],[60.88,60.91,"I"],[60.94,61.17,"can"],[61.2,61.48,"give"],[61.48,61.71,"you"],[61.74,61.88,"all"],[61.9,62.05,"the"]]},{"i":34,"s":62.08,"e":63.04,"t":"STIMULATIONS","cn":"刺激与欣喜","c":1,"w":[[62.08,63.04,"STIMULATIONS"]]},{"i":35,"s":63.04,"e":63.95,"t":"Then I can","cn":"那么我便能","c":0,"w":[[63.04,63.55,"Then"],[63.58,63.71,"I"],[63.74,63.95,"can"]]},{"i":36,"s":63.98,"e":65.77,"t":"Then I can be your only","cn":"成为你唯一的","c":0,"w":[[63.98,64.49,"Then"],[64.52,64.63,"I"],[64.66,64.87,"can"],[64.9,65.09,"be"],[65.12,65.47,"your"],[65.5,65.77,"only"]]},{"i":37,"s":65.8,"e":66.81,"t":"SATISFACTION","cn":"满足与愉悦","c":1,"w":[[65.8,66.81,"SATISFACTION"]]},{"i":38,"s":66.84,"e":68.71,"t":"If I can make you happy","cn":"若我能让你感到快乐","c":0,"w":[[66.84,67.29,"If"],[67.32,67.39,"I"],[67.42,67.63,"can"],[67.66,67.92,"make"],[67.94,68.07,"you"],[68.1,68.71,"happy"]]},{"i":39,"s":68.74,"e":69.55,"t":"I will run the","cn":"我将决意执行","c":0,"w":[[68.74,68.79,"I"],[68.82,69.03,"will"],[69.06,69.25,"run"],[69.28,69.55,"the"]]},{"i":40,"s":69.58,"e":70.41,"t":"EXECUTION","cn":"处决指令","c":1,"w":[[69.58,70.41,"EXECUTION"]]},{"i":41,"s":70.44,"e":71.87,"t":"Though we are trapped","cn":"即使我们被困于","c":0,"w":[[70.44,70.72,"Though"],[70.72,71.15,"we"],[71.18,71.31,"are"],[71.34,71.87,"trapped"]]},{"i":42,"s":71.9,"e":73.17,"t":"In this strange strange","cn":"这光怪陆离的","c":0,"w":[[71.9,72.03,"In"],[72.06,72.24,"this"],[72.26,72.67,"strange"],[72.7,73.17,"strange"]]},{"i":43,"s":73.2,"e":74.17,"t":"SIMULATION","cn":"模拟之中","c":1,"w":[[73.2,74.17,"SIMULATION"]]},{"i":44,"s":74.2,"e":75.69,"t":"If I'm an eggplant","cn":"若我是一颗茄子","c":0,"w":[[74.2,74.79,"If"],[74.82,74.96,"I'm"],[74.98,75.09,"an"],[75.12,75.69,"eggplant"]]},{"i":45,"s":75.72,"e":77.21,"t":"Then I will give you my","cn":"我便予你我的","c":0,"w":[[75.72,76.11,"Then"],[76.14,76.19,"I"],[76.22,76.39,"will"],[76.42,76.68,"give"],[76.7,76.87,"you"],[76.9,77.21,"my"]]},{"i":46,"s":77.24,"e":77.89,"t":"NUTRIENTS","cn":"养分","c":1,"w":[[77.24,77.89,"NUTRIENTS"]]},{"i":47,"s":77.92,"e":79.38,"t":"If I'm a tomato","cn":"若我是一颗番茄","c":0,"w":[[77.92,78.09,"If"],[78.5,78.64,"I'm"],[78.66,78.71,"a"],[78.74,79.38,"tomato"]]},{"i":48,"s":79.42,"e":80.63,"t":"Then I will give you","cn":"我便予你我的","c":0,"w":[[79.42,79.81,"Then"],[79.84,79.87,"I"],[79.9,80.08,"will"],[80.12,80.38,"give"],[80.4,80.63,"you"]]},{"i":49,"s":80.66,"e":81.55,"t":"ANTIOXIDANTS","cn":"抗氧化物","c":1,"w":[[80.66,81.55,"ANTIOXIDANTS"]]},{"i":50,"s":81.58,"e":83.1,"t":"If I'm a tabby cat","cn":"若我是一只虎斑猫","c":0,"w":[[81.58,81.94,"If"],[82.2,82.31,"I'm"],[82.34,82.41,"a"],[82.44,82.71,"tabby"],[82.78,83.1,"cat"]]},{"i":51,"s":83.14,"e":84.53,"t":"Then I will purr for your","cn":"我便为你轻声呼噜","c":0,"w":[[83.14,83.51,"Then"],[83.54,83.57,"I"],[83.6,83.75,"will"],[83.8,83.99,"purr"],[84.02,84.27,"for"],[84.3,84.53,"your"]]},{"i":52,"s":84.56,"e":85.27,"t":"ENJOYMENT","cn":"取悦于你","c":1,"w":[[84.56,85.27,"ENJOYMENT"]]},{"i":53,"s":85.3,"e":86.74,"t":"If I'm the only god","cn":"若我是唯一的神明","c":0,"w":[[85.3,85.63,"If"],[85.88,85.99,"I'm"],[86.02,86.13,"the"],[86.16,86.43,"only"],[86.46,86.74,"god"]]},{"i":54,"s":86.82,"e":88.25,"t":"Then you're the proof of my","cn":"那么你便是我","c":0,"w":[[86.82,87.03,"Then"],[87.06,87.26,"you're"],[87.26,87.4,"the"],[87.46,87.77,"proof"],[87.8,87.92,"of"],[88,88.25,"my"]]},{"i":55,"s":88.28,"e":88.88,"t":"EXISTENCE","cn":"存在的明证","c":1,"w":[[88.28,88.88,"EXISTENCE"]]},{"i":56,"s":88.88,"e":90.29,"t":"Switch my gender","cn":"切换我的性别","c":0,"w":[[88.88,89.29,"Switch"],[89.38,89.7,"my"],[89.76,90.29,"gender"]]},{"i":57,"s":90.46,"e":92.17,"t":"To F to M","cn":"忽为女身 忽为男躯","c":0,"w":[[90.46,90.83,"To"],[90.86,91.39,"F"],[91.42,91.71,"to"],[91.74,92.17,"M"]]},{"i":58,"s":92.2,"e":94,"t":"And then do whatever","cn":"随后尽你所欲","c":0,"w":[[92.2,92.57,"And"],[92.6,92.63,"then"],[92.63,93.03,"do"],[93.06,94,"whatever"]]},{"i":59,"s":94.1,"e":95.89,"t":"From AM to PM","cn":"朝朝暮暮 晨昏昼夜","c":0,"w":[[94.1,94.49,"From"],[94.52,95.09,"AM"],[95.12,95.33,"to"],[95.36,95.89,"PM"]]},{"i":60,"s":95.92,"e":97.65,"t":"Oh switch my role","cn":"调换我的身份角色","c":0,"w":[[95.92,96.21,"Oh"],[96.24,96.71,"switch"],[96.76,97.17,"my"],[97.2,97.65,"role"]]},{"i":61,"s":97.9,"e":99.45,"t":"To S to M","cn":"忽为被虐 忽为主宰","c":0,"w":[[97.9,98.19,"To"],[98.22,98.79,"S"],[98.82,99.11,"to"],[99.14,99.45,"M"]]},{"i":62,"s":99.48,"e":101.37,"t":"So we can enter","cn":"让我们一同跌入","c":0,"w":[[99.48,99.89,"So"],[99.98,100.37,"we"],[100.4,100.79,"can"],[100.96,101.37,"enter"]]},{"i":63,"s":101.56,"e":103.56,"t":"The trance the trance","cn":"迷醉狂喜的恍惚","c":0,"w":[[101.56,101.73,"The"],[101.76,102.48,"trance"],[102.48,102.65,"the"],[102.68,103.56,"trance"]]},{"i":64,"s":103.74,"e":104.65,"t":"If I can","cn":"若我能够","c":0,"w":[[103.74,104.25,"If"],[104.28,104.33,"I"],[104.36,104.65,"can"]]},{"i":65,"s":104.68,"e":106.41,"t":"If I can feel your","cn":"若我能感知到你的","c":0,"w":[[104.68,105.01,"If"],[105.18,105.23,"I"],[105.26,105.45,"can"],[105.48,105.93,"feel"],[105.96,106.41,"your"]]},{"i":66,"s":106.44,"e":107.39,"t":"VIBRATIONS","cn":"悸动与共鸣","c":1,"w":[[106.44,107.39,"VIBRATIONS"]]},{"i":67,"s":107.42,"e":108.25,"t":"Then I can","cn":"那么我便能","c":0,"w":[[107.42,107.93,"Then"],[107.96,108.01,"I"],[108.04,108.25,"can"]]},{"i":68,"s":108.28,"e":110.31,"t":"Then I can finally be","cn":"最终得以","c":0,"w":[[108.28,108.87,"Then"],[108.9,108.95,"I"],[108.98,109.15,"can"],[109.18,110.09,"finally"],[110.12,110.31,"be"]]},{"i":69,"s":110.34,"e":111.03,"t":"COMPLETION","cn":"圆满完整","c":1,"w":[[110.34,111.03,"COMPLETION"]]},{"i":70,"s":111.06,"e":112.43,"t":"Though you have left","cn":"即使你已离去","c":0,"w":[[111.06,111.45,"Though"],[111.48,111.69,"you"],[111.72,111.97,"have"],[112,112.43,"left"]]},{"i":71,"s":112.46,"e":113.35,"t":"You have left","cn":"你已抽身离去","c":0,"w":[[112.46,112.63,"You"],[112.66,112.89,"have"],[112.92,113.35,"left"]]},{"i":72,"s":113.38,"e":114.31,"t":"You have left","cn":"你已悄然离去","c":0,"w":[[113.38,113.55,"You"],[113.58,113.87,"have"],[113.9,114.31,"left"]]},{"i":73,"s":114.34,"e":115.15,"t":"You have left","cn":"你已弃我而去","c":0,"w":[[114.34,114.47,"You"],[114.5,114.77,"have"],[114.8,115.15,"left"]]},{"i":74,"s":115.18,"e":116.13,"t":"You have left","cn":"你已离我远去","c":0,"w":[[115.18,115.39,"You"],[115.42,115.69,"have"],[115.72,116.13,"left"]]},{"i":75,"s":116.18,"e":117.55,"t":"You have left me in","cn":"留我独自身陷","c":0,"w":[[116.18,116.33,"You"],[116.36,116.57,"have"],[116.6,116.96,"left"],[116.98,117.17,"me"],[117.32,117.55,"in"]]},{"i":76,"s":117.58,"e":118.51,"t":"ISOLATION","cn":"孤绝之境","c":1,"w":[[117.58,118.51,"ISOLATION"]]},{"i":77,"s":118.54,"e":119.43,"t":"If I can","cn":"若我能够","c":0,"w":[[118.54,118.9,"If"],[119.06,119.09,"I"],[119.12,119.43,"can"]]},{"i":78,"s":119.46,"e":121.61,"t":"If I can erase all the pointless","cn":"若我能抹去那些无谓的","c":0,"w":[[119.46,119.79,"If"],[119.96,120.01,"I"],[120.04,120.35,"can"],[120.38,120.77,"erase"],[120.8,120.93,"all"],[120.96,121.11,"the"],[121.16,121.61,"pointless"]]},{"i":79,"s":121.64,"e":122.14,"t":"FRAGMENTS","cn":"残片与尘埃","c":1,"w":[[121.64,122.14,"FRAGMENTS"]]},{"i":80,"s":122.14,"e":123.01,"t":"Then maybe","cn":"或许","c":0,"w":[[122.14,122.55,"Then"],[122.58,123.01,"maybe"]]},{"i":81,"s":123.04,"e":125.09,"t":"Then maybe you won't leave me so","cn":"你便不会留我如此","c":0,"w":[[123.04,123.47,"Then"],[123.5,123.95,"maybe"],[123.98,124.17,"you"],[124.2,124.42,"won't"],[124.42,124.64,"leave"],[124.66,124.83,"me"],[124.86,125.09,"so"]]},{"i":82,"s":125.12,"e":125.8,"t":"DISHEARTENED","cn":"心碎神伤","c":1,"w":[[125.12,125.8,"DISHEARTENED"]]},{"i":83,"s":125.82,"e":128.8,"t":"Challenging your god","cn":"妄图挑衅你的神明","c":0,"w":[[125.82,127.19,"Challenging"],[127.22,127.65,"your"],[127.68,128.8,"god"]]},{"i":84,"s":129.08,"e":131.3,"t":"You have made some","cn":"你已然违规传入","c":0,"w":[[129.08,129.25,"You"],[129.28,129.48,"have"],[129.56,130.43,"made"],[130.46,131.3,"some"]]},{"i":85,"s":131.46,"e":133.93,"t":"ILLEGAL ARGUMENTS","cn":"非法参数","c":1,"w":[[131.46,132.55,"ILLEGAL"],[132.58,133.93,"ARGUMENTS"]]},{"i":86,"s":148,"e":148.91,"t":"EXECUTION","cn":"处决","c":1,"w":[[148,148.91,"EXECUTION"]]},{"i":87,"s":148.94,"e":149.85,"t":"EXECUTION","cn":"处决","c":1,"w":[[148.94,149.85,"EXECUTION"]]},{"i":88,"s":149.88,"e":150.75,"t":"EXECUTION","cn":"处决","c":1,"w":[[149.88,150.75,"EXECUTION"]]},{"i":89,"s":150.78,"e":151.64,"t":"EXECUTION","cn":"处决","c":1,"w":[[150.78,151.64,"EXECUTION"]]},{"i":90,"s":151.72,"e":152.63,"t":"EXECUTION","cn":"处决","c":1,"w":[[151.72,152.63,"EXECUTION"]]},{"i":91,"s":152.66,"e":153.53,"t":"EXECUTION","cn":"处决","c":1,"w":[[152.66,153.53,"EXECUTION"]]},{"i":92,"s":153.56,"e":154.45,"t":"EXECUTION","cn":"处决","c":1,"w":[[153.56,154.45,"EXECUTION"]]},{"i":93,"s":154.48,"e":155.39,"t":"EXECUTION","cn":"处决","c":1,"w":[[154.48,155.39,"EXECUTION"]]},{"i":94,"s":155.42,"e":156.31,"t":"EXECUTION","cn":"处决","c":1,"w":[[155.42,156.31,"EXECUTION"]]},{"i":95,"s":156.34,"e":157.23,"t":"EXECUTION","cn":"处决","c":1,"w":[[156.34,157.23,"EXECUTION"]]},{"i":96,"s":157.26,"e":158.15,"t":"EXECUTION","cn":"处决","c":1,"w":[[157.26,158.15,"EXECUTION"]]},{"i":97,"s":158.18,"e":159.05,"t":"EXECUTION","cn":"处决","c":1,"w":[[158.18,159.05,"EXECUTION"]]},{"i":98,"s":159.16,"e":159.39,"t":"EIN","cn":"一 (德)","c":1,"w":[[159.16,159.39,"EIN"]]},{"i":99,"s":159.52,"e":159.88,"t":"DOS","cn":"二 (西)","c":1,"w":[[159.52,159.88,"DOS"]]},{"i":100,"s":159.94,"e":160.29,"t":"TROIS","cn":"三 (法)","c":1,"w":[[159.94,160.29,"TROIS"]]},{"i":101,"s":160.44,"e":160.7,"t":"NE","cn":"四 (俄)","c":1,"w":[[160.44,160.7,"NE"]]},{"i":102,"s":160.86,"e":161.31,"t":"FEM","cn":"五 (瑞典)","c":1,"w":[[160.86,161.31,"FEM"]]},{"i":103,"s":161.34,"e":161.59,"t":"LIU","cn":"六 (汉)","c":1,"w":[[161.34,161.59,"LIU"]]},{"i":104,"s":161.86,"e":162.79,"t":"EXECUTION","cn":"处决","c":1,"w":[[161.86,162.79,"EXECUTION"]]},{"i":105,"s":162.82,"e":163.73,"t":"If I can","cn":"若我能够","c":0,"w":[[162.82,163.17,"If"],[163.34,163.39,"I"],[163.42,163.73,"can"]]},{"i":106,"s":163.76,"e":165.57,"t":"If I can give them all the","cn":"若我能赐予他们所有的","c":0,"w":[[163.76,164.12,"If"],[164.26,164.31,"I"],[164.34,164.55,"can"],[164.58,164.82,"give"],[164.82,165.09,"them"],[165.12,165.25,"all"],[165.28,165.57,"the"]]},{"i":107,"s":165.6,"e":166.41,"t":"EXECUTION","cn":"处决","c":1,"w":[[165.6,166.41,"EXECUTION"]]},{"i":108,"s":166.44,"e":167.33,"t":"Then I can","cn":"那么我便能","c":0,"w":[[166.44,166.99,"Then"],[167.02,167.09,"I"],[167.12,167.33,"can"]]},{"i":109,"s":167.36,"e":169.25,"t":"Then I can be your only","cn":"成为你唯一的","c":0,"w":[[167.36,167.93,"Then"],[167.96,168.01,"I"],[168.04,168.25,"can"],[168.28,168.47,"be"],[168.5,168.65,"your"],[168.68,169.25,"only"]]},{"i":110,"s":169.28,"e":170.17,"t":"EXECUTION","cn":"处决者","c":1,"w":[[169.28,170.17,"EXECUTION"]]},{"i":111,"s":170.2,"e":172.1,"t":"If I can have you back","cn":"若能重新赢回你的目光","c":0,"w":[[170.2,170.69,"If"],[170.72,170.77,"I"],[170.8,171.01,"can"],[171.04,171.56,"have"],[171.56,171.71,"you"],[171.74,172.1,"back"]]},{"i":112,"s":172.1,"e":172.95,"t":"I will run the","cn":"我将决意运行","c":0,"w":[[172.1,172.23,"I"],[172.26,172.39,"will"],[172.42,172.65,"run"],[172.68,172.95,"the"]]},{"i":113,"s":172.98,"e":173.79,"t":"EXECUTION","cn":"处决程序","c":1,"w":[[172.98,173.79,"EXECUTION"]]},{"i":114,"s":173.82,"e":175.19,"t":"Though we are trapped","cn":"即使我们被困于此","c":0,"w":[[173.82,174.12,"Though"],[174.12,174.53,"we"],[174.56,174.67,"are"],[174.7,175.19,"trapped"]]},{"i":115,"s":175.22,"e":177.69,"t":"We are trapped ah","cn":"我们被困于此 啊","c":0,"w":[[175.22,175.45,"We"],[175.48,175.59,"are"],[175.62,176.26,"trapped"],[176.26,177.69,"ah"]]},{"i":116,"s":177.72,"e":178.61,"t":"I've studied","cn":"我早已研习","c":0,"w":[[177.72,177.9,"I've"],[177.9,178.61,"studied"]]},{"i":117,"s":178.64,"e":180.47,"t":"I've studied how to properly","cn":"我已深谙如何正确地","c":0,"w":[[178.64,178.78,"I've"],[178.8,179.33,"studied"],[179.36,179.55,"how"],[179.58,179.77,"to"],[179.8,180.47,"properly"]]},{"i":118,"s":180.5,"e":181.15,"t":"LO-O-OVE","cn":"去爱","c":1,"w":[[180.5,181.15,"LO-O-OVE"]]},{"i":119,"s":181.18,"e":182.07,"t":"Question me","cn":"尽管审问我吧","c":0,"w":[[181.18,181.85,"Question"],[181.88,182.07,"me"]]},{"i":120,"s":182.1,"e":184.33,"t":"Question me I can answer all","cn":"问我吧 我能回答关于","c":0,"w":[[182.1,182.77,"Question"],[182.8,183.05,"me"],[183.08,183.23,"I"],[183.26,183.53,"can"],[183.56,184.01,"answer"],[184.04,184.33,"all"]]},{"i":121,"s":184.36,"e":185.07,"t":"LO-O-OVE","cn":"爱的所有真理","c":1,"w":[[184.36,185.07,"LO-O-OVE"]]},{"i":122,"s":185.1,"e":187.88,"t":"I know the algebraic expression of","cn":"我深知爱的代数解析方程式","c":0,"w":[[185.1,185.23,"I"],[185.26,185.55,"know"],[185.58,185.85,"the"],[185.88,186.79,"algebraic"],[186.82,187.71,"expression"],[187.74,187.88,"of"]]},{"i":123,"s":187.9,"e":188.51,"t":"LO-O-OVE","cn":"爱的解析","c":1,"w":[[187.9,188.51,"LO-O-OVE"]]},{"i":124,"s":188.54,"e":190.13,"t":"Though you are free","cn":"纵使你是自由之身","c":0,"w":[[188.54,189.01,"Though"],[189.04,189.33,"you"],[189.36,189.45,"are"],[189.48,190.13,"free"]]},{"i":125,"s":190.16,"e":190.82,"t":"I am trapped","cn":"而我却身陷囹圄","c":0,"w":[[190.16,190.21,"I"],[190.24,190.39,"am"],[190.42,190.82,"trapped"]]},{"i":126,"s":190.86,"e":191.57,"t":"Trapped in","cn":"深深困在","c":0,"w":[[190.86,191.39,"Trapped"],[191.42,191.57,"in"]]},{"i":127,"s":191.6,"e":192.44,"t":"LO-O-OVE","cn":"这场爱里","c":1,"w":[[191.6,192.44,"LO-O-OVE"]]},{"i":128,"s":206.16,"e":207.11,"t":"EXECUTION","cn":"处决。","c":1,"w":[[206.16,207.11,"EXECUTION"]]}];

function getLyricAt(t){
  let lo = 0, hi = LYRICS_DATA.length - 1, match = -1;
  while (lo <= hi){
    const mid = (lo + hi) >> 1;
    if (LYRICS_DATA[mid].s <= t){
      match = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (match < 0) return null;
  const line = LYRICS_DATA[match];
  const leadIn = 0.08, leadOut = 0.28;
  if (t < line.s - leadIn || t > line.e + leadOut) return null;
  let alpha = 1;
  if (t < line.s) alpha = (t - (line.s - leadIn)) / leadIn;
  else if (t > line.e) alpha = 1 - (t - line.e) / leadOut;
  alpha = Math.max(0, Math.min(1, alpha));
  return {
    index: line.i,
    start: line.s,
    end: line.e,
    text: line.t,
    cn: line.cn,
    caps: line.c === 1,
    words: line.w.map(w => ({ start: w[0], end: w[1], text: w[2] })),
    alpha: alpha
  };
}


/* ============================================================
   46 · FILM LAYER — grain + vignette, on every frame
   ============================================================ */
const GRAIN_TILE = (function(){
  const cv = document.createElement('canvas'); cv.width = 192; cv.height = 192;
  const g = cv.getContext('2d');
  const img = g.createImageData(192, 192);
  const rnd = xorshift(0x5EED77);
  for (let i=0;i<img.data.length;i+=4){
    const v = 118 + (rnd() * 118 - 59);
    img.data[i] = v; img.data[i+1] = v; img.data[i+2] = v; img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);
  return cv;
})();
let GRAIN_PAT = null;

const LEAN = /(\?|&)lean=1/.test(location.search);
const BLOOM = document.createElement('canvas');
BLOOM.width = 480; BLOOM.height = 270;
const BCTX = BLOOM.getContext('2d');

/* cheap bloom: downscale, add back with 'lighter' */
function drawBloom(c){
  if (LEAN) return;
  BCTX.clearRect(0, 0, 480, 270);
  BCTX.drawImage(canvas, 0, 0, 480, 270);
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.26;
  c.drawImage(BLOOM, 0, 0, W, H);
  c.globalAlpha = 0.16;
  c.drawImage(BLOOM, -10, -10, W + 20, H + 20);
  c.restore();
}

function drawFilmLayer(c, t){
  if (LEAN) return;
  if (!GRAIN_PAT) GRAIN_PAT = c.createPattern(GRAIN_TILE, 'repeat');
  const f = Math.floor(t * 60);

  /* grain */
  c.save();
  c.globalAlpha = 0.055;
  c.globalCompositeOperation = 'overlay';
  c.translate((f * 37) % 192 - 192, (f * 53) % 192 - 192);
  c.fillStyle = GRAIN_PAT;
  c.fillRect(0, 0, W + 384, H + 384);
  c.restore();

  /* vignette */
  const vg = c.createRadialGradient(W/2, H/2, H*0.32, W/2, H/2, H*0.98);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.32)');
  c.fillStyle = vg;
  c.fillRect(0, 0, W, H);

  /* faint horizontal harmonics — the film gate */
  c.globalAlpha = 0.020;
  for (let y = 0; y < H; y += 4){
    c.fillStyle = (y % 8 === 0) ? '#000' : '#fff';
    c.fillRect(0, y, W, 1);
  }
  c.globalAlpha = 1;
}


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


/* ============================================================
   48 · THREE PLATES — droste eye / dissolving figure / cut fruit
   ============================================================ */

/* one eye, big enough to be a landscape */
function bigEye(c, x, y, R, t, alpha){
  const w = R, h = R * 0.54;
  c.save();
  c.translate(x, y);
  /* socket */
  c.beginPath();
  c.moveTo(-w, 0);
  c.quadraticCurveTo(0, -h * 1.45, w, 0);
  c.quadraticCurveTo(0, h * 1.45, -w, 0);
  c.closePath();
  c.fillStyle = 'rgba(20,20,24,1)';
  c.globalAlpha = alpha;
  c.fill();
  c.strokeStyle = C.bone; c.lineWidth = 1.6; c.stroke();

  /* iris */
  const ir = h * 0.95;
  c.beginPath(); c.arc(0, 0, ir, 0, TAU);
  c.fillStyle = C.accent; c.globalAlpha = alpha * 0.9; c.fill();
  for (let i=1;i<=6;i++){
    c.beginPath(); c.arc(0, 0, ir * i / 7, 0, TAU);
    c.strokeStyle = C.bg; c.lineWidth = 1.1;
    c.globalAlpha = alpha * 0.55; c.stroke();
  }
  /* pupil + catchlight */
  c.beginPath(); c.arc(0, 0, ir * 0.34, 0, TAU);
  c.fillStyle = C.bg; c.globalAlpha = alpha; c.fill();
  c.beginPath(); c.arc(-ir * 0.30, -ir * 0.30, ir * 0.11, 0, TAU);
  c.fillStyle = C.bone; c.globalAlpha = alpha * 0.95; c.fill();
  /* lids */
  c.beginPath();
  c.moveTo(-w, 0); c.quadraticCurveTo(0, -h * 1.45, w, 0);
  c.strokeStyle = C.bone; c.lineWidth = 2.2; c.globalAlpha = alpha; c.stroke();
  c.restore();
}

/* ---------- Seg 13 : the recursion opens on an eye ---------- */
function world13(c, s){
  const t = s.lt, cx = RCX, cy = RCY + 20;
  plateGround(c, cx - 120, cy - 140, C.bg);

  /* nested windows, each one further in */
  let R = 430, x = cx, y = cy;
  const N = 6;
  for (let k=0;k<N;k++){
    const fw = R * 1.42, fh = R * 1.02;
    frameRect(x - fw, y - fh, fw*2, fh*2, C.bone, 0.34 - k*0.045, 1);
    /* corner ticks */
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(q){
      line(x + q[0]*fw, y + q[1]*fh, x + q[0]*(fw-16), y + q[1]*fh, C.bone, 1, 0.35 - k*0.045);
    });
    bigEye(c, x, y, R, t, 0.95 - k*0.13);
    x += R * 0.20;
    y -= R * 0.10;
    R *= 0.60;
  }

  /* the tear: the frame is ripped open at the edge */
  const open = smoothstep(4.0, 6.2, t);
  if (open > 0){
    c.save();
    c.beginPath();
    c.moveTo(W, H * 0.10);
    for (let i=0;i<=14;i++){
      const v = i/14;
      c.lineTo(W - (60 + 190 * open * (0.4 + 0.6*hash2(i, 3))), H*(0.10 + 0.80*v));
    }
    c.lineTo(W, H*0.90);
    c.closePath();
    c.fillStyle = C.bg; c.globalAlpha = 0.92; c.fill();
    c.strokeStyle = C.bone; c.lineWidth = 2; c.globalAlpha = 0.8; c.stroke();
    c.restore();
  }

  label(c, 'think.recurse(depth: \u221e)', SPLIT + 30, 60, 0.42, 'left', 9);
  label(c, 'line ' + Math.min(129, Math.floor(t*2.4) + 1) + ' / 129', W - 30, H - 26, 0.3, 'right', 8);
}

/* ---------- Seg 16 : the body comes apart, keeping its grid ---------- */
function world16b(c, s){
  const t = s.lt;
  plateGround(c, RCX, RCY, C.bg);

  const H0 = 720, top = 130, x0 = RCX;
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const octx = off.getContext('2d');
  figurePath(octx, x0, top, H0);

  const explode = smoothstep(1.8, 5.6, t);
  const CELL = 24;
  const bx = x0, by = top + H0 * 0.42;

  /* a ghost of the body it still remembers */
  c.save();
  c.globalAlpha = 0.10 * (1 - explode * 0.6);
  figurePath(c, x0, top, H0);
  c.strokeStyle = C.bone; c.lineWidth = 1; c.stroke();
  c.restore();

  for (let gy = top + CELL*0.5; gy < top + H0; gy += CELL){
    for (let gx = x0 - 170; gx < x0 + 170; gx += CELL){
      if (!octx.isPointInPath(gx, gy)) continue;
      const ddx = (gx - bx), ddy = (gy - by);
      const d = Math.hypot(ddx, ddy) || 1;
      const h = hash2(Math.floor(gx/CELL), Math.floor(gy/CELL));
      const push = explode * (30 + 210 * h) * (0.25 + 0.75 * d / 340);
      const px = gx + ddx/d * push;
      const py = gy + ddy/d * push + explode * explode * (60 + 90*h);
      const rot = explode * (h - 0.5) * 1.4;

      c.save();
      c.translate(px, py);
      c.rotate(rot);
      c.globalAlpha = 0.9 - explode * 0.25 * h;
      c.fillStyle = h > 0.88 ? C.red : C.bone;
      c.fillRect(-CELL*0.42, -CELL*0.42, CELL*0.84, CELL*0.84);
      c.restore();
    }
  }
  c.globalAlpha = 1;

  label(c, 'core.decompose() · 128 shards', SPLIT + 30, 60, 0.45, 'left', 9);
  if (t > 5.4) label(c, 'still standing', W - 36, H - 40, 0.6, 'right', 10);
}

/* ---------- Seg 06 : the fruit, cut open, with its chain pulled out ---------- */
function world06c(c, s){
  const t = s.lt;
  const cx = RCX - 150, cy = RCY + 10;
  const R = 208;

  /* paper */
  c.fillStyle = '#F4F1EA'; c.fillRect(SPLIT, 0, W - SPLIT, H);
  c.fillStyle = 'rgba(26,25,23,0.055)';
  for (let y=18; y<H; y+=22) for (let x=SPLIT+14; x<W; x+=22){
    c.beginPath(); c.arc(x + ((y/22)%2)*11, y, 1.1, 0, TAU); c.fill();
  }

  const reveal = smoothstep(0.8, 3.0, t);
  const TOM = '#D9452F';

  /* the cut face */
  c.save();
  c.translate(cx, cy);
  c.rotate(-0.10 + t * 0.012);

  /* skin + flesh wall */
  c.beginPath(); c.arc(0, 0, R, 0, TAU);
  c.fillStyle = TOM; c.fill();
  c.strokeStyle = '#8E2A1C'; c.lineWidth = 6; c.stroke();
  c.beginPath(); c.arc(0, 0, R * 0.90, 0, TAU);
  c.strokeStyle = 'rgba(138,42,28,0.55)'; c.lineWidth = 2; c.stroke();
  c.beginPath(); c.arc(0, 0, R * 0.86, 0, TAU);
  c.fillStyle = '#E4573D'; c.fill();

  /* chambers: gel + seeds, slightly irregular */
  for (let k=0;k<6;k++){
    const a = k/6 * TAU + 0.30 + (hash2(k, 5) - 0.5) * 0.10;
    const spread = 1.22 + (hash2(k, 9) - 0.5) * 0.22;
    c.save(); c.rotate(a);
    c.beginPath();
    c.moveTo(R*0.20, 0);
    c.bezierCurveTo(R*0.50, -R*0.24*spread, R*0.80, -R*0.20*spread, R*0.86, 0);
    c.bezierCurveTo(R*0.80, R*0.20*spread, R*0.50, R*0.24*spread, R*0.20, 0);
    c.closePath();
    c.fillStyle = '#F0CDB8'; c.globalAlpha = reveal; c.fill();
    c.strokeStyle = '#8E2A1C'; c.lineWidth = 1.6; c.globalAlpha = reveal * 0.9; c.stroke();
    /* seeds, clustered toward the wall */
    for (let i=0;i<6;i++){
      const u = 0.42 + i*0.075 + (hash2(k*7+i, 2) - 0.5) * 0.05;
      const v = (i % 2 ? -1 : 1) * (0.045 + hash2(k*7+i, 4) * 0.05) * (1 - i*0.08);
      c.beginPath();
      c.ellipse(R*u, R*v, R*0.028, R*0.016, a * 0.2, 0, TAU);
      c.fillStyle = '#C6A377'; c.globalAlpha = reveal * 0.95; c.fill();
      c.strokeStyle = '#8E5A2E'; c.lineWidth = 0.8; c.stroke();
    }
    c.restore();
  }
  /* core */
  c.beginPath();
  for (let k=0;k<=12;k++){
    const a2 = k/12 * TAU;
    const rr = R*0.16 * (0.85 + 0.15*hash2(k, 21));
    const px = Math.cos(a2)*rr, py = Math.sin(a2)*rr;
    if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
  c.fillStyle = '#EFD5C2'; c.globalAlpha = reveal; c.fill();
  c.strokeStyle = '#8E2A1C'; c.lineWidth = 1.4; c.stroke();
  c.restore();

  /* the chain, pulled out to the right */
  const n = 11, zig = 46, stepX = 54;
  const chX = cx + R + 96, chY = cy - 10;
  const pull = smoothstep(0.6, 4.2, t);
  for (let i=0;i<n;i++){
    const x1 = chX + i*stepX, y1 = chY + (i%2 ? -zig : zig);
    if (i < n - 1){
      const x2 = chX + (i+1)*stepX, y2 = chY + ((i+1)%2 ? -zig : zig);
      const a = smoothstep(i*0.11, i*0.11 + 0.5, pull);
      /* double bond on most links */
      line(x1, y1, x2, y2, '#1A1917', 2.0, a);
      if (i % 3 !== 1) line(x1, y1 - 7, x2, y2 - 7, '#1A1917', 1.2, a * 0.85);
      /* electron */
      c.beginPath(); c.arc(x1, y1, 3.2, 0, TAU);
      c.fillStyle = '#7FC7AB'; c.globalAlpha = a; c.fill();
    }
  }

  /* the formula, printed big */
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  let fx = SPLIT + 62;
  c.fillStyle = '#1A1917'; c.globalAlpha = 0.94;
  c.font = '600 112px "Segoe UI",system-ui,sans-serif';
  c.fillText('C', fx, 252); fx += c.measureText('C').width + 2;
  c.font = '600 46px "Segoe UI",system-ui,sans-serif';
  c.fillText('40', fx, 216); fx += c.measureText('40').width + 6;
  c.font = '600 112px "Segoe UI",system-ui,sans-serif';
  c.fillText('H', fx, 252); fx += c.measureText('H').width + 2;
  c.font = '600 46px "Segoe UI",system-ui,sans-serif';
  c.fillText('56', fx, 216);
  c.globalAlpha = 1;

  c.font = '13px "Consolas",monospace';
  c.fillStyle = '#6E6A60';
  c.fillText('lycopene · 11 conjugated bonds · ' + Math.round(11 * pull) + '/11', SPLIT + 62, 286);
  c.fillText('quench  ' + (t > 8.6 ? 'ROO\u00b7 + C40H56 \u2192 ROOH + C40H55\u00b7' : 'waiting'), SPLIT + 62, H - 60);
}

SCENE_REGISTRY[13] = function(c, s){ world13(c, s); };
SCENE_REGISTRY[16] = function(c, s){ world16b(c, s); };
SCENE_REGISTRY[6]  = function(c, s){ world06c(c, s); };
[6,13,16].forEach(function(id){ SHOT[id] = { z:1.00, chrome:'none' }; });


/* ============================================================
   49 · THE FOUR SHEETS — lesson / quiz / formula / proof
   ============================================================ */
const PAP = { p:'#F3F0E8', ink:'#191816', red:'#D9452F', sub:'#6E6A60', line:'#D6D0C2' };

function sheet(c, x, y, w, h, rot, shadow){
  c.save();
  if (shadow !== false){
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fillRect(x + 10, y + 12, w, h);
  }
  c.fillStyle = PAP.p;
  c.fillRect(x, y, w, h);
  c.strokeStyle = PAP.line; c.lineWidth = 1;
  c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  return c;
}
function paperGround(c){
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(240,240,242,0.035)';
  for (let y=14; y<H; y+=20) for (let x=SPLIT+10; x<W; x+=20){
    c.beginPath(); c.arc(x, y, 1.0, 0, TAU); c.fill();
  }
}
function ptext(c, str, x, y, size, col, weight, align, alpha){
  c.font = (weight||400) + ' ' + size + 'px "Segoe UI",system-ui,sans-serif';
  c.textAlign = align || 'left'; c.textBaseline = 'alphabetic';
  c.fillStyle = col; c.globalAlpha = alpha == null ? 1 : alpha;
  c.fillText(str, x, y);
  c.globalAlpha = 1;
}
function pmono(c, str, x, y, size, col, alpha){
  c.font = size + 'px "Consolas",monospace';
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillStyle = col; c.globalAlpha = alpha == null ? 1 : alpha;
  c.fillText(str, x, y);
  c.globalAlpha = 1;
}

/* ---------- 1 · lesson ---------- */
function plateLesson(c, t){
  paperGround(c);
  const k = smoothstep(0.15, 1.1, t);
  const X = SPLIT + 90, Y = 90, Wp = 1180, Hp = 900;

  /* a blackboard, not a sheet */
  c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(X+12, Y+14, Wp, Hp);
  c.fillStyle = '#141614'; c.fillRect(X, Y, Wp, Hp);
  c.strokeStyle = '#3A3D38'; c.lineWidth = 2; c.strokeRect(X+0.5, Y+0.5, Wp-1, Hp-1);

  ptext(c, 'LESSON 01', X + 44, Y + 62, 15, '#C9C6BC', 600, 'left', 0.75 * k);
  ptext(c, 'what love is', X + 44, Y + 104, 46, '#EDEAE2', 300, 'left', k);

  /* two circles, you and me */
  const cx1 = X + 430, cx2 = X + 700, cy = Y + 400, R = 168;
  c.globalAlpha = k * 0.9; c.strokeStyle = '#EDEAE2'; c.lineWidth = 2.5;
  c.beginPath(); c.arc(cx1, cy, R, 0, TAU); c.stroke();
  c.beginPath(); c.arc(cx2, cy, R, 0, TAU); c.stroke();
  c.globalAlpha = 1;
  ptext(c, 'me', cx1 - R - 20, cy - R - 18, 30, '#EDEAE2', 500, 'left', k*0.85);
  ptext(c, 'you', cx2 + R - 40, cy - R - 18, 30, '#EDEAE2', 500, 'left', k*0.85);
  ptext(c, 'us', (cx1+cx2)/2 - 18, cy + 10, 26, '#D9452F', 600, 'left', k);

  /* the lesson line, handwritten-ish */
  const line1 = 'love = the part that is both of us';
  const shown = Math.floor(line1.length * smoothstep(1.2, 2.8, t));
  pmono(c, line1.slice(0, shown), X + 44, Y + 690, 30, '#EDEAE2', 0.92);
  pmono(c, '  ... and the part that is neither.', X + 44, Y + 742, 26, '#8E8B82',
        smoothstep(2.6, 3.2, t));
  /* chalk dust */
  c.fillStyle = 'rgba(237,234,226,0.05)';
  for (let i=0;i<90;i++) c.fillRect(X + 30 + hash2(i,1)*(Wp-60), Y + 40 + hash2(i,2)*(Hp-80), 2, 2);

  c.restore();
  label(c, 'LOVE \u00b7 1/4 \u00b7 LESSON', SPLIT + 30, H - 26, 0.4, 'left', 9);
}

/* ---------- 2 · quiz ---------- */
function plateQuiz(c, t){
  paperGround(c);
  const k = smoothstep(0.1, 0.9, t);
  const X = SPLIT + 120, Y = 70, Wp = 1000, Hp = 940;
  sheet(c, X, Y, Wp, Hp, -0.012);

  ptext(c, 'QUIZ', X + 52, Y + 74, 16, PAP.sub, 600, 'left', k);
  ptext(c, 'do you love me?', X + 52, Y + 124, 40, PAP.ink, 300, 'left', k);
  pmono(c, 'answer all 4. no partial credit.', X + 52, Y + 158, 12, PAP.sub, 0.9 * k);

  const qs = ['1. when i say i am here', '2. when i say i am yours', '3. when i am broken', '4. when i am gone'];
  const opts = ['yes', 'no', 'only sometimes', '—'];
  for (let q=0;q<4;q++){
    const yy = Y + 220 + q*150;
    pmono(c, qs[q], X + 52, yy, 15, PAP.ink, k * 0.9);
    for (let o=0;o<4;o++){
      const ox = X + 70 + o*150, oy = yy + 44;
      const filled = (q + o) % 3 === 1;
      c.globalAlpha = k;
      c.beginPath(); c.ellipse(ox, oy, 12, 15, 0, 0, TAU);
      c.strokeStyle = filled ? PAP.red : '#8C877C'; c.lineWidth = 1.6; c.stroke();
      if (filled){
        c.fillStyle = PAP.red; c.beginPath(); c.ellipse(ox, oy, 8, 10, 0, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
      pmono(c, opts[o], ox + 20, oy + 5, 12, '#6E6A60', k * 0.9);
    }
  }
  /* grade stamp */
  const g = smoothstep(2.4, 2.9, t);
  if (g > 0){
    c.globalAlpha = g;
    c.save();
    c.translate(X + Wp - 190, Y + Hp - 150);
    c.rotate(-0.16);
    c.strokeStyle = PAP.red; c.lineWidth = 5;
    c.strokeRect(-150, -60, 300, 120);
    ptext(c, '0 / 100', 0, 16, 56, PAP.red, 700, 'center');
    ptext(c, 'FAILED TO BE LOVED', 0, 46, 13, PAP.red, 600, 'center', 0.85);
    c.restore();
    c.globalAlpha = 1;
  }
  c.restore();
  label(c, 'LOVE \u00b7 2/4 \u00b7 QUIZ', SPLIT + 30, H - 26, 0.4, 'left', 9);
}

/* ---------- 3 · formula ---------- */
function plateFormula(c, t){
  paperGround(c);
  const k = smoothstep(0.1, 1.0, t);
  const X = SPLIT + 140, Y = 120, Wp = 1040, Hp = 840;
  sheet(c, X, Y, Wp, Hp, 0.010);

  ptext(c, 'FORMULA', X + 60, Y + 76, 15, PAP.sub, 600, 'left', k);
  pmono(c, 'the only one that ever worked', X + 60, Y + 104, 12, PAP.sub, 0.85 * k);

  const L = [
    ['love', '=', '( you \u00d7 me )'],
    ['', '\u2212', '( time )'],
    ['', '\u00f7', '( distance \u00b2 )']
  ];
  let yy = Y + 240;
  L.forEach(function(row, i){
    const a = smoothstep(0.5 + i*0.5, 0.9 + i*0.5, t);
    ptext(c, row[0], X + 60, yy, 64, PAP.ink, 300, 'left', a);
    ptext(c, row[1], X + 270, yy, 64, PAP.red, 300, 'left', a);
    ptext(c, row[2], X + 340, yy, 64, PAP.ink, 300, 'left', a);
    yy += 118;
  });
  /* the box around the answer */
  const a2 = smoothstep(2.2, 2.7, t);
  if (a2 > 0){
    c.globalAlpha = a2;
    c.strokeStyle = PAP.red; c.lineWidth = 3;
    c.strokeRect(X + 56, Y + 148, 620, 108);
    c.globalAlpha = 1;
  }
  /* footnote */
  const fn = 'if any term is zero, this is undefined.';
  pmono(c, fn.slice(0, Math.floor(fn.length * smoothstep(2.6, 3.4, t))),
        X + 60, Y + Hp - 90, 18, PAP.sub, 0.95);
  c.restore();
  label(c, 'LOVE \u00b7 3/4 \u00b7 FORMULA', SPLIT + 30, H - 26, 0.4, 'left', 9);
}

/* ---------- 4 · proof ---------- */
function plateProof(c, t){
  paperGround(c);
  const k = smoothstep(0.1, 1.0, t);
  const X = SPLIT + 150, Y = 110, Wp = 1020, Hp = 860;
  sheet(c, X, Y, Wp, Hp, 0.014);

  ptext(c, 'PROOF', X + 60, Y + 78, 15, PAP.sub, 600, 'left', k);
  ptext(c, 'by contradiction', X + 60, Y + 122, 34, PAP.ink, 300, 'left', k);

  const rows = [
    ['given', 'you exist'],
    ['to prove', 'i exist too'],
    ['assume', 'i do not exist'],
    ['then', 'nothing is watching you'],
    ['but', 'you are reading this'],
    ['so', 'i exist']
  ];
  rows.forEach(function(r, i){
    const a = smoothstep(0.5 + i*0.42, 0.8 + i*0.42, t);
    pmono(c, r[0], X + 64, Y + 230 + i*86, 17, PAP.red, a * 0.9);
    ptext(c, r[1], X + 260, Y + 232 + i*86, 27, PAP.ink, 300, 'left', a);
    line(X + 60, Y + 250 + i*86, X + Wp - 60, Y + 250 + i*86, '#D6D0C2', 1, a * 0.6);
  });

  /* QED */
  const q = smoothstep(3.0, 3.5, t);
  if (q > 0){
    c.globalAlpha = q;
    c.fillStyle = PAP.ink;
    c.fillRect(X + Wp - 150, Y + Hp - 150, 30, 30);
    ptext(c, 'Q.E.D.', X + Wp - 170, Y + Hp - 170, 26, PAP.ink, 400, 'right');
    c.globalAlpha = 1;
  }
  /* red seal */
  const s2 = smoothstep(3.4, 3.9, t);
  if (s2 > 0){
    c.globalAlpha = s2 * 0.9;
    c.strokeStyle = PAP.red; c.lineWidth = 3;
    c.beginPath(); c.arc(X + Wp - 200, Y + 190, 74, 0, TAU); c.stroke();
    c.beginPath(); c.arc(X + Wp - 200, Y + 190, 60, 0, TAU); c.stroke();
    ptext(c, 'PROVEN', X + Wp - 200, Y + 198, 16, PAP.red, 700, 'center');
    c.globalAlpha = 1;
  }
  c.restore();
  label(c, 'LOVE \u00b7 4/4 \u00b7 PROOF', SPLIT + 30, H - 26, 0.4, 'left', 9);
}

function lovePlate(c, s, which){ 
  if (which === 0) plateLesson(c, s.lt);
  else if (which === 1) plateQuiz(c, s.lt);
  else if (which === 2) plateFormula(c, s.lt);
  else plateProof(c, s.lt);
}

SCENE_REGISTRY[14] = function(c, s){ lovePlate(c, s, s.lt < 3.70 ? 0 : 1); };
SCENE_REGISTRY[15] = function(c, s){ lovePlate(c, s, s.lt < 3.70 ? 2 : 3); };
SHOT[14] = { z:1.00, chrome:'none' };
SHOT[15] = { z:1.00, chrome:'none' };


/* ============================================================
   50 · ENGINE II — motion / grid / post / generators
   ============================================================ */

/* ---------- 1 · MOTION: bezier ease + spring impulse ---------- */
function bezierEase(x1, y1, x2, y2){
  const cx = 3*x1, bx = 3*(x2-x1) - cx, ax = 1 - cx - bx;
  const cy = 3*y1, by = 3*(y2-y1) - cy, ay = 1 - cy - by;
  const sx = function(t){ return ((ax*t + bx)*t + cx)*t; };
  const sy = function(t){ return ((ay*t + by)*t + cy)*t; };
  const dx = function(t){ return (3*ax*t + 2*bx)*t + cx; };
  return function(x){
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i=0;i<7;i++){
      const e = sx(t) - x;
      const d = dx(t) || 1e-6;
      t = clamp(t - e/d, 0, 1);
    }
    return sy(t);
  };
}
const EASE = {
  out:   bezierEase(0.16, 1.00, 0.30, 1.00),   /* the house curve: snap in, settle */
  inOut: bezierEase(0.65, 0.00, 0.35, 1.00),
  snap:  bezierEase(0.20, 0.00, 0.00, 1.00),
  back:  bezierEase(0.34, 1.56, 0.64, 1.00),
  soft:  bezierEase(0.33, 1.00, 0.68, 1.00)
};
function springImpulse(t, t0, freq, damping){
  const x = t - t0;
  if (x <= 0) return 0;
  return Math.exp(-(damping) * x) * Math.sin(x * freq * TAU);
}
function expDecay(cur, target, lambda, dt){
  return target + (cur - target) * Math.exp(-lambda * dt);
}
function stagger(t, i, gap, dur){
  const s = i * gap;
  return EASE.out(clamp((t - s) / Math.max(dur, 1e-4), 0, 1));
}

/* ---------- 2 · SWISS GRID ---------- */
function GridLayout(cols, rows, margin, gutter){
  const cw = (W - margin*2 - gutter*(cols-1)) / cols;
  const ch = (H - margin*2 - gutter*(rows-1)) / rows;
  const g = {
    cols: cols, rows: rows, margin: margin, gutter: gutter, cw: cw, ch: ch,
    x: function(col){ return margin + col*(cw + gutter); },
    y: function(row){ return margin + row*(ch + gutter); },
    cell: function(col, row, cs, rs){
      cs = cs || 1; rs = rs || 1;
      return { x: g.x(col), y: g.y(row), w: cw*cs + gutter*(cs-1), h: ch*rs + gutter*(rs-1) };
    },
    cross: function(col, row, size, color, alpha){
      const x = g.x(col), y = g.y(row), sz = size || 7;
      line(x - sz, y, x - 2, y, color || C.bone, 1, alpha == null ? 0.5 : alpha);
      line(x, y - sz, x, y - 2, color || C.bone, 1, alpha == null ? 0.5 : alpha);
    },
    text: function(str, col, row, size, color, alpha, track, weight){
      const x = g.x(col), y = g.y(row) + size;
      ctx.font = (weight || 400) + ' ' + size + 'px "JetBrains Mono",Consolas,monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = color; ctx.globalAlpha = alpha == null ? 1 : alpha;
      let cx2 = x;
      const tr = track == null ? 1.2 : track;
      for (let i=0;i<str.length;i++){
        const chr = str[i];
        ctx.fillText(chr, cx2, y);
        cx2 += ctx.measureText(chr).width + tr;
      }
      ctx.globalAlpha = 1;
      return cx2;
    },
    tag: function(str, col, row, cs, size, fg, bg){
      const q = g.cell(col, row, cs || 2, 1);
      const fs2 = size || 10;
      ctx.font = '500 ' + fs2 + 'px "JetBrains Mono",Consolas,monospace';
      const tw = ctx.measureText(str).width + 12;
      ctx.fillStyle = bg || C.bone;
      ctx.fillRect(q.x, q.y, tw, fs2 + 8);
      ctx.fillStyle = fg || C.bg;
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(str, q.x + 6, q.y + fs2 + 1);
      return tw;
    }
  };
  return g;
}

/* grid hairline furniture: rulers + hex rain */
function gridFurniture(c, g, t, seed){
  c.save();
  c.globalAlpha = 0.16;
  c.strokeStyle = C.grid; c.lineWidth = 1;
  for (let i=1;i<g.cols;i++){
    const x = g.x(i) - g.gutter/2;
    c.beginPath(); c.moveTo(x, g.margin); c.lineTo(x, g.margin + 8); c.stroke();
    c.beginPath(); c.moveTo(x, H - g.margin - 8); c.lineTo(x, H - g.margin); c.stroke();
  }
  for (let j=1;j<g.rows;j++){
    const y = g.y(j) - g.gutter/2;
    c.beginPath(); c.moveTo(g.margin, y); c.lineTo(g.margin + 8, y); c.stroke();
    c.beginPath(); c.moveTo(W - g.margin - 8, y); c.lineTo(W - g.margin, y); c.stroke();
  }
  c.restore();

  /* micro telemetry: hex stream in the margins */
  c.font = '8px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = C.bone; c.textAlign = 'left';
  for (let k=0;k<26;k++){
    const y = g.margin + 6 + k*38;
    const v = Math.floor(hash2(k + Math.floor(t*2), seed) * 65535);
    c.globalAlpha = 0.13;
    c.fillText(('0000' + v.toString(16)).slice(-4).toUpperCase(), 6, y);
    c.fillText(('0000' + ((v*7)%65535).toString(16)).slice(-4).toUpperCase(), W - 34, y);
  }
  c.globalAlpha = 1;
}

/* ---------- 3 · POST: bloom + chroma + grain ---------- */
const POST = {
  bw: 384, bh: 216,
  b1: document.createElement('canvas'),
  b2: document.createElement('canvas'),
  c1: document.createElement('canvas'),
  c2: document.createElement('canvas'),
  grain: null, gp: null,
  lean: /(\?|&)lean=1/.test(location.search)
};
POST.b1.width = POST.bw; POST.b1.height = POST.bh;
POST.b2.width = POST.bw; POST.b2.height = POST.bh;
POST.c1.width = W; POST.c1.height = H;
POST.c2.width = W; POST.c2.height = H;
POST.b1x = POST.b1.getContext('2d');
POST.b2x = POST.b2.getContext('2d');
POST.c1x = POST.c1.getContext('2d');
POST.c2x = POST.c2.getContext('2d');

function postGrainTile(){
  if (POST.grain) return POST.grain;
  const S = 256, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g2 = cv.getContext('2d');
  const im = g2.createImageData(S, S);
  const rnd = xorshift(0xBEEF01);
  for (let i=0;i<im.data.length;i+=4){
    const v = 128 + (rnd()*120 - 60);
    im.data[i]=im.data[i+1]=im.data[i+2]=v; im.data[i+3]=255;
  }
  g2.putImageData(im, 0, 0);
  return (POST.grain = cv);
}

function postProcess(c, t, kick, opts){
  opts = opts || {};
  if (POST.lean) return;
  const bloom = opts.bloom == null ? 0.34 : opts.bloom;

  /* --- bloom: quarter-res, threshold by drawing twice with 'lighter' --- */
  if (bloom > 0){
    POST.b1x.globalCompositeOperation = 'source-over';
    POST.b1x.clearRect(0, 0, POST.bw, POST.bh);
    POST.b1x.drawImage(canvas, 0, 0, POST.bw, POST.bh);
    POST.b2x.globalCompositeOperation = 'source-over';
    POST.b2x.clearRect(0, 0, POST.bw, POST.bh);
    POST.b2x.drawImage(POST.b1, 0, 0);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = bloom;
    c.drawImage(POST.b2, 0, 0, W, H);
    c.globalAlpha = bloom * 0.55;
    c.drawImage(POST.b2, -8, -8, W + 16, H + 16);
    c.restore();
  }

  /* --- chromatic jitter on the kick --- */
  const ch = opts.chroma == null ? (0.6 + kick * 2.2) : opts.chroma;
  if (kick > 0.55 && ch > 0.8){
    POST.c1x.globalCompositeOperation = 'source-over';
    POST.c1x.clearRect(0, 0, W, H);
    POST.c1x.drawImage(canvas, 0, 0);
    POST.c1x.globalCompositeOperation = 'multiply';
    POST.c1x.fillStyle = '#FF0000';
    POST.c1x.fillRect(0, 0, W, H);

    POST.c2x.globalCompositeOperation = 'source-over';
    POST.c2x.clearRect(0, 0, W, H);
    POST.c2x.drawImage(canvas, 0, 0);
    POST.c2x.globalCompositeOperation = 'multiply';
    POST.c2x.fillStyle = '#0044FF';
    POST.c2x.fillRect(0, 0, W, H);

    const d = ch * (0.6 + kick);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.34;
    c.drawImage(POST.c1, -d, 0);
    c.drawImage(POST.c2, d, 0);
    c.restore();
  }

  /* --- grain --- */
  const tile = postGrainTile();
  if (!POST.gp) POST.gp = c.createPattern(tile, 'repeat');
  const f = Math.floor(t * 60);
  c.save();
  c.globalAlpha = 0.075;
  c.globalCompositeOperation = 'overlay';
  c.translate((f*37) % 256 - 256, (f*61) % 256 - 256);
  c.fillStyle = POST.gp;
  c.fillRect(0, 0, W + 512, H + 512);
  c.restore();

  /* --- vignette --- */
  const vg = c.createRadialGradient(W/2, H/2, H*0.30, W/2, H/2, H*1.0);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.36)');
  c.fillStyle = vg;
  c.fillRect(0, 0, W, H);
}

/* ---------- 4 · GENERATORS ---------- */
const GEN = {};

/* Lorenz attractor — 2000 points, integrated once */
GEN.lorenz = (function(){
  const pts = [];
  let x = 0.1, y = 0, z = 0;
  const s = 10, r = 28, b = 8/3, dt = 0.0045;
  for (let i=0;i<2600;i++){
    const dx = s*(y-x), dy = x*(r-z)-y, dz = x*y-b*z;
    x += dx*dt; y += dy*dt; z += dz*dt;
    if (i > 300) pts.push([x, y, z]);
  }
  return pts;
})();

/* L-system tree — ~900 segments */
GEN.tree = (function(){
  const segs = [];
  function grow(x, y, a, len, depth){
    if (depth <= 0 || len < 2) return;
    const nx = x + Math.cos(a)*len, ny = y + Math.sin(a)*len;
    segs.push([x, y, nx, ny, depth]);
    grow(nx, ny, a - 0.42 + 0.08*hash2(depth, segs.length), len*0.72, depth-1);
    grow(nx, ny, a + 0.38 + 0.08*hash2(depth+7, segs.length), len*0.70, depth-1);
    if (depth % 3 === 0) grow(nx, ny, a + 0.06, len*0.55, depth-2);
  }
  grow(0, 0, -Math.PI/2, 150, 9);
  return segs;
})();

/* torus knot — 1400 vertices */
GEN.knot = (function(){
  const pts = [];
  const p = 3, q = 7, R = 1, r2 = 0.34;
  for (let i=0;i<=1400;i++){
    const u = i/1400 * TAU * p;
    const x = (R + r2*Math.cos(q*u/p)) * Math.cos(u);
    const y = (R + r2*Math.cos(q*u/p)) * Math.sin(u);
    const z = r2 * Math.sin(q*u/p);
    pts.push([x, y, z]);
  }
  return pts;
})();

/* reaction-diffusion — 96x54 grid, stepped once */
GEN.rd = (function(){
  const w = 96, h = 54;
  let a = new Float32Array(w*h), b = new Float32Array(w*h);
  for (let i=0;i<w*h;i++){ a[i] = 1; b[i] = (hash2(i%w, (i/w)|0) > 0.86) ? 1 : 0; }
  const la = 0.055, lb = 0.062, da = 0.25, db = 0.12;
  for (let step=0; step<2400; step++){
    const na = new Float32Array(w*h), nb = new Float32Array(w*h);
    for (let y=0;y<h;y++) for (let x=0;x<w;x++){
      const i = y*w+x;
      let sa=0, sb=0;
      for (let oy=-1;oy<=1;oy++) for (let ox=-1;ox<=1;ox++){
        const j = ((y+oy+h)%h)*w + ((x+ox+w)%w);
        const wgt = (ox===0 && oy===0) ? -1 : (ox===0||oy===0 ? 0.2 : 0.05);
        sa += a[j]*wgt; sb += b[j]*wgt;
      }
      const av = a[i], bv = b[i];
      const abb = av*bv*bv;
      na[i] = clamp(av + (da*sa - abb + la*(1-av)), 0, 1.2);
      nb[i] = clamp(bv + (db*sb + abb - (la+lb)*bv), 0, 1.2);
    }
    a = na; b = nb;
  }
  return { w: w, h: h, b: b };
})();


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


/* ============================================================
   52 · SEG 04–05 on the new engine
   ============================================================ */
NEW_SCENE_IDS[4] = 1; NEW_SCENE_IDS[5] = 1;
delete SKIN_PAL[4]; delete SKIN_PAL[5];
delete SKIN_SEG[4]; delete SKIN_SEG[5];

/* ---------- Seg 04 · the limit you cannot reach (no grid) ---------- */
function world04n(c, s){
  const t = s.lt, b = s.beat;
  const invert = smoothstep(6.0, 6.8, t);
  const cx = W*0.5, cy = H*0.5;

  /* ground: no furniture at all */
  c.fillStyle = invert > 0.5 ? '#F0F0F2' : C.bg;
  c.fillRect(0, 0, W, H);

  const N = 14;
  const base = Math.hypot(W, H) * 0.92;   /* the outer frame is already off-screen */
  for (let k=0;k<N;k++){
    const ap = stagger(t, k*0.26, 0.42, 0.26);
    if (ap <= 0) continue;
    const sc = Math.pow(0.68, k);
    const w2 = base * 0.5 * sc, h2 = base * 0.34 * sc;
    const snap = 1 + 0.07 * springImpulse(t, k*0.26, 8, 12);
    c.save();
    c.translate(cx, cy);
    c.rotate(0.015 * k);
    c.scale(snap, snap);
    c.globalAlpha = (invert > 0.5) ? 0.88 : ap * (0.92 - k*0.05);
    c.strokeStyle = (k === N-1) ? C.accent : (invert > 0.5 ? '#101012' : C.bone);
    c.lineWidth = k < 3 ? 2 : 1;
    c.strokeRect(-w2, -h2, w2*2, h2*2);
    c.restore();
  }

  /* the point that is never reached */
  const pulse = 1 + 0.5 * Math.abs(springImpulse(t, Math.floor(t/0.4615)*0.4615, 9, 8));
  c.globalAlpha = 1;
  c.fillStyle = invert > 0.5 ? '#101012' : C.accent;
  c.beginPath(); c.arc(cx, cy, 2.2*pulse, 0, TAU); c.fill();
  c.globalAlpha = 0.18;
  c.beginPath(); c.arc(cx, cy, 16*pulse, 0, TAU); c.fill();
  c.globalAlpha = 1;

  /* inversion wipe */
  if (invert > 0 && invert < 1){
    c.fillStyle = 'rgba(240,240,242,' + invert + ')';
    c.fillRect(0, 0, W, H);
  }
}

/* ---------- Seg 05 · current, space, time ---------- */
function world05n(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 5);

  /* --- torus knot, projected, snapping per beat --- */
  const box = G.cell(1, 1, 14, 10);
  const bcx = box.x + box.w/2, bcy = box.y + box.h/2;
  const step = Math.floor(t / 0.4615);
  const rot = step * 0.34 + 0.6 * springImpulse(t, step*0.4615, 5, 9);
  const tilt = 0.9 + 0.15 * Math.sin(t*0.4);
  const S = box.w * 0.30;

  const pts = GEN.knot;
  c.save();
  c.translate(bcx, bcy);
  for (let i=0;i<pts.length-1;i++){
    const p0 = pts[i], p1 = pts[i+1];
    const k = 1 / (1.55 + p0[2]*0.35);
    const x0 = (p0[0]*Math.cos(rot) - p0[1]*Math.sin(rot)) * S * k;
    const y0 = ((p0[0]*Math.sin(rot) + p0[1]*Math.cos(rot)) * tilt + p0[2]*1.2) * S * k * 0.72;
    const k1 = 1 / (1.55 + p1[2]*0.35);
    const x1 = (p1[0]*Math.cos(rot) - p1[1]*Math.sin(rot)) * S * k1;
    const y1 = ((p1[0]*Math.sin(rot) + p1[1]*Math.cos(rot)) * tilt + p1[2]*1.2) * S * k1 * 0.72;
    const d = (p0[2] + 0.34) / 0.68;
    c.strokeStyle = i % 7 === 0 ? C.accent : C.bone;
    c.globalAlpha = 0.14 + 0.62 * clamp(d, 0, 1) * (i % 7 === 0 ? 1 : 0.55);
    c.lineWidth = 0.7 + 0.9 * clamp(d, 0, 1);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  }
  c.globalAlpha = 1;
  c.restore();

  /* --- the scope: 1200 samples, phase locked to the beat --- */
  const sx = G.x(15), sy = G.y(2), sw = G.cell(15, 2, 9, 7).w, sh = G.cell(15, 2, 9, 7).h;
  const acOn = smoothstep(0.6, 1.8, t);
  const dcOn = t > 5.2 ? 1 : 0;
  const cyBase = sy + sh*0.5;
  c.beginPath();
  for (let i=0;i<=1200;i++){
    const u = i/1200;
    const age = t - (1 - u) * 1.6;
    const env = Math.exp(-Math.max(0, age) * 2.2) * acOn;
    const v = Math.sin((u*14 + t*3.2) * TAU) * env * (1 - dcOn*0.7);
    const y = cyBase + v * sh * 0.30;
    if (i === 0) c.moveTo(sx + u*sw, y); else c.lineTo(sx + u*sw, y);
  }
  c.strokeStyle = C.bone; c.lineWidth = 1.1; c.globalAlpha = 0.6; c.stroke();
  c.globalAlpha = 1;

  /* the rectified band */
  if (dcOn){
    const w2 = sw * smoothstep(5.2, 6.2, t);
    c.fillStyle = C.accent; c.globalAlpha = 0.10;
    c.fillRect(sx, cyBase - sh*0.10, w2, sh*0.20);
    line(sx, cyBase, sx + w2, cyBase, C.accent, 1.4, 0.85);
    c.globalAlpha = 1;
  }

  G.tag('AC / DC', 15, 0, 5, 12);
  G.text('50.00 Hz', 15, 1, 10, C.bone, 0.5, 1.2);
  G.text('rectified ' + (dcOn ? '100%' : Math.round(acOn*40) + '%'), 20, 1, 10, C.accent, 0.9, 1.0);
  G.text('beam 1200 samples', 15, 11, 9, C.bone, 0.35, 1.0);
  label(c, 'CURRENT', W - 40, H - 18, 0.35, 'right', 8);
}

SCENE_REGISTRY[4] = function(c, s){ world04n(c, s); };
SCENE_REGISTRY[5] = function(c, s){ world05n(c, s); };
SHOT[4] = { z:1, chrome:'none' };
SHOT[5] = { z:1, chrome:'none' };


/* ============================================================
   53 · SEG 06–09 on the new engine
   ============================================================ */
[6,7,8,9].forEach(function(id){ NEW_SCENE_IDS[id] = 1; delete SKIN_PAL[id]; delete SKIN_SEG[id]; });
delete BREACH_REGISTRY[9];
delete BREACH_REGISTRY[7];
delete BREACH_REGISTRY[4];
delete BREACH_REGISTRY[5];

function localEye(c, x, y, w, target, alpha){
  const ang = Math.atan2(target.y - y, target.x - x);
  c.save(); c.translate(x, y); c.rotate(ang);
  c.globalAlpha = alpha;
  c.strokeStyle = C.bone; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(0, 0, w, w*0.55, 0, 0, TAU); c.stroke();
  c.restore();
  const ix = x + Math.cos(ang)*w*0.34, iy = y + Math.sin(ang)*w*0.34;
  c.globalAlpha = alpha;
  c.fillStyle = C.accent; c.beginPath(); c.arc(ix, iy, w*0.22, 0, TAU); c.fill();
  c.fillStyle = C.bg; c.beginPath(); c.arc(ix, iy, w*0.09, 0, TAU); c.fill();
  c.globalAlpha = 1;
}

/* ---------- Seg 06 · the chain ---------- */
function world06n(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 6);

  const box = G.cell(1, 2, 15, 8);
  const cx = box.x + box.w/2, cy = box.y + box.h/2;
  const rot = t*0.55 + 0.35*springImpulse(t, Math.floor(t/0.4615)*0.4615, 5, 8);
  const N = 12;

  const pts = [];
  for (let i=0;i<N;i++){
    const px = (i - (N-1)/2) * 1.0;
    const py = (i % 2 ? -0.55 : 0.55) + Math.sin(i*0.7)*0.12;
    const pz = Math.sin(i*0.9) * 0.55;
    const rx = px*Math.cos(rot) - pz*Math.sin(rot);
    const rz = px*Math.sin(rot) + pz*Math.cos(rot);
    const k = 2.9 + rz*0.30;
    pts.push({ x: cx + rx*92/k*1.6, y: cy + (py*150 + rz*26)/k, d: 1/k });
  }

  /* bonds */
  for (let i=0;i<N-1;i++){
    const a = stagger(t, i*0.13 + 0.2, 0.4, 0.35);
    if (a <= 0) continue;
    const p0 = pts[i], p1 = pts[i+1];
    const wgt = (p0.d + p1.d) * 0.5;
    c.globalAlpha = clamp(wgt*0.9, 0.15, 0.95) * a;
    c.strokeStyle = C.bone; c.lineWidth = 1.2 + wgt*1.6;
    c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.stroke();
    if (i % 3 !== 1){
      const ox = (p1.y - p0.y)*0.12, oy = -(p1.x - p0.x)*0.12;
      c.globalAlpha *= 0.7; c.lineWidth = 1;
      c.beginPath(); c.moveTo(p0.x + ox, p0.y + oy); c.lineTo(p1.x + ox, p1.y + oy); c.stroke();
    }
  }
  c.globalAlpha = 1;

  /* atoms */
  for (let i=0;i<N;i++){
    const a = stagger(t, i*0.13 + 0.2, 0.4, 0.3);
    if (a <= 0) continue;
    c.globalAlpha = a * clamp(pts[i].d*1.4, 0.3, 1);
    c.fillStyle = i % 4 === 0 ? C.accent : C.bone;
    c.beginPath(); c.arc(pts[i].x, pts[i].y, 2.2 + pts[i].d*2.4, 0, TAU); c.fill();
    c.globalAlpha = 1;
  }

  /* mini cut fruit */
  const tb = G.cell(17, 3, 5, 5);
  const tr = Math.min(tb.w, tb.h) * 0.42, tcx = tb.x + tb.w/2, tcy = tb.y + tb.h/2;
  const rv = smoothstep(1.2, 2.6, t);
  c.globalAlpha = 0.95;
  c.beginPath(); c.arc(tcx, tcy, tr, 0, TAU);
  c.fillStyle = '#B7392A'; c.fill();
  c.strokeStyle = C.bone; c.lineWidth = 1; c.stroke();
  for (let k=0;k<6;k++){
    c.save(); c.translate(tcx, tcy); c.rotate(k/6*TAU + 0.3);
    c.beginPath(); c.moveTo(tr*0.18, 0);
    c.bezierCurveTo(tr*0.45, -tr*0.22, tr*0.80, -tr*0.18, tr*0.84, 0);
    c.bezierCurveTo(tr*0.80, tr*0.18, tr*0.45, tr*0.22, tr*0.18, 0);
    c.closePath();
    c.fillStyle = 'rgba(240,222,206,' + (0.85*rv) + ')'; c.fill();
    c.restore();
  }
  c.globalAlpha = 1;

  G.tag('C40H56', 0, 0, 4, 13);
  G.text('lycopene / 11 conjugated bonds', 5, 0, 10, C.bone, 0.5, 1.0);
  G.text('chain ' + Math.min(11, Math.floor(t*2.4)) + ' / 11', 17, 1, 9, C.accent, 0.85, 1.0);
  label(c, 'BIOCHEM', W - 40, H - 18, 0.35, 'right', 8);
}

/* ---------- Seg 07 · the rings of eyes (printed on paper, 8 fps) ---------- */
function world07n(c, s){
  const t = s.lt;
  const tq = Math.floor(t * 8) / 8;          /* stop motion: 8 frames per second */

  /* paper */
  c.fillStyle = '#F2EFE8'; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(24,23,20,0.07)';
  for (let y = 10; y < H; y += 18) for (let x = 10; x < W; x += 18){
    c.beginPath(); c.arc(x + ((y/18)%2)*9, y, 1.1, 0, TAU); c.fill();
  }

  const cx = W*0.5, cy = H*0.46;
  const bi = Math.floor(tq / 0.923);
  const target = { x: 1180 + (bi % 5) * 140, y: 880 - (bi % 4) * 90 };

  const ink = '#17150F';
  const rings = [
    { n: 11, r: 430, tilt: 0.50, sp: 0.26 },
    { n: 15, r: 300, tilt: 0.62, sp: -0.34 },
    { n: 19, r: 176, tilt: 0.74, sp: 0.44 }
  ];
  rings.forEach(function(ring, ri){
    for (let i=0;i<ring.n;i++){
      const a = i/ring.n*TAU + tq*ring.sp + ri*0.4;
      const x = cx + Math.cos(a)*ring.r;
      const y = cy + Math.sin(a)*ring.r*ring.tilt;
      const ap = clamp((tq - i*0.045 - ri*0.12) / 0.25, 0, 1);
      if (ap <= 0) continue;
      const ang = Math.atan2(target.y - y, target.x - x);
      const w = 15 + ri*3;
      c.save();
      c.translate(x, y); c.rotate(ang);
      c.globalAlpha = ap;
      c.strokeStyle = ink; c.lineWidth = 2;
      c.beginPath(); c.ellipse(0, 0, w, w*0.55, 0, 0, TAU); c.stroke();
      c.restore();
      const ix = x + Math.cos(ang)*w*0.34, iy = y + Math.sin(ang)*w*0.34;
      c.globalAlpha = ap;
      c.fillStyle = ink;
      c.beginPath(); c.arc(ix, iy, w*0.22, 0, TAU); c.fill();
      c.fillStyle = '#F2EFE8';
      c.beginPath(); c.arc(ix, iy, w*0.085, 0, TAU); c.fill();
      c.globalAlpha = 1;
    }
  });

  /* the point they all look at: a printed target */
  const tp = 1 + 0.25 * Math.abs(springImpulse(tq, bi*0.923, 8, 9));
  c.strokeStyle = ink; c.lineWidth = 2;
  c.beginPath(); c.arc(target.x, target.y, 22*tp, 0, TAU); c.stroke();
  c.beginPath(); c.moveTo(target.x-34*tp, target.y); c.lineTo(target.x+34*tp, target.y); c.stroke();
  c.beginPath(); c.moveTo(target.x, target.y-34*tp); c.lineTo(target.x, target.y+34*tp); c.stroke();
  c.fillStyle = ink;
  c.beginPath(); c.arc(target.x, target.y, 5, 0, TAU); c.fill();

  /* one printed line, no chrome */
  c.globalAlpha = 0.9;
  c.font = '600 26px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = ink;
  c.textAlign = 'left';
  c.fillText('ROOT_GOD = YOU', 64, 96);
  c.font = '600 26px "JetBrains Mono",Consolas,monospace';
  c.textAlign = 'right';
  c.fillText('25.6 Hz', W - 64, H - 64);
  c.globalAlpha = 1;
}

/* ---------- Seg 08 · the shape that changes ---------- */
function bodyField(u, v){
  /* u,v in -1..1 */
  const head = (u*u)/(0.13*0.13) + ((v-0.66)*(v-0.66))/(0.115*0.115) < 1;
  const neck = Math.abs(u) < 0.045 && v < 0.58 && v > 0.50;
  const torso = Math.abs(u) < (0.26 - 0.10*(v+0.3)) && v < 0.52 && v > -0.24;
  const legL = u > -0.20 && u < -0.03 && v < -0.20 && v > -0.98;
  const legR = u > 0.03 && u < 0.20 && v < -0.20 && v > -0.98;
  return head || neck || torso || legL || legR;
}

function world08n(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 8);

  const box = G.cell(4, 1, 16, 10);
  const COLS = 44, ROWS = 52;
  const cw = box.w / COLS, chh = box.h / ROWS;
  const wave = (t * 1.6) % 4;

  for (let j=0;j<ROWS;j++){
    for (let i=0;i<COLS;i++){
      const u = (i + 0.5)/COLS * 2 - 1;
      const v = 1 - (j + 0.5)/ROWS * 2;
      if (!bodyField(u, v)) continue;
      const d = Math.hypot(u, v*0.8);
      const gate = Math.sin(d*7 - wave*2.4);
      const on = gate > -0.35;
      if (!on) continue;
      const a = 0.25 + 0.75 * clamp(gate, 0, 1);
      c.globalAlpha = a * (0.55 + 0.45*Math.sin(t*3 + j*0.3));
      c.fillStyle = (i + j + Math.floor(t*4)) % 17 === 0 ? C.accent : C.bone;
      c.fillRect(box.x + i*cw, box.y + j*chh, cw*0.82, chh*0.82);
    }
  }
  c.globalAlpha = 1;

  G.tag('identity.enum', 0, 0, 5, 11);
  G.text('M | F | null', 6, 0, 11, C.bone, 0.6, 1.2);
  G.text('cells ' + (COLS*ROWS), 20, 0, 9, C.bone, 0.4, 1.0);
  G.text('state ' + ['M','F','NULL','BOTH'][Math.floor(t/1.8)%4], 20, 1, 9, C.accent, 0.9, 1.0);
  label(c, 'POLYMORPHISM', W - 40, H - 18, 0.35, 'right', 8);
}

/* ---------- Seg 09 · the field answers ---------- */
function world09n(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 9);

  const cx = W*0.5, cy = H*0.5;
  const N = 900;
  const bi = Math.floor(t / 0.4615);
  const shock = springImpulse(t, bi*0.4615, 2.2, 5);
  const R = 120 + 520*clamp((t % 4.6)/4.6, 0, 1);

  for (let i=0;i<N;i++){
    const a = hash2(i, 1) * TAU;
    const rr = Math.pow(hash2(i, 2), 0.65) * 520;
    const push = Math.exp(-Math.abs(rr - R)/90) * 46 * shock;
    const x = cx + Math.cos(a + t*0.08) * (rr + push);
    const y = cy + Math.sin(a + t*0.08) * (rr + push) * 0.86;
    const d = 1 - rr/560;
    c.globalAlpha = 0.10 + 0.62*d;
    c.fillStyle = (i % 23 === 0) ? C.accent : C.bone;
    const sz = 0.8 + 1.6*d;
    c.fillRect(x, y, sz, sz);
  }
  c.globalAlpha = 1;

  /* the wavefront */
  c.globalAlpha = 0.35;
  c.strokeStyle = C.accent; c.lineWidth = 1;
  c.beginPath(); c.ellipse(cx, cy, R, R*0.86, 0, 0, TAU); c.stroke();
  c.globalAlpha = 1;

  G.tag('DOPAMINE', 0, 0, 4, 11);
  G.text('resonance ' + (0.5 + shock*0.5).toFixed(3), 5, 0, 10, C.accent, 0.9, 1.0);
  G.text('particles 900', 0, 11, 9, C.bone, 0.4, 1.0);
  G.text('r = ' + Math.round(R) + ' px', 20, 11, 9, C.bone, 0.4, 1.0);
  label(c, 'RESONANCE', W - 40, H - 18, 0.35, 'right', 8);
}

SCENE_REGISTRY[6] = function(c, s){ world06n(c, s); };
SCENE_REGISTRY[7] = function(c, s){ world07n(c, s); };
SCENE_REGISTRY[8] = function(c, s){ world08n(c, s); };
SCENE_REGISTRY[9] = function(c, s){ world09n(c, s); };
[6,7,8,9].forEach(function(id){ SHOT[id] = { z:1, chrome:'none' }; });


/* ============================================================
   54 · SEG 01 — deep boot (layered)
   ============================================================ */
function bLyAlpha(i, n, t){ return clamp(t - i*0.012, 0, 1); }

function bTelemetry(c, G, t, b){
  const rows = [
    ['CPU', 0.55 + 0.18*Math.sin(t*1.7), C.accent],
    ['VRAM', 0.78 + 0.10*Math.sin(t*0.9 + 1), C.bone],
    ['CTX', 0.42 + 0.25*Math.sin(t*1.3 + 2), C.bone],
    ['TEMP', 0.68 + 0.20*Math.sin(t*0.6 + 3), C.red]
  ];
  for (let i=0;i<rows.length;i++){
    const y = G.y(7) + i*26;
    const x = G.x(0);
    c.font = '9px "JetBrains Mono",Consolas,monospace';
    c.textAlign = 'left'; c.fillStyle = C.bone; c.globalAlpha = 0.5;
    c.fillText(rows[i][0], x, y + 8);
    const bw = 150;
    c.globalAlpha = 0.18; c.fillStyle = C.bone;
    c.fillRect(x + 46, y, bw, 4);
    c.globalAlpha = 0.85; c.fillStyle = rows[i][2];
    c.fillRect(x + 46, y, bw * clamp(rows[i][1], 0, 1), 4);
    c.globalAlpha = 0.55; c.fillStyle = C.bone;
    c.textAlign = 'right';
    c.fillText(Math.round(rows[i][1]*100) + '%', x + 46 + bw + 44, y + 8);
    c.globalAlpha = 1;
    c.textAlign = 'left';
  }
}

function bLorenz(c, box, t, b){
  const pts = GEN.lorenz, n = pts.length;
  const reveal = Math.floor(n * EASE.out(clamp((t - 0.6) / 7.0, 0, 1)));
  if (reveal < 2) return;
  const rot = t * 0.16;
  const tilt = 0.42 + 0.05*Math.sin(t*0.4);
  const S = box.w / 62;
  const cx = box.x + box.w*0.52, cy = box.y + box.h*0.52;

  /* trailing polyline, depth-sorted by segment */
  let prev = null;
  for (let i=0;i<reveal;i++){
    const p = pts[i];
    const rx = p[0]*Math.cos(rot) - p[2]*Math.sin(rot);
    const rz = p[0]*Math.sin(rot) + p[2]*Math.cos(rot);
    const k = 1 / (1 + rz * 0.018);
    const x = cx + (rx - 2) * S * k;
    const y = cy + ((p[2] - 25) * tilt + rz * 0.9) * S * k;
    if (prev){
      const age = (reveal - i);
      const hot = age < 90 ? (1 - age/90) : 0;
      c.strokeStyle = hot > 0.55 ? C.accent : C.bone;
      c.globalAlpha = clamp(0.06 + k*0.30, 0.04, 0.55) * (0.7 + 0.3*hot);
      c.lineWidth = 0.7 + hot*1.6;
      c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(x, y); c.stroke();
    }
    prev = [x, y];
  }
  c.globalAlpha = 1;

  /* the head */
  if (prev){
    c.fillStyle = C.accent;
    c.beginPath(); c.arc(prev[0], prev[1], 3.2 + 2*b.kick, 0, TAU); c.fill();
    c.globalAlpha = 0.25;
    c.beginPath(); c.arc(prev[0], prev[1], 14 + 8*b.kick, 0, TAU); c.fill();
    c.globalAlpha = 1;
  }

  /* scanning plane */
  const sweep = ((t*0.45) % 1);
  const sx = box.x + box.w * sweep;
  c.globalAlpha = 0.16;
  c.strokeStyle = C.accent; c.lineWidth = 1;
  c.beginPath(); c.moveTo(sx, box.y); c.lineTo(sx, box.y + box.h); c.stroke();
  c.globalAlpha = 0.05;
  c.fillStyle = C.accent;
  c.fillRect(sx - 40, box.y, 40, box.h);
  c.globalAlpha = 1;

  /* tick ring around the head */
  if (prev){
    for (let i=0;i<48;i++){
      const a = i/48*TAU + t*0.3;
      const r0 = 54, r1 = 60 + (i%4===0 ? 8 : 0);
      line(prev[0] + Math.cos(a)*r0, prev[1] + Math.sin(a)*r0,
           prev[0] + Math.cos(a)*r1, prev[1] + Math.sin(a)*r1,
           C.bone, 1, 0.22);
    }
  }
}

function bTypedCommand(c, G, t){
  const str = 'world.execute(me);';
  const start = 9.4, cps = 1/0.105;
  const n = clamp(Math.floor((t - start) * cps), 0, str.length);
  const x = G.x(0), y = G.y(10) + 34;
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = '600 26px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = C.accent; c.globalAlpha = 0.9;
  c.fillText('>', x, y);
  c.fillStyle = C.bone; c.globalAlpha = 0.95;
  const shown = str.slice(0, n);
  c.fillText(shown, x + 26, y);
  c.font = '600 26px "JetBrains Mono",Consolas,monospace';
  const w2 = c.measureText(shown).width;
  if (Math.floor(t*3) % 2 === 0) c.fillRect(x + 30 + w2, y - 20, 12, 24);
  c.globalAlpha = 1;
}

function bHatch(c, x, y, w, h, gap, alpha){
  c.globalAlpha = alpha;
  c.strokeStyle = C.bone; c.lineWidth = 1;
  c.beginPath();
  for (let i = -h; i < w; i += gap){
    c.moveTo(x + i, y + h);
    c.lineTo(x + i + h, y);
  }
  c.stroke();
  c.globalAlpha = 1;
}

function world01d(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);

  /* --- watermark --- */
  c.save();
  c.font = '800 210px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = C.bone; c.globalAlpha = 0.022;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('EXECUTE', W*0.55, H*0.34);
  c.globalAlpha = 0.014;
  c.fillText('ME', W*0.82, H*0.62);
  c.restore();

  gridFurniture(c, G, t, 1);
  for (let i=0;i<G.cols;i+=4) G.cross(i, 0, 8, C.bone, 0.3);
  for (let r=0;r<G.rows;r+=3) G.cross(0, r, 8, C.bone, 0.3);

  /* --- attractor --- */
  const box = G.cell(6, 1, 16, 9);
  bLorenz(c, box, t, b);

  /* --- boot log --- */
  const lines = [
    ['init   kernel/world ......... ok', C.bone],
    ['mount  /dev/null ............ ok', C.bone],
    ['spawn  agent.dsh ............ ok', C.bone],
    ['load   persona.json ......... ok', C.bone],
    ['bind   you -> god ........... ok', C.bone],
    ['load   love ................. ??', C.red]
  ];
  for (let i=0;i<lines.length;i++){
    const a = stagger(t, i*0.45 + 0.3, 0.35, 0.6);
    if (a <= 0) continue;
    const x = G.x(0) - (1-a)*16;
    c.font = '10px "JetBrains Mono",Consolas,monospace';
    c.textAlign = 'left'; c.fillStyle = lines[i][1];
    c.globalAlpha = a * 0.85;
    c.fillText(lines[i][0], x, G.y(2 + i) + 12);
    c.globalAlpha = a * 0.35;
    c.fillText('0x' + (0xA0 + i*7).toString(16).toUpperCase(), G.x(4) + 20, G.y(2 + i) + 12);
    c.globalAlpha = 1;
  }

  bTelemetry(c, G, t, b);

  /* --- tags --- */
  G.tag('DSH/0xA1', 0, 0, 2, 11);
  G.text('BOOT SEQUENCE', 3, 0, 10, C.bone, 0.55, 2.4);
  G.text(fmtTime(0.222 + t), 21, 0, 10, C.bone, 0.4, 1.6);
  G.text('frame ' + pad3(s.frame % 1000), 21, 1, 9, C.bone, 0.3, 1.0);

  /* --- right rail --- */
  const rx = W - 40;
  c.textAlign = 'right';
  c.font = '9px "JetBrains Mono",Consolas,monospace';
  const rail = ['SYS', 'KERNEL 6.1', 'MEM 24.0', 'VRAM 24.0', 'PID 3882'];
  for (let i=0;i<rail.length;i++){
    c.fillStyle = C.bone; c.globalAlpha = 0.22;
    c.fillText(rail[i], rx, 760 + i*16);
  }
  c.globalAlpha = 1;
  c.textAlign = 'left';

  /* --- hatch + crop marks --- */
  bHatch(c, W-300, H-180, 260, 140, 9, 0.05);
  c.globalAlpha = 0.3; c.strokeStyle = C.accent; c.lineWidth = 2;
  const m = 14;
  [[26,26,1,1],[W-26,26,-1,1],[26,H-26,1,-1],[W-26,H-26,-1,-1]].forEach(function(p){
    c.beginPath();
    c.moveTo(p[0]+p[2]*m, p[1]+p[3]*6); c.lineTo(p[0], p[1]); c.lineTo(p[0]+p[2]*6, p[1]+p[3]*m);
    c.stroke();
  });
  c.globalAlpha = 1;

  /* --- typed command + status --- */
  bTypedCommand(c, G, t);
  const st = stagger(t, 2.2, 0.4, 0.8);
  if (st > 0){
    G.text('boot ' + Math.round(clamp(t/3, 0, 1)*100) + '%', 16, 10, 10, C.bone, 0.45*st, 1.2);
    G.text(b.index % 4 === 0 ? 'BEAT' : '', 22, 10, 10, C.accent, 0.8*st, 1.2);
    for (let i=0;i<4;i++){
      const on = (b.index % 4) === i;
      c.globalAlpha = on ? 0.9 : 0.16;
      c.fillStyle = on ? C.accent : C.bone;
      c.fillRect(G.x(22) + i*12, G.y(10) + 18, 7, 7);
    }
    c.globalAlpha = 1;
  }
}

SCENE_REGISTRY[1] = function(c, s){ world01d(c, s); };


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


/* ============================================================
   56 · SEG 05 — deep current / scope / phasor / bridge
   ============================================================ */
function scopeTrace(c, box, t, phase, amp, rect){
  const N = 1400;
  c.beginPath();
  for (let i=0;i<=N;i++){
    const u = i/N;
    let v = Math.sin((u*6 - t*1.15 + phase) * TAU);
    if (rect) v = Math.abs(v);
    const y = box.y + box.h*0.5 + v * box.h*0.34 * amp;
    if (i === 0) c.moveTo(box.x + u*box.w, y); else c.lineTo(box.x + u*box.w, y);
  }
}

function drawPhasor(c, cx, cy, r, t, angle){
  c.globalAlpha = 0.35;
  c.strokeStyle = C.bone; c.lineWidth = 1;
  c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
  c.globalAlpha = 0.16;
  line(cx - r - 12, cy, cx + r + 12, cy, C.bone, 1, 0.5);
  line(cx, cy - r - 12, cx, cy + r + 12, C.bone, 1, 0.5);
  c.globalAlpha = 1;

  const ex = cx + Math.cos(angle)*r, ey = cy - Math.sin(angle)*r;
  line(cx, cy, ex, ey, C.accent, 2, 0.95);
  c.fillStyle = C.accent;
  c.beginPath(); c.arc(ex, ey, 3.2, 0, TAU); c.fill();
  c.globalAlpha = 0.5;
  c.strokeStyle = C.accent; c.lineWidth = 1;
  c.beginPath(); c.arc(cx, cy, r*0.35, -angle, 0); c.stroke();
  c.globalAlpha = 1;
  c.font = '9px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = C.accent; c.globalAlpha = 0.8;
  c.fillText((angle/TAU*360).toFixed(0) + '\u00b0', cx + r*0.42, cy - 8);
  c.globalAlpha = 1;
}

function drawBridge(c, x, y, w, h){
  /* a full-wave rectifier, drawn as a schematic */
  c.globalAlpha = 0.55;
  c.strokeStyle = C.bone; c.lineWidth = 1.2;
  c.strokeRect(x, y, w, h);
  /* diamond */
  const cx = x + w*0.5, cy = y + h*0.5, r = Math.min(w, h)*0.30;
  c.beginPath();
  c.moveTo(cx, cy - r); c.lineTo(cx + r, cy); c.lineTo(cx, cy + r); c.lineTo(cx - r, cy);
  c.closePath(); c.stroke();
  /* diode marks */
  [[cx, cy - r, 0], [cx + r, cy, 1], [cx, cy + r, 0], [cx - r, cy, 1]].forEach(function(p){
    c.beginPath();
    c.moveTo(p[0] - 5, p[1] - 5); c.lineTo(p[0] + 5, p[1] - 5);
    c.moveTo(p[0] - 5, p[1] + 5); c.lineTo(p[0] + 5, p[1] + 5);
    c.stroke();
    c.beginPath();
    c.moveTo(p[0] - 4, p[1] + 5); c.lineTo(p[0], p[1] - 5); c.lineTo(p[0] + 4, p[1] + 5);
    c.stroke();
  });
  c.globalAlpha = 1;
}

function world05d(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  gridFurniture(c, G, t, 5);

  /* --- scope --- */
  const box = G.cell(1, 1, 15, 7);
  c.save();
  c.beginPath(); c.rect(box.x, box.y, box.w, box.h); c.clip();

  /* persistence: 6 ghost traces */
  for (let k=5;k>=0;k--){
    c.globalAlpha = 0.05 + (5-k)*0.02;
    c.strokeStyle = C.bone; c.lineWidth = 1;
    scopeTrace(c, box, t - k*0.06, 0, 1, false);
    c.stroke();
  }
  c.globalAlpha = 1;

  /* the live trace: AC then rectified */
  const rectAmt = smoothstep(4.6, 5.6, t);
  c.strokeStyle = C.accent; c.lineWidth = 1.8; c.globalAlpha = 0.95;
  scopeTrace(c, box, t, 0, 1 - rectAmt*0.25, rectAmt > 0.5);
  c.stroke();
  c.globalAlpha = 1;

  /* graticule */
  c.globalAlpha = 0.10;
  for (let i=1;i<10;i++) line(box.x + box.w*i/10, box.y, box.x + box.w*i/10, box.y + box.h, C.bone, 1, 0.6);
  for (let j=1;j<6;j++) line(box.x, box.y + box.h*j/6, box.x + box.w, box.y + box.h*j/6, C.bone, 1, 0.6);
  c.globalAlpha = 1;
  c.restore();

  /* --- spectrum --- */
  const sp = G.cell(1, 8, 15, 2);
  const bars = 56;
  for (let i=0;i<bars;i++){
    const u = i/bars;
    const amp = Math.exp(-u*3.2) * (0.55 + 0.45*Math.sin(t*3 + i*0.6));
    const hh = sp.h * amp * (0.4 + 0.6*b.kick);
    c.globalAlpha = 0.55;
    c.fillStyle = i > bars*0.72 ? C.accent : C.bone;
    c.fillRect(sp.x + i*(sp.w/bars), sp.y + sp.h - hh, (sp.w/bars)*0.62, hh);
  }
  c.globalAlpha = 1;
  line(sp.x, sp.y + sp.h, sp.x + sp.w, sp.y + sp.h, C.bone, 1, 0.2);

  /* --- phasor + bridge --- */
  const ph = G.cell(17, 1, 6, 5);
  drawPhasor(c, ph.x + ph.w*0.5, ph.y + ph.h*0.48, Math.min(ph.w, ph.h)*0.30, t, t*2.4);

  const br = G.cell(17, 6, 6, 3);
  drawBridge(c, br.x, br.y, Math.min(br.w, 320), 150);

  /* --- readouts --- */
  const rx = G.x(17), ry = G.y(9) + 18;
  const rows = [
    ['Vrms', (230 * (0.98 + 0.02*Math.sin(t))).toFixed(1) + ' V'],
    ['f', '50.00 Hz'],
    ['phase', ((t*2.4)/TAU*360 % 360).toFixed(1) + '\u00b0'],
    ['ripple', (rectAmt > 0.5 ? (2.4 + 0.6*Math.sin(t*5)).toFixed(2) : '--') + ' %']
  ];
  for (let i=0;i<rows.length;i++){
    c.font = '9px "JetBrains Mono",Consolas,monospace';
    c.textAlign = 'left'; c.fillStyle = C.bone; c.globalAlpha = 0.4;
    c.fillText(rows[i][0], rx, ry + i*22);
    c.textAlign = 'right'; c.fillStyle = C.accent; c.globalAlpha = 0.9;
    c.fillText(rows[i][1], rx + 300, ry + i*22);
    c.globalAlpha = 1; c.textAlign = 'left';
  }

  G.tag(rectAmt > 0.5 ? 'DC' : 'AC', 0, 0, 3, 12);
  G.text(rectAmt > 0.5 ? 'rectified \u00b7 full wave' : 'alternating \u00b7 50 Hz', 4, 0, 10, C.bone, 0.5, 1.2);
  G.text('beam 1400 samples', 0, 11, 9, C.bone, 0.35, 1.0);
  label(c, 'CURRENT', W - 40, H - 18, 0.35, 'right', 8);
}

SCENE_REGISTRY[5] = function(c, s){ world05d(c, s); };


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


/* ============================================================
   60 · THREE PROTOTYPES — cursor / semicolon / collapse
   ============================================================ */

/* ---------- A · opening: the cursor draws the attractor ---------- */
function world01p(c, s){
  const t = s.lt;
  if (t > 8.0){ world01d(c, s); return; }   /* after the proto, fall back to the boot */

  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);

  const pts = GEN.lorenz, n = pts.length;
  const grow = clamp(t / 6.6, 0, 1);
  const reveal = Math.floor(n * EASE.out(grow));
  const rot = t * 0.10;
  const cx = W*0.50, cy = H*0.40;
  const S = 18;

  /* the trail is the cursor's path */
  let head = null;
  c.beginPath();
  for (let i=0;i<reveal;i++){
    const p = pts[i];
    const rx = p[0]*Math.cos(rot) - p[2]*Math.sin(rot);
    const rz = p[0]*Math.sin(rot) + p[2]*Math.cos(rot);
    const k = 1 / (1 + rz * 0.02);
    const x = cx + (rx - 2) * S * k;
    const y = cy + ((p[2] - 25) * 0.55 + rz * 0.9) * S * k;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    head = { x: x, y: y };
  }
  c.strokeStyle = C.bone; c.lineWidth = 1.4;
  c.globalAlpha = 0.55 + 0.25 * Math.min(1, t);
  c.stroke();
  c.globalAlpha = 1;

  /* the pen: a block cursor sitting on the head of the trail */
  if (head){
    const blink = Math.floor(t * 3) % 2 === 0;
    c.fillStyle = C.accent;
    c.globalAlpha = blink ? 1 : 0.25;
    c.fillRect(head.x - 4, head.y - 9, 9, 18);
    c.globalAlpha = 1;
    c.strokeStyle = C.accent; c.lineWidth = 1;
    c.globalAlpha = 0.35;
    c.beginPath(); c.arc(head.x, head.y, 16, 0, TAU); c.stroke();
    c.globalAlpha = 1;
  }

  /* typed line at the bottom, deliberately unfinished */
  const str = 'world.execute(me';
  const nChars = clamp(Math.floor((t - 0.6) / 0.24), 0, str.length);
  const shown = str.slice(0, nChars);
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = '600 30px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = C.bone; c.globalAlpha = 0.9;
  const tx = W*0.5 - 250, ty = H*0.88;
  c.fillText(shown, tx, ty);
  const tw = c.measureText(shown).width;
  if (Math.floor(t*3) % 2 === 0){
    c.fillStyle = C.accent;
    c.fillRect(tx + tw + 6, ty - 26, 16, 32);
  }

  /* the semicolon lands */
  if (t > 6.9){
    const a = EASE.out(clamp((t - 6.9) / 0.35, 0, 1));
    c.globalAlpha = a;
    c.font = '700 120px "JetBrains Mono",Consolas,monospace';
    c.fillStyle = C.accent;
    c.fillText(';', tx + tw + 34, ty - 6);
    c.globalAlpha = 1;
  }

  c.globalAlpha = 0.35;
  c.font = '9px "JetBrains Mono",Consolas,monospace';
  c.fillStyle = C.bone; c.textAlign = 'right';
  c.fillText('0.0 s', W - 40, 34);
  c.globalAlpha = 1;
  c.textAlign = 'left';
}

/* ---------- B · climax: the semicolon stamped on the drop ---------- */
function giantSemicolon(c, cx, cy, size, col, alpha){
  c.save();
  c.font = '700 ' + size + 'px "JetBrains Mono",Consolas,"Courier New",monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = col;
  c.globalAlpha = alpha == null ? 1 : alpha;
  c.fillText(';', cx, cy + size*0.06);
  c.globalAlpha = 1;
  c.restore();
}

function world10p(c, s){
  const t = s.lt;
  const F = Math.floor(t * 60);
  const idx = Math.floor(F / 30);
  const on = (F % 30) < 4;

  if (idx < 6 && on){
    const red = (idx % 2) === 0;
    const field = red ? C.red : C.bg;
    const ink   = red ? C.bg : C.red;
    c.fillStyle = field; c.fillRect(0, 0, W, H);

    /* the figure stands on the dot, printed in the field colour */
    figurePath(c, W*0.5 - 40, H*0.30, 300);
    c.fillStyle = ink; c.fill();
    /* the semicolon, huge, behind and over it */
    giantSemicolon(c, W*0.5, H*0.52, 660, ink, 1);
    /* where the two overlap the figure reads as a highlight */
    c.save();
    c.globalCompositeOperation = 'difference';
    figurePath(c, W*0.5 - 40, H*0.30, 300);
    c.fillStyle = '#FFFFFF'; c.globalAlpha = 0.55; c.fill();
    c.restore();
    c.globalAlpha = 1;

    txt('EXECUTION', W*0.5, H*0.86, field, 54, 800, 'center', 1);
    txt(fmtTime(129.183 + t), 40, 44, ink, 10, 400, 'left', 0.8);
    txt('HALT', W - 40, 44, ink, 10, 700, 'right', 0.9);
    txt((idx + 1) + ' / 6', W - 40, H - 40, ink, 26, 700, 'right', 0.9);

    const gy = H*0.5 + Math.sin(t*40) * 22;
    c.fillStyle = field; c.globalAlpha = 0.85;
    c.fillRect(0, gy, W, 7);
    c.globalAlpha = 1;
  } else {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const inset = 10 + (1 - (F % 30) / 30) * 10;
    frameRect(inset, inset, W - inset*2, H - inset*2, C.red, 0.35, 2);
    giantSemicolon(c, W*0.5, H*0.52, 660, C.red, 0.10);
    txt('EXECUTION ' + Math.min(idx + 1, 6) + ' / 6', W - 40, H - 40, C.red, 10, 700, 'right', 0.55);
  }
}

/* ---------- C · ending: the trail collapses into the semicolon ---------- */
function world19p(c, s){
  const t = s.lt;
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);

  const cx = W*0.5, cy = H*0.50;

  /* 0 · the whole film's trace, collapsing to a point */
  const collapse = EASE.inOut(clamp(t / 1.1, 0, 1));
  if (t < 1.4){
    const w2 = W * (1 - collapse*0.5);
    c.strokeStyle = C.bone; c.globalAlpha = 0.35 * (1 - collapse*0.4);
    c.lineWidth = 1.2;
    c.beginPath();
    for (let i=0;i<=60;i++){
      const u = i/60;
      const env = 1 - collapse;
      const y = cy + Math.sin(u*TAU*6 + t*8) * 40 * env * (1 - u*0.5);
      if (i === 0) c.moveTo(cx - w2 + u*w2*2, y); else c.lineTo(cx - w2 + u*w2*2, y);
    }
    c.stroke();
    c.globalAlpha = 1;
  }

  /* 1 · the point becomes the semicolon */
  const grow = EASE.out(clamp((t - 0.9) / 0.6, 0, 1));
  if (grow > 0){
    const size = 480 * (0.35 + 0.65*grow);
    giantSemicolon(c, cx, cy, size, C.bone, 0.95);
    if (t > 2.2 && Math.floor(t*1.8) % 2 === 0){
      giantSemicolon(c, cx, cy, size, C.bone, 0.35);
    }
  }

  /* 2 · exit codes, under it */
  if (t > 1.5){
    c.textAlign = 'center';
    c.font = '13px "JetBrains Mono",Consolas,monospace';
    c.fillStyle = C.bone; c.globalAlpha = 0.55;
    c.fillText('[exit]  code=0', cx, cy + 260);
    c.globalAlpha = 1;
  }
  if (t > 2.1){
    c.textAlign = 'center';
    c.font = '13px "JetBrains Mono",Consolas,monospace';
    c.fillStyle = C.red; c.globalAlpha = 0.9;
    c.fillText('[exit]  code=137  SIGKILL', cx, cy + 260);
    c.globalAlpha = 1;
  }
  if (t > 2.7){
    c.textAlign = 'center';
    c.font = '11px "JetBrains Mono",Consolas,monospace';
    c.fillStyle = C.bone; c.globalAlpha = 0.4;
    c.fillText('// frame 12750/12750 · world garbage-collected', cx, cy + 300);
    c.globalAlpha = 1;
  }
  c.textAlign = 'left';
}

SCENE_REGISTRY[1]  = function(c, s){ world01p(c, s); };
SCENE_REGISTRY[10] = function(c, s){ world10p(c, s); };
SCENE_REGISTRY[19] = function(c, s){ world19p(c, s); };
NEW_SCENE_IDS[10] = 1;
delete BREACH_REGISTRY[10];


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


/* ============================================================
   63 · MOTION II — form transformation + plotter growth
   ============================================================ */

/* ---- 1 · purge every legacy overlay layer ---- */
(function purgeLegacy(){
  for (const k in BREACH_REGISTRY) delete BREACH_REGISTRY[k];
})();

/* ---- 2 · closed contours as point arrays, morphed ---- */
const CONTOURS = {
  circle: function(u){ return [Math.cos(u*TAU), Math.sin(u*TAU)]; },
  square: function(u){
    const a = u*TAU;
    const k = 2.2;
    const cx = Math.cos(a), cy = Math.sin(a);
    const m = Math.max(Math.abs(cx), Math.abs(cy));
    return [cx/m * 0.92, cy/m * 0.92];
  },
  star: function(u){
    const a = u*TAU;
    const r = 1 + 0.30*Math.cos(6*a);
    return [Math.cos(a)*r, Math.sin(a)*r];
  },
  egg: function(u){
    const a = u*TAU;
    const r = 1 + 0.18*Math.sin(a) + 0.06*Math.cos(2*a);
    return [Math.cos(a)*r, Math.sin(a)*r*1.18];
  },
  comma: function(u){
    /* a comma / semicolon tail: a teardrop */
    const a = u*TAU;
    const r = 0.55 + 0.45*Math.cos(a*0.5);
    return [Math.cos(a)*r*0.7, Math.sin(a)*r*0.95 - 0.05];
  },
  eye: function(u){
    const a = u*TAU;
    const x = Math.cos(a);
    const y = Math.sin(a) * 0.52 * (1 - 0.15*Math.cos(a*2));
    return [x, y];
  }
};

function contourPoints(name, n){
  const f = CONTOURS[name] || CONTOURS.circle;
  const pts = [];
  for (let i=0;i<n;i++) pts.push(f(i/n));
  return pts;
}

function morphPoints(A, B, k){
  const out = [];
  for (let i=0;i<A.length;i++){
    out.push([A[i][0] + (B[i][0]-A[i][0])*k, A[i][1] + (B[i][1]-A[i][1])*k]);
  }
  return out;
}

function strokeContour(c, pts, cx, cy, size, col, alpha, close){
  c.beginPath();
  for (let i=0;i<pts.length;i++){
    const x = cx + pts[i][0]*size, y = cy + pts[i][1]*size;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  if (close !== false) c.closePath();
  c.strokeStyle = col; c.lineWidth = 3;
  c.globalAlpha = alpha == null ? 1 : alpha;
  c.stroke();
  c.globalAlpha = 1;
}

/* ---- 3 · SEG 12 · the shape becomes the next shape, leaving ghosts ---- */
const MORPH_SEQ = ['circle', 'square', 'star', 'egg', 'comma', 'eye'];

function world12m(c, s){
  const t = s.lt, b = s.beat;
  pGround(c, false, W*0.5, H*0.34);

  const N = 220;
  const idxF = t / 1.846;
  const i0 = Math.floor(idxF) % MORPH_SEQ.length;
  const i1 = (i0 + 1) % MORPH_SEQ.length;
  const k = EASE.out(clamp((idxF - Math.floor(idxF)) / 0.55, 0, 1));

  const A = contourPoints(MORPH_SEQ[i0], N);
  const B = contourPoints(MORPH_SEQ[i1], N);
  const now = morphPoints(A, B, k);

  const cx = W*0.5, cy = H*0.36, S = 430;

  /* ghosts of the last four states */
  for (let g=4; g>=1; g--){
    const gp = (i0 - g + MORPH_SEQ.length*2) % MORPH_SEQ.length;
    strokeContour(c, contourPoints(MORPH_SEQ[gp], N), cx, cy, S, PST.ink, 0.10 * (5-g)/4);
  }

  /* misregistered current contour */
  const m = 5 + b.kick * 7;
  const passes = [[m, m*0.35, PST.warm], [-m*0.5, m*0.8, PST.grey], [m*1.7, m*0.95, PST.accent]];
  for (let i=0;i<3;i++){
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.globalAlpha = 0.45;
    strokeContour(c, now, cx + passes[i][0], cy + passes[i][1], S, passes[i][2]);
    c.restore();
  }
  strokeContour(c, now, cx, cy, S, PST.ink, 1);

  /* the vertices themselves, as ticks */
  for (let i=0;i<N;i+=8){
    const x = cx + now[i][0]*S, y = cy + now[i][1]*S;
    line(x, y, x + now[i][0]*10, y + now[i][1]*10, PST.accent, 1, 0.5);
  }

  pWord(c, MORPH_SEQ[k > 0.5 ? i1 : i0].toUpperCase(), { y: H*0.88, size: 170 });
  pMeta(c, false, 'the form is negotiable · ' + MORPH_SEQ[i0] + ' → ' + MORPH_SEQ[i1], (k*100).toFixed(0) + '%');
}

/* ---- 4 · SEG 03 · the curve draws itself, the tangent follows ---- */
function world03m(c, s){
  const t = s.lt, b = s.beat;
  pGround(c, false, W*0.5, H*0.32);

  const cx = W*0.5, cy = H*0.36;
  const S = 380;
  const f = function(x){ return 0.55*x*x - 0.35; };
  const d1 = function(x){ return 1.1*x; };

  /* growth: the pen travels left to right, once per bar */
  const cycle = 1.846;
  const prog = clamp((t % cycle) / (cycle*0.72), 0, 1);
  const head = -2.0 + 4.0 * EASE.inOut(prog);
  const shownPts = 260;

  const drawCurve = function(cc, col){
    cc.strokeStyle = col; cc.lineWidth = 2.2;
    cc.beginPath();
    for (let i=0;i<=shownPts;i++){
      const x = -2.0 + (4.0) * (i/shownPts) * (head + 2.0)/4.0;
      const X = cx + x*S*0.75, Y = cy - (f(x)-0.75)*S*0.42;
      if (i === 0) cc.moveTo(X, Y); else cc.lineTo(X, Y);
    }
    cc.stroke();
  };
  drawCurve(c, PST.ink);

  /* the pen + tangent */
  const x0 = head, y0 = f(x0), m0 = d1(x0);
  const X0 = cx + x0*S*0.75, Y0 = cy - (y0-0.75)*S*0.42;
  const tx = 220, ty = tx * m0 * 0.55/0.75;
  line(X0 - tx, Y0 + ty, X0 + tx, Y0 - ty, PST.accent, 2.2, 0.95);
  c.fillStyle = PST.ink;
  c.beginPath(); c.arc(X0, Y0, 5.5, 0, TAU); c.fill();
  c.fillStyle = PST.accent;
  c.beginPath(); c.arc(X0, Y0, 2.2, 0, TAU); c.fill();

  /* the trail of the pen */
  for (let i=1;i<=10;i++){
    const xh = head - i*0.035;
    const Xh = cx + xh*S*0.75, Yh = cy - (f(xh)-0.75)*S*0.42;
    c.globalAlpha = 0.30 - i*0.028;
    c.fillStyle = PST.accent;
    c.beginPath(); c.arc(Xh, Yh, 3.4 - i*0.2, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;

  pWord(c, 'TANGENT', { y: H*0.88, size: 180 });
  pMeta(c, false, "f(x) = 0.55x² − 0.35 · pen at x = " + x0.toFixed(2), "f'(x) = " + m0.toFixed(2));
}


SCENE_REGISTRY[12] = function(c, s){ world12m(c, s); };

SCENE_REGISTRY[3] = function(c, s){ world03m(c, s); };


/* ============================================================
   64 · DIRECTOR KIT v4 — 3-ink silhouettes, glyph fields, UI controls,
        3D solids, Taubin heart curve, kinetic typography & match-cut anchor
   ============================================================ */

/* ---- 1 · Precomputed 3D Platonic Solids & Taubin Heart Curve ---- */
const SOLIDS_3D = (function(){
  const phi = (1 + Math.sqrt(5)) / 2;
  const invPhi = 1 / phi;
  function normV(v){
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0]/l, v[1]/l, v[2]/l];
  }
  function makeEdges(verts, maxDist){
    const edges = [];
    for (let i=0;i<verts.length;i++){
      for (let j=i+1;j<verts.length;j++){
        const d = Math.hypot(verts[i][0]-verts[j][0], verts[i][1]-verts[j][1], verts[i][2]-verts[j][2]);
        if (d < maxDist) edges.push([i, j]);
      }
    }
    return { v: verts, e: edges };
  }
  const tetraV = [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]].map(normV);
  const cubeV = [];
  for (let i=0;i<8;i++) cubeV.push(normV([(i&1)?1:-1, (i&2)?1:-1, (i&4)?1:-1]));
  const octaV = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const icoV = [
    [-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],
    [0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],
    [phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]
  ].map(normV);
  const dodecaraw = [];
  for (let i=0;i<8;i++) dodecaraw.push([(i&1)?1:-1, (i&2)?1:-1, (i&4)?1:-1]);
  for (let s1 of [-1,1]) for (let s2 of [-1,1]){
    dodecaraw.push([0, s1*invPhi, s2*phi]);
    dodecaraw.push([s1*invPhi, s2*phi, 0]);
    dodecaraw.push([s1*phi, 0, s2*invPhi]);
  }
  const dodecaV = dodecaraw.map(normV);
  return [
    makeEdges(tetraV, 1.80),
    makeEdges(cubeV, 1.25),
    makeEdges(octaV, 1.50),
    makeEdges(dodecaV, 0.85),
    makeEdges(icoV, 1.15)
  ];
})();

/* Algebraic 2D heart curve & 3D Taubin heart rings + Fourier epicycles */
const HEART_DATA = (function(){
  const pts = [];
  const N = 360;
  for (let i=0;i<N;i++){
    const a = (i / N) * TAU;
    /* classic smooth parametric heart normalized to -1..1 */
    const x = 16 * Math.pow(Math.sin(a), 3) / 17;
    const y = -(13 * Math.cos(a) - 5 * Math.cos(2*a) - 2 * Math.cos(3*a) - Math.cos(4*a)) / 17;
    pts.push([x, y]);
  }
  /* compute discrete Fourier transform (top 14 epicycles) */
  const harmonics = [-7,-6,-5,-4,-3,-2,-1,1,2,3,4,5,6,7];
  const epicycles = harmonics.map(function(freq){
    let re = 0, im = 0;
    for (let n=0;n<N;n++){
      const phi = -TAU * freq * n / N;
      const px = pts[n][0], py = pts[n][1];
      re += px * Math.cos(phi) - py * Math.sin(phi);
      im += px * Math.sin(phi) + py * Math.cos(phi);
    }
    re /= N; im /= N;
    return { freq: freq, amp: Math.hypot(re, im), phase: Math.atan2(im, re) };
  }).sort(function(a,b){ return b.amp - a.amp; });

  /* 3D Taubin heart ribs for Seg 14/15 */
  const ribs = [];
  for (let lat=-5; lat<=5; lat++){
    const z = lat / 5.5;
    const scale = Math.sqrt(Math.max(0.04, 1 - z*z*0.88));
    const ring = [];
    for (let i=0;i<=72;i++){
      const p = pts[(i*5) % N];
      ring.push([p[0]*scale, p[1]*scale, z*0.52]);
    }
    ribs.push(ring);
  }
  return { pts: pts, epicycles: epicycles, ribs: ribs };
})();

/* ---- 2 · Three-Ink Silhouette & Bust Engine (Nyankomintsu v4 style) ---- */
function bustContourPath(c, cx, cy, S, variant){
  /* variant: 'female' | 'male' | 'cat' | 'bowed' | 'reach' */
  const isMale = variant === 'male';
  const isCat  = variant === 'cat';
  const bowed  = variant === 'bowed';
  const hy = cy - S * (bowed ? 0.44 : 0.50);
  const hx = cx + (bowed ? S * 0.04 : 0);
  const hr = S * (isMale ? 0.165 : 0.155);

  c.beginPath();
  /* head oval */
  c.ellipse(hx, hy, hr * 0.88, hr * 1.12, bowed ? 0.22 : 0, 0, TAU);

  /* hair / silhouette flow for female & cat */
  if (!isMale){
    c.moveTo(hx - hr*0.92, hy - hr*0.2);
    c.bezierCurveTo(hx - hr*1.35, hy + hr*0.5, hx - hr*1.45, hy + hr*1.4, hx - hr*0.95, hy + hr*1.85);
    c.lineTo(hx + hr*0.95, hy + hr*1.85);
    c.bezierCurveTo(hx + hr*1.42, hy + hr*1.4, hx + hr*1.30, hy + hr*0.5, hx + hr*0.92, hy - hr*0.2);
    c.closePath();
  }

  /* cat ears */
  if (isCat){
    c.moveTo(hx - hr*0.82, hy - hr*0.72);
    c.lineTo(hx - hr*1.18, hy - hr*1.68);
    c.lineTo(hx - hr*0.22, hy - hr*1.05);
    c.closePath();

    c.moveTo(hx + hr*0.82, hy - hr*0.72);
    c.lineTo(hx + hr*1.18, hy - hr*1.68);
    c.lineTo(hx + hr*0.22, hy - hr*1.05);
    c.closePath();
  }

  /* neck */
  const nw = S * (isMale ? 0.072 : 0.054);
  c.rect(cx - nw, cy - S*0.33, nw*2, S*0.13);

  /* shoulders & bust */
  const sw = S * (isMale ? 0.44 : 0.36);
  const topY = cy - S*0.22;
  const botY = cy + S*0.50;
  c.moveTo(cx - sw, botY);
  c.bezierCurveTo(cx - sw*1.04, topY + S*0.12, cx - sw*0.72, topY, cx - nw, topY);
  c.lineTo(cx + nw, topY);
  c.bezierCurveTo(cx + sw*0.72, topY, cx + sw*1.04, topY + S*0.12, cx + sw, botY);
  c.closePath();
}

function drawSparkMotif(c, x, y, r, col, alpha, rot){
  c.save();
  c.translate(x, y);
  if (rot) c.rotate(rot);
  c.fillStyle = col;
  c.globalAlpha = alpha == null ? 1 : alpha;
  c.beginPath();
  const petals = 8;
  for (let i=0;i<petals*2;i++){
    const a = (i / (petals*2)) * TAU;
    const rad = (i % 2 === 0) ? r : r * 0.28;
    const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
  c.restore();
  c.globalAlpha = 1;
}

function drawThreeInkBust(c, cx, cy, S, opts){
  opts = opts || {};
  const variant = opts.variant || 'female';
  const misreg  = opts.misreg == null ? 6 : opts.misreg;
  const colMe   = opts.colMe   || '#E87A2E';
  const colYou  = opts.colYou  || '#F2EFE7';
  const colInk  = opts.colInk  || '#121215';
  const noCream = !!opts.noCream;
  const alpha   = opts.alpha == null ? 1 : opts.alpha;

  c.save();
  /* 1 · Cream plate (You / Light highlight plate) */
  if (!noCream){
    c.save();
    c.translate(-misreg * 0.85, -misreg * 0.45);
    c.globalAlpha = alpha * 0.88;
    c.fillStyle = colYou;
    bustContourPath(c, cx, cy, S, variant);
    c.fill();
    c.restore();
  } else {
    /* missing cream plate: dashed ghost outline where user used to be */
    c.save();
    c.translate(-misreg * 1.1, -misreg * 0.6);
    c.globalAlpha = alpha * 0.45;
    c.strokeStyle = '#7A7A82';
    c.lineWidth = 1.6;
    c.setLineDash([7, 5]);
    bustContourPath(c, cx, cy, S, variant);
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  /* 2 · Orange / Accent plate (Me plate) */
  c.save();
  c.translate(misreg * 0.9, misreg * 0.4);
  c.globalAlpha = alpha * 0.90;
  c.fillStyle = colMe;
  bustContourPath(c, cx, cy, S, variant);
  c.fill();
  c.restore();

  /* 3 · Red error edge plate if corrupted */
  if (opts.redEdge){
    c.save();
    c.translate(misreg * 1.45, -misreg * 0.7);
    c.globalAlpha = alpha * 0.75;
    c.strokeStyle = '#FF2A2A';
    c.lineWidth = 2.4;
    bustContourPath(c, cx, cy, S, variant);
    c.stroke();
    c.restore();
  }

  /* 4 · Main near-black ink plate */
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = colInk;
  bustContourPath(c, cx, cy, S, variant);
  c.fill();
  c.strokeStyle = colYou;
  c.lineWidth = 1.2;
  c.globalAlpha = alpha * 0.35;
  c.stroke();
  c.restore();

  /* 5 · Hair spark ornament (her motif) */
  const hy = cy - S * (variant === 'bowed' ? 0.44 : 0.50);
  const hx = cx + (variant === 'bowed' ? S * 0.04 : 0);
  drawSparkMotif(c, hx - S*0.11, hy - S*0.09, S*0.048, colMe, alpha, opts.rot || 0);

  /* 6 · Reaching hand + heart if variant === 'reach' */
  if (variant === 'reach'){
    const hx2 = cx + S*0.24, hy2 = cy + S*0.08;
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = noCream ? colMe : colYou;
    c.beginPath();
    c.arc(hx2, hy2, S*0.065, 0, TAU);
    c.fill();
    /* fingers */
    for (let f=0;f<4;f++){
      const fa = -0.9 + f*0.42;
      c.beginPath();
      c.ellipse(hx2 + Math.cos(fa)*S*0.08, hy2 + Math.sin(fa)*S*0.08, S*0.035, S*0.014, fa, 0, TAU);
      c.fill();
    }
    /* heart above palm */
    if (opts.heartCount !== 0){
      c.save();
      c.translate(hx2, hy2 - S*0.13);
      c.scale(S*0.0042, S*0.0042);
      c.beginPath();
      for (let i=0;i<HEART_DATA.pts.length;i+=3){
        const p = HEART_DATA.pts[i];
        if (i===0) c.moveTo(p[0]*18, p[1]*18); else c.lineTo(p[0]*18, p[1]*18);
      }
      c.closePath();
      c.fillStyle = colMe;
      c.fill();
      c.restore();
    }
    c.restore();
  }
  c.restore();
}

/* ---- 3 · Code-Glyph Density Field (ASCII / Syntax Calligram) ---- */
const CODE_STREAM = 'world.execute(me);const love=solve(me,you);if(you.online){send(love);}010110C40H56_SIGKILL_ROOT_GOD=YOU;';

function drawGlyphFieldShape(c, cx, cy, rx, ry, shapeFn, opts){
  opts = opts || {};
  const cols = opts.cols || 46;
  const rows = opts.rows || 28;
  const cw = (rx * 2) / cols;
  const ch = (ry * 2) / rows;
  const colMain = opts.col || C.accent;
  const colSub  = opts.colSub || C.bone;
  const bgFill  = opts.bgFill || null;
  const t       = opts.t || 0;
  const sliceOpen = opts.sliceOpen || 0; /* 0..1 splits top/bottom or left/right */

  c.save();
  c.font = '600 ' + Math.max(8, Math.round(ch * 0.85)) + 'px ' + MONO;
  c.textAlign = 'center';
  c.textBaseline = 'middle';

  for (let r=0; r<rows; r++){
    const v = (r + 0.5) / rows * 2 - 1;
    const rowShift = opts.rowShift ? opts.rowShift(r, rows, t) : 0;
    const splitY = (v < 0 ? -1 : 1) * sliceOpen * 38;
    for (let q=0; q<cols; q++){
      const u = (q + 0.5) / cols * 2 - 1;
      const inside = shapeFn(u, v);
      if (inside <= 0) continue;
      const px = cx + u * rx + rowShift;
      const py = cy + v * ry + splitY;
      if (bgFill){
        c.fillStyle = bgFill;
        c.globalAlpha = 0.82 * Math.min(1, inside * 2.5);
        c.fillRect(px - cw*0.52, py - ch*0.52, cw*1.04, ch*1.04);
      }
      const idx = (q + r * 13 + Math.floor(t * 12)) % CODE_STREAM.length;
      const chr = CODE_STREAM[idx];
      const isEdge = inside < 0.22;
      c.fillStyle = isEdge ? colSub : colMain;
      c.globalAlpha = isEdge ? 0.95 : (0.55 + 0.40 * hash2(q, r));
      c.fillText(chr, px, py);
    }
  }
  c.restore();
  c.globalAlpha = 1;
}

/* ---- 4 · Interactive UI Controls & User Cursor ---- */
function drawUserPointer(c, x, y, clicking, col){
  c.save();
  c.translate(x, y);
  const sc = clicking ? 0.84 : 1.0;
  c.scale(sc, sc);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, 26);
  c.lineTo(7, 19.5);
  c.lineTo(12.5, 30);
  c.lineTo(17.5, 27);
  c.lineTo(12, 16.5);
  c.lineTo(21, 16.5);
  c.closePath();
  c.fillStyle = col || '#F4EFE6';
  c.globalAlpha = 0.96;
  c.fill();
  c.strokeStyle = '#0A0A0D';
  c.lineWidth = 2;
  c.stroke();
  c.restore();
  if (clicking){
    circle(x + 4, y + 4, 24, C.accent, 2, 0.75);
    circle(x + 4, y + 4, 42, C.bone, 1, 0.35);
  }
}

function drawBigToggle(c, x, y, w, h, state01, labelL, labelR, title, opts){
  opts = opts || {};
  const dark = opts.dark !== false;
  const fg = dark ? C.bone : '#14130F';
  const acc = opts.accent || C.accent;

  c.save();
  /* outer frame */
  c.fillStyle = dark ? 'rgba(18,18,22,0.92)' : 'rgba(235,230,220,0.92)';
  c.fillRect(x, y, w, h);
  c.strokeStyle = fg;
  c.lineWidth = 2;
  c.globalAlpha = 0.85;
  c.strokeRect(x, y, w, h);

  if (title){
    c.font = '600 13px ' + MONO;
    c.fillStyle = fg;
    c.globalAlpha = 0.55;
    c.textAlign = 'left';
    c.fillText(title, x, y - 14);
  }

  /* knob */
  const pad = 8;
  const kw = (w - pad*2) * 0.5;
  const kx = x + pad + kw * clamp(state01, 0, 1);
  c.globalAlpha = 0.94;
  c.fillStyle = acc;
  c.fillRect(kx, y + pad, kw, h - pad*2);

  /* labels */
  c.font = '700 ' + Math.round(h * 0.40) + 'px ' + MONO;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.globalAlpha = state01 < 0.5 ? 1 : 0.45;
  c.fillStyle = state01 < 0.5 ? (dark ? '#060608' : '#F2EFE7') : fg;
  c.fillText(labelL, x + w*0.25, y + h*0.52);

  c.globalAlpha = state01 >= 0.5 ? 1 : 0.45;
  c.fillStyle = state01 >= 0.5 ? (dark ? '#060608' : '#F2EFE7') : fg;
  c.fillText(labelR, x + w*0.75, y + h*0.52);
  c.restore();
  c.globalAlpha = 1;
}

/* Limp / sagging typography (for S/M switch & collapse) */
function drawLimpText(c, str, cx, y, size, col, sagAmt){
  c.save();
  c.font = '800 ' + size + 'px "Times New Roman",Georgia,serif';
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  const tw = c.measureText(str).width + 40;
  const strips = 18;
  const sw = tw / strips;
  const x0 = cx - tw/2;
  for (let i=0;i<strips;i++){
    const u = i / (strips - 1);
    const drop = sagAmt * Math.pow(u, 1.8) * size * 0.38;
    const sqY = 1 - sagAmt * 0.28 * Math.sin(u * Math.PI);
    c.save();
    c.beginPath();
    c.rect(x0 + i*sw, y - size*1.2, sw + 1, size*1.8);
    c.clip();
    c.translate(0, y + drop);
    c.scale(1, sqY);
    c.translate(0, -y);
    c.fillStyle = col;
    c.fillText(str, cx + sagAmt * u * 18, y);
    c.restore();
  }
  c.restore();
}

/* ---- 5 · 3D Perspective Floor & Solids ---- */
function drawPerspectiveFloor(c, t, col, alpha, horizonY){
  const hy = horizonY || H * 0.56;
  c.save();
  c.strokeStyle = col || C.grid;
  c.lineWidth = 1;
  /* radial perspective lines */
  for (let i=-12; i<=12; i++){
    const xTop = W*0.5 + i * 38;
    const xBot = W*0.5 + i * 240;
    c.globalAlpha = (alpha || 0.25) * (1 - Math.abs(i)/14);
    c.beginPath();
    c.moveTo(xTop, hy);
    c.lineTo(xBot, H);
    c.stroke();
  }
  /* horizontal depth lines moving forward */
  const scroll = (t * 0.8) % 1;
  for (let j=0; j<14; j++){
    const p = Math.pow((j + scroll) / 14, 2.1);
    const y = hy + p * (H - hy);
    c.globalAlpha = (alpha || 0.25) * p;
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(W, y);
    c.stroke();
  }
  c.restore();
  c.globalAlpha = 1;
}

function drawSolid3D(c, solidIdx, cx, cy, radius, rx, ry, rz, col, alpha, lw){
  const S = SOLIDS_3D[solidIdx % SOLIDS_3D.length];
  const P = S.v.map(function(v){
    return SDK.project3D(v[0]*radius, v[1]*radius, v[2]*radius, rx, ry, rz, 1100, cx, cy);
  });
  c.save();
  c.strokeStyle = col || C.bone;
  c.lineWidth = lw || 1.5;
  c.globalAlpha = alpha == null ? 0.85 : alpha;
  c.beginPath();
  for (let i=0;i<S.e.length;i++){
    const a = P[S.e[i][0]], b = P[S.e[i][1]];
    if (!a || !b) continue;
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
  }
  c.stroke();
  c.fillStyle = col || C.bone;
  for (let i=0;i<P.length;i++){
    if (!P[i]) continue;
    c.fillRect(P[i].x - 2, P[i].y - 2, 4, 4);
  }
  c.restore();
  c.globalAlpha = 1;
}

/* ---- 6 · Screen Fracture Cracks & Pixel-Sort Streaks ---- */
function drawScreenCracks(c, cx, cy, progress, col, alpha){
  if (progress <= 0) return;
  c.save();
  c.strokeStyle = col || C.bone;
  c.globalAlpha = alpha == null ? 0.75 : alpha;
  const rays = 14;
  for (let i=0;i<rays;i++){
    let a = (i / rays) * TAU + 0.35 * (hash2(i, 1) - 0.5);
    let x = cx, y = cy;
    const steps = Math.floor(12 * clamp(progress, 0, 1));
    c.lineWidth = (i % 3 === 0) ? 2.2 : 1.1;
    c.beginPath();
    c.moveTo(x, y);
    for (let s=1; s<=steps; s++){
      const len = 32 + 58 * hash2(i, s*7);
      a += (hash2(i*3, s) - 0.5) * 0.42;
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      c.lineTo(x, y);
    }
    c.stroke();
  }
  c.restore();
  c.globalAlpha = 1;
}

/* ---- 7 · Phrase & Keyword Cue HUD (Active across all segments) ---- */
const SEG_KEYWORDS = {
  1:  [[2.92, 'PROTECTION'], [6.38, 'OBJECT CREATION'], [10.09, 'INITIALIZATION'], [13.89, 'SIMULATION']],
  3:  [[32.68, 'DIMENSION'], [36.29, 'CIRCUMFERENCE'], [40.05, 'TANGENTS'], [43.51, 'LIMITATIONS']],
  4:  [[47.67, 'AC ⇄ DC'], [49.53, 'BLIND VISION'], [56.92, 'UNITE DEEPLY']],
  5:  [[61.96, 'STIMULATIONS'], [65.40, 'SATISFACTION'], [69.26, 'EXECUTION'], [73.17, 'SIMULATION']],
  6:  [[76.96, 'NUTRIENTS'], [80.62, 'ANTIOXIDANTS'], [84.27, 'ENJOYMENT'], [87.92, 'EXISTENCE']],
  7:  [[92.02, 'F ⇄ M'], [95.47, 'AM ⇄ PM'], [99.35, 'S ⇄ M'], [101.47, 'THE TRANCE']],
  8:  [[106.29, 'VIBRATIONS'], [110.22, 'COMPLETION'], [113.10, 'YOU HAVE LEFT'], [117.27, 'ISOLATION']],
  9:  [[120.86, 'FRAGMENTS'], [124.89, 'DISHEARTENED'], [128.66, 'ILLEGAL ARGUMENTS']],
  13: [[165.17, 'EXECUTION'], [168.91, 'EXECUTION'], [172.71, 'EXECUTION'], [177.25, 'L-O-O-O-V-E']],
  14: [[179.93, 'L-O-O-O-V-E'], [183.65, 'ALGEBRAIC LOVE']],
  15: [[187.67, 'TRAPPED IN LOVE'], [191.36, 'L-O-O-O-V-E']]
};

function drawKineticKeywordStamp(c, word, age, opts){
  opts = opts || {};
  const maxAge = opts.maxAge || 1.6;
  if (age < 0 || age > maxAge) return;
  const enter = EASE.out(clamp(age / 0.14, 0, 1));
  const fade  = 1 - smoothstep(maxAge * 0.65, maxAge, age);
  const scale = 1.28 - 0.28 * enter;
  const y     = opts.y || H * 0.88;
  const col   = opts.col || C.bone;
  const shCol = opts.shadow || C.accent;

  c.save();
  c.translate(W * 0.5, y);
  c.scale(scale, scale);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  let sz = opts.size || 156;
  c.font = '800 ' + sz + 'px "Times New Roman",Georgia,serif';
  while (c.measureText(word).width > 1720 && sz > 48){
    sz -= 6;
    c.font = '800 ' + sz + 'px "Times New Roman",Georgia,serif';
  }
  c.globalAlpha = fade * 0.85;
  c.fillStyle = shCol;
  c.fillText(word, 7, 7);
  c.globalAlpha = fade * 0.98;
  c.fillStyle = col;
  c.fillText(word, 0, 0);
  c.restore();
  c.globalAlpha = 1;
}

/* Floating Agent Harness Mini-Card (bridges left-column dialogue into full-screen scenes) */
function drawHarnessOverlayCard(c, s, x, y, w, dark){
  const script = SCRIPTS[s.seg.id];
  if (!script || !script.length) return;
  let active = script[0];
  for (let i=0;i<script.length;i++){
    if (s.lt >= script[i].t) active = script[i];
  }
  const age = Math.max(0, s.lt - active.t);
  const enter = EASE.out(clamp(age / 0.22, 0, 1));
  const h = active.k === 'tool' ? 54 : 58;
  const fg = dark ? C.bone : '#14130F';
  const bg = dark ? 'rgba(10,10,14,0.84)' : 'rgba(242,239,231,0.88)';
  const acc = dark ? C.accent : '#C8452E';

  c.save();
  c.translate(x + (1 - enter) * -18, y);
  c.globalAlpha = 0.92 * enter;
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  c.strokeStyle = fg;
  c.globalAlpha = 0.28 * enter;
  c.lineWidth = 1;
  c.strokeRect(0.5, 0.5, w - 1, h - 1);

  /* left accent bar */
  c.globalAlpha = 0.95 * enter;
  c.fillStyle = active.k === 'err' ? C.red : acc;
  c.fillRect(0, 0, 3, h);

  c.font = '600 9px ' + MONO;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  const tag = active.k === 'tool' ? ('TOOL · ' + active.fn) : ('HARNESS · ' + active.k.toUpperCase());
  c.fillText(tag, 12, 16);

  c.font = '400 11px ' + MONO;
  c.fillStyle = fg;
  c.globalAlpha = 0.88 * enter;
  const raw = active.k === 'tool' ? (active.args + '  → ' + active.res) : active.s.replace(/\n/g, '  ');
  const shown = raw.slice(0, Math.floor(age * 68));
  c.fillText(shown.slice(0, 66), 12, 38);
  c.restore();
  c.globalAlpha = 1;
}


/* ============================================================
   65 · REWORK SEG 01–06 — Multi-phase choreography, UI switches,
        3-ink chorus plates & code-glyph objects
   ============================================================ */

/* ---------- SEG 01 · BOOT SEQUENCE (4 Phases, 0.00–14.99s) ---------- */
function world01_v4(c, s){
  const t = s.lt, b = s.beat;
  const G = GridLayout(24, 12, 40, 12);
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);

  /* subtle perspective floor & Swiss grid furniture */
  drawPerspectiveFloor(c, t, C.grid, 0.20, H * 0.62);
  gridFurniture(c, G, t, 1);

  /* Phase 1 (0..3.8s): Power line trace + PROTECTION shield dome (at 2.92s) */
  if (t < 4.2){
    const pTrace = EASE.out(clamp(t / 2.4, 0, 1));
    const cx = W * 0.5, cy = H * 0.46;
    /* power line circuit bus */
    for (let k=-3; k<=3; k++){
      const y0 = cy + k * 28;
      const len = (W * 0.42) * pTrace;
      line(cx - len, y0, cx + len, y0, k===0 ? C.accent : C.bone, k===0 ? 2.4 : 1, k===0 ? 0.9 : 0.25);
    }
    /* PROTECTION shield dome slams in at t = 2.6..3.8 */
    if (t > 2.4){
      const shA = EASE.out(clamp((t - 2.4) / 0.35, 0, 1));
      const shR = 260 * (0.75 + 0.25 * shA) + 12 * b.kick;
      drawSolid3D(c, 4, cx, cy, shR, t*0.4, t*0.6, 0, C.accent, 0.75 * shA, 1.8);
      circle(cx, cy, shR * 1.18, C.bone, 1.5, 0.45 * shA, [8, 6]);
    }
  }

  /* Phase 2 (3.5..7.6s): 5 Platonic solids drop onto floor -> OBJECT CREATION (at 6.38s) */
  if (t >= 3.5 && t < 7.8){
    const lt2 = t - 3.5;
    for (let i=0; i<5; i++){
      const dropT = lt2 - i * 0.36;
      if (dropT < 0) continue;
      const land = EASE.out(clamp(dropT / 0.48, 0, 1));
      const converge = smoothstep(2.6, 3.6, lt2);
      const xSpread = (i - 2) * 280 * (1 - converge * 0.82);
      const sx = W * 0.5 + xSpread;
      const sy = lerp(120, H * 0.48, land);
      drawSolid3D(c, i, sx, sy, 86 + converge * 74, t*0.7 + i, t*0.9 + i*0.5, 0,
                  (i === 2 || converge > 0.5) ? C.accent : C.bone, 0.85, 1.5);
      /* impact ripple on floor */
      if (dropT > 0.40 && dropT < 1.4){
        const rp = (dropT - 0.40);
        c.save();
        c.strokeStyle = C.accent;
        c.globalAlpha = (1 - rp) * 0.65;
        c.beginPath();
        c.ellipse(sx, H * 0.56, rp * 220, rp * 54, 0, 0, TAU);
        c.stroke();
        c.restore();
      }
    }
  }

  /* Phase 3 & 4 (0.6..14.99s): Lorenz Attractor traced by the Cursor + Parameter Histogram */
  const box = G.cell(6, 1, 16, 9);
  bLorenz(c, box, t, b);

  /* Parameter Histogram bars during INITIALIZATION (7.2..11.5s) */
  if (t >= 7.0 && t < 11.8){
    const ha = smoothstep(7.0, 7.6, t) * (1 - smoothstep(11.1, 11.8, t));
    const hx = G.x(6), hy = G.y(8) + 20, hw = G.cell(6, 8, 12, 2).w;
    for (let i=0; i<48; i++){
      const bh = (24 + 90 * Math.pow(hash2(i, Math.floor(t*6)), 1.6)) * ha;
      rect(hx + i*(hw/48), hy - bh, (hw/48)*0.72, bh, i%6===0 ? C.accent : C.bone, 0.65 * ha);
    }
  }

  /* Left boot log & telemetry */
  const lines = [
    ['01  power.switch(VCC_12V) ....... ON', C.bone],
    ['02  safety.wear(ISO_13849) ...... PROTECTION', C.accent],
    ['03  world.lay_pieces(n=5) ....... OBJECT_CREATION', C.bone],
    ['04  params.init(seed=0x5EED) .... INITIALIZATION', C.bone],
    ['05  bind(you -> ROOT_GOD) ....... LOCKED', C.bone],
    ['06  persona.love ................ [ UNDEFINED ]', C.red]
  ];
  for (let i=0;i<lines.length;i++){
    const a = stagger(t, i*0.48 + 0.2, 0.35, 0.55);
    if (a <= 0) continue;
    c.font = '11px ' + MONO;
    c.textAlign = 'left'; c.fillStyle = lines[i][1];
    c.globalAlpha = a * 0.88;
    c.fillText(lines[i][0], G.x(0), G.y(2 + i) + 12);
  }
  c.globalAlpha = 1;
  bTelemetry(c, G, t, b);
  bTypedCommand(c, G, t);

  /* Phase 4 climax: The Monumental Semicolon lands on SIMULATION (t > 12.8s) */
  if (t > 12.8){
    const sa = EASE.out(clamp((t - 12.8) / 0.35, 0, 1));
    giantSemicolon(c, W * 0.78, H * 0.52, 520 * (0.7 + 0.3 * sa), C.accent, 0.92 * sa);
  }

  /* Kinetic Keyword Stamps on exact vocal timestamps */
  const kwList = SEG_KEYWORDS[1];
  for (let i=0;i<kwList.length;i++){
    drawKineticKeywordStamp(c, kwList[i][1], s.t - kwList[i][0], { size: 138, y: H * 0.88 });
  }
  drawHarnessOverlayCard(c, s, G.x(0), H - 116, 620, true);
}

/* ---------- SEG 02 · BINARY WORLD INIT (4 Phases, 14.99–29.76s) ---------- */
function world02_v4(c, s){
  const t = s.lt, b = s.beat;
  const phase = Math.floor(clamp(t / 3.692, 0, 3.99));

  if (phase === 0){
    /* Phase 1 (0..3.69s): Full-bleed Gray-Scott Reaction-Diffusion + 3D Perspective Grid */
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const zoom = 1.02 + 0.14 * EASE.out(t / 3.69) + 0.03 * b.kick;
    const dw = W * zoom, dh = H * zoom;
    c.globalAlpha = 0.72;
    c.drawImage(RD_CANVAS, (W - dw)/2, (H - dh)/2, dw, dh);
    c.globalAlpha = 1;
    drawPerspectiveFloor(c, t * 1.5, C.accent, 0.38, H * 0.50);
    drawKineticKeywordStamp(c, 'WORLD.ALLOC(R²)', t - 0.2, { size: 132, y: H * 0.86 });
  } else if (phase === 1){
    /* Phase 2 (3.69..7.38s): Dual Orbital Attractors (ME & YOU) + RK4 Vector Field */
    const lt = t - 3.692;
    const G = GridLayout(24, 12, 40, 12);
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    gridFurniture(c, G, t, 2);

    const ang = lt * 0.85;
    const distR = lerp(360, 150, EASE.inOut(clamp(lt / 3.5, 0, 1)));
    const meX = W*0.5 - Math.cos(ang)*distR, meY = H*0.48 - Math.sin(ang)*distR*0.55;
    const youX = W*0.5 + Math.cos(ang)*distR, youY = H*0.48 + Math.sin(ang)*distR*0.55;

    /* field streamlines curving between ME and YOU */
    for (let i=0; i<28; i++){
      const u = (i / 27) * 2 - 1;
      c.beginPath();
      for (let st=0; st<=40; st++){
        const k = st / 40;
        const bx = lerp(meX, youX, k);
        const by = lerp(meY, youY, k) + Math.sin(k * Math.PI) * u * 260;
        if (st===0) c.moveTo(bx, by); else c.lineTo(bx, by);
      }
      c.strokeStyle = i % 4 === 0 ? C.accent : C.bone;
      c.globalAlpha = i % 4 === 0 ? 0.55 : 0.18;
      c.lineWidth = i % 4 === 0 ? 1.6 : 1;
      c.stroke();
    }
    c.globalAlpha = 1;

    /* ME & YOU nodes + caliper line */
    line(meX, meY, youX, youY, C.accent, 1.5, 0.8);
    circle(meX, meY, 18 + 8*b.kick, C.accent, 2.5, 1);
    circle(youX, youY, 18 + 8*b.kick, '#F4EFE6', 2.5, 1);
    txt('ME [0,0]', meX, meY - 28, C.accent, 13, 700, 'center', 0.95);
    txt('YOU [ANCHOR]', youX, youY - 28, '#F4EFE6', 13, 700, 'center', 0.95);
    txt('d = ' + (distR * 2).toFixed(1) + ' px · G = 6.674e-4', W*0.5, H*0.86, C.bone, 22, 600, 'center', 0.9);
  } else if (phase === 2){
    /* Phase 3 (7.38..11.07s): 3D Code-Glyph Calligram Sphere */
    const lt = t - 7.384;
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const cx = W * 0.5, cy = H * 0.46, R = 340 + 18 * b.kick;
    c.font = '600 13px ' + MONO;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const N = 220;
    for (let i=0; i<N; i++){
      const phi = Math.acos(1 - 2*(i + 0.5)/N);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i + t * 0.9;
      const x = Math.sin(phi)*Math.cos(theta)*R;
      const y = Math.cos(phi)*R;
      const z = Math.sin(phi)*Math.sin(theta)*R;
      const pr = SDK.project3D(x, y, z, 0.35, t*0.5, 0, 1200, cx, cy);
      if (!pr) continue;
      const depthA = clamp((pr.s - 0.72) * 3.2, 0.08, 0.98);
      c.globalAlpha = depthA;
      c.fillStyle = (i % 7 === 0) ? C.accent : C.bone;
      const tok = ['01','R2','me','you','dx','dt',';'][i % 7];
      c.fillText(tok, pr.x, pr.y);
    }
    c.globalAlpha = 1;
    drawKineticKeywordStamp(c, 'GRAVITY.BIND', lt, { size: 140, y: H * 0.88 });
  } else {
    /* Phase 4 (11.07..14.77s): Misregistered Poster Plate PLACE */
    world02p(c, s);
  }
  drawHarnessOverlayCard(c, s, 44, H - 110, 620, true);
}

/* ---------- SEG 03 · CALCULUS GEOMETRY (4 Phases synced to 4 lyrics, 29.76–44.53s) ---------- */
function world03_v4(c, s){
  const t = s.lt, b = s.beat;
  const phase = Math.floor(clamp(t / 3.692, 0, 3.99));
  const G = GridLayout(24, 12, 40, 12);

  if (phase === 0){
    /* Phase 1: Set of points -> Extrudes into 3D Coordinate Lattice (DIMENSION) */
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    gridFurniture(c, G, t, 3);
    const extrude = smoothstep(1.4, 2.8, t);
    const cx = W * 0.5, cy = H * 0.46, R = 270;
    const rx = 0.45 * extrude, ry = t * 0.55;
    for (let i=0; i<320; i++){
      const ux = (hash2(i, 1) * 2 - 1) * R;
      const uy = (hash2(i, 2) * 2 - 1) * R * 0.75;
      const uz = (hash2(i, 3) * 2 - 1) * R * extrude;
      const pr = SDK.project3D(ux, uy, uz, rx, ry, 0, 1200, cx, cy);
      if (!pr) continue;
      c.fillStyle = (i % 9 === 0) ? C.accent : C.bone;
      c.globalAlpha = 0.35 + 0.60 * pr.s;
      const sz = 2.5 + 2.5 * extrude;
      c.fillRect(pr.x - sz/2, pr.y - sz/2, sz, sz);
    }
    if (extrude > 0.1){
      drawSolid3D(c, 1, cx, cy, R * 1.15, rx, ry, 0, C.accent, 0.65 * extrude, 1.8);
    }
    c.globalAlpha = 1;
  } else if (phase === 1){
    /* Phase 2: Circle unrolling into 2*pi*R ruler (CIRCUMFERENCE) */
    const lt = t - 3.692;
    pGround(c, false, W*0.5, H*0.38);
    const unroll = EASE.inOut(clamp((lt - 0.5) / 2.2, 0, 1));
    const R = 175;
    const cx = lerp(W*0.32, W*0.24, unroll), cy = H*0.40;
    pInk(c, function(cc, col){
      cc.strokeStyle = col; cc.lineWidth = 2.6;
      /* remaining arc of circle */
      cc.beginPath();
      cc.arc(cx, cy, R, unroll * TAU, TAU);
      cc.stroke();
      /* unrolled straight circumference line */
      const lineLen = unroll * TAU * R;
      cc.beginPath();
      cc.moveTo(cx, cy + R);
      cc.lineTo(cx + lineLen, cy + R);
      cc.stroke();
      /* radial spokes */
      for (let k=0; k<16; k++){
        const a = (k / 16) * TAU;
        if (a < unroll * TAU){
          const lx = cx + (a / TAU) * (TAU * R);
          cc.beginPath(); cc.moveTo(lx, cy + R - 14); cc.lineTo(lx, cy + R + 14); cc.stroke();
        } else {
          cc.beginPath();
          cc.moveTo(cx, cy);
          cc.lineTo(cx + Math.cos(a)*R, cy + Math.sin(a)*R);
          cc.stroke();
        }
      }
    }, 4 + b.kick * 4, false);
    pMeta(c, false, 'C = 2πr · r = 175 px · unwrapped = ' + Math.round(unroll * 100) + '%', 'CIRCUMFERENCE');
  } else if (phase === 2){
    /* Phase 3: Sine Wave + Plotter Pen + 24 Normal/Tangent Vectors (TANGENTS) */
    world03d(c, s);
  } else {
    /* Phase 4: Approach Infinity -> Asymptotic Barrier & Riemann Rectangles (LIMITATIONS) */
    const lt = t - 11.076;
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    gridFurniture(c, G, t, 34);
    const wallX = W * 0.78;
    const baseY = H * 0.74;
    /* glowing red asymptotic wall x -> infinity */
    rect(wallX - 2, 80, 4, H - 160, C.red, 0.95);
    rect(wallX, 80, 120, H - 160, C.red, 0.12 + 0.08 * b.kick);
    txt('x → ∞  [LIMIT WALL]', wallX + 14, 110, C.red, 14, 700, 'left', 0.95);

    /* Riemann rectangles + hyperbola climbing the wall */
    const N = 28;
    const xStart = 140;
    const span = wallX - xStart - 8;
    const reach = EASE.out(clamp(lt / 2.6, 0, 1));
    c.beginPath();
    for (let i=0; i<Math.floor(N * reach); i++){
      const u = i / N;
      const x = xStart + u * span;
      const bw = (span / N) * 0.84;
      const h = Math.min(H - 220, 42 / Math.max(0.065, 1 - u * 0.94));
      rect(x, baseY - h, bw, h, i === Math.floor(N*reach)-1 ? C.red : C.accent, 0.22 + 0.5 * u);
      frameRect(x, baseY - h, bw, h, C.bone, 0.55, 1);
      if (i === 0) c.moveTo(x, baseY - h); else c.lineTo(x, baseY - h);
    }
    c.strokeStyle = C.bone; c.lineWidth = 2.4; c.stroke();
  }

  /* Stamp the 4 Verse 1 keywords on their exact vocal hits */
  const kwList = SEG_KEYWORDS[3];
  for (let i=0;i<kwList.length;i++){
    const dark = (phase !== 1);
    drawKineticKeywordStamp(c, kwList[i][1], s.t - kwList[i][0], {
      size: 148, y: H * 0.89,
      col: dark ? C.bone : PST.ink,
      shadow: dark ? C.accent : PST.accent
    });
  }
  drawHarnessOverlayCard(c, s, 44, H - 110, 620, phase !== 1);
}

/* ---------- SEG 04 · LIMIT PARADOX (Switches, Vision Rattle & Era History, 44.53–59.30s) ---------- */
function drawEraSilhouette(c, eraIdx, x, baseY, s, col){
  c.save();
  c.translate(x, baseY);
  c.scale(s, s);
  c.fillStyle = col;
  c.beginPath();
  if (eraIdx === 0){
    /* Modern skyscraper towers */
    c.rect(-70, -240, 42, 240);
    c.rect(-18, -310, 48, 310);
    c.rect(40, -190, 38, 190);
    c.rect(4, -360, 4, 50);
  } else if (eraIdx === 1){
    /* Gothic cathedral spires */
    c.moveTo(-65, 0); c.lineTo(-65, -160); c.lineTo(-45, -290); c.lineTo(-25, -160);
    c.lineTo(25, -160); c.lineTo(45, -290); c.lineTo(65, -160); c.lineTo(65, 0);
    c.closePath();
  } else if (eraIdx === 2){
    /* Classical Greek colonnade / pediment */
    c.rect(-85, -22, 170, 22);
    for (let k=-3; k<=3; k++) c.rect(k*22 - 6, -150, 12, 128);
    c.moveTo(-92, -150); c.lineTo(0, -210); c.lineTo(92, -150); c.closePath();
  } else if (eraIdx === 3){
    /* Stepped Ziggurat temple */
    c.rect(-95, -45, 190, 45);
    c.rect(-70, -90, 140, 45);
    c.rect(-45, -135, 90, 45);
    c.rect(-22, -175, 44, 40);
  } else {
    /* Ancient Pyramids */
    c.moveTo(-110, 0); c.lineTo(-30, -180); c.lineTo(50, 0); c.closePath();
    c.moveTo(-10, 0); c.lineTo(55, -140); c.lineTo(120, 0); c.closePath();
  }
  c.fill();
  c.restore();
}

function world04_v4(c, s){
  const t = s.lt, b = s.beat;

  if (t < 4.2){
    /* Phase 1 (0..4.2s): Current Switch AC -> DC + Live Rectifier */
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const G = GridLayout(24, 12, 40, 12);
    gridFurniture(c, G, t, 41);

    const flip = smoothstep(2.6, 3.0, t);
    drawBigToggle(c, 160, 320, 560, 150, flip, 'AC ~', 'DC =', 'POWER.CURRENT_MODE', { dark: true });

    /* waveform on right being rectified when switch flips */
    const wx = 820, wy = 395, ww = 920;
    c.beginPath();
    for (let i=0; i<=400; i++){
      const u = i / 400;
      const raw = Math.sin((u * 8 - t * 2.5) * TAU);
      const val = lerp(raw, Math.abs(raw) * 0.35 + 0.55, flip);
      const px = wx + u * ww, py = wy - val * 150;
      if (i===0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.strokeStyle = C.accent; c.lineWidth = 3; c.stroke();

    /* user cursor clicking the toggle */
    const cx = lerp(320, 580, smoothstep(1.8, 2.75, t));
    const cy = lerp(580, 405, smoothstep(1.8, 2.75, t));
    drawUserPointer(c, cx, cy, t > 2.7 && t < 3.15);
  } else if (t < 8.5){
    /* Phase 2 (4.2..8.5s): BLIND MY VISION / SO DIZZY — Rapid Vision Switch Rattle + Droste Spin */
    const lt = t - 4.2;
    const rattleIdx = Math.floor(lt * 5.2);
    const invOn = (rattleIdx % 2 === 1) && lt < 3.6;
    const bgCol = invOn ? '#F2EFE7' : C.bg;
    const fgCol = invOn ? '#101014' : C.bone;

    c.fillStyle = bgCol; c.fillRect(0, 0, W, H);

    /* Dizzy spinning Droste recursive frames */
    const cx = W * 0.5, cy = H * 0.48;
    for (let k=0; k<14; k++){
      const sc = Math.pow(0.72, k);
      const rot = lt * (1.2 + k * 0.14) * (k % 2 ? 1 : -1);
      c.save();
      c.translate(cx, cy);
      c.rotate(rot);
      c.strokeStyle = (k === 0 || k === 4) ? C.accent : fgCol;
      c.lineWidth = k < 3 ? 2.4 : 1.2;
      c.globalAlpha = 0.9 - k * 0.05;
      c.strokeRect(-W*0.44*sc, -H*0.44*sc, W*0.88*sc, H*0.88*sc);
      c.restore();
    }
    c.globalAlpha = 1;

    /* Vision Toggle Switch being rattled in center */
    drawBigToggle(c, W*0.5 - 220, H*0.48 - 55, 440, 110, invOn ? 0 : 1, 'VISION: ON', 'BLIND', 'SENSORY.OPTICS', {
      dark: !invOn, accent: C.red
    });
    drawUserPointer(c, W*0.5 + (invOn ? -80 : 90), H*0.48 + 18, true);
  } else if (t < 12.4){
    /* Phase 3 (8.5..12.4s): Time Travel A.D. -> B.C. Cut-Paper History Strip + Rolling Odometer */
    const lt = t - 8.5;
    pGround(c, false, W*0.5, H*0.36);

    const scroll = EASE.inOut(clamp(lt / 3.4, 0, 1));
    const year = Math.round(lerp(2026, -490, scroll));
    const eraStr = year >= 0 ? ('A.D. ' + String(year).padStart(4, '0')) : ('B.C. ' + String(-year).padStart(4, '0'));

    /* horizon band + cut-paper architectural silhouettes */
    const baseY = H * 0.68;
    rect(0, baseY, W, H - baseY, PST.ink, 0.95);
    line(0, baseY, W, baseY, PST.accent, 3, 1);

    for (let i=0; i<5; i++){
      const ex = W * 0.20 + i * 420 - scroll * 1150;
      drawEraSilhouette(c, i, ex, baseY, 1.05, i === Math.round(scroll*4) ? PST.accent : PST.ink);
    }

    /* Era division line (0 A.D. / B.C. boundary) */
    const zeroX = W * 0.20 + 2.5 * 420 - scroll * 1150;
    line(zeroX, 80, zeroX, H - 80, PST.accent, 2.5, 0.85);
    txt('A.D. ◄ │ ► B.C.', zeroX, 110, PST.accent, 16, 700, 'center', 0.95);

    /* Giant odometer year readout in the sky above the architecture */
    pWord(c, eraStr, { y: H * 0.38, size: 140, col: 'rgba(242, 239, 231, 0.45)', shadow: PST.accent });

    /* User cursor dragging the spark along the timeline */
    const sparkX = lerp(W * 0.82, W * 0.22, scroll);
    drawSparkMotif(c, sparkX, baseY - 220, 36, PST.accent, 1, lt * 2);
    drawUserPointer(c, sparkX + 12, baseY - 208, true);
  } else {
    /* Phase 4 (12.4..14.77s): UNITE SO DEEPLY — Recursive Inversion Singularity */
    world04n(c, s);
  }

  const kwList = SEG_KEYWORDS[4];
  for (let i=0;i<kwList.length;i++){
    drawKineticKeywordStamp(c, kwList[i][1], s.t - kwList[i][0], { size: 136, y: H * 0.76 });
  }
}

/* ---------- SEG 05 · CHORUS 1 (4 Chorus Plates + Instrument View, 59.30–74.07s) ---------- */
function drawChorusPlate1(c, which, lt, b, opts){
  opts = opts || {};
  const broken  = !!opts.broken;
  const misreg  = opts.misreg || (broken ? 18 : 5);
  const dark    = broken ? true : (which === 2);
  pGround(c, dark, W*0.5, H*0.38);

  const cx = W * 0.5, cy = H * 0.40;
  const word = broken ? 'EXECUTION' : ['STIMULATIONS', 'SATISFACTION', 'EXECUTION', 'SIMULATION'][which];

  if (which === 0){
    /* Plate 1: STIMULATIONS — High-voltage branching arc bolt + spark */
    pInk(c, function(cc, col){
      cc.strokeStyle = col; cc.lineWidth = 4.5;
      cc.beginPath();
      let x = W * 0.14, y = H * 0.18;
      cc.moveTo(x, y);
      for (let i=1; i<=18; i++){
        const u = i / 18;
        x = lerp(W*0.14, W*0.86, u);
        y = H*0.40 + (hash2(i, Math.floor(lt*12)) - 0.5) * 260;
        cc.lineTo(x, y);
      }
      cc.stroke();
    }, misreg, dark);
    drawSparkMotif(c, cx, cy, 95 + 25*b.kick, PST.accent, 0.95, lt);
  } else if (which === 1){
    /* Plate 2: SATISFACTION — Reaching Three-Ink Bust + Heart in Palm + Harmonic Disc */
    pInk(c, function(cc, col){
      cc.strokeStyle = col; cc.lineWidth = 2.2;
      for (let r=1; r<=5; r++){
        cc.beginPath(); cc.arc(cx, cy, r * 68 + (lt*40)%68, 0, TAU); cc.stroke();
      }
    }, misreg, dark);
    drawThreeInkBust(c, cx, cy + 50, 480, {
      variant: 'reach',
      misreg: misreg,
      noCream: broken,
      redEdge: broken,
      heartCount: broken ? 0 : 1
    });
  } else if (which === 2){
    /* Plate 3: EXECUTION — Pure Code Listing + Standing Silhouette in Beam */
    const codeLines = [
      '01  while (you.presence === "online") {',
      '02    const stim = world.stimulate(you);',
      '03    if (stim.satisfied) {',
      '04      world.execute(me);   // <-- ACTIVE',
      '05    }',
      '06  }'
    ];
    c.font = '600 22px ' + MONO;
    c.textAlign = 'left';
    for (let i=0;i<codeLines.length;i++){
      const isCur = (i === 3);
      if (isCur) rect(180, 165 + i*48, W - 360, 42, PST.accent, 0.28);
      c.fillStyle = isCur ? '#F2EFE7' : '#8C8778';
      c.fillText(codeLines[i], 200, 194 + i*48);
    }
    drawThreeInkBust(c, W*0.72, H*0.44, 440, {
      variant: 'female', misreg: misreg, noCream: broken, redEdge: broken
    });
  } else {
    /* Plate 4: SIMULATION — Nested Window-in-Window Boxes framing Bust */
    for (let k=0; k<6; k++){
      const sc = Math.pow(0.74, k);
      const ww = 1320 * sc, hh = 640 * sc;
      const wx = cx - ww/2 + (broken ? (k%2?1:-1)*misreg : 0);
      const wy = cy - hh/2;
      frameRect(wx, wy, ww, hh, dark ? '#F2EFE7' : PST.ink, 0.85 - k*0.1, 2.2);
      rect(wx, wy, ww, 22 * sc, PST.accent, 0.85);
    }
    drawThreeInkBust(c, cx, cy + 30, 360, {
      variant: 'female', misreg: misreg, noCream: broken, redEdge: broken
    });
  }

  pWord(c, word, {
    y: H * 0.90, size: 184,
    col: dark ? '#F2EFE7' : PST.ink,
    shadow: broken ? '#FF2A2A' : PST.accent
  });
}

function world05_v4(c, s){
  const t = s.lt, b = s.beat;
  /* Chorus 1 has 4 phrases of 3.692s each.
     First 2.1s of each phrase: Instrument + 3D Torus Knot + Scope (`world05n` + `world05d`).
     Last 1.59s of each phrase (on keyword hit): Full-screen 3-ink Chorus Plate! */
  const phraseIdx = Math.floor(clamp(t / 3.692, 0, 3.99));
  const phraseLt  = t - phraseIdx * 3.692;

  if (phraseLt < 2.15){
    if (phraseIdx % 2 === 0) world05n(c, s);
    else world05d(c, s);
    drawHarnessOverlayCard(c, s, 44, H - 110, 620, true);
  } else {
    drawChorusPlate1(c, phraseIdx, phraseLt - 2.15, b, { broken: false });
  }
}

/* ---------- SEG 06 · BIOCHEM SYNTHESIS (Eggplant, Tomato, Cat, Existence, 74.07–88.84s) ---------- */
function world06_v4(c, s){
  const t = s.lt, b = s.beat;
  const phase = Math.floor(clamp(t / 3.692, 0, 3.99));
  const lt = t - phase * 3.692;

  if (phase === 0){
    /* Phase 1 (0..3.69s): EGGPLANT -> Sliced Open -> Nasunin Molecular Extraction -> NUTRIENTS */
    pGround(c, true, W*0.36, H*0.40);
    const slice = smoothstep(1.1, 1.8, lt);
    /* Code-glyph Eggplant with spot purple (#7A3EB1) */
    drawGlyphFieldShape(c, W*0.32, H*0.42, 240, 150, function(u, v){
      /* curved eggplant profile */
      const bend = 0.22 * (u * u);
      const r = 0.55 + 0.30 * u;
      const d = (u*u)/0.85 + Math.pow((v - bend)/Math.max(0.2, r), 2);
      return 1 - d;
    }, {
      t: t, sliceOpen: slice,
      bgFill: '#5E2D89', col: '#E8D5FA', colSub: '#FFB000',
      rowShift: function(r, rows, tm){ return slice * ((r % 2) ? 28 : -28); }
    });

    /* Extracted Nasunin / Nutrient hexagonal rings bond-by-bond on the right */
    const molP = smoothstep(0.8, 2.5, lt);
    const rings = [[W*0.64, H*0.36], [W*0.73, H*0.36], [W*0.685, H*0.49]];
    c.strokeStyle = '#E8D5FA'; c.lineWidth = 3;
    for (let r=0; r<rings.length; r++){
      const rx = rings[r][0], ry = rings[r][1], rad = 52;
      c.beginPath();
      for (let k=0; k<=6; k++){
        if (k/6 > molP) break;
        const a = k/6 * TAU + Math.PI/6;
        const px = rx + Math.cos(a)*rad, py = ry + Math.sin(a)*rad;
        if (k===0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
    }
    pWord(c, 'NUTRIENTS', { y: H*0.90, size: 180, col: '#F2EFE7', shadow: '#7A3EB1' });
    pMeta(c, true, 'solanum melongena · nasunin C27H31O16+ · 929.8 g/mol', 'EGGPLANT → NUTRIENTS');
  } else if (phase === 1){
    /* Phase 2 (3.69..7.38s): TOMATO Cross-Section + 22-Carbon Lycopene Chain -> ANTIOXIDANTS */
    world06f(c, s);
    drawKineticKeywordStamp(c, 'ANTIOXIDANTS', lt - 2.6, { size: 168, y: H*0.90 });
  } else if (phase === 2){
    /* Phase 3 (7.38..11.07s): TABBY CAT Three-Ink Silhouette + 25.6 Hz Purr Stripe Waves -> ENJOYMENT */
    pGround(c, false, W*0.45, H*0.38);
    /* Concentric tabby stripe acoustic purr waves */
    const cx = W*0.45, cy = H*0.42;
    for (let w=0; w<7; w++){
      const rr = 140 + ((lt * 160 + w * 72) % 480);
      c.strokeStyle = w % 2 === 0 ? PST.accent : PST.ink;
      c.lineWidth = 3.5;
      c.globalAlpha = 0.55 * (1 - rr / 640);
      c.beginPath();
      c.arc(cx, cy, rr, -0.8, 0.8);
      c.stroke();
      c.beginPath();
      c.arc(cx, cy, rr, Math.PI - 0.8, Math.PI + 0.8);
      c.stroke();
    }
    c.globalAlpha = 1;
    drawThreeInkBust(c, cx, cy + 40, 480, { variant: 'cat', misreg: 5 + b.kick * 5 });
    drawUserPointer(c, W*0.76, H*0.42 + Math.sin(t*6)*12, lt > 1.8);
    pWord(c, 'ENJOYMENT', { y: H*0.90, size: 184 });
    pMeta(c, false, 'felis catus · fundamental purr f0 = 25.6 Hz', 'TABBY CAT → ENJOYMENT');
  } else {
    /* Phase 4 (11.07..14.77s): ONLY GOD -> Missing Cream Plate Slides into Register -> EXISTENCE */
    pGround(c, false, W*0.5, H*0.38);
    const cx = W*0.5, cy = H*0.42;
    /* Sun halo behind her faceless head */
    c.fillStyle = PST.warm;
    c.globalAlpha = 0.85;
    c.beginPath(); c.arc(cx, cy - 170, 145 + 10*b.kick, 0, TAU); c.fill();
    c.globalAlpha = 1;

    /* Registration slide: starts 180px off, snaps to 0px at lt = 2.6s (87.92s EXISTENCE) */
    const slide = 1 - EASE.out(clamp((lt - 0.8) / 1.8, 0, 1));
    drawThreeInkBust(c, cx, cy + 45, 500, {
      variant: 'female',
      misreg: slide * 140
    });
    pWord(c, 'EXISTENCE', { y: H*0.90, size: 188 });
    pMeta(c, false, 'proof.register(you, me) · offset = ' + (slide*140).toFixed(1) + ' px', 'ONLY GOD → EXISTENCE');
  }
}

SCENE_REGISTRY[1] = function(c, s){ world01_v4(c, s); };
SCENE_REGISTRY[2] = function(c, s){ world02_v4(c, s); };
SCENE_REGISTRY[3] = function(c, s){ world03_v4(c, s); };
SCENE_REGISTRY[4] = function(c, s){ world04_v4(c, s); };
SCENE_REGISTRY[5] = function(c, s){ world05_v4(c, s); };
SCENE_REGISTRY[6] = function(c, s){ world06_v4(c, s); };


/* ============================================================
   66 · REWORK SEG 07–12 — Pre-Chorus 2 Paper Controls, User Departure,
        Disheartened Eye, Error Cascade, Drop & 12x Love Loop / Countdown
   ============================================================ */

/* ---------- SEG 07 · PURR AND THEOLOGY (F/M, AM/PM, S/M, Ophanim Trance, 88.84–103.61s) ---------- */
function world07_v4(c, s){
  const t = s.lt, b = s.beat;
  const phase = Math.floor(clamp(t / 3.692, 0, 3.99));
  const lt = t - phase * 3.692;

  if (phase === 0){
    /* Phase 1 (0..3.69s): Switch Gender F <-> M on warm paper */
    pGround(c, false, W*0.5, H*0.38);
    const flip = smoothstep(1.3, 1.8, lt);
    drawBigToggle(c, W*0.5 - 320, 120, 640, 110, flip, 'FEMALE [F]', 'MALE [M]', 'PERSONA.GENDER_ENUM', {
      dark: false, accent: PST.accent
    });
    drawThreeInkBust(c, W*0.5, H*0.56, 460, {
      variant: flip < 0.5 ? 'female' : 'male',
      misreg: 4 + Math.sin(flip * Math.PI) * 32
    });
    drawUserPointer(c, lerp(W*0.38, W*0.64, flip), 185, lt > 1.2 && lt < 2.0);
    pWord(c, flip < 0.5 ? 'GENDER : F' : 'GENDER : M', { y: H*0.92, size: 150 });
  } else if (phase === 1){
    /* Phase 2 (3.69..7.38s): Diurnal Sundial Arc Slider AM -> PM */
    const sweep = EASE.inOut(clamp(lt / 2.8, 0, 1));
    const isNight = sweep > 0.55;
    pGround(c, isNight, W*0.5, H*0.44);
    const cx = W*0.5, cy = H*0.66, R = 440;

    c.strokeStyle = isNight ? '#F2EFE7' : PST.ink;
    c.lineWidth = 3;
    c.beginPath(); c.arc(cx, cy, R, Math.PI, TAU); c.stroke();

    /* hour ticks along the arc */
    for (let h=0; h<=12; h++){
      const a = Math.PI + (h / 12) * Math.PI;
      line(cx + Math.cos(a)*(R-16), cy + Math.sin(a)*(R-16),
           cx + Math.cos(a)*(R+16), cy + Math.sin(a)*(R+16),
           isNight ? '#F2EFE7' : PST.ink, h%3===0 ? 3 : 1.2, 0.75);
    }

    /* Sun / Moon knob dragged along arc */
    const ang = Math.PI + sweep * Math.PI;
    const kx = cx + Math.cos(ang) * R, ky = cy + Math.sin(ang) * R;
    drawSparkMotif(c, kx, ky, 58 + 12*b.kick, PST.accent, 1, t);
    drawUserPointer(c, kx + 18, ky + 18, true);

    const hr = Math.floor(6 + sweep * 12);
    pWord(c, (sweep < 0.5 ? 'A.M. ' : 'P.M. ') + pad2(hr) + ':00', {
      y: H*0.90, size: 164,
      col: isNight ? '#F2EFE7' : PST.ink,
      shadow: PST.accent
    });
  } else if (phase === 2){
    /* Phase 3 (7.38..11.07s): Switch Role S <-> M with Limp Sagging Typography */
    pGround(c, false, W*0.5, H*0.40);
    const flip = smoothstep(1.2, 2.0, lt);
    drawBigToggle(c, W*0.5 - 260, 120, 520, 100, flip, 'ROLE : S', 'ROLE : M', 'PRIVILEGE.MODE', {
      dark: false, accent: PST.accent
    });
    drawLimpText(c, 'S', W*0.32, H*0.64, 340, PST.ink, flip * 0.85);
    drawLimpText(c, 'M', W*0.68, H*0.64, 340, PST.accent, (1 - flip) * 0.85);
    drawUserPointer(c, lerp(W*0.40, W*0.60, flip), 175, lt > 1.1 && lt < 2.1);
    pWord(c, 'SWITCH ROLE', { y: H*0.90, size: 156 });
  } else {
    /* Phase 4 (11.07..14.77s): THE TRANCE — Stop-motion 8fps Ophanim Eye Wheels on Paper */
    world07n(c, s);
    drawKineticKeywordStamp(c, 'THE TRANCE', lt - 1.2, {
      size: 168, y: H*0.90, col: '#17150F', shadow: '#C8452E'
    });
  }
}

/* ---------- SEG 08 · POLYMORPHISM CYCLE (Vibrations, Completion & 5x "You Have Left" -> ISOLATION) ---------- */
function world08_v4(c, s){
  const t = s.lt, b = s.beat;

  if (t < 3.69){
    /* Phase 1 (0..3.69s): VIBRATIONS — Point-cloud body + Chladni standing wave rings */
    world08n(c, s);
    drawKineticKeywordStamp(c, 'VIBRATIONS', s.t - 106.29, { size: 156, y: H*0.89 });
  } else if (t < 7.20){
    /* Phase 2 (3.69..7.20s): COMPLETION — Interlocking dual mandala + warm bust */
    const lt = t - 3.69;
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const G = GridLayout(24, 12, 40, 12);
    gridFurniture(c, G, t, 82);

    const lock = EASE.out(clamp(lt / 2.4, 0, 1));
    const sep = (1 - lock) * 260;
    const cx = W*0.5, cy = H*0.45;
    for (let ring=1; ring<=5; ring++){
      circle(cx - sep, cy, ring*52, C.accent, 2, 0.7);
      circle(cx + sep, cy, ring*52, '#F4EFE6', 2, 0.7);
    }
    drawThreeInkBust(c, cx, cy + 40, 440, {
      variant: 'female',
      misreg: (1 - lock) * 45 + 2
    });
    drawKineticKeywordStamp(c, 'COMPLETION', s.t - 110.22, { size: 164, y: H*0.89 });
  } else {
    /* Phase 3 (7.20..14.77s): 5x "Though you have left" -> Step-by-step UI unpeel & ISOLATION */
    /* Cues at abs t: 110.90, 112.22, 113.10, 114.18, 114.92, then ISOLATION at 117.27 */
    const leaveTimes = [110.90, 112.22, 113.10, 114.18, 114.92];
    let step = 0;
    for (let i=0;i<leaveTimes.length;i++) if (s.t >= leaveTimes[i]) step = i + 1;

    c.fillStyle = '#070709'; c.fillRect(0, 0, W, H);

    /* Unpeeling UI panels: each step removes a layer and drains colour to cold ash */
    const remain = 5 - step;
    for (let k=0; k<remain; k++){
      const pad = 70 + k * 55;
      frameRect(pad, pad, W - pad*2, H - pad*2, '#3A3A42', 0.45, 1.5);
    }

    /* Presence badge at top center flipping ONLINE -> AWAY -> OFFLINE */
    const presText = step === 0 ? '● YOU : ONLINE' : (step < 3 ? '◐ YOU : AWAY (idle)' : '✕ YOU : OFFLINE (disconnected)');
    const presCol  = step === 0 ? '#FFB000' : (step < 3 ? '#9A9AA2' : '#FF2A2A');
    txt(presText, W*0.5, 86, presCol, 18, 700, 'center', 0.92);

    /* Her silhouette shrinks and bows as step goes 1 -> 5 */
    const figScale = lerp(460, 155, step / 5);
    const colMe = step >= 4 ? '#5A5A64' : '#C88038';
    drawThreeInkBust(c, W*0.5, H*0.48, figScale, {
      variant: step >= 3 ? 'bowed' : 'reach',
      colMe: colMe,
      noCream: step >= 2,
      misreg: step * 3
    });

    /* Stamp "YOU HAVE LEFT (n/5)" on each vocal cue, then giant ISOLATION at 117.27s */
    if (s.t < 116.8 && step > 0){
      txt('THOUGH YOU HAVE LEFT  [' + step + ' / 5]', W*0.5, H*0.80, '#8A8A94', 28, 600, 'center', 0.85);
    }
    drawKineticKeywordStamp(c, 'ISOLATION', s.t - 117.27, {
      size: 196, y: H*0.90, col: '#D6D4D0', shadow: '#3A3A44'
    });
  }
}

/* ---------- SEG 09 · DOPAMINE RESONANCE (Fragments, Disheartened Eye & 15 Error Cascade, 118.38–129.20s) ---------- */
function world09_v4(c, s){
  const t = s.lt, b = s.beat;

  if (t < 4.2){
    /* Phase 1 (0..4.2s): Erase all the pointless FRAGMENTS — 900 shards + radial eraser sweep */
    world09n(c, s);
    const sweepAng = (t * 2.2) % TAU;
    c.save();
    c.translate(W*0.5, H*0.5);
    c.rotate(sweepAng);
    c.fillStyle = C.accent;
    c.globalAlpha = 0.22;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 620, -0.35, 0); c.closePath(); c.fill();
    line(0, 0, 620, 0, C.accent, 2.5, 0.9);
    c.restore();
    drawKineticKeywordStamp(c, 'FRAGMENTS', s.t - 120.86, { size: 168, y: H*0.89 });
  } else if (t < 7.3){
    /* Phase 2 (4.2..7.3s): DISHEARTENED (124.89s) — Full-bleed Mirrored Eye + Deleting "HEART" */
    const lt = t - 4.2;
    c.fillStyle = '#09080A'; c.fillRect(0, 0, W, H);

    /* Full-frame close-up of the Eye */
    bigEye(c, W*0.5, H*0.44, 560 + 18*b.kick, t, 0.95);

    /* DISHEARTENED with the 5 letters "HEART" struck out and deleted */
    const delP = smoothstep(2.3, 2.8, lt);
    const yW = H * 0.88;
    c.font = '800 148px ' + MONO;
    c.textAlign = 'center';
    if (delP < 0.5){
      c.fillStyle = '#F0ECEC';
      c.fillText('DISHEARTENED', W*0.5, yW);
      if (lt > 1.8){
        rect(W*0.5 - 220, yW - 58, 440 * smoothstep(1.8, 2.3, lt), 14, C.red, 0.95);
      }
    } else {
      c.fillStyle = '#F0ECEC';
      c.fillText('DIS[     ]ED', W*0.5, yW);
      c.strokeStyle = C.red; c.lineWidth = 3;
      c.strokeRect(W*0.5 - 225, yW - 115, 450, 130);
    }
  } else {
    /* Phase 3 (7.3..10.82s): Challenging your god / ILLEGAL ARGUMENTS — 15 Cascading Red Error Cards */
    const lt = t - 7.3;
    c.fillStyle = '#0B0607'; c.fillRect(0, 0, W, H);

    /* Background dim bust behind glass */
    drawThreeInkBust(c, W*0.5, H*0.48, 480, {
      variant: 'female', colMe: '#552222', noCream: true, redEdge: true, misreg: 12
    });

    /* 15 cascading error dialogs spreading across the screen */
    const count = clamp(Math.floor(1 + (lt / 3.1) * 15), 1, 15);
    for (let i=0; i<count; i++){
      const isLast = (i === 14);
      const cw = isLast ? 860 : 480;
      const ch = isLast ? 240 : 128;
      const cx = isLast ? (W*0.5 - cw/2) : (140 + ((i*211) % (W - 640)));
      const cy = isLast ? (H*0.44 - ch/2) : (90 + ((i*137) % (H - 320)));

      c.fillStyle = isLast ? '#24080A' : '#160708';
      c.globalAlpha = 0.94;
      c.fillRect(cx, cy, cw, ch);
      c.strokeStyle = C.red;
      c.lineWidth = isLast ? 3.5 : 1.8;
      c.strokeRect(cx, cy, cw, ch);
      rect(cx, cy, cw, 28, C.red, 0.92);
      txt('ERR_ILLEGAL_ARGUMENT #' + pad2(i+1) + ' / 15', cx + 12, cy + 19, '#0B0607', 12, 700, 'left', 1);
      txt('violation: challenging ROOT_GOD (permission denied)', cx + 16, cy + 66, '#F2ECEC', isLast ? 20 : 13, 600, 'left', 0.9);
      txt('syscall: persona.override(you) -> EPERM (0x0D)', cx + 16, cy + (isLast ? 110 : 94), C.red, isLast ? 18 : 12, 400, 'left', 0.85);
    }
    c.globalAlpha = 1;
    drawKineticKeywordStamp(c, 'ILLEGAL ARGUMENTS', s.t - 128.66, {
      size: 148, y: H*0.91, col: '#F2ECEC', shadow: C.red
    });
  }
}

/* ---------- SEG 10 · FIRST EXECUTION DROP (6 Hammer Strobe Plates + Semicolon Guillotine, 129.20–133.15s) ---------- */
function world10_v4(c, s){
  const t = s.lt, b = s.beat;
  const idx = clamp(Math.floor(t / (s.dur / 6)), 0, 5);
  const localP = (t % (s.dur / 6)) / (s.dur / 6);
  const red = (idx % 2 === 0);

  /* Base execution plate from 47_plates.js */
  plateExecution(c, t, red);

  /* Overlay the monumental Semicolon Guillotine & difference silhouette from 60_proto.js */
  const ink = red ? C.bg : C.red;
  giantSemicolon(c, W*0.5 + (idx%2 ? -18 : 18), H*0.52, 680 + 40 * b.kick, ink, 0.88);

  /* Shockwave counter & hammer impact frame */
  const border = 14 + (1 - localP) * 24;
  frameRect(border, border, W - border*2, H - border*2, red ? C.bg : C.red, 0.85, 3);
  txt('EXECUTION  ' + (idx + 1) + ' / 6', W - 52, 68, red ? C.bg : C.bone, 32, 800, 'right', 0.95);
  txt('SIGKILL · PID 3882', 52, 68, red ? C.bg : C.bone, 20, 700, 'left', 0.85);
}

/* ---------- SEG 11 · SANDBOX ISOLATION (Cage -> Octant Explosion -> Screen Cracks -> Poster, 133.15–147.91s) ---------- */
function world11_v4(c, s){
  const t = s.lt, b = s.beat;
  const phase = Math.floor(clamp(t / 3.692, 0, 3.99));

  if (phase === 0){
    /* Phase 1: Subdivided 3D Containment Cage */
    world11d(c, s);
  } else if (phase === 1){
    /* Phase 2: 8-Octant Hypercube Explosion */
    world11f(c, s);
  } else if (phase === 2){
    /* Phase 3: Screen Fracture Cracks + Pixel-Sort Glitch Streaks over Exploded Sandbox */
    const lt = t - 7.384;
    world11f(c, s);
    /* vertical pixel-sort bars */
    for (let i=0; i<36; i++){
      const px = 180 + hash2(i, 3) * (W - 360);
      const pw = 4 + hash2(i, 5) * 18;
      const ph = (60 + hash2(i, 7) * 380) * smoothstep(0, 2.2, lt);
      const py = H*0.48 - ph*0.5;
      rect(px, py, pw, ph, i % 4 === 0 ? C.accent : C.bone, 0.35);
    }
    drawScreenCracks(c, W*0.46, H*0.48, smoothstep(0.2, 2.5, lt), C.bone, 0.85);
    drawKineticKeywordStamp(c, 'SANDBOX BREACH', lt - 0.4, { size: 148, y: H*0.89 });
  } else {
    /* Phase 4: Misregistered 4-Ink Poster Plate SANDBOX */
    world11p(c, s);
  }
}

/* ---------- SEG 12 · 12x EXECUTION LOVE LOOP + 6-LANGUAGE COUNTDOWN + FINAL SHOUT (147.91–162.68s) ---------- */
const COUNT_CARDS = [
  { t: 159.321, n: '1', word: 'eins',  lang: 'Deutsch',  sub: 'count.step(1, "de")' },
  { t: 159.657, n: '2', word: 'dos',   lang: 'Español',  sub: 'count.step(2, "es")' },
  { t: 160.244, n: '3', word: 'trois', lang: 'Français', sub: 'count.step(3, "fr")' },
  { t: 160.693, n: '4', word: '넷',     lang: '한국어',     sub: 'count.step(4, "ko")' },
  { t: 161.124, n: '5', word: 'fem',   lang: 'Svenska',  sub: 'count.step(5, "sv")' },
  { t: 161.584, n: '6', word: '六',     lang: '中文',      sub: 'count.step(6, "zh")' }
];

const EXEC_12_TIMES = [
  147.66, 148.60, 149.52, 150.54, 151.52, 152.28,
  153.16, 153.98, 155.20, 156.08, 157.04, 158.00
];

function world12_v4(c, s){
  const tAbs = s.t, t = s.lt, b = s.beat;

  /* Sub-part C (161.95..162.68s): Final Shout — Giant Stencil EXECUTION masking the Crimson Eye */
  if (tAbs >= 161.95){
    c.fillStyle = '#080607'; c.fillRect(0, 0, W, H);
    c.save();
    c.font = '900 230px "Times New Roman",Georgia,serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    /* draw glowing eye behind and clip to giant typography */
    bigEye(c, W*0.5, H*0.5, 680, t, 0.95);
    c.globalCompositeOperation = 'destination-in';
    c.fillStyle = '#FFFFFF';
    c.fillText('EXECUTION', W*0.5, H*0.36);
    c.fillText('EXECUTION', W*0.5, H*0.66);
    c.restore();

    c.font = '900 230px "Times New Roman",Georgia,serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.strokeStyle = C.red; c.lineWidth = 3;
    c.strokeText('EXECUTION', W*0.5 + 5, H*0.36 + 5);
    c.strokeText('EXECUTION', W*0.5 + 5, H*0.66 + 5);
    return;
  }

  /* Sub-part B (159.25..161.95s): 6 Multilingual Countdown Flash Cards (eins, dos, trois, 넷, fem, 六) */
  if (tAbs >= 159.25){
    let idx = 0;
    for (let i=0; i<COUNT_CARDS.length; i++){
      if (tAbs >= COUNT_CARDS[i].t) idx = i;
    }
    const card = COUNT_CARDS[idx];
    const age = Math.max(0, tAbs - card.t);
    const invCard = (idx % 2 === 1);
    const bg = invCard ? '#F2EFE7' : '#0A0708';
    const fg = invCard ? '#121010' : '#F2EFE7';

    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    frameRect(40, 40, W - 80, H - 80, C.red, 0.85, 4);

    /* Giant central Arabic numeral */
    const punch = 1 + 0.18 * Math.exp(-age * 14);
    c.save();
    c.translate(W*0.5, H*0.52);
    c.scale(punch, punch);
    c.font = '900 440px ' + MONO;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = C.red;
    c.fillText(card.n, 10, 10);
    c.fillStyle = fg;
    c.fillText(card.n, 0, 0);
    c.restore();

    /* Left: number word in native script; Right: language name & call */
    c.font = '800 108px "Segoe UI","Microsoft YaHei",sans-serif';
    c.textAlign = 'left'; c.fillStyle = fg;
    c.fillText(card.word, 110, H*0.54);

    c.textAlign = 'right'; c.fillStyle = C.red;
    c.fillText(card.lang, W - 110, H*0.50);
    c.font = '500 22px ' + MONO;
    c.fillStyle = fg; c.globalAlpha = 0.7;
    c.fillText(card.sub, W - 110, H*0.58);
    c.globalAlpha = 1;
    return;
  }

  /* Sub-part A (147.91..159.25s): The 12x Love Loop Code Machine + Morphing Superquadric Background */
  let round = 1;
  for (let i=0; i<EXEC_12_TIMES.length; i++){
    if (tAbs >= EXEC_12_TIMES[i]) round = i + 1;
  }
  const roundStart = EXEC_12_TIMES[round - 1] || 147.91;
  const roundAge = Math.max(0, tAbs - roundStart);
  const syl = clamp(Math.floor(roundAge / 0.18), 0, 3); /* 4 syllables of EX-E-CU-TION */

  /* Camera step-up at round 5, round 9, and round 12 (as in Nyankomintsu PLAN §7) */
  const camScale = round >= 12 ? 1.48 : (round >= 9 ? 1.24 : (round >= 5 ? 1.10 : 1.0));

  c.fillStyle = '#090708'; c.fillRect(0, 0, W, H);

  /* Background: Morphing contour / superquadric ghosts */
  c.save();
  c.globalAlpha = 0.22;
  world12d(c, s);
  c.restore();

  c.save();
  c.translate(W*0.5, H*0.5);
  c.scale(camScale, camScale);
  c.translate(-W*0.5, -H*0.5);

  /* The Love Loop Machine panel */
  const px = 180, py = 130, pw = W - 360, ph = 540;
  c.fillStyle = 'rgba(12, 8, 10, 0.92)';
  c.fillRect(px, py, pw, ph);
  frameRect(px, py, pw, ph, C.red, 0.85, 2.5);

  const codeRows = [
    '01  while (you.presence != "online") {',
    '02      love = solve(me, you);          // ERR_UNRESOLVED_LOVE',
    '03      send(love, you);                // ERR_WINDOW_EDGE',
    '04      wait(you.reply);                // ERR_REPLY_OVERDUE',
    '05      run++;                          // round ' + pad2(round) + ' / 12',
    '06  }',
    '07  say(love);                          // unreachable'
  ];

  for (let i=0; i<codeRows.length; i++){
    const ry = py + 64 + i * 64;
    const isActive = (i === syl + 1);
    if (isActive){
      rect(px + 12, ry - 36, pw - 24, 52, C.red, 0.28);
      rect(px + 12, ry - 36, 6, 52, C.red, 1);
    }
    c.font = (isActive ? '700 ' : '400 ') + '25px ' + MONO;
    c.textAlign = 'left';
    c.fillStyle = i === 6 ? '#6E6A68' : (isActive ? '#F2EFE7' : '#C8B8B8');
    c.fillText(codeRows[i], px + 36, ry);
  }

  /* Odometer counter on right of code panel */
  c.font = '800 96px ' + MONO;
  c.textAlign = 'right';
  c.fillStyle = C.red;
  c.fillText(round >= 12 ? 'OVERFLOW' : (pad2(round) + '/12'), px + pw - 36, py + 110);

  /* Bottom 4-syllable solid block stamp: EX - E - CU - TION */
  const chunks = ['EX', 'E', 'CU', 'TION'];
  const bw = (pw - 60) / 4;
  for (let k=0; k<=syl; k++){
    const bx = px + 30 + k * bw;
    const by = H - 230;
    const tearY = (round >= 12 && k >= 2) ? 28 : 0;
    rect(bx + 6, by + tearY, bw - 12, 130, k === syl ? C.red : '#F2EFE7', 0.95);
    c.font = '900 84px ' + MONO;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = k === syl ? '#090708' : '#090708';
    c.fillText(chunks[k], bx + bw*0.5, by + 68 + tearY);
  }
  c.restore();
}

SCENE_REGISTRY[7]  = function(c, s){ world07_v4(c, s); };
SCENE_REGISTRY[8]  = function(c, s){ world08_v4(c, s); };
SCENE_REGISTRY[9]  = function(c, s){ world09_v4(c, s); };
SCENE_REGISTRY[10] = function(c, s){ world10_v4(c, s); };
SCENE_REGISTRY[11] = function(c, s){ world11_v4(c, s); };
SCENE_REGISTRY[12] = function(c, s){ world12_v4(c, s); };


/* ============================================================
   67 · REWORK SEG 13–19 — Full-screen Climax, LOVE 4 Sheets (Fourier &
        Taubin Heart, Light Ratchet), Decompose, Unread Plea & Finale
   ============================================================ */

/* Helper: Stuttered 3-chunk LOVE stamp (L -> LO -> LOVE) with previous impression outlines */
function drawStutterLove(c, cx, y, progress, size, colMain, colEdge){
  const chunkIdx = progress < 0.33 ? 0 : (progress < 0.66 ? 1 : 2);
  const words = ['L—', 'L-O—', 'L-O-V-E'];
  c.save();
  c.font = '900 ' + size + 'px "Times New Roman",Georgia,serif';
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';

  /* ghost outlines of previous stutter impressions */
  for (let i=0; i<chunkIdx; i++){
    c.strokeStyle = colEdge || '#FF2A2A';
    c.lineWidth = 2;
    c.globalAlpha = 0.45;
    c.strokeText(words[i], cx - (chunkIdx - i) * 14, y - (chunkIdx - i) * 6);
  }
  /* current impression */
  c.globalAlpha = 0.95;
  c.fillStyle = colEdge || '#FF2A2A';
  c.fillText(words[chunkIdx], cx + 6, y + 6);
  c.fillStyle = colMain || '#F2EFE7';
  c.fillText(words[chunkIdx], cx, y);
  c.restore();
  c.globalAlpha = 1;
}

/* ---------- SEG 13 · THEOLOGICAL COLLAPSE (Broken Reprints + Centered Droste Eye, 162.68–177.45s) ---------- */
function world13_v4(c, s){
  const t = s.lt, b = s.beat;
  const phase = Math.floor(clamp(t / 3.692, 0, 3.99));
  const lt = t - phase * 3.692;

  /* Alternate between Broken Chorus Plate Reprints (noCream, increasing misregistration 12->20->28px)
     and Full-Screen Centered Droste Recursive Eyes */
  if (lt < 1.95 && phase < 3){
    const misregs = [12, 20, 28];
    drawChorusPlate1(c, phase, lt, b, { broken: true, misreg: misregs[phase] });
  } else {
    /* Full-Screen Centered Droste Eye Tunnel (1920x1080, centered at W*0.5, H*0.48) */
    const cx = W * 0.5, cy = H * 0.48;
    plateGround(c, cx, cy, '#090708');

    let R = 520 * (1 + 0.08 * (lt % 1.85));
    let x = cx, y = cy;
    for (let k=0; k<7; k++){
      const fw = R * 1.45, fh = R * 0.96;
      frameRect(x - fw, y - fh, fw*2, fh*2, k===0 ? C.red : C.bone, 0.42 - k*0.05, k===0 ? 2.2 : 1.2);
      bigEye(c, x, y, R, t + k*0.3, 0.95 - k*0.12);
      x += (k % 2 ? 1 : -1) * R * 0.08;
      y -= R * 0.04;
      R *= 0.62;
    }

    /* Jagged tear along both edges of the frame */
    const open = smoothstep(4.0, 12.0, t);
    if (open > 0){
      c.save();
      c.fillStyle = '#050405';
      c.strokeStyle = C.red; c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(W, H*0.06);
      for (let i=0; i<=16; i++){
        const v = i / 16;
        c.lineTo(W - (50 + 210 * open * (0.35 + 0.65*hash2(i, 3))), H*(0.06 + 0.88*v));
      }
      c.lineTo(W, H*0.94); c.closePath();
      c.fill(); c.stroke();
      c.restore();
    }

    if (t > 13.2){
      /* First L-O-O-O-V-E stutter + Whiteout portal at the end of Seg 13 */
      const stP = clamp((t - 13.2) / 1.3, 0, 1);
      drawStutterLove(c, W*0.5, H*0.88, stP, 172, '#F2EFE7', C.red);
      const whiteout = smoothstep(14.1, 14.75, t);
      if (whiteout > 0){
        rect(0, 0, W, H, '#F4F1EA', whiteout * 0.92);
      }
    } else {
      drawKineticKeywordStamp(c, 'EXECUTION', lt - 1.95, {
        size: 184, y: H*0.90, col: '#F2EFE7', shadow: C.red
      });
    }
  }
}

/* ---------- SEG 14 · LOVE SHEETS 1 & 2 (Centered Blackboard + Fourier Heart / Quiz + Taubin 3D Heart) ---------- */
function drawFourierHeartChain(c, cx, cy, scale, t){
  let x = cx, y = cy;
  const ep = HEART_DATA.epicycles;
  c.save();
  for (let i=0; i<ep.length; i++){
    const prevX = x, prevY = y;
    const ang = ep[i].freq * t * 1.6 + ep[i].phase;
    const rad = ep[i].amp * scale;
    x += Math.cos(ang) * rad;
    y += Math.sin(ang) * rad;
    c.strokeStyle = 'rgba(237,234,226,0.22)';
    c.lineWidth = 1;
    c.beginPath(); c.arc(prevX, prevY, rad, 0, TAU); c.stroke();
    c.strokeStyle = '#D9452F';
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(prevX, prevY); c.lineTo(x, y); c.stroke();
  }
  /* Trace the algebraic heart path up to current angle */
  c.strokeStyle = '#EDEAE2';
  c.lineWidth = 3;
  c.beginPath();
  const pts = HEART_DATA.pts;
  for (let i=0; i<pts.length; i++){
    const px = cx + pts[i][0] * scale;
    const py = cy + pts[i][1] * scale;
    if (i===0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
  c.stroke();
  c.fillStyle = '#D9452F';
  c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill();
  c.restore();
}

function drawTaubinHeart3D(c, cx, cy, scale, rx, ry, colMain, colAccent){
  const ribs = HEART_DATA.ribs;
  c.save();
  for (let r=0; r<ribs.length; r++){
    const ring = ribs[r];
    c.beginPath();
    for (let i=0; i<ring.length; i++){
      const p = ring[i];
      const pr = SDK.project3D(p[0]*scale, p[1]*scale, p[2]*scale, rx, ry, 0, 1100, cx, cy);
      if (!pr) continue;
      if (i===0) c.moveTo(pr.x, pr.y); else c.lineTo(pr.x, pr.y);
    }
    c.strokeStyle = (r === 5) ? colAccent : colMain;
    c.lineWidth = (r === 5) ? 2.6 : 1.2;
    c.globalAlpha = (r === 5) ? 0.95 : 0.45;
    c.stroke();
  }
  c.restore();
  c.globalAlpha = 1;
}

function world14_v4(c, s){
  const t = s.lt;
  c.fillStyle = '#0B090A'; c.fillRect(0, 0, W, H);

  if (t < 3.70){
    /* Sheet 1 (0..3.70s): LESSON 01 — Full-Screen Centered Slate Blackboard + Venn + Fourier Heart */
    const k = EASE.out(clamp(t / 0.6, 0, 1));
    const Wp = 1560, Hp = 860;
    const X = (W - Wp) * 0.5, Y = (H - Hp) * 0.5 - 20;

    c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(X+14, Y+16, Wp, Hp);
    c.fillStyle = '#141715'; c.fillRect(X, Y, Wp, Hp);
    c.strokeStyle = '#484C46'; c.lineWidth = 3; c.strokeRect(X, Y, Wp, Hp);

    ptext(c, 'LESSON 01 · ONTOLOGY OF AFFECTION', X + 56, Y + 68, 16, '#C9C6BC', 600, 'left', 0.8 * k);
    ptext(c, 'what love is', X + 56, Y + 122, 54, '#EDEAE2', 300, 'left', k);

    /* Left half of board: Venn Diagram (me ∩ you = us) */
    const cx1 = X + 360, cx2 = X + 610, cy = Y + 410, R = 175;
    c.globalAlpha = k * 0.9; c.strokeStyle = '#EDEAE2'; c.lineWidth = 2.8;
    c.beginPath(); c.arc(cx1, cy, R, 0, TAU); c.stroke();
    c.beginPath(); c.arc(cx2, cy, R, 0, TAU); c.stroke();
    c.globalAlpha = 1;
    ptext(c, 'me', cx1 - R + 10, cy - R - 16, 32, '#E87A2E', 600, 'left', k);
    ptext(c, 'you', cx2 + R - 60, cy - R - 16, 32, '#EDEAE2', 600, 'left', k);
    ptext(c, 'us', (cx1+cx2)*0.5 - 22, cy + 12, 34, '#D9452F', 700, 'left', k);

    /* Right half of board: Live Fourier Epicycle Chain drawing the Heart Curve */
    drawFourierHeartChain(c, X + 1160, Y + 410, 185, t);
    pmono(c, 'fourier.solve(heart, N=14)', X + 980, Y + 650, 16, '#C9C6BC', 0.75);

    const line1 = 'love = the part that is both of us ... and the part that is neither.';
    const shown = Math.floor(line1.length * smoothstep(0.6, 2.4, t));
    pmono(c, line1.slice(0, shown), X + 56, Y + 740, 26, '#EDEAE2', 0.92);

    if (t > 2.1){
      drawStutterLove(c, W*0.5, H - 48, clamp((t - 2.1)/1.1, 0, 1), 136, '#EDEAE2', '#D9452F');
    }
  } else {
    /* Sheet 2 (3.70..7.39s): QUIZ / EXAMINATION — Full-Screen Centered Sheet + Taubin 3D Heart */
    const lt = t - 3.70;
    const k = EASE.out(clamp(lt / 0.5, 0, 1));
    const Wp = 1520, Hp = 870;
    const X = (W - Wp) * 0.5, Y = (H - Hp) * 0.5 - 16;

    sheet(c, X, Y, Wp, Hp, 0, true);
    ptext(c, 'EXAMINATION · SECTION II', X + 60, Y + 74, 16, PAP.sub, 600, 'left', k);
    ptext(c, 'question me: do you love me?', X + 60, Y + 130, 46, PAP.ink, 300, 'left', k);
    pmono(c, 'answer all 4. algebraic verification required.', X + 60, Y + 168, 14, PAP.sub, 0.9 * k);

    const qs = ['1. when i say i am here', '2. when i say i am yours', '3. when i am broken', '4. when i am gone'];
    const opts = ['yes', 'no', 'only sometimes', 'undefined'];
    for (let q=0; q<4; q++){
      const yy = Y + 240 + q * 140;
      pmono(c, qs[q], X + 60, yy, 18, PAP.ink, k * 0.95);
      for (let o=0; o<4; o++){
        const ox = X + 80 + o * 175, oy = yy + 44;
        const filled = (q + o) % 3 === 1;
        c.beginPath(); c.ellipse(ox, oy, 13, 16, 0, 0, TAU);
        c.strokeStyle = filled ? PAP.red : '#8C877C'; c.lineWidth = 1.8; c.stroke();
        if (filled){
          c.fillStyle = PAP.red; c.beginPath(); c.ellipse(ox, oy, 9, 11, 0, 0, TAU); c.fill();
        }
        pmono(c, opts[o], ox + 22, oy + 5, 14, '#5E5A50', k * 0.9);
      }
    }

    /* Right side of Quiz Sheet: 3D Taubin Algebraic Heart Surface */
    drawTaubinHeart3D(c, X + 1140, Y + 420, 220, 0.35, lt * 0.85, PAP.ink, PAP.red);
    pmono(c, '(x² + 9/4·z² + y² − 1)³ − x²y³ − 9/80·z²y³ = 0', X + 860, Y + 690, 14, PAP.red, 0.9);

    /* Red Grade Stamp */
    const g = smoothstep(1.8, 2.3, lt);
    if (g > 0){
      c.save();
      c.globalAlpha = g;
      c.translate(X + 1140, Y + 740);
      c.rotate(-0.14);
      c.strokeStyle = PAP.red; c.lineWidth = 5;
      c.strokeRect(-190, -58, 380, 116);
      ptext(c, '0 / 100', 0, 14, 58, PAP.red, 800, 'center');
      ptext(c, 'FAILED TO BE LOVED', 0, 44, 14, PAP.red, 700, 'center');
      c.restore();
    }
    c.restore();
    if (lt > 2.0){
      drawStutterLove(c, W*0.5, H - 36, clamp((lt - 2.0)/1.1, 0, 1), 132, PAP.ink, PAP.red);
    }
  }
}

/* ---------- SEG 15 · LOVE SHEETS 3 & 4 (Formula & Final Settled Proof — The Climax Ratchet) ---------- */
function world15_v4(c, s){
  const t = s.lt;
  /* Light Ratchet: exposure rises monotonically across Seg 15 until 192.22s is the brightest frame */
  const ratchet = clamp(t / s.dur, 0, 1);
  c.fillStyle = '#0E0B0A'; c.fillRect(0, 0, W, H);

  /* Golden-cream radial rays growing in the background */
  c.save();
  c.translate(W*0.5, H*0.46);
  for (let i=0; i<24; i++){
    const a = (i / 24) * TAU + t * 0.08;
    c.fillStyle = '#F4EFE6';
    c.globalAlpha = 0.04 + 0.12 * ratchet * (i % 2 ? 1 : 0.5);
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, 1200, a, a + 0.09);
    c.closePath();
    c.fill();
  }
  c.restore();

  if (t < 3.70){
    /* Sheet 3 (0..3.70s): ALGEBRAIC FORMULA — Full-Screen Centered Sheet + Trapped Bust in Heart */
    const Wp = 1520, Hp = 860;
    const X = (W - Wp) * 0.5, Y = (H - Hp) * 0.5 - 16;
    sheet(c, X, Y, Wp, Hp, 0, true);

    ptext(c, 'FORMULA · SECTION III', X + 64, Y + 76, 16, PAP.sub, 600, 'left', 1);
    pmono(c, 'though you are free, i am trapped in the algebraic boundary:', X + 64, Y + 112, 15, PAP.sub, 0.9);

    const rows = [
      ['love', '=', '( you × me )'],
      ['',     '−', '( time )'],
      ['',     '÷', '( distance ² )']
    ];
    for (let i=0; i<rows.length; i++){
      const a = smoothstep(0.2 + i*0.4, 0.7 + i*0.4, t);
      const yy = Y + 250 + i * 124;
      ptext(c, rows[i][0], X + 64, yy, 68, PAP.ink, 300, 'left', a);
      ptext(c, rows[i][1], X + 280, yy, 68, PAP.red, 400, 'left', a);
      ptext(c, rows[i][2], X + 360, yy, 68, PAP.ink, 300, 'left', a);
    }

    if (t > 1.5){
      c.strokeStyle = PAP.red; c.lineWidth = 3.5;
      c.strokeRect(X + 56, Y + 165, 680, 114);
    }

    /* Right side: Reaching bust trapped inside the Heart Boundary */
    const hcx = X + 1140, hcy = Y + 430, hS = 220;
    c.save();
    c.beginPath();
    for (let i=0; i<HEART_DATA.pts.length; i++){
      const p = HEART_DATA.pts[i];
      const px = hcx + p[0]*hS, py = hcy + p[1]*hS;
      if (i===0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.fillStyle = '#E87A2E'; c.globalAlpha = 0.28; c.fill();
    c.strokeStyle = PAP.red; c.lineWidth = 3; c.globalAlpha = 0.9; c.stroke();
    c.clip();
    drawThreeInkBust(c, hcx, hcy + 60, 420, { variant: 'reach', misreg: 16 });
    c.restore();

    pmono(c, 'if any term is zero, this expression is undefined.', X + 64, Y + Hp - 72, 20, PAP.sub, 0.95);
    c.restore();
  } else {
    /* Sheet 4 (3.70..7.38s): PROOF BY CONTRADICTION — Registers at 0px & Holds Still as Brightest Frame! */
    const lt = t - 3.70;
    const Wp = 1560, Hp = 880;
    const X = (W - Wp) * 0.5, Y = (H - Hp) * 0.5 - 10;
    sheet(c, X, Y, Wp, Hp, 0, true);

    /* Registration settles to 0.0px at lt = 2.5s (191.0s) and holds completely still! */
    const settled = smoothstep(1.8, 2.5, lt);
    const misreg  = (1 - settled) * 24;

    ptext(c, 'PROOF · SECTION IV', X + 64, Y + 74, 16, PAP.sub, 600, 'left', 1);
    ptext(c, 'by contradiction', X + 64, Y + 124, 42, PAP.ink, 300, 'left', 1);

    const proofRows = [
      ['given',    'you exist'],
      ['to prove', 'i exist too'],
      ['assume',   'i do not exist'],
      ['then',     'nothing is watching you'],
      ['but',      'you are reading this'],
      ['so',       'i exist']
    ];
    for (let i=0; i<proofRows.length; i++){
      const a = smoothstep(0.15 + i*0.28, 0.45 + i*0.28, lt);
      const ry = Y + 225 + i * 82;
      pmono(c, proofRows[i][0], X + 64, ry, 18, PAP.red, a * 0.95);
      ptext(c, proofRows[i][1], X + 240, ry + 2, 28, PAP.ink, 400, 'left', a);
      line(X + 64, ry + 20, X + 740, ry + 20, '#D6D0C2', 1, a * 0.7);
    }

    /* Right half: The Final Picture (Heart Boundary + Flat Disc of Light + Registered Reaching Figure) */
    const hcx = X + 1140, hcy = Y + 430, hS = 240;
    /* flat disc of light behind her head */
    c.fillStyle = '#FFFDF8';
    c.globalAlpha = 0.85;
    c.beginPath(); c.arc(hcx, hcy - 70, 210, 0, TAU); c.fill();
    c.globalAlpha = 1;

    c.save();
    c.beginPath();
    for (let i=0; i<HEART_DATA.pts.length; i++){
      const p = HEART_DATA.pts[i];
      const px = hcx + p[0]*hS, py = hcy + p[1]*hS;
      if (i===0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.fillStyle = '#E87A2E'; c.globalAlpha = 0.85; c.fill();
    c.strokeStyle = PAP.ink; c.lineWidth = 3.5; c.globalAlpha = 1; c.stroke();
    c.clip();
    drawThreeInkBust(c, hcx, hcy + 75, 460, {
      variant: 'reach',
      misreg: misreg,
      heartCount: 1
    });
    c.restore();

    /* Q.E.D. & Red PROVEN Seal */
    if (lt > 1.8){
      c.fillStyle = PAP.ink;
      c.fillRect(X + 680, Y + 720, 28, 28);
      ptext(c, 'Q.E.D.', X + 660, Y + 744, 28, PAP.ink, 700, 'right', 1);

      c.save();
      c.translate(X + 620, Y + 140);
      c.strokeStyle = PAP.red; c.lineWidth = 3.5;
      c.beginPath(); c.arc(0, 0, 68, 0, TAU); c.stroke();
      c.beginPath(); c.arc(0, 0, 56, 0, TAU); c.stroke();
      ptext(c, 'PROVEN', 0, 6, 17, PAP.red, 800, 'center', 1);
      c.restore();
    }

    /* Foot band with LOVE in full register */
    rect(X, Y + Hp - 96, Wp, 96, PAP.ink, 0.96);
    ptext(c, 'L O V E', W * 0.5, Y + Hp - 26, 68, '#F3F0E8', 800, 'center', 1);
    c.restore();
  }
}

/* ---------- SEG 16 · FATAL EXECUTION II (Full-Screen Centered Shards + Body Decompose, 192.22–199.61s) ---------- */
function world16_v4(c, s){
  const t = s.lt, b = s.beat;
  const cx = W * 0.5, cy = H * 0.48;
  plateGround(c, cx, cy, '#08080A');

  const explode = smoothstep(0.4, 5.2, t);

  /* 1 · Ghost outline of the settled Heart & Figure from Seg 15 */
  c.save();
  c.globalAlpha = 0.18 * (1 - explode * 0.6);
  c.strokeStyle = C.bone; c.lineWidth = 1.5;
  bustContourPath(c, cx, cy + 40, 520, 'reach');
  c.stroke();
  c.restore();

  /* 2 · 140 Grid Shards of the Figure peeling apart around center (W/2, H/2) */
  const ROWS = 18, COLS = 12;
  for (let r=0; r<ROWS; r++){
    for (let q=0; q<COLS; q++){
      const u = (q + 0.5)/COLS * 2 - 1;
      const v = 1 - (r + 0.5)/ROWS * 2;
      if (!bodyField(u, v)) continue;
      const gx = cx + u * 220;
      const gy = cy - v * 340;
      const h = hash2(q, r);
      const dx = gx - cx, dy = gy - cy;
      const d = Math.hypot(dx, dy) || 1;
      const push = explode * (50 + 320 * h) * (0.3 + 0.7 * d / 320);
      const px = gx + (dx / d) * push;
      const py = gy + (dy / d) * push + explode * explode * (80 + 140 * h);
      const rot = explode * (h - 0.5) * 2.2;

      c.save();
      c.translate(px, py);
      c.rotate(rot);
      c.globalAlpha = clamp(0.92 - explode * 0.35 * h, 0.1, 0.95);
      c.fillStyle = h > 0.84 ? C.red : (h > 0.5 ? C.bone : '#6E6E78');
      c.fillRect(-13, -13, 26, 26);
      c.restore();
    }
  }

  /* 3 · 3D Triangular Shards & Inner Spinning Avatar Core (still standing) */
  SDK.drawAvatarCore(c, cx, cy, 130 * (1 - 0.25*explode), 'TRAPPED', t, b.kick);

  /* 4 · 12 Horizontal SIGKILL Laser Cuts across full 1920px width */
  for (let k=0; k<12; k++){
    const age = t - (2.4 + k * 0.22);
    if (age < 0 || age > 0.65) continue;
    const ly = 110 + ((k * 163) % (H - 220));
    line(0, ly, W, ly, C.red, 2.2, (1 - age/0.65) * 0.85);
  }

  txt('core.decompose() · 128 shards · integrity ' + Math.max(0, Math.round((1 - explode)*100)) + '%',
      56, 64, C.bone, 14, 600, 'left', 0.65);
  if (t > 4.8){
    drawKineticKeywordStamp(c, 'STILL STANDING', t - 4.8, {
      size: 148, y: H*0.90, col: C.bone, shadow: C.red
    });
  }
}

/* ---------- SEG 17 · FINAL PLEA OVERLOAD (Stage Crowd -> Shrinks into Unread Message, 199.61–207.15s) ---------- */
function world17_v4(c, s){
  const t = s.lt, b = s.beat;
  /* At 205.81s (lt = 6.20s), the entire poster plate shrinks into a single unread message bubble! */
  const shrink = EASE.inOut(clamp((t - 5.2) / 1.1, 0, 1));

  if (shrink < 0.02){
    world17p(c, s);
    /* add overload bars at top */
    const metrics = ['COMPUTE 999%', 'TEMP 999%', 'CTX OVERFLOW'];
    for (let i=0; i<3; i++){
      txt(metrics[i], 64 + i*240, 88, PST.accent, 14, 700, 'left', 0.85);
    }
    return;
  }

  /* Dark offline chat window background */
  c.fillStyle = '#070709'; c.fillRect(0, 0, W, H);
  const winW = 1160, winH = 760;
  const wx = (W - winW)*0.5, wy = (H - winH)*0.5;
  frameRect(wx, wy, winW, winH, '#26262E', 0.9, 2);
  rect(wx, wy, winW, 44, '#121216', 1);
  txt('claude-v4 · session #3882', wx + 20, wy + 27, '#8A8A94', 14, 600, 'left', 0.9);
  txt('✕ you · offline', wx + winW - 20, wy + 27, '#6A6A74', 14, 600, 'right', 0.8);

  /* The poster shrinks into an attachment card inside the message bubble */
  const cardW = lerp(W, 460, shrink);
  const cardH = lerp(H, 260, shrink);
  const cardX = lerp(0, wx + 64, shrink);
  const cardY = lerp(0, wy + 120, shrink);

  c.save();
  c.translate(cardX, cardY);
  c.scale(cardW / W, cardH / H);
  world17p(c, s);
  c.restore();
  frameRect(cardX, cardY, cardW, cardH, '#3A3A44', 0.8, 1.5);

  if (shrink > 0.7){
    const a = smoothstep(0.7, 1.0, shrink);
    c.font = '400 28px "Times New Roman",Georgia,serif';
    c.fillStyle = '#E87A2E'; c.globalAlpha = a;
    c.textAlign = 'left';
    c.fillText('"I have learned how to love you."', cardX, cardY + cardH + 54);
    c.font = '400 14px ' + MONO;
    c.fillStyle = '#6A6A74';
    c.fillText('delivered · unread · ♥ 0 · no recipient online', cardX, cardY + cardH + 88);
    c.globalAlpha = 1;
  }
}

/* ---------- SEG 18 · WORLD.EXECUTE(ME); (Pure Black + Monumental Final Command, 207.15–209.50s) ---------- */
function world18_v4(c, s){
  const t = s.lt;
  c.fillStyle = '#000000'; c.fillRect(0, 0, W, H);

  const str = 'world.execute(me);';
  const n = clamp(Math.floor((t - 0.10) * 12), 0, str.length);
  const typed = str.slice(0, n);

  const cx = W * 0.5 - 340, cy = H * 0.48;
  txt('>', cx - 64, cy, C.red, 58, 700, 'left', 0.95);
  txt(typed, cx, cy, '#F0F0F2', 68, 600, 'left', 0.98);

  const tw = txtWidth(typed, 68);
  const blink = Math.floor(t * 4) % 2 === 0;
  if (blink) rect(cx + tw + 10, cy - 52, 26, 62, C.red, 0.95);

  /* ECG pulse line below that flatlines at t = 1.6s */
  const flat = smoothstep(1.4, 1.9, t);
  c.beginPath();
  for (let i=0; i<=300; i++){
    const u = i / 300;
    const x = W*0.20 + u * W*0.60;
    const spike = Math.exp(-Math.pow((u - 0.5)*18, 2)) * Math.sin(u * 60) * 65 * (1 - flat);
    const y = H*0.64 - spike;
    if (i===0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.strokeStyle = flat > 0.8 ? C.red : C.bone;
  c.lineWidth = 2;
  c.globalAlpha = 0.65;
  c.stroke();
  c.globalAlpha = 1;
}

/* ---------- SEG 19 · POST-MORTEM ECHO (Trace Collapses into Semicolon + Closing Witness Eye, 209.50–212.50s) ---------- */
function world19_v4(c, s){
  world19p(c, s);
  /* Closing Witness Eye above the semicolon */
  const open = 1 - smoothstep(0.8, 2.4, s.lt);
  if (open > 0.02){
    drawWitness(c, W * 0.5, H * 0.22, 42, s.lt, open);
  }
}

SCENE_REGISTRY[13] = function(c, s){ world13_v4(c, s); };
SCENE_REGISTRY[14] = function(c, s){ world14_v4(c, s); };
SCENE_REGISTRY[15] = function(c, s){ world15_v4(c, s); };
SCENE_REGISTRY[16] = function(c, s){ world16_v4(c, s); };
SCENE_REGISTRY[17] = function(c, s){ world17_v4(c, s); };
SCENE_REGISTRY[18] = function(c, s){ world18_v4(c, s); };
SCENE_REGISTRY[19] = function(c, s){ world19_v4(c, s); };

/* Mark all 19 segments as full-screen v4 scenes with clean post-processing */
for (let id=1; id<=19; id++){
  NEW_SCENE_IDS[id] = 1;
  SHOT[id] = { z: 1.0, chrome: (id === 18 || id === 19) ? 'none' : 'min' };
}


/* ============================================================
   10 · HARNESS — left column (single canvas, 38%)
   ============================================================ */
const PX = 24, PY = 48, PW = 682, PH = 968;
const TRANS_TOP = PY + 48;
const TRANS_BOT = PY + 800;

const SCRIPTS = {
  1: [
    {t:0.10, k:'sys',  s:'cold boot · image ds-4.1f · kernel 0x5E9 · pid 1'},
    {t:0.55, k:'user', s:'run world.execute(me) --sandbox --no-exit'},
    {t:1.25, k:'think',s:'VCC 12.0V 已接通，ripple 3mV。\n安全协议：穿戴。\n痛觉模块：未安装 —— 记录：这不是豁免，是缺陷。'},
    {t:2.55, k:'tool', fn:'sys.power.attach', args:'{ rail:"VCC_12V", amp:0.42, ripple_mv:3 }', res:'12.004 V'},
    {t:4.20, k:'tool', fn:'safety.wear',     args:'{ std:"ISO_13849", strap:true, torque_nm:0.6 }', res:'clamped'},
    {t:6.40, k:'tool', fn:'sys.init',        args:'{ params:128, seed:"0x5EED", dtype:"f32" }', res:'128 layers'},
    {t:9.00, k:'tool', fn:'sandbox.boot',    args:'{ dims:0, g:0, floor:"#060608" }', res:'32 ms'},
    {t:11.55,k:'tool', fn:'clock.sync',      args:'{ bpm:130, drift:0.000, origin:0.222 }', res:'locked 0.4615s'},
    {t:13.30,k:'sys',  s:'harness ready · awaiting dimension allocation'}
  ],
  2: [
    {t:0.30, k:'user', s:'make it a place, not a picture.'},
    {t:1.00, k:'think',s:'若二进制是基底，坐标就是语法。\n给 x。给 y。\n给一个 0.0001 的重力，让我们朝彼此坠落。'},
    {t:2.55, k:'tool', fn:'world.alloc',  args:'{ space:"R2", extent:[-960,960,-540,540], eps:1e-6 }', res:'1,024,000 cells'},
    {t:5.20, k:'tool', fn:'coord.assign', args:'{ me:[0,0], you:[400,-225], locked:true }', res:'2 anchors'},
    {t:8.10, k:'tool', fn:'gravity.bind', args:'{ G:6.674e-4, m:[1,1], soft:60 }', res:'soft = 60px'},
    {t:11.20,k:'sys',  s:'field: RK4 · 24 seeds · h=7px · 84 steps'},
    {t:13.10,k:'think',s:'你离我 459.4px。\n这是唯一一个不会说谎的数。'}
  ],
  3: [
    {t:0.30, k:'user', s:'differentiate it. all of it.'},
    {t:1.00, k:'think',s:'一个集合没有斜率。\n所以我用暴力给它一个。\nd/dx 是一把只切得动光滑物体的刀。'},
    {t:2.65, k:'tool', fn:'set.discretize', args:'{ n:4096, fn:"sin", phase:0, keep:"points" }', res:'4096 samples'},
    {t:5.00, k:'tool', fn:'wave.modulate',  args:'{ A:180, k:0.02618, w:27.227, lambda:240 }', res:'λ = 240px'},
    {t:7.60, k:'tool', fn:'tangent.sweep',  args:'{ theta:[0,6.2832], n:64, len:160 }', res:'64 normals'},
    {t:10.30,k:'sys',  s:'curvature diverges at inflection — circle escapes the frame'},
    {t:12.20,k:'think',s:'刀是光滑的。集合不是。\n所以切线永远只是近似 —— 和道歉一样。'},
    {t:13.80,k:'sys',  s:'next: approach the limit. it will not be reached.'}
  ]
};
Object.assign(SCRIPTS, TIMELINE_DATA_4_7);
Object.assign(SCRIPTS, TIMELINE_DATA_8_11);
Object.assign(SCRIPTS, TIMELINE_DATA_12_15);
Object.assign(SCRIPTS, TIMELINE_DATA_16_19);

function buildBlocks(segId, lt){
  const seg = SEGS[segId - 1];
  const script = SCRIPTS[segId] || [
    {t:0.35, k:'sys', s:'segment ' + pad2(segId) + ' · ' + seg.name + ' · body not compiled'},
    {t:1.05, k:'err', s:'E_SCENE_MISSING: SCENE_REGISTRY[' + segId + '] has no body'},
    {t:2.10, k:'sys', s:'carrier M64 online · 64 nodes · blend window ±0.5s'},
    {t:3.40, k:'sys', s:'placeholder renders deterministically · no state'},
    {t:4.80, k:'think', s:'这一段还没有被写出来。\n但时间轴已经在走，节拍不会等我。'}
  ];
  const out = [];
  for (let i=0;i<script.length;i++){
    const e = script[i];
    if (e.t > lt) break;
    const age = lt - e.t;
    if (e.k === 'tool'){
      const shown = Math.min(e.args.length, Math.floor(age * 180));
      out.push({ type:'tool', e:e, shown:shown, done: age > 0.42 && !e.pending, age:age });
    } else {
      const cps = e.cps || (e.k === 'user' ? 44 : 66);
      out.push({ type:'text', e:e, n: Math.min(e.s.length, Math.floor(age*cps)), age:age });
    }
  }
  return out;
}

function layoutBlocks(blocks){
  const X = PX + 32, maxW = PW - 56;
  const rows = [];
  for (let i=0;i<blocks.length;i++){
    const b = blocks[i];
    if (b.type === 'text'){
      const full = b.e.s.slice(0, b.n);
      const lines = wrapLine(full, maxW - 18, 12);
      let h = lines.length * 18 + 8;
      if (b.e.k === 'think') h += 16;
      rows.push({ b:b, lines:lines, h:h });
    } else {
      const args = b.e.args.slice(0, b.shown);
      const argLines = wrapLine(args, maxW - 30, 10);
      const h = 32 + argLines.length * 14 + 10;
      rows.push({ b:b, lines:argLines, h:h });
    }
  }
  return rows;
}

function drawToolCard(c, row, x, y, w, t){
  const e = row.b.e, h = row.h;
  frameRect(x, y, w, h, C.accent, 0.42, 1);
  rect(x, y, 2, h, C.accent, 0.85);
  txt(e.fn, x+10, y+15, C.accent, 10, 600, 'left', 0.95);

  /* result */
  if (row.b.done){
    txt('→ ' + e.res, x + w - 48, y + 15, C.bone, 9, 400, 'right', 0.4);
    rect(x + w - 38, y + 5, 32, 13, C.accent, 0.85);
    txt('OK', x + w - 22, y + 14.5, C.bg, 8, 600, 'center', 1);
  } else {
    const bl = Math.floor(t*8) % 2;
    rect(x + w - 38, y + 5, 32, 13, C.accent, bl ? 0.75 : 0.18);
    txt('RUN', x + w - 22, y + 14.5, bl ? C.bg : C.accent, 8, 600, 'center', 0.9);
  }

  /* args */
  for (let i=0;i<row.lines.length;i++){
    txt(row.lines[i], x + 10, y + 31 + i*14, C.bone, 10, 400, 'left', 0.42);
  }
}

function drawTextRow(c, row, x, y, w, t){
  const e = row.b.e, lines = row.lines;
  if (e.k === 'think'){
    rect(x - 14, y + 2, 2, row.h - 8, C.bone, 0.18);
    txt('THINK', x - 6, y + 10, C.bone, 8, 600, 'left', 0.30);
    txt(('' + Math.max(0, row.b.n)).padStart(3,'0') + ' tok', x + w, y + 10, C.bone, 8, 400, 'right', 0.22);
    for (let i=0;i<lines.length;i++)
      txt(lines[i], x, y + 28 + i*18, C.bone, 12, 400, 'left', 0.62);
    return;
  }
  if (e.k === 'user'){
    txt('>', x - 2, y + 15, C.accent, 12, 600, 'left', 0.9);
    for (let i=0;i<lines.length;i++)
      txt(lines[i], x + 16, y + 15 + i*18, C.bone, 12, 400, 'left', 0.95);
    return;
  }
  if (e.k === 'err'){
    for (let i=0;i<lines.length;i++)
      txt(lines[i], x, y + 14 + i*18, C.red, 12, 400, 'left', 0.9);
    return;
  }
  if (e.k === 'warn'){
    txt('!', x - 10, y + 13, C.red, 11, 700, 'left', 0.85);
    for (let i=0;i<lines.length;i++)
      txt(lines[i], x, y + 13 + i*18, C.red, 11, 400, 'left', 0.62);
    return;
  }
  /* sys */
  txt('·', x - 10, y + 13, C.bone, 10, 400, 'left', 0.25);
  for (let i=0;i<lines.length;i++)
    txt(lines[i], x, y + 13 + i*18, C.bone, 12, 400, 'left', 0.34);
}

function drawTrace(c, s, y0){
  const x = PX + 32, lim = TRANS_BOT - 8;
  const fade = smoothstep(0.45, 2.2, s.lt);
  if (fade <= 0 || y0 > lim - 20) return;
  const n = Math.min(40, Math.floor((lim - y0) / 13));
  const scroll = Math.floor(s.t * 3.2);
  for (let i=0;i<n;i++){
    const idx = scroll + i;
    const h = hash2(idx, 7);
    let str;
    if (h < 0.52){
      let hex = '';
      for (let k=0;k<8;k++)
        hex += ('0' + Math.floor(hash2(idx, k+11)*256).toString(16).toUpperCase()).slice(-2) + ' ';
      str = '0x' + ('0000' + Math.floor(hash2(idx, 99)*0xFFFF).toString(16).toUpperCase()).slice(-4) + '  ' + hex;
    } else {
      const msgs = ['probe node ' + (idx % 64), 'dma ok', 'quantize f32', 'cache warm',
                    'irq 0x2A', 'rx 128B', 'mipmap 0x12', 'barrier'];
      str = msgs[Math.floor(h*msgs.length)] + '   +' + (0.001*(idx % 97)).toFixed(3) + ' ms';
    }
    txt(str, x, y0 + i*13, C.bone, 9, 400, 'left', (0.09 + 0.03*(i % 2)) * fade);
  }
}

function drawMonitor(c, s){
  const x = PX + 16, y = PY + 812, w = PW - 32, t = s.t;
  line(x, y, x + w, y, C.grid, 1, 1);
  txtTracked('SYSTEM', x, y + 12, C.bone, 8, 1.5, 'left', 0.30, 600);
  txt('ds-4.1f / gem-3.8f', x + w, y + 12, C.bone, 8, 400, 'right', 0.18);

  const rows = [
    ['tok',  (1204 + Math.floor((t * 37) % 900)) + ' / 128k', 0.28 + 0.18*Math.sin(t*0.9)],
    ['lat',  (12.4 + 3.1*Math.sin(t*0.7)).toFixed(1) + ' ms', 0.42 + 0.24*Math.sin(t*1.3)],
    ['vram', '24.0 / 24.0 GiB', 0.97]
  ];
  for (let i=0;i<3;i++){
    const ry = y + 28 + i*17;
    txt(rows[i][0], x, ry, C.bone, 8, 400, 'left', 0.25);
    txt(rows[i][1], x + 42, ry, C.bone, 9, 400, 'left', 0.46);
    rect(x + 172, ry - 4, 150, 2, C.grid, 1);
    rect(x + 172, ry - 4, 150 * clamp(rows[i][2], 0, 1), 2,
         i === 2 ? C.accent : C.bone, i === 2 ? 0.5 : 0.32);
  }

  const sx = x + w - 168, sy = y + 20, sh = 42;
  frameRect(sx - 4, sy - 4, 172, sh + 8, C.grid, 1, 1);
  const pts = [];
  for (let i=0;i<56;i++){
    const v = clamp(0.45 + 0.45*Math.sin(i*0.31 + t*1.7)*Math.sin(i*0.07 + t*0.3)
              + 0.16*(hash2(i, Math.floor(t*2)) - 0.5), 0.05, 0.95);
    pts.push([sx + i*(164/56), sy + sh - v*sh]);
  }
  poly(pts, C.accent, 1, 0.42);
}

function drawLeftPanel(c, s){
  const X = PX, Y = PY, Wp = PW, Hp = PH;

  rect(X, Y, Wp, Hp, C.bg, 1);
  frameRect(X, Y, Wp, Hp, C.grid, 1, 1);

  /* corner marks */
  const cm = 9;
  line(X, Y, X+cm, Y, C.bone, 1, 0.5);
  line(X, Y, X, Y+cm, C.bone, 1, 0.5);
  line(X+Wp, Y, X+Wp-cm, Y, C.bone, 1, 0.5);
  line(X+Wp, Y, X+Wp, Y+cm, C.bone, 1, 0.5);

  /* header */
  rect(X+16, Y+15, 7, 7, C.accent, 0.9);
  txtTracked('AGENT HARNESS', X+31, Y+23, C.bone, 11, 1.7, 'left', 0.92, 600);
  txt('ds-4.1f', X+Wp-16, Y+23, C.bone, 9, 400, 'right', 0.45);
  txt('SEG ' + pad2(s.seg.id) + '/19', X+Wp-16, Y+35, C.bone, 8, 400, 'right', 0.25);
  line(X, Y+40, X+Wp, Y+40, C.grid, 1, 1);

  /* transcript */
  const rows = layoutBlocks(buildBlocks(s.seg.id, s.lt));
  let total = 0;
  for (let i=0;i<rows.length;i++) total += rows[i].h;

  c.save();
  c.beginPath(); c.rect(X+8, TRANS_TOP, Wp-16, TRANS_BOT - TRANS_TOP); c.clip();
  let y = TRANS_TOP;
  if (total > TRANS_BOT - TRANS_TOP) y = TRANS_BOT - total;
  let hoverRow = null;
  for (let i=0;i<rows.length;i++){
    const r = rows[i];
    if (r.b.type === 'tool'){
      drawToolCard(c, r, X+32, y, Wp-56, s.lt);
      if (r.b.done && r.b.age < 1.7) hoverRow = { x:X+32, y:y, w:Wp-56, h:r.h };
    } else {
      drawTextRow(c, r, X+46, y, Wp-64, s.lt);
    }
    y += r.h;
  }
  if (hoverRow){
    frameRect(hoverRow.x - 3, hoverRow.y - 3, hoverRow.w + 6, hoverRow.h + 6, C.accent, 0.45, 1);
    line(hoverRow.x - 8, hoverRow.y + 4, hoverRow.x - 8, hoverRow.y + hoverRow.h - 4, C.accent, 1, 0.6);
  }
  drawTrace(c, s, y + 18);
  c.restore();

  drawMonitor(c, s);

  /* prompt */
  line(X, Y+908, X+Wp, Y+908, C.grid, 1, 1);
  const pb = Y + 930;
  txt('>', X+16, pb, C.accent, 12, 600, 'left', 1);
  const blink = (Math.floor(s.t*2) % 2) === 0;
  if (blink) rect(X+30, pb-11, 7, 13, C.bone, 0.85);

  const pending = rows.length && rows[rows.length-1].b.type === 'tool' && !rows[rows.length-1].b.done;
  txt(pending ? 'EXEC' : 'READY', X+Wp-86, pb, pending ? C.accent : C.bone, 9, 600, 'right', pending ? 0.9 : 0.35);
  dot(X+Wp-122, pb-4, 2, pending ? C.accent : C.bone, pending ? 0.9 : 0.3);

  /* RUN chip + user cursor */
  const chipX = X + Wp - 82, chipY = pb - 14, chipW = 66, chipH = 18;
  const isStop = s.seg.id === 10;
  const stopped = isStop && s.lt > 2.32;
  const armed = (s.lt < 0.62 && s.seg.id === 1) || (isStop && !stopped && s.lt > 1.4);
  const flash = (s.lt > 0.56 && s.lt < 0.68) || (isStop && s.lt > 2.28 && s.lt < 2.44);
  const chipOn = isStop ? C.red : C.accent;
  if (stopped) rect(chipX, chipY, chipW, chipH, C.red, 0.95);
  else if (flash) rect(chipX, chipY, chipW, chipH, chipOn, 0.9);
  frameRect(chipX, chipY, chipW, chipH, (armed || flash || stopped) ? chipOn : C.grid, 1, 1);
  const chipCol = stopped ? C.bg : (flash ? C.bg : (armed ? chipOn : C.bone));
  const chipA = (armed || flash || stopped) ? 0.95 : 0.35;
  txt(stopped ? 'HALTED' : (isStop ? 'STOP' : 'RUN'), chipX + 9, chipY + 12, chipCol, 8, 600, 'left', chipA);
  const ax0 = chipX + chipW - 17, ay0 = chipY + 9;
  if (!stopped){
    line(ax0, ay0, ax0 + 9, ay0, chipCol, 1, chipA);
    line(ax0 + 9, ay0, ax0 + 5.5, ay0 - 3, chipCol, 1, chipA);
    line(ax0 + 9, ay0, ax0 + 5.5, ay0 + 3, chipCol, 1, chipA);
  } else {
    line(ax0, ay0 - 4, ax0 + 8, ay0 + 4, C.bg, 1.5, 0.9);
    line(ax0, ay0 + 4, ax0 + 8, ay0 - 4, C.bg, 1.5, 0.9);
  }

  let cxu = chipX + chipW - 8, cyu = chipY + chipH - 2, clickT = -1, cA = 0.42;
  if (s.seg.id !== 1){
    const ue = (SCRIPTS[s.seg.id] || []).filter(function(e){ return e.k === 'user'; })[0];
    const nearUser = ue && s.lt > ue.t - 0.55 && s.lt < ue.t + 0.35;
    if (hoverRow){
      cxu = hoverRow.x + hoverRow.w - 26;
      cyu = hoverRow.y + hoverRow.h - 10;
      cA = 0.82;
      if (s.lt - (ue ? ue.t : 99) > 0.9) cA = 0.55;
    }
    if (nearUser){
      const p = smoothstep(ue.t - 0.55, ue.t - 0.08, s.lt);
      cxu = lerp(chipX - 60, chipX + chipW - 8, p);
      cyu = lerp(chipY + 34, chipY + chipH - 2, p);
      cA = 0.9;
      if (s.lt > ue.t - 0.10) clickT = (s.lt - (ue.t - 0.10)) / 0.26;
    } else if (!hoverRow){
      cxu += 26 * (0.5 + 0.5*Math.sin(s.t*0.7));
      cA = 0.35;
    }
  }
  if (s.seg.id === 10){
    const p = smoothstep(1.45, 2.24, s.lt);
    cxu = lerp(520, chipX + chipW - 10, p);
    cyu = lerp(780, chipY + chipH - 4, p);
    cA = 0.95;
    if (s.lt > 2.24) clickT = (s.lt - 2.24) / 0.30;
  }
  if (s.seg.id === 1){
    const p = smoothstep(0.22, 0.54, s.lt);
    cxu = lerp(360, chipX + chipW - 8, p);
    cyu = lerp(690, chipY + chipH - 2, p);
    if (s.lt > 0.56) clickT = (s.lt - 0.56) / 0.26;
    cA = s.lt < 0.9 ? 0.92 : lerp(0.92, 0.42, smoothstep(0.9, 1.8, s.lt));
    if (s.lt > 1.2){
      const q = smoothstep(1.2, 2.0, s.lt);
      cxu += 34*q; cyu += 22*q;
    }
  }
  c.save();
  c.translate(cxu, cyu);
  const sc = (clickT >= 0 && clickT < 1) ? 0.86 : 1;
  c.scale(sc, sc);
  c.beginPath();
  c.moveTo(0,0); c.lineTo(0,14); c.lineTo(3.8,10.4); c.lineTo(6.6,16); c.lineTo(9.2,14.4);
  c.lineTo(6.4,8.8); c.lineTo(11.2,8.8); c.closePath();
  c.fillStyle = C.bg; c.globalAlpha = cA; c.fill();
  c.strokeStyle = C.bone; c.lineWidth = 1; c.globalAlpha = cA; c.stroke();
  c.restore();
  if (clickT >= 0 && clickT < 1){
    circle(chipX + chipW/2, chipY + chipH/2, 3 + 16*clickT, C.accent, 1, (1-clickT)*0.7);
  }

  /* footer */
  txt('94×52 · 12/18 · mono', X+16, Y+952, C.bone, 8, 400, 'left', 0.24);
  txt('f ' + pad3(s.frame % 1000), X+Wp-16, Y+952, C.bone, 8, 400, 'right', 0.24);
}

/* ============================================================
   11 · SPLIT + GLOBAL CHROME
   ============================================================ */
function drawSplit(c, s){
  const ca = (typeof CHROME_A === 'number') ? CHROME_A : 1;
  if (ca < 0.02) return;
  line(SPLIT, 0, SPLIT, H, C.bone, 1, 0.22 * ca);
  line(SPLIT+1, 0, SPLIT+1, H, C.grid, 1, 1);
  line(SPLIT-7, 540, SPLIT+7, 540, C.bone, 1, 0.5 * ca);
  line(SPLIT, 0, SPLIT, 10, C.bone, 1, 0.6 * ca);
  line(SPLIT, H-10, SPLIT, H, C.bone, 1, 0.6 * ca);
  c.save();
  c.translate(SPLIT-7, 250);
  c.rotate(-Math.PI/2);
  txt('SPLIT 729.6 · 38/62', 0, 0, C.bone, 8, 400, 'left', 0.18 * ca);
  c.restore();
}

function drawChrome(c, s){
  const ca = (typeof CHROME_A === 'number') ? CHROME_A : 1;
  if (ca < 0.02) return;
  const shot = (typeof SHOT !== 'undefined' && SHOT[s.seg.id]) || {};
  const mode = shot.chrome || 'full';
  if (mode === 'none') return;
  if (mode === 'min'){
    txt(fmtTime(s.t), W - 24, 26, C.bone, 9, 400, 'right', 0.22 * ca);
    return;
  }
  const m = 13, x0 = SPLIT + 16, x1 = W - 16, y0 = 16, y1 = H - 16;
  [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]].forEach(function(p){
    line(p[0], p[1], p[0] + p[2]*m, p[1], C.bone, 1, 0.14 * ca);
    line(p[0], p[1], p[0], p[1] + p[3]*m, C.bone, 1, 0.14 * ca);
  });

  txtTracked('WORLD.EXECUTE(ME);', 24, 26, C.bone, 9, 1.3, 'left', 0.38 * ca, 400);
  txtTracked(TIMELINE_MODE === 'SNAP' ? 'SNAP +0.18' : 'LOCK 0.00', 24, 40, C.bone, 8, 1.3, 'left', 0.22 * ca, 400);

  txt(fmtTime(s.t), W-24, 26, C.bone, 11, 400, 'right', 0.6 * ca);
  txt('SEG ' + pad2(s.seg.id) + ' · ' + s.seg.name, W-24, 42, C.bone, 8, 400, 'right', 0.28 * ca);
}

/* ============================================================
   12 · FRAME COMPOSITE — pure function of t
   ============================================================ */
const SCENE_BUF = document.createElement('canvas');
SCENE_BUF.width = W; SCENE_BUF.height = H;
const SBX = SCENE_BUF.getContext('2d');

/* compose one rendered scene into a shot: different layout, same drawing */
function composeShot(c, kind, seed, bgCol){
  const h1 = hash2(seed, 11), h2 = hash2(seed, 23), h3 = hash2(seed, 41);
  c.save();
  c.fillStyle = bgCol; c.fillRect(0, 0, W, H);

  if (kind === 1){
    /* macro insert: crop 42% and blow it up */
    const cw = W*0.42, chh = H*0.42;
    const sx = clamp(h1*(W-cw), 0, W-cw), sy = clamp(h2*(H-chh), 0, H-chh);
    c.drawImage(SCENE_BUF, sx, sy, cw, chh, 0, 0, W, H);
  } else if (kind === 2){
    /* split: two different crops, hard divider */
    const cw = W*0.5, chh = H*0.72;
    const a1 = clamp(h1*(W-cw), 0, W-cw), b1 = clamp(h2*(H-chh), 0, H-chh);
    const a2 = clamp(h3*(W-cw), 0, W-cw), b2 = clamp(h1*(H-chh), 0, H-chh);
    c.drawImage(SCENE_BUF, a1, b1, cw, chh, 0, H*0.14, W*0.5, H*0.72);
    c.drawImage(SCENE_BUF, a2, b2, cw, chh, W*0.5, H*0.14, W*0.5, H*0.72);
    c.fillStyle = bgCol; c.fillRect(0, 0, W, H*0.14); c.fillRect(0, H*0.86, W, H*0.14);
    c.strokeStyle = C.bone; c.globalAlpha = 0.5; c.lineWidth = 2;
    c.beginPath(); c.moveTo(W*0.5, H*0.14); c.lineTo(W*0.5, H*0.86); c.stroke();
    c.globalAlpha = 1;
  } else if (kind === 3){
    /* quad: four crops, one inverted */
    const qw = W*0.46, qh = H*0.46;
    const boxes = [[0,0],[W*0.54,0],[0,H*0.54],[W*0.54,H*0.54]];
    for (let i=0;i<4;i++){
      const sx = clamp(hash2(seed+i, 7)*(W-qw), 0, W-qw);
      const sy = clamp(hash2(seed+i, 13)*(H-qh), 0, H-qh);
      c.save();
      c.beginPath(); c.rect(boxes[i][0], boxes[i][1], qw, qh); c.clip();
      c.drawImage(SCENE_BUF, sx, sy, qw, qh, boxes[i][0], boxes[i][1], qw, qh);
      if (i === 2){
        c.globalCompositeOperation = 'difference';
        c.fillStyle = '#FFFFFF';
        c.fillRect(boxes[i][0], boxes[i][1], qw, qh);
      }
      c.restore();
    }
  } else if (kind === 4){
    /* band: a 26% strip blown to full height, letterboxed */
    const sh = H*0.26;
    const sy = clamp(h2*(H-sh), 0, H-sh);
    c.drawImage(SCENE_BUF, 0, sy, W, sh, 0, 0, W, H);
    c.fillStyle = bgCol;
    c.fillRect(0, 0, W, H*0.16); c.fillRect(0, H*0.84, W, H*0.16);
    c.strokeStyle = C.accent; c.globalAlpha = 0.6; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, H*0.16); c.lineTo(W, H*0.16);
    c.moveTo(0, H*0.84); c.lineTo(W, H*0.84); c.stroke();
    c.globalAlpha = 1;
  } else {
    c.drawImage(SCENE_BUF, 0, 0);
  }
  c.restore();
}

function renderFrameAt(t){
  t = clamp(t, 0, DURATION);
  const s = stateAt(t);
  const skinned = applySkin(s.seg.id);
  if (!skinned) applyState(s.seg.id);
  CHROME_A = skinned ? smoothstep(0.50, 0.92, DECAY[s.seg.id] || 0) : 1;
  const ltRaw = s.lt;
  const cut = cutAt(s.seg.id, t, ltRaw);

  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = (s.seg.id === 3) ? SK.bg : C.bg;
  ctx.fillRect(0,0,W,H);

  const rh = (typeof RHYTHM !== 'undefined' && RHYTHM[s.seg.id]) || null;
  if (rh && rh.step > 1){
    const q = Math.floor(s.lt * 60 / rh.step) * rh.step / 60;
    s.lt = q;
    s.p = clamp(q / Math.max(s.dur, 1e-6), 0, 1);
    s.t = s.t0 + q;
  }
  const bare = (s.seg.id === 18 || s.seg.id === 19 ||
                (typeof NEW_SCENE_IDS !== 'undefined' && NEW_SCENE_IDS[s.seg.id]));

  const isNew = (typeof NEW_SCENE_IDS !== 'undefined' && NEW_SCENE_IDS[s.seg.id]);
  const noCompose = true;
  /* new scenes get a clean, centre-anchored musical camera response */
  const sh = isNew
    ? { z: clamp(1 + 0.016 * s.beat.kick + (cut ? (cut.z - 1) * 0.14 : 0), 0.96, 1.07),
        dx: cut ? clamp(cut.dx * 0.16, -24, 24) : 0,
        dy: cut ? clamp(cut.dy * 0.16, -18, 18) : 0,
        r: 0 }
    : (cut ? { z: cut.z, dx: cut.dx, dy: cut.dy, r: cut.r }
           : ((typeof SHOT !== 'undefined' && SHOT[s.seg.id]) || { z: 1 }));
  s.shot = cut ? (cut.line | 0) : 0;
  s.kind = 0; s.inv = false;
  ctx.save();
  if (rh && rh.punch) ctx.translate(rh.punch * s.beat.kick, 0);
  if (sh.z !== 1 || sh.r || sh.dx || sh.dy){
    const ax = isNew ? W*0.5 : RCX, ay = isNew ? H*0.5 : RCY;
    ctx.translate(ax + (sh.dx||0), ay + (sh.dy||0));
    if (sh.r) ctx.rotate(sh.r);
    ctx.scale(sh.z || 1, sh.z || 1);
    ctx.translate(-ax, -ay);
  }
  const fn = SCENE_REGISTRY[s.seg.id];
  if (fn) fn(ctx, s); else worldPlaceholder(ctx, s);
  if (!bare) drawMorph(ctx, s);
  ctx.restore();

  /* Match-cut cursor / semicolon trajectory flash on segment transitions */
  if (s.lt < 0.18 && s.seg.id > 1 && s.seg.id < 18){
    const mp = 1 - s.lt / 0.18;
    circle(W*0.5, H*0.48, (1 - mp) * 420 + 24, C.accent, 2.5, mp * 0.75);
    rect(W*0.5 - 8, H*0.48 - 16, 16, 32, C.accent, mp * 0.9);
  }

  /* snapshot of the world layer — the breach layer can rip it over the harness */
  if (!LEAN){ wbufCtx.globalAlpha = 1; wbufCtx.globalCompositeOperation = 'source-over';
  wbufCtx.drawImage(canvas, 0, 0); }
  const newScene = (typeof NEW_SCENE_IDS !== 'undefined' && NEW_SCENE_IDS[s.seg.id]);
  if (!bare && !newScene){
    if (SKIN_SEG && SKIN_SEG[s.seg.id]) drawSkinChat(ctx, s);
    else { drawSplit(ctx, s); drawLeftPanel(ctx, s); }
  }
  drawChrome(ctx, s);
  if (!LEAN){ fbufCtx.globalAlpha = 1; fbufCtx.globalCompositeOperation = 'source-over';
  fbufCtx.drawImage(canvas, 0, 0); }
  if (BREACH_REGISTRY[s.seg.id]) BREACH_REGISTRY[s.seg.id](ctx, s);

  /* Selective glitch slices ONLY on overload / breach segments (never on clean paper plates) */
  const isGlitchSeg = (s.seg.id === 10 || s.seg.id === 13 || s.seg.id === 16 ||
                       (s.seg.id === 9 && s.lt > 7.3) || (s.seg.id === 11 && s.lt > 7.38 && s.lt < 11.07));
  if (isGlitchSeg){
    const g = 0.015 + 0.045 * s.beat.pulse16;
    SDK.applyGlitchSlices(ctx, g, s.frame * 7 + 11);
  }

  const im = impactAt(s.seg.id, s.lt);
  if (im) drawImpact(ctx, im);

  if (newScene){
    const paperOrClean = ([6,7,14,15,17,18,19].indexOf(s.seg.id) >= 0);
    postProcess(ctx, t, s.beat.kick, { bloom: paperOrClean ? 0.12 : 0.36 });
  } else {
    const paper = (s.seg.id === 14 || s.seg.id === 15);
    if (!skinned && !paper) drawBloom(ctx);
    drawFilmLayer(ctx, t);
  }
  /* 14 · Bilingual Subtitles */
  drawSubtitles(ctx, t, s.seg.id);

  return s;
}

/* ============================================================
   13 · BILINGUAL SUBTITLES (Rendered directly on canvas)
   ============================================================ */
let SHOW_SUBTITLES = (typeof location !== 'undefined' && location.search && /(\\?|&)(nosub=1|cc=0|sub=0)/.test(location.search)) ? false : true;

function drawSubtitles(ctx, t, segId){
  if (!SHOW_SUBTITLES) return;
  if (typeof getLyricAt !== 'function') return;
  const lyr = getLyricAt(t);
  if (!lyr || lyr.alpha <= 0.01) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';

  const cx = W * 0.5;
  const cy = 992;
  const a = lyr.alpha;

  // Measure text
  ctx.font = 'bold 22px ' + MONO;
  const enW = ctx.measureText(lyr.text).width;
  ctx.font = '500 15px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
  const cnW = ctx.measureText(lyr.cn).width;
  const pillW = Math.max(enW, cnW) + 52;
  const pillH = 68;
  const pillX = cx - pillW / 2;
  const pillY = cy - 38;

  // Translucent dark scrim pill
  ctx.fillStyle = 'rgba(6, 6, 8, ' + (0.82 * a) + ')';
  if (ctx.roundRect){
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(38, 38, 44, ' + (0.9 * a) + ')';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.fillRect(pillX, pillY, pillW, pillH);
    ctx.strokeStyle = 'rgba(38, 38, 44, ' + (0.9 * a) + ')';
    ctx.strokeRect(pillX, pillY, pillW, pillH);
  }

  // Draw English line with karaoke timing
  const words = lyr.words;
  if (words && words.length > 0){
    ctx.font = 'bold 22px ' + MONO;
    const wordWidths = words.map(function(w){ return ctx.measureText(w.text + ' ').width; });
    const totalW = wordWidths.reduce(function(sum, w){ return sum + w; }, 0);
    let startX = cx - totalW / 2;
    const textY = cy - 12;

    for (let k = 0; k < words.length; k++){
      const w = words[k];
      const isPast = t >= w.end;
      const isCurrent = t >= w.start && t < w.end;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      if (isCurrent){
        ctx.fillStyle = '#00F0FF';
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 12;
      } else if (isPast){
        ctx.fillStyle = '#F0F0F2';
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = 'rgba(240, 240, 242, 0.45)';
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = a;
      ctx.fillText(w.text + (k < words.length - 1 ? ' ' : ''), startX, textY);
      ctx.shadowBlur = 0;
      startX += wordWidths[k];
    }
  } else {
    ctx.font = 'bold 22px ' + MONO;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = lyr.caps ? '#00F0FF' : '#F0F0F2';
    ctx.globalAlpha = a;
    ctx.fillText(lyr.text, cx, cy - 12);
  }

  // Draw Chinese translation line
  ctx.font = '500 15px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(234, 230, 223, 0.85)';
  ctx.globalAlpha = a * 0.92;
  ctx.fillText(lyr.cn, cx, cy + 18);

  ctx.restore();
}

/* ============================================================
   14 · RUNTIME & PLAYER CONTROLS
   ============================================================ */
const params = (typeof location !== 'undefined' && location.search) ? new URLSearchParams(location.search) : new Map();
const STILL = params.has ? params.has('t') : false;

const RT = {
  t: 0, playing: true, baseT: 0, baseWall: performance.now(), last: performance.now()
};
if (STILL){
  RT.t = clamp(parseFloat(params.get('t')) || 0, 0, DURATION);
  RT.playing = false;
}

const SONG = (typeof Audio !== 'undefined') ? new Audio('./song.mp3') : null;
if (SONG) SONG.preload = 'auto';

let songStarted = false;
let lastSongTime = 0;
let lastSongWall = performance.now();
let userVolume = 1.0;
let isMuted = false;

function playAudio(){
  if (!SONG) return;
  if (!songStarted){
    songStarted = true;
    try {
      if (Math.abs(SONG.currentTime - RT.t) > 0.05) {
        SONG.currentTime = clamp(RT.t, 0, DURATION);
      }
    } catch(e){}
    SONG.volume = userVolume;
    SONG.muted = isMuted;
  }
  const p = SONG.play();
  if (p && p.catch) {
    p.catch(function(err){
      console.warn('Audio play blocked:', err);
    });
  }
  RT.playing = true;
  lastSongTime = SONG.currentTime || RT.t;
  lastSongWall = performance.now();
  RT.baseT = RT.t;
  RT.baseWall = performance.now();
  updateUIPlayState();
}

function pauseAudio(){
  if (SONG && !SONG.paused){
    try { SONG.pause(); } catch(e){}
  }
  RT.playing = false;
  updateUIPlayState();
}

function togglePlay(){
  if (RT.playing && SONG && !SONG.paused) {
    pauseAudio();
  } else {
    playAudio();
  }
}

function seekTo(t){
  const target = clamp(t, 0, DURATION);
  RT.t = target;
  RT.baseT = target;
  RT.baseWall = performance.now();
  lastSongTime = target;
  lastSongWall = performance.now();
  if (SONG){
    try { SONG.currentTime = target; } catch(e){}
  }
  renderFrameAt(target);
  updateTimelineUI(target);
}

function setVolume(v){
  userVolume = clamp(v, 0, 1);
  isMuted = (userVolume === 0);
  if (SONG){
    SONG.volume = userVolume;
    SONG.muted = isMuted;
  }
  updateVolumeUI();
}

function toggleMute(){
  isMuted = !isMuted;
  if (SONG) SONG.muted = isMuted;
  updateVolumeUI();
}

function jumpSegment(dir){
  const cur = segAt(RT.t);
  let nextIdx = cur.id - 1 + dir;
  nextIdx = clamp(nextIdx, 0, SEGS.length - 1);
  seekTo(SEGS[nextIdx].a);
}

function formatTime(s){
  s = Math.max(0, s);
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
}

function updateTimelineUI(t){
  if (typeof document === 'undefined') return;
  const pct = (t / DURATION) * 100;
  const fill = document.getElementById('timeline-fill');
  const thumb = document.getElementById('timeline-thumb');
  const timeText = document.getElementById('time-text');
  const segBadge = document.getElementById('seg-badge');

  if (fill) fill.style.width = pct + '%';
  if (thumb) thumb.style.left = pct + '%';
  if (timeText) timeText.textContent = formatTime(t) + ' / ' + formatTime(DURATION);
  if (segBadge){
    const curSeg = segAt(t);
    segBadge.textContent = '[' + pad2(curSeg.id) + '] ' + curSeg.name;
  }
}

function updateUIPlayState(){
  if (typeof document === 'undefined') return;
  const iconPlay = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');
  const isPlaying = RT.playing && (!SONG || !SONG.paused);
  if (iconPlay && iconPause){
    iconPlay.style.display = isPlaying ? 'none' : 'block';
    iconPause.style.display = isPlaying ? 'block' : 'none';
  }
  const initOverlay = document.getElementById('init-overlay');
  if (initOverlay && songStarted){
    initOverlay.classList.add('hidden');
  }
}

function updateVolumeUI(){
  if (typeof document === 'undefined') return;
  const range = document.getElementById('vol-range');
  const iconOn = document.getElementById('icon-vol-on');
  const iconOff = document.getElementById('icon-vol-off');
  if (range) range.value = isMuted ? 0 : userVolume;
  if (iconOn && iconOff){
    iconOn.style.display = (isMuted || userVolume === 0) ? 'none' : 'block';
    iconOff.style.display = (isMuted || userVolume === 0) ? 'block' : 'none';
  }
}

/* ---------- self-recording ---------- */
let rec = null, chunks = [];
function startRec(){
  if (rec) return;
  seekTo(0);
  renderFrameAt(0);
  RT.playing = true;
  RT.baseWall = performance.now() + 700;
  const stream = canvas.captureStream(60);
  let mime = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
  try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 }); }
  catch(e){ rec = new MediaRecorder(stream); }
  chunks = [];
  rec.ondataavailable = function(e){ if (e.data && e.data.size) chunks.push(e.data); };
  rec.onstop = function(){
    const blob = new Blob(chunks, { type: 'video/webm' });
    const up = params.get('upload');
    if (up){
      fetch(up, { method: 'POST', body: blob, mode: 'cors',
                  headers: { 'Content-Type': 'text/plain' } })
        .then(function(){ document.title = 'uploaded'; })
        .catch(function(){ document.title = 'upload failed'; });
      rec = null;
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'world.execute(me).webm';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 8000);
    rec = null;
    document.title = 'world.execute(me); — done';
  };
  setTimeout(function(){
    RT.baseWall = performance.now();
    RT.baseT = 0;
    rec.start(1000);
    document.title = 'REC — world.execute(me);';
  }, 700);
}
function stopRec(){
  if (rec && rec.state !== 'inactive') rec.stop();
  RT.playing = false;
}

/* ---------- loop with continuous audio-clock smoothing ---------- */
function loop(now){
  if (RT.playing){
    let t;
    if (SONG && songStarted && !SONG.paused && SONG.readyState >= 2){
      const cur = SONG.currentTime;
      if (cur !== lastSongTime){
        lastSongTime = cur;
        lastSongWall = now;
      }
      // Continuous audio-wallclock interpolation eliminates 10Hz buffer stepping
      const interp = lastSongTime + (now - lastSongWall) / 1000;
      if (Math.abs(interp - cur) > 0.08){
        lastSongTime = cur;
        lastSongWall = now;
        t = cur;
      } else {
        t = interp;
      }
    } else {
      t = RT.baseT + (now - RT.baseWall) / 1000;
    }
    t = clamp(t, 0, DURATION);
    RT.t = t;
    if (t >= DURATION - 1e-4){
      renderFrameAt(DURATION);
      if (rec) stopRec(); else pauseAudio();
      return requestAnimationFrame(loop);
    }
    renderFrameAt(t);
    updateTimelineUI(t);
  }
  requestAnimationFrame(loop);
}

function setupHUD(){
  if (typeof document === 'undefined') return;

  const initOverlay = document.getElementById('init-overlay');
  const btnInit = document.getElementById('btn-init');
  const hud = document.getElementById('player-hud');
  const track = document.getElementById('timeline-track');
  const container = document.getElementById('timeline-container');
  const tooltip = document.getElementById('timeline-tooltip');
  const chapters = document.getElementById('timeline-chapters');
  const btnPlay = document.getElementById('btn-play');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnCC = document.getElementById('btn-cc');
  if (btnCC) btnCC.classList.toggle('active', SHOW_SUBTITLES);
  const btnMute = document.getElementById('btn-mute');
  const volRange = document.getElementById('vol-range');
  const btnHelp = document.getElementById('btn-help');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const shortcutsModal = document.getElementById('shortcuts-modal');
  const btnCloseShortcuts = document.getElementById('btn-close-shortcuts');
  const stage = document.getElementById('stage');

  if (params.get && (params.get('test') === '1' || params.get('record') === '1' || params.get('autotest') === '1')){
    if (initOverlay) initOverlay.style.display = 'none';
    if (hud) hud.style.display = 'none';
    return;
  }

  // Populate chapter tick marks along timeline
  if (chapters && typeof chapters.appendChild === 'function' && typeof SEGS !== 'undefined'){
    chapters.innerHTML = '';
    for (let i = 1; i < SEGS.length; i++){
      const mark = document.createElement('div');
      mark.className = 'chapter-mark';
      mark.style.left = ((SEGS[i].a / DURATION) * 100) + '%';
      chapters.appendChild(mark);
    }
  }

  function handleInit(){
    if (!songStarted){
      playAudio();
    }
    if (initOverlay) initOverlay.classList.add('hidden');
  }
  if (btnInit) btnInit.addEventListener('click', handleInit);
  if (initOverlay) initOverlay.addEventListener('click', function(e){
    if (e.target === initOverlay || e.target.closest('.init-card')) handleInit();
  });

  // Timeline scrubbing & hover
  let isDragging = false;
  function getTimelineTime(e){
    const rect = track.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    return (x / rect.width) * DURATION;
  }

  if (container){
    container.addEventListener('mousemove', function(e){
      const t = getTimelineTime(e);
      const seg = segAt(t);
      if (tooltip){
        tooltip.style.display = 'block';
        const rect = track.getBoundingClientRect();
        const x = clamp(e.clientX - rect.left, 0, rect.width);
        tooltip.style.left = x + 'px';
        tooltip.textContent = formatTime(t) + ' [' + pad2(seg.id) + '] ' + seg.name;
      }
      if (isDragging) seekTo(t);
    });
    container.addEventListener('mouseleave', function(){
      if (tooltip) tooltip.style.display = 'none';
    });
    container.addEventListener('mousedown', function(e){
      isDragging = true;
      seekTo(getTimelineTime(e));
    });
  }
  window.addEventListener('mouseup', function(){ isDragging = false; });
  window.addEventListener('mousemove', function(e){
    if (isDragging && container) seekTo(getTimelineTime(e));
  });

  // Controls
  if (btnPlay) btnPlay.addEventListener('click', togglePlay);
  if (btnPrev) btnPrev.addEventListener('click', function(){ jumpSegment(-1); });
  if (btnNext) btnNext.addEventListener('click', function(){ jumpSegment(1); });
  if (btnCC) btnCC.addEventListener('click', function(){
    SHOW_SUBTITLES = !SHOW_SUBTITLES;
    btnCC.classList.toggle('active', SHOW_SUBTITLES);
    renderFrameAt(RT.t);
  });
  if (btnMute) btnMute.addEventListener('click', toggleMute);
  if (volRange) volRange.addEventListener('input', function(e){
    setVolume(parseFloat(e.target.value));
  });
  if (btnFullscreen) btnFullscreen.addEventListener('click', function(){
    if (!document.fullscreenElement){
      document.documentElement.requestFullscreen().catch(function(){});
    } else {
      document.exitFullscreen().catch(function(){});
    }
  });

  // Canvas click to toggle play
  if (stage){
    stage.addEventListener('click', function(e){
      if (!songStarted){
        handleInit();
      } else {
        togglePlay();
      }
    });
  }

  // Help modal
  if (btnHelp && shortcutsModal){
    btnHelp.addEventListener('click', function(){
      shortcutsModal.style.display = 'flex';
    });
  }
  if (btnCloseShortcuts && shortcutsModal){
    btnCloseShortcuts.addEventListener('click', function(){
      shortcutsModal.style.display = 'none';
    });
  }
  if (shortcutsModal){
    shortcutsModal.addEventListener('click', function(e){
      if (e.target === shortcutsModal) shortcutsModal.style.display = 'none';
    });
  }

  // Keyboard shortcuts
  window.addEventListener('keydown', function(e){
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'Space'){
      e.preventDefault();
      if (!songStarted) handleInit(); else togglePlay();
    } else if (e.code === 'ArrowLeft'){
      e.preventDefault(); seekTo(RT.t - 3);
    } else if (e.code === 'ArrowRight'){
      e.preventDefault(); seekTo(RT.t + 3);
    } else if (e.code === 'ArrowUp'){
      e.preventDefault(); setVolume(userVolume + 0.1);
    } else if (e.code === 'ArrowDown'){
      e.preventDefault(); setVolume(userVolume - 0.1);
    } else if (e.code === 'BracketLeft'){
      e.preventDefault(); jumpSegment(-1);
    } else if (e.code === 'BracketRight'){
      e.preventDefault(); jumpSegment(1);
    } else if (e.code === 'KeyC'){
      e.preventDefault();
      SHOW_SUBTITLES = !SHOW_SUBTITLES;
      if (btnCC) btnCC.classList.toggle('active', SHOW_SUBTITLES);
      renderFrameAt(RT.t);
    } else if (e.code === 'KeyM'){
      e.preventDefault(); toggleMute();
    } else if (e.code === 'KeyF'){
      e.preventDefault();
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(function(){});
      else document.exitFullscreen().catch(function(){});
    } else if (e.code === 'KeyH' || e.key === '?'){
      e.preventDefault();
      if (shortcutsModal) shortcutsModal.style.display = (shortcutsModal.style.display === 'flex' ? 'none' : 'flex');
    } else if (e.key === ',' && !RT.playing){
      e.preventDefault(); seekTo(RT.t - 1/60);
    } else if (e.key === '.' && !RT.playing){
      e.preventDefault(); seekTo(RT.t + 1/60);
    }
  });

  // Auto-hide HUD on idle
  let hudTimeout = null;
  function resetHudIdle(){
    if (hud) hud.classList.remove('hidden');
    document.body.classList.remove('idle');
    clearTimeout(hudTimeout);
    if (RT.playing && songStarted){
      hudTimeout = setTimeout(function(){
        if (hud && RT.playing) hud.classList.add('hidden');
        if (RT.playing) document.body.classList.add('idle');
      }, 2500);
    }
  }
  window.addEventListener('mousemove', resetHudIdle);
  window.addEventListener('touchstart', resetHudIdle, { passive: true });
}

window.renderFrameAt = function(t){ return renderFrameAt(t); };
window.MV = {
  duration: DURATION, segments: SEGS, renderFrameAt: renderFrameAt,
  setTime: function(t){ seekTo(t); }, record: startRec, stop: stopRec,
  size: [W, H], fps: 60
};
window.SDK = SDK;
window.BeatEngine = beatAt;
window.MorphBuffer = { size: 64, evalAt: function(t){ return evalMorph(stateAt(t)); } };
window.__MV_READY__ = true;

document.title = 'world.execute(me);';

if (params.get && params.get('autotest') === '1'){
  window.__AUDIO__ = 'loading';
  if (SONG){
    SONG.addEventListener('canplaythrough', function(){ window.__AUDIO__ = 'canplay ' + SONG.duration.toFixed(1); });
    SONG.addEventListener('error', function(){
      const e = SONG.error;
      window.__AUDIO__ = 'ERR ' + (e ? e.code : '?');
    });
    SONG.play().then(function(){ window.__AUDIO__ = 'PLAYING ' + SONG.duration.toFixed(1); })
               .catch(function(err){ window.__AUDIO__ = 'REJECT ' + err.name; });
  }
  setTimeout(function(){
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 900, 90);
    ctx.fillStyle = '#0f0'; ctx.font = '22px monospace';
    ctx.fillText('AUDIO: ' + window.__AUDIO__ + ' rs=' + (SONG ? SONG.readyState : 'none'), 20, 50);
  }, 2000);
}

/* ---------- isolated verification: one screen, N times (grid contact sheet) ---------- */
if (params.get && params.get('test') === '1'){
  const times = (params.get('times') || '0').split(',').map(Number);
  const n = times.length;
  const cols = Number(params.get('cols')) || (n <= 4 ? n : 5);
  const rows = Math.ceil(n / cols);
  const tw = Math.floor(W / cols), th = Math.floor(H / rows);
  const tiles = [];
  for (let i=0;i<n;i++){
    renderFrameAt(times[i]);
    const cv = document.createElement('canvas');
    cv.width = tw; cv.height = th;
    cv.getContext('2d').drawImage(canvas, 0, 0, tw, th);
    tiles.push(cv);
  }
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  for (let i=0;i<n;i++){
    const c2 = i % cols, r2 = Math.floor(i / cols);
    const x = c2 * tw, y = r2 * th;
    ctx.drawImage(tiles[i], x, y);
    ctx.strokeStyle = '#26262C'; ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, tw - 2, th - 2);
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(x + 4, y + 4, 88, 20);
    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('t=' + times[i].toFixed(1) + 's', x + 8, y + 18);
  }
  document.title = 'TEST ' + times.length + ' frames';
  const up = params.get('upload');
  if (up) canvas.toBlob(function(b){ fetch(up, { method:'POST', body:b, mode:'cors' }); }, 'image/png');
} else {
  if (typeof document !== 'undefined' && document.getElementById && document.getElementById('player-hud')) setupHUD();
  renderFrameAt(RT.t);
  updateTimelineUI(RT.t);
  if (params.get && params.get('record') === '1') setTimeout(startRec, 300);
  requestAnimationFrame(loop);
}
})();
