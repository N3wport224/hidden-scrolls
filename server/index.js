const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); // Native Node module
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

/**
 * NATIVE STREAMING PROXY
 * Uses http.request for maximum stability with large audio files
 */
app.get('/api/proxy', (req, res) => {
  const { path: apiPath } = req.query;
  const ABS_HOST = 'localhost';
  const ABS_PORT = 13378;

  const options = {
    hostname: ABS_HOST,
    port: ABS_PORT,
    path: decodeURIComponent(apiPath),
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`
    }
  };

  // Forward Range header if browser sent one (Crucial for scrubbing)
  if (req.headers.range) {
    options.headers['Range'] = req.headers.range;
  }

  const proxyReq = http.request(options, (proxyRes) => {
    // Forward the status code (200, 206, 404, etc.)
    res.status(proxyRes.statusCode);

    // Forward relevant media headers
    const forwardHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
    forwardHeaders.forEach(h => {
      if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
    });

    // Pipe the raw binary stream directly to the browser
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    console.error(`[Proxy Error] ${e.message}`);
    if (!res.headersSent) res.status(500).send("Stream Error");
  });

  proxyReq.end();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Bulletproof Proxy active on port ${PORT}`));