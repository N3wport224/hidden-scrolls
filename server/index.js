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

  // SESSION UNLOCK LOGIC: If requesting /play, we must ensure a session exists
  if (subPath.includes('/play')) {
    console.log(`[SESSION UNLOCK] Initializing stream for: ${subPath}`);
    
    // We send a hidden POST request to ABS to officially "Start" the playback session
    const unlockPath = fullUrl.replace('/play', '');
    const postData = JSON.stringify({ 
      deviceInfo: { clientName: "CarPlayer", deviceId: "car-system-v1" },
      forceDirectPlay: true 
    });

    const unlockReq = http.request(unlockPath, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    });
    unlockReq.write(postData);
    unlockReq.end();
    
    // Give ABS a tiny moment to register the session before we pull the audio
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  const options = {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
      'Range': req.headers.range || '' // FORWARD RANGE: Required for the browser to play
    }
  };

  const proxyReq = http.request(fullUrl, options, (proxyRes) => {
    console.log(`[ABS Status]: ${proxyRes.statusCode} for ${subPath}`);

    res.status(proxyRes.statusCode);
    const forwardHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
    forwardHeaders.forEach(h => {
      if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
    });

    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    console.error(`[Network Error]: ${e.message}`);
    if (!res.headersSent) res.status(500).send("ABS Offline");
  });

  proxyReq.end();
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

app.listen(PORT, () => console.log(`🚀 Pro Engine V13: Auto-Session Unlock Active`));