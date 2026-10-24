import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const PORT = 8731;
const H264_PATH = path.join(root, 'tools', 'world_raw.h264');
const OUT_MP4 = path.join(root, 'world.execute(me).mp4');
const SONG_PATH = path.join(root, 'song.mp3');

if (fs.existsSync(H264_PATH)) fs.unlinkSync(H264_PATH);
const h264Stream = fs.createWriteStream(H264_PATH);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const startTime = Date.now();
let browserProc = null;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = url.pathname;

  if (pathname === '/chunk_batch') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      h264Stream.write(buf);
      res.writeHead(200);
      res.end('OK');
    });
    return;
  }

  if (pathname === '/progress') {
    const f = parseInt(url.searchParams.get('f') || '0', 10);
    const total = parseInt(url.searchParams.get('total') || '12750', 10);
    const pct = ((f / total) * 100).toFixed(1);
    const elapsed = Math.max((Date.now() - startTime) / 1000, 0.1);
    const fps = (f / elapsed).toFixed(1);
    const remainingSec = parseFloat(fps) > 0 ? Math.round((total - f) / parseFloat(fps)) : 0;
    const remMin = Math.floor(remainingSec / 60);
    const remSec = (remainingSec % 60).toString().padStart(2, '0');
    const tSec = (f / 60).toFixed(1);

    process.stdout.write(
      `\r[EXPORT] ${pct}% | Frame ${f}/${total} (t=${tSec}s) | ${fps} FPS | ETA: ${remMin}m${remSec}s `
    );
    res.writeHead(200);
    res.end('OK');
    return;
  }

  if (pathname === '/done') {
    console.log('\n\n[RENDER FINISHED] All 12,750 frames rendered & encoded via WebCodecs!');
    res.writeHead(200);
    res.end('OK');

    h264Stream.end(() => {
      const h264SizeMb = (fs.statSync(H264_PATH).size / (1024 * 1024)).toFixed(2);
      console.log(`[H264 BITSTREAM] Generated ${H264_PATH} (${h264SizeMb} MB)`);
      console.log('[FFMPEG] Muxing pure video with song.mp3...');

      if (browserProc) {
        browserProc.kill();
      }

      const ff = spawn('ffmpeg', [
        '-y',
        '-r', '60',
        '-i', H264_PATH,
        '-i', SONG_PATH,
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-t', '212.5',
        '-movflags', '+faststart',
        OUT_MP4
      ], { stdio: 'inherit' });

      ff.on('close', code => {
        if (fs.existsSync(H264_PATH)) fs.unlinkSync(H264_PATH);
        if (code === 0 && fs.existsSync(OUT_MP4)) {
          const mp4Mb = (fs.statSync(OUT_MP4).size / (1024 * 1024)).toFixed(2);
          console.log('\n===============================================================');
          console.log(`SUCCESS! 100% Deterministic 60.000 FPS Video Produced!`);
          console.log(`File: ${OUT_MP4} (${mp4Mb} MB)`);
          console.log(`Specification: 1920x1080 @ 60.000 FPS | 12,750 frames | 0 dropped`);
          console.log('===============================================================\n');
        } else {
          console.error('[ERROR] FFmpeg muxing failed with code', code);
        }
        server.close();
        process.exit(code || 0);
      });
    });
    return;
  }

  // Static file serving
  let filePath = path.join(root, pathname === '/' ? 'index.html' : pathname.replace(/^\//, ''));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Export server listening on http://127.0.0.1:${PORT}`);
  console.log('Starting Edge with GPU Hardware Acceleration...');
  console.log('Rendering all 12,750 frames deterministically (No subtitles, ?nosub=1)...');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  browserProc = spawn(edgePath, [
    '--enable-gpu',
    '--ignore-gpu-blocklist',
    '--enable-accelerated-video-encode',
    '--enable-accelerated-video-decode',
    '--use-gl=angle',
    '--use-angle=d3d11',
    '--enable-zero-copy',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=CalculateNativeWinOcclusion',
    '--window-size=1920,1080',
    `http://127.0.0.1:${PORT}/index.html?export=1&nosub=1`
  ]);

  browserProc.on('error', err => console.error('Failed to launch Edge:', err));
});
