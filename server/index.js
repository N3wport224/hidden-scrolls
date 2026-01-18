const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); 
require('dotenv').config();

const app = express();
const PORT = 3000;

// FORWARDING CORS: This exposes the headers ChatGPT mentioned
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
  
  // Mandatory base path detected in your source code
  const fullUrl = `${base}/audiobookshelf/${subPath}`;

  const options = {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
      // Forward the Range header (Critical for 206 responses)
      'Range': req.headers.range || '' 
    }
  };

  const proxyReq = http.request(fullUrl, options, (proxyRes) => {
    // DIAGNOSTIC LOGGING
    console.log(`[ABS REQ]: ${fullUrl} | [STATUS]: ${proxyRes.statusCode}`);

    // Set the status code (200 or 206) and forward headers ChatGPT highlighted
    res.status(proxyRes.statusCode);
    const forwardHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
    forwardHeaders.forEach(h => {
      if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
    });

    // Directly pipe the binary stream to the browser
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    console.error(`[Connection Error]: ${e.message}`);
    if (!res.headersSent) res.status(500).send("ABS Connection Failed");
  });

  proxyReq.end();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Pro Engine V11: Binary Stream Handshake Active`));