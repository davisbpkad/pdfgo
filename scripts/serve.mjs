/**
 * scripts/serve.mjs - Conflict-Free Local HTTP Preview Server
 * Automatically scans and detects an available port to prevent any localhost conflicts.
 * Uses native Node.js http and fs modules (zero dependencies).
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import net from 'net';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

const BASE_DIR = path.resolve('dist');

/**
 * Find a free port starting from startPort or using kernel ephemeral port (0)
 */
function findFreePort(startPort = 3100) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port
        resolve(findFreePort(startPort + 1));
      } else {
        reject(err);
      }
    });

    server.listen(startPort, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function startServer() {
  if (!fs.existsSync(path.join(BASE_DIR, 'index.html'))) {
    console.log('Build belum ditemukan. Menjalankan "node build.mjs" terlebih dahulu...');
    const { execSync } = await import('child_process');
    execSync('node build.mjs', { stdio: 'inherit' });
  }

  const freePort = await findFreePort(3100);

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/' || reqUrl === '') {
      reqUrl = '/index.html';
    }

    const safePath = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(BASE_DIR, safePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found - File tidak ditemukan.');
    }
  });

  server.listen(freePort, '127.0.0.1', () => {
    console.log('\n========================================================');
    console.log('       PDF To Go - Local Preview Server                 ');
    console.log('========================================================');
    console.log(`> URL: http://localhost:${freePort}`);
    console.log(`> Port ${freePort} terpilih secara dinamis (BEBAS BENTROK).`);
    console.log(`> Atau buka langsung file HTML via: file://${path.join(BASE_DIR, 'PDF To Go.html')}`);
    console.log('========================================================\n');
  });
}

startServer().catch(console.error);
