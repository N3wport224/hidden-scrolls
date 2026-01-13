require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const compression = require('compression');
const apicache = require('apicache');
const path = require('path'); // Required for hosting the site

const app = express();
const PORT = process.env.PORT || 3000;
const cache = apicache.middleware;

app.use(cors());
app.use(compression());

if (!process.env.ABS_BASE_URL || !process.env.ABS_API_TOKEN) {
  console.error("❌ ERROR: Missing .env variables.");
}

// --- SMART CACHE FILTER ---
const cacheLogic = cache('5 minutes', (req, res) => {
    const path = req.query.path || '';
    return res.statusCode === 200 && 
           req.method === 'GET' && 
           !path.includes('/file') && 
           !path.includes('/cover') &&
           !path.includes('/play');
});

// --- API PROXY ROUTE ---
app.use('/api/proxy', cacheLogic, async (req, res) => {
  try {
    const originalPath = req.query.path || '/api/items'; 
    const targetUrl = `${process.env.ABS_BASE_URL}${originalPath}`;
    const rangeHeader = req.headers.range;

    console.log(`📡 Fetching: ${originalPath}`);

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

// --- HOST THE WEBSITE (New Part) ---
// 1. Serve the static files from the React build folder
app.use(express.static(path.join(__dirname, '../client/dist')));

// 2. Handle "Catch-All" routing (Sends all other requests to React)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Hidden Scrolls running on port ${PORT}`);
});