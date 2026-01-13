require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Note: We REMOVED the general compression middleware because it breaks audio streaming

if (!process.env.ABS_BASE_URL || !process.env.ABS_API_TOKEN) {
  console.error("❌ ERROR: Missing .env variables.");
}

// --- API PROXY ROUTE ---
app.use('/api/proxy', async (req, res) => {
  try {
    const originalPath = req.query.path;
    if (!originalPath) return res.status(400).send("Missing path");

    const targetUrl = `${process.env.ABS_BASE_URL}${originalPath}`;
    const rangeHeader = req.headers.range;

    console.log(`📡 Proxying: ${originalPath} ${rangeHeader ? '(Streaming)' : ''}`);

    const headers = {
      'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`
    };

    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      responseType: 'stream',
      decompress: false, // CRITICAL: Prevents corrupting the audio stream
      validateStatus: () => true, // Accept 200, 206, 404, etc.
    });

    // Forward important headers for streaming
    const headersToForward = [
      'content-type',
      'content-length',
      'accept-ranges',
      'content-range',
      'last-modified'
    ];

    headersToForward.forEach(header => {
      if (response.headers[header]) {
        res.setHeader(header, response.headers[header]);
      }
    });

    // Forward the exact status code (200 or 206)
    res.status(response.status);
    
    // Pipe the audio data to the client
    response.data.pipe(res);

  } catch (error) {
    console.error("💀 PROXY ERROR:", error.message);
    if (!res.headersSent) res.status(500).send("Proxy Error");
  }
});

// --- HOST THE WEBSITE ---
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Hidden Scrolls running on port ${PORT}`);
});