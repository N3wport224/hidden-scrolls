const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); 
require('dotenv').config();

const app = express();
const PORT = 3000;

// Enable wide CORS and expose headers ChatGPT mentioned
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
  
  // Prepends mandatory base path
  const fullUrl = `${base}/audiobookshelf/${subPath}`;

  const options = {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
      // FORWARD RANGE HEADER: Critical for 206 responses
      'Range': req.headers.range || ''
    }
  };

  const proxyReq = http.get(fullUrl, options, (proxyRes) => {
    // Log the diagnosis ChatGPT recommended
    console.log(`[ABS REQ]: ${fullUrl}`);
    console.log(`[ABS STATUS]: ${proxyRes.statusCode}`);

    // Forward the 200 or 206 status code exactly as ABS sends it
    res.status(proxyRes.statusCode);

    // Forward all critical media headers ChatGPT mentioned
    const forwardHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
    forwardHeaders.forEach(h => {
      if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
    });

    // Directly pipe the binary stream to prevent buffering lag
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    console.error(`[Proxy Error]: ${e.message}`);
    if (!res.headersSent) res.status(500).send("ABS Connection Failed");
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Pro Engine V8: Range Support Active`));