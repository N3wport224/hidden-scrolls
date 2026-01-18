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
  
  // SLASH GUARD: Clean the base URL and the incoming path
  const base = (process.env.ABS_BASE_URL || 'http://100.81.193.52:13378').replace(/\/+$/, '');
  const subPath = decodeURIComponent(apiPath).replace(/^\/+/, '');
  const fullUrl = `${base}/${subPath}`;

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

  const proxyReq = http.get(fullUrl, options, (proxyRes) => {
    // If ABS returns a 404 here, we log exactly what URL failed
    if (proxyRes.statusCode === 404) {
      console.error(`[ABS 404] Target not found: ${fullUrl}`);
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

app.listen(PORT, () => console.log(`🚀 Car Player V4: Connection Shield Active`));