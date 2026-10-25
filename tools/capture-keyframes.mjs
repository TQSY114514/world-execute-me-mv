import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const PORT = 8745;
let capturedCount = 0;
const targetTimes = [
  { t: 34.2, name: 'preview-circumference-01.png' },
  { t: 35.5, name: 'preview-circumference-02.png' },
  { t: 36.6, name: 'preview-circumference-03.png' },
  { t: 56.5, name: 'preview-unite-deeply.png' }
];

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
  if (url.pathname === '/upload_frame') {
    const name = url.searchParams.get('name') || 'frame.png';
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      const outPath = path.join(root, 'docs', name);
      fs.writeFileSync(outPath, buf);
      console.log(`[FRAME SAVED] ${name} (${buf.length} bytes)`);
      capturedCount++;
      res.writeHead(200);
      res.end('OK');

      if (capturedCount >= targetTimes.length) {
        setTimeout(() => {
          server.close();
          process.exit(0);
        }, 500);
      }
    });
    return;
  }

  let filePath = path.join(root, url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, ''));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === '.html' ? 'text/html' : (ext === '.js' ? 'application/javascript' : 'application/octet-stream');
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Capturing 4 keyframe PNGs via test=1...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  targetTimes.forEach((item, idx) => {
    setTimeout(() => {
      const uploadUrl = `http://127.0.0.1:${PORT}/upload_frame?name=${item.name}`;
      const testUrl = `http://127.0.0.1:${PORT}/index.html?test=1&cols=1&times=${item.t}&upload=${encodeURIComponent(uploadUrl)}`;
      const proc = spawn(edgePath, [
        '--headless=new',
        '--disable-gpu',
        '--window-size=1920,1080',
        testUrl
      ]);
      proc.on('error', err => console.error(err));
      setTimeout(() => proc.kill(), 4000);
    }, idx * 1000);
  });
});
