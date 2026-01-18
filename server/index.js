const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); 
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors({ origin: '*', exposedHeaders: ['Content-Range', 'Accept-Ranges'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('/api/proxy', async (req, res) => {
  const { path: apiPath } = req.query;
  const base = (process.env.ABS_BASE_URL || 'http://100.81.193.52:13378').replace(/\/+$/, '');
  const subPath = decodeURIComponent(apiPath).replace(/^\/+/, '');
  
  // We will try these three patterns until one doesn't 404
  const patterns = [
    `${base}/audiobookshelf/${subPath}`, // Pattern A (Base path folder)
    `${base}/${subPath}`,                // Pattern B (Root level)
    `${base}/audiobookshelf/api/items/${subPath.split('/')[2]}/file` // Pattern C (Alternative /file)
  ];

  console.log(`\n--- PROBING START ---`);
  
  for (let fullUrl of patterns) {
    console.log(`[Testing]: ${fullUrl}`);
    
    try {
      const proxyReq = http.request(fullUrl, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
          'Range': req.headers.range || ''
        }
      }, (proxyRes) => {
        if (proxyRes.statusCode < 400) {
          console.log(`[SUCCESS] Found working path: ${proxyRes.statusCode}`);
          res.status(proxyRes.statusCode);
          const forwardHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
          forwardHeaders.forEach(h => { if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]); });
          proxyRes.pipe(res);
          return;
        } else {
          console.log(`[FAIL] Status ${proxyRes.statusCode}`);
          if (fullUrl === patterns[patterns.length - 1]) {
            res.status(404).send("All paths failed. Check user permissions.");
          }
        }
      });
      
      proxyReq.on('error', () => {});
      proxyReq.end();
      
      // Give each request a moment to resolve before trying next pattern
      await new Promise(r => setTimeout(r, 100)); 
      if (res.headersSent) break;
    } catch (e) {
      continue;
    }
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
app.listen(PORT, () => console.log(`🚀 Pro Probe Active on ${PORT}`));