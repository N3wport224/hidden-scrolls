const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); 
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors({
  origin: '*',
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('/api/proxy', async (req, res) => {
  const { path: apiPath } = req.query;
  const base = (process.env.ABS_BASE_URL || 'http://100.81.193.52:13378').replace(/\/+$/, '');
  const subPath = decodeURIComponent(apiPath).replace(/^\/+/, '');
  
  // MANDATORY: The /audiobookshelf/ folder identified in your source code
  const fullUrl = `${base}/audiobookshelf/${subPath}`;

  console.log(`[ENGINE] Handshaking: ${fullUrl}`);

  const options = {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
      'Range': req.headers.range || '' // Critical for 206 Partial Content
    }
  };

  const proxyReq = http.request(fullUrl, options, (proxyRes) => {
    // DIAGNOSTIC LOGGING
    console.log(`[ABS Response]: ${proxyRes.statusCode}`);

    // If ABS blocks the stream with a 404, we log the internal reason
    if (proxyRes.statusCode === 404) {
      console.error(`!! SESSION BLOCK: ABS requires an active Playback Session for this token !!`);
    }

    res.status(proxyRes.statusCode);
    const forwardHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
    forwardHeaders.forEach(h => {
      if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
    });

    // Pipe binary stream directly to minimize buffering lag
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    console.error(`[Network Error]: ${e.message}`);
    if (!res.headersSent) res.status(500).send("ABS Connection Failed");
  });

  proxyReq.end();
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

app.listen(PORT, () => console.log(`🚀 Pro Engine V11: Session Handshake Active`));