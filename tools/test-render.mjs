import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const PORT = 8741;
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
  if (url.pathname === '/upload_sheet') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      const outPath = path.join(root, 'docs', 'test-contact-sheet.png');
      fs.writeFileSync(outPath, buf);
      console.log(`[CONTACT SHEET SAVED] ${outPath} (${buf.length} bytes)`);
      res.writeHead(200);
      res.end('OK');
      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 500);
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
  const times = [
    33.0, 34.0, 35.0, 36.0, 37.0,
    46.0, 48.0, 53.5, 55.5, 57.5,
    62.0, 65.5, 69.5, 73.0, 77.0,
    81.0, 84.5, 88.0, 106.0, 117.0,
    148.0, 160.0, 165.0, 173.0, 185.0
  ].join(',');

  const testUrl = `http://127.0.0.1:${PORT}/index.html?test=1&cols=5&times=${times}&upload=http://127.0.0.1:${PORT}/upload_sheet`;
  console.log('Launching Edge for 25-frame contact sheet test...');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const proc = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    testUrl
  ]);

  proc.on('error', err => {
    console.error('Edge launch error:', err);
    server.close();
    process.exit(1);
  });

  setTimeout(() => {
    console.log('Timeout guard reached');
    proc.kill();
    server.close();
    process.exit(1);
  }, 20000);
});
