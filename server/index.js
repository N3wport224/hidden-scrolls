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
  
  // Clean the base URL from .env
  const base = (process.env.ABS_BASE_URL || 'http://100.81.193.52:13378').replace(/\/+$/, '');
  
  // Resolve the internal ABS path
  let subPath = decodeURIComponent(apiPath).replace(/^\/+/, '');

  // ABS API MAPPING: Ensure the proxy hits the actual media endpoint
  if (subPath.includes('/file')) {
    // Some ABS versions prefer /file, others /play. This ensures compatibility.
    console.log(`[Proxy] Streaming media for: ${subPath}`);
  }

  const fullUrl = `${base}/${subPath}`;
  console.log(`[Proxy Request] Target: ${fullUrl}`);

  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${process.env.ABS_API_TOKEN}` }
  };

  if (req.headers.range) {
    options.headers['Range'] = req.headers.range;
  }

  const proxyReq = http.get(fullUrl, options, (proxyRes) => {
    // Forward the status code and headers
    res.status(proxyRes.statusCode);
    
    const forwardHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
    forwardHeaders.forEach(h => {
      if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
    });

    // Pipe the binary data directly to the browser
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    console.error(`[Proxy Connection Error]: ${e.message}`);
    if (!res.headersSent) res.status(500).send("ABS Connection Failed");
  });

  proxyReq.end();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Car Player V5: Connection Shield Active`));