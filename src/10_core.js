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
