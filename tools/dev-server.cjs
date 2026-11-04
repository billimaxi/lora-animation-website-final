// Local static server plus the real Netlify handler. No deployment required.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { handler } = require('../netlify/functions/tech-news');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpeg': 'image/jpeg' };
http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/.netlify/functions/tech-news') {
      const result = await handler();
      response.writeHead(result.statusCode, result.headers); response.end(result.body); return;
    }
    if (url.pathname === '/.netlify/functions/lora-ai') {
      const { default: aiHandler } = await import('../netlify/functions/lora-ai.mjs');
      const controller = new AbortController();
      const requestTimeout = setTimeout(() => controller.abort(), 25000);
      try {
        const chunks = [];
        let size = 0;
        for await (const chunk of request) {
          size += chunk.length;
          if (size > 50000) { response.writeHead(413); response.end('Request too large'); return; }
          chunks.push(chunk);
        }
        const result = await aiHandler(new Request('http://' + request.headers.host + url.pathname, {
          method: request.method, headers: request.headers,
          ...(!['GET', 'HEAD'].includes(request.method) ? { body: Buffer.concat(chunks) } : {}),
          signal: controller.signal
        }));
        response.writeHead(result.status, Object.fromEntries(result.headers));
        response.end(await result.text());
      } finally { clearTimeout(requestTimeout); }
      return;
    }
    let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!file.startsWith(root + path.sep) && file !== root) throw new Error('Invalid path');
    // Match public publishing behavior without exposing local metadata or dependencies.
    const relative = path.relative(root, file);
    if (relative.split(path.sep).some(part => part.startsWith('.') || ['node_modules', 'netlify', 'tools', 'tests'].includes(part))) throw new Error('Private path');
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    response.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
    response.end(await fs.readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(8000, '0.0.0.0', () => console.log('Local LORA server on port 8000, including the Netlify news handler.'));
