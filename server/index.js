require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const compression = require('compression'); // New Tool 1: Shrinks data
const apicache = require('apicache');       // New Tool 2: Remembers data

const app = express();
const PORT = process.env.PORT || 3000;
const cache = apicache.middleware;

app.use(cors());
app.use(compression()); // Enable Gzip compression globally

if (!process.env.ABS_BASE_URL || !process.env.ABS_API_TOKEN) {
  console.error("❌ ERROR: Missing .env variables.");
}

// --- SMART CACHE FILTER ---
// We only want to cache "Text" data (Library lists, Book info).
// We MUST NOT cache Audio streams or Images (too big/complex).
const cacheLogic = cache('5 minutes', (req, res) => {
    const path = req.query.path || '';
    
    // Only cache if the request was successful (200 OK)
    // AND it is NOT a file (audio) or cover (image)
    return res.statusCode === 200 && 
           req.method === 'GET' && 
           !path.includes('/file') && 
           !path.includes('/cover') &&
           !path.includes('/play');
});

// Apply the cache logic to our proxy route
app.use('/api/proxy', cacheLogic, async (req, res) => {
  try {
    const originalPath = req.query.path || '/api/items'; 
    const targetUrl = `${process.env.ABS_BASE_URL}${originalPath}`;
    const rangeHeader = req.headers.range;

    // Log only if it's NOT a cached hit (Cached hits are silent and instant)
    console.log(`📡 Fetching from Pi: ${originalPath}`);

    const headers = {
      'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
      'Content-Type': req.headers['content-type'] || 'application/json'
    };

    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      responseType: 'stream', 
      validateStatus: () => true, 
    });

    res.set({
        'Content-Type': response.headers['content-type'],
        'Content-Length': response.headers['content-length'],
        'Accept-Ranges': response.headers['accept-ranges'],
        'Content-Range': response.headers['content-range']
    });

    res.status(response.status);
    response.data.pipe(res);

  } catch (error) {
    console.error("💀 PROXY ERROR:", error.message);
    if (!res.headersSent) {
        res.status(500).send("Proxy Error");
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 High-Performance Proxy running on http://localhost:${PORT}`);
});