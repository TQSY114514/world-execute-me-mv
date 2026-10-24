
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
