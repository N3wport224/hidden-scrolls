const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); 
require('dotenv').config();

const app = express();
const PORT = 3000;

// MANDATORY: Tell the browser it is safe to play this audio stream
app.use(cors({
  origin: '*',
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('/api/proxy', (req, res) => {
  const { path: apiPath } = req.query;
  const base = (process.env.ABS_BASE_URL || 'http://100.81.193.52:13378').replace(/\/+$/, '');
  const subPath = decodeURIComponent(apiPath).replace(/^\/+/, '');
  
  // FIXED PATH: Confirmed working by your Probing Test
  const fullUrl = `${base}/audiobookshelf/${subPath}`;

  const options = {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
      'Range': req.headers.range || '' // Critical for scrubbing/seeking
    }
  };

  const proxyReq = http.request(fullUrl, options, (proxyRes) => {
    // Forward the exact status (200 or 206)
    res.status(proxyRes.statusCode);

    // Forward binary headers ChatGPT and your logs highlighted
    const forwardHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
    forwardHeaders.forEach(h => {
      if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
    });

    // Final pipe to browser
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    console.error(`[Engine Error]: ${e.message}`);
    if (!res.headersSent) res.status(500).send("ABS Connection Failed");
  });
  
  proxyReq.end();
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
app.listen(PORT, () => console.log(`🚀 Pro Engine V9: Final Connection Established`));