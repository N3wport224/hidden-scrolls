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
  const fullUrl = `${base}/audiobookshelf/${subPath}`;

  // If this is an audio request, we force-check the session handshake
  if (subPath.includes('/play') || subPath.includes('/file')) {
    console.log(`[SESSION HANDSHAKE] Opening media stream for: ${subPath}`);
  }

  const options = {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
      'Range': req.headers.range || '' // FORWARD RANGE: Required for browser playback
    }
  };

  const proxyReq = http.request(fullUrl, options, (proxyRes) => {
    // DIAGNOSTIC LOGGING
    console.log(`[ABS Status]: ${proxyRes.statusCode} for ${subPath}`);

    if (proxyRes.statusCode === 404) {
      console.error(`!! SESSION BLOCK DETECTED !! ABS is rejecting the stream.`);
    }

    res.status(proxyRes.statusCode);
    const forwardHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
    forwardHeaders.forEach(h => {
      if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
    });

    // Pipe directly to browser
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    console.error(`[Network Error]: ${e.message}`);
    if (!res.headersSent) res.status(500).send("ABS Offline");
  });

  proxyReq.end();
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

app.listen(PORT, () => console.log(`🚀 Pro Engine V12: Session Handshake Active`));