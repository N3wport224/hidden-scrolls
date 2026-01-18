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
  
  // FIXED: Pull the full URL from .env
  // This resolves the 404 by pointing to the correct Tailscale IP
  const ABS_TARGET = process.env.ABS_BASE_URL || 'http://100.81.193.52:13378';
  const fullUrl = `${ABS_TARGET}${decodeURIComponent(apiPath)}`;

  console.log(`[Proxy] Routing to: ${fullUrl}`);

  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`
    }
  };

  if (req.headers.range) {
    options.headers['Range'] = req.headers.range;
  }

  // Native http.get for binary stability
  const proxyReq = http.get(fullUrl, options, (proxyRes) => {
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

app.listen(PORT, () => console.log(`🚀 Car Player V3 Online`));