import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT || 8731);
const OUT = process.argv[2] || 'world.execute(me).webm';
const ROOT = path.resolve('.');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (req.method === 'POST') {
    const parts = [];
    req.on('data', c => parts.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(parts);
      fs.writeFileSync(OUT, buf);
      console.log('RECORDING COMPLETED: ' + OUT + ' (' + (buf.length / 1024 / 1024).toFixed(2) + ' MB)');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      setTimeout(() => process.exit(0), 600);
    });
    return;
  }

  if (req.method === 'GET') {
    const urlPath = req.url.split('?')[0];
    let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.mp3': 'audio/mpeg',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.webm': 'video/webm'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      return fs.createReadStream(filePath).pipe(res);
    }
    res.writeHead(404);
    return res.end('Not Found');
  }

  res.writeHead(405);
  res.end('Method Not Allowed');
});

server.listen(PORT, '127.0.0.1', () => console.log('Capture server listening on http://127.0.0.1:' + PORT));
setTimeout(() => { console.log('TIMEOUT'); process.exit(2); }, 10 * 60 * 1000);
