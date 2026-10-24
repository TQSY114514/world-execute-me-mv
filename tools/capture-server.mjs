import http from 'node:http';
import fs from 'node:fs';

const PORT = Number(process.env.PORT || 8731);
const OUT = process.argv[2] || 'shots/film.webm';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.method !== 'POST') { res.writeHead(404); return res.end('no'); }
  const parts = [];
  req.on('data', c => parts.push(c));
  req.on('end', () => {
    const buf = Buffer.concat(parts);
    fs.writeFileSync(OUT, buf);
    console.log('WROTE ' + OUT + ' ' + buf.length + ' bytes');
    res.writeHead(200); res.end('ok');
    setTimeout(() => process.exit(0), 300);
  });
});
server.listen(PORT, '127.0.0.1', () => console.log('listening ' + PORT));
setTimeout(() => { console.log('TIMEOUT'); process.exit(2); }, 8 * 60 * 1000);
