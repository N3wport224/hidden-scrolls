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
  
  // SESSION REDIRECT LOGIC: If requesting /play, we perform a Deep Handshake
  if (subPath.includes('/play')) {
    const itemId = subPath.split('/')[2];
    console.log(`[DEEP HANDSHAKE] Unlocking Item: ${itemId}`);
    
    const postData = JSON.stringify({ 
      deviceInfo: { clientName: "CarPlayer", deviceId: "car-v1" },
      forceDirectPlay: true 
    });

    const sessionReq = http.request(`${base}/audiobookshelf/api/items/${itemId}/play`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    }, (sessionRes) => {
      let body = '';
      sessionRes.on('data', d => body += d);
      sessionRes.on('end', () => {
        try {
          const sessionData = JSON.parse(body);
          const sessionId = sessionData.id;
          // REDIRECT TO THE TRACK URL: Found in your source code line 431
          const trackUrl = `/api/proxy?path=${encodeURIComponent(`/public/session/${sessionId}/track/1`)}`;
          console.log(`[SESSION SUCCESS] ID: ${sessionId} -> Routing to Track`);
          res.redirect(trackUrl);
        } catch (e) {
          res.status(500).send("Session parsing failed");
        }
      });
    });
    sessionReq.write(postData);
    sessionReq.end();
    return;
  }

  // STANDARD PROXY LOGIC (For covers and the final track stream)
  const fullUrl = `${base}/audiobookshelf/${subPath}`;
  const options = {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
      'Range': req.headers.range || '' 
    }
  };

  const proxyReq = http.request(fullUrl, options, (proxyRes) => {
    console.log(`[ABS STATUS]: ${proxyRes.statusCode} for ${subPath}`);
    res.status(proxyRes.statusCode);
    const forwardHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
    forwardHeaders.forEach(h => {
      if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
    });
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => res.status(500).send("ABS Connection Failed"));
  proxyReq.end();
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

app.listen(PORT, () => console.log(`🚀 Pro Engine V14: Deep Handshake Active`));