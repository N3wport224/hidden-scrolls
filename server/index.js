const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); 
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('/api/proxy', (req, res) => {
  const { path: apiPath } = req.query;
  
  // ABS BASE PATH DETECTED: /audiobookshelf
  const base = (process.env.ABS_BASE_URL || 'http://100.81.193.52:13378').replace(/\/+$/, '');
  const subPath = decodeURIComponent(apiPath).replace(/^\/+/, '');
  
  // Create the corrected URL with the base path
  const fullUrl = `${base}/audiobookshelf/${subPath}`;

  console.log(`\n--- DEBUGGER LOG ---`);
  console.log(`[Target URL]: ${fullUrl}`);
  console.log(`[Range Req]: ${req.headers.range || 'None'}`);

  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${process.env.ABS_API_TOKEN}` }
  };

  if (req.headers.range) {
    options.headers['Range'] = req.headers.range;
  }

  const proxyReq = http.get(fullUrl, options, (proxyRes) => {
    console.log(`[ABS Response]: ${proxyRes.statusCode}`);

    // If we still get a 404, we log a warning about the Base Path
    if (proxyRes.statusCode === 404) {
      console.error(`!! STILL 404: Verify if ABS expects /audiobookshelf/ or just /`);
    }

    res.status(proxyRes.statusCode);
    const forwardHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
    forwardHeaders.forEach(h => {
      if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
    });

    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    console.error(`[Proxy Connection Error]: ${e.message}`);
    if (!res.headersSent) res.status(500).send("ABS Connection Failed");
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Smart Debugger active on port ${PORT}`));