require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.all('/api/proxy', async (req, res) => {
  const originalPath = req.query.path;
  if (!originalPath) return res.status(400).send("Missing path");

  const token = (process.env.ABS_API_TOKEN || '').trim();
  const baseUrl = process.env.ABS_BASE_URL.replace(/\/$/, '');
  const targetUrl = `${baseUrl}/${originalPath.replace(/^\//, '')}`;
  
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Range': req.headers.range || 'bytes=0-',
        'User-Agent': req.headers['user-agent']
      },
      data: req.body,
      responseType: 'stream',
      validateStatus: () => true 
    });

    // CRITICAL for Mobile: Pass these headers exactly as they come from ABS
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges', 
      'cache-control',
      'last-modified'
    ];

    headersToForward.forEach(h => {
      if (response.headers[h]) res.setHeader(h, response.headers[h]);
    });

    // Log the actual type being sent to the phone for debugging
    console.log(`📡 [${response.status}] Type: ${response.headers['content-type']} -> ${originalPath}`);
    
    res.status(response.status);
    response.data.pipe(res);
  } catch (error) {
    console.error("💀 Proxy Error:", error.message);
    if (!res.headersSent) res.status(500).send("Proxy Error");
  }
});

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

app.listen(PORT, () => console.log(`🚀 Transparent Proxy Engine active on port ${PORT}`));