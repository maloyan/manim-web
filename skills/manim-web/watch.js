#!/usr/bin/env node
/**
 * watch.js — live edit→reload dev server for manim-web scenes.
 *
 * Serves one `index.html`, watches it on disk, and pushes a Server-Sent
 * Events (SSE) reload signal to the open page on every save. The page also
 * POSTs its manim-web log entries back here, so an agent can read browser
 * logs without a headless browser.
 *
 * Usage:
 *   node watch.js            # serve ./index.html on http://localhost:3000
 *   node watch.js app.html   # serve a different file
 *   PORT=4000 node watch.js  # pick the port
 *
 * Endpoints:
 *   GET  /          -> the HTML file (no cache)
 *   GET  /__reload  -> SSE stream; emits "reload" when the file changes
 *   POST /__log     -> record one JSON log entry (from onLog in the page)
 *   GET  /__logs    -> the recorded log entries as a JSON array
 *
 * The page opts in with:
 *   new EventSource('/__reload').onmessage = () => location.reload();
 *   onLog(entry => fetch('/__log', { method: 'POST', body: JSON.stringify(entry) }));
 *
 * No dependencies — Node's built-in http and fs only.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const file = path.resolve(process.argv[2] || 'index.html');
const port = Number(process.env.PORT) || 3000;

// A ready-to-edit starter page, written once if the target file is missing,
// so `node watch.js` works on an empty directory.
const STARTER_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>manim-web scene</title></head>
<body>
<div id="container"></div>

<!-- Live reload: the watch.js SSE stream reloads the page on every save. -->
<script>
  new EventSource('/__reload').onmessage = () => location.reload();
</script>

<!-- The scene. Edit this block and save to see the change. -->
<script type="module">
  import {
    Scene,
    Circle,
    Create,
    onLog,
    BLUE,
  } from 'https://cdn.jsdelivr.net/npm/manim-web@latest/dist/manim-web.browser.js';

  // Forward manim-web logs to watch.js so an agent can read them from /__logs.
  onLog((entry) => {
    fetch('/__log', { method: 'POST', body: JSON.stringify(entry) }).catch(() => {});
  });

  const scene = new Scene(document.getElementById('container'), { width: 600, height: 360 });
  const circle = new Circle({ radius: 1.5, color: BLUE });
  await scene.play(new Create(circle));
</script>
</body>
</html>
`;

if (!fs.existsSync(file)) {
  fs.writeFileSync(file, STARTER_HTML);
  console.log(`created starter ${path.basename(file)}`);
}

/** @type {Array<unknown>} collected log entries POSTed by the page. */
const logs = [];
/** @type {Array<import('http').ServerResponse>} open SSE clients. */
let clients = [];

// Clear logs and tell every open page to reload when the file changes.
// fs.watch can fire twice per save on some platforms; a short debounce
// collapses the burst into one reload.
let reloadTimer = null;
fs.watch(file, () => {
  if (reloadTimer) return;
  reloadTimer = setTimeout(() => {
    reloadTimer = null;
    logs.length = 0;
    for (const res of clients) res.write('data: reload\n\n');
  }, 50);
});

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(fs.readFileSync(file));
  } else if (req.method === 'GET' && req.url === '/__reload') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write('\n'); // open the stream
    clients.push(res);
    req.on('close', () => {
      clients = clients.filter((c) => c !== res);
    });
  } else if (req.method === 'POST' && req.url === '/__log') {
    let body = '';
    req.on('data', (d) => {
      body += d;
    });
    req.on('end', () => {
      try {
        logs.push(JSON.parse(body));
      } catch {
        logs.push({ level: 'error', message: 'watch.js: non-JSON log body', raw: body });
      }
      res.end('ok');
    });
  } else if (req.method === 'GET' && req.url === '/__logs') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(logs));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(port, () => {
  console.log(`serving ${path.basename(file)} on http://localhost:${port}`);
  console.log(`logs at http://localhost:${port}/__logs`);
});
