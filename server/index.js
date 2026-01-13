require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use('/api/proxy', async (req, res) => {
  try {
    const originalPath = req.query.path;
    if (!originalPath) return res.status(400).send("Missing path");

    // 1. CONSTRUCT URL WITH STICKY TOKEN
    // We append the token directly to the URL so it survives redirects
    const baseUrl = process.env.ABS_BASE_URL.replace(/\/$/, '');
    const cleanPath = originalPath.startsWith('/') ? originalPath : `/${originalPath}`;
    
    // Check if path already has query params
    const separator = cleanPath.includes('?') ? '&' : '?';
    const targetUrl = `${baseUrl}${cleanPath}${separator}token=${process.env.ABS_API_TOKEN}`;

    console.log(`📡 Proxying: ${originalPath}`);
    if (req.headers.range) console.log(`   ↳ Range: ${req.headers.range}`);

    // 2. MAKE THE REQUEST (No Auth Header needed now)
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Range': req.headers.range || '', // Forward the streaming request
        'Accept': '*/*',
        'Accept-Encoding': 'identity' // Disable compression
      },
      responseType: 'stream',
      validateStatus: () => true,
      maxRedirects: 5 // Follow redirects automatically
    });

    console.log(`   ✅ Upstream Status: ${response.status}`);

    // 3. FORWARD RESPONSE
    res.status(response.status);
    
    const headersToForward = [
      'content-type',
      'content-length',
      'accept-ranges',
      'content-range',
      'content-encoding'
    ];

    headersToForward.forEach(header => {
      if (response.headers[header]) {
        res.setHeader(header, response.headers[header]);
      }
    });

    response.data.pipe(res);

  } catch (error) {
    console.error("💀 PROXY ERROR:", error.message);
    if (!res.headersSent) res.status(500).send("Proxy Error");
  }
});

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Hidden Scrolls running on port ${PORT}`);
});