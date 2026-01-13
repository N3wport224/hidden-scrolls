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
    const targetUrl = `${process.env.ABS_BASE_URL}${originalPath}`;
    
    // Log the incoming request
    console.log(`📡 Request: ${originalPath}`);
    if (req.headers.range) {
      console.log(`   ↳ Client asked for Range: ${req.headers.range}`);
    }

    // 1. Prepare Headers (Force Capitalization for Strict Servers)
    const upstreamHeaders = {
      'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
      'Accept': '*/*',
      'Accept-Encoding': 'identity', // Disable compression
      'Connection': 'keep-alive'
    };

    // 2. Explicitly add Range if the phone asked for it
    if (req.headers.range) {
      upstreamHeaders['Range'] = req.headers.range; 
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: upstreamHeaders,
      responseType: 'stream', 
      decompress: false,
      validateStatus: () => true,
    });

    console.log(`   ✅ Upstream Status: ${response.status}`);
    console.log(`   ✅ Content-Type: ${response.headers['content-type']}`);

    // 3. Forward the specific streaming headers
    const headersToForward = [
      'content-type',
      'content-length',
      'accept-ranges',
      'content-range',
      'content-encoding',
      'transfer-encoding'
    ];

    headersToForward.forEach(header => {
      if (response.headers[header]) {
        res.setHeader(header, response.headers[header]);
      }
    });

    // 4. Send the data
    res.status(response.status);
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