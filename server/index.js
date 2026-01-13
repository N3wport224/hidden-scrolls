require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // We use the native module now
const path = require('path');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Helper to clean up the URL
const getTargetUrl = (base, relPath) => {
  const cleanBase = base.replace(/\/$/, '');
  const cleanPath = relPath.startsWith('/') ? relPath : `/${relPath}`;
  return new URL(`${cleanBase}${cleanPath}`);
};

app.use('/api/proxy', (req, res) => {
  const originalPath = req.query.path;
  if (!originalPath) return res.status(400).send("Missing path");

  try {
    const targetUrl = getTargetUrl(process.env.ABS_BASE_URL, originalPath);

    console.log(`📡 Proxying: ${originalPath}`);
    if (req.headers.range) console.log(`   ↳ Range: ${req.headers.range}`);

    // Prepare options for the raw request
    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || 80,
      path: targetUrl.pathname + targetUrl.search,
      method: req.method,
      headers: {
        ...req.headers,
        // Override crucial headers
        'host': targetUrl.host,
        'authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
        'accept-encoding': 'identity', // Disable compression (CRITICAL for streaming)
        'connection': 'keep-alive'
      }
    };

    // The Raw Request
    const proxyReq = http.request(options, (proxyRes) => {
      console.log(`   ✅ Upstream Status: ${proxyRes.statusCode}`);

      // Forward status and headers to phone
      res.status(proxyRes.statusCode);
      
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });

      // Pipe the data (stream it)
      proxyRes.pipe(res);
    });

    // Handle Errors
    proxyReq.on('error', (e) => {
      console.error(`💀 PROXY ERROR: ${e.message}`);
      if (!res.headersSent) res.status(500).send("Proxy Error");
    });

    // End the request
    proxyReq.end();

  } catch (error) {
    console.error("Critical Error:", error);
    res.status(500).send("Server Error");
  }
});

// Host the website
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Hidden Scrolls running on port ${PORT}`);
});