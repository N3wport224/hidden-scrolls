require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// --- STREAMING PROXY ---
app.use('/api/proxy', async (req, res) => {
  try {
    const originalPath = req.query.path;
    const targetUrl = `${process.env.ABS_BASE_URL}${originalPath}`;
    
    // Log exactly what is happening
    console.log(`📡 Request: ${originalPath}`);
    if (req.headers.range) {
      console.log(`   ↳ Streaming Range: ${req.headers.range}`);
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
        'Range': req.headers.range || '', // Forward the range request!
        'Accept': '*/*'
      },
      responseType: 'stream', 
      decompress: false, // REQUIRED for streaming to work
      validateStatus: () => true,
    });

    // Forward the critical headers back to the phone
    res.set({
        'Content-Type': response.headers['content-type'],
        'Content-Length': response.headers['content-length'],
        'Accept-Ranges': response.headers['accept-ranges'],
        'Content-Range': response.headers['content-range'],
    });

    res.status(response.status); // Should be 206 for streaming
    response.data.pipe(res);

  } catch (error) {
    console.error("💀 PROXY ERROR:", error.message);
    if (!res.headersSent) res.status(500).send("Proxy Error");
  }
});

// Host the website
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Hidden Scrolls running on port ${PORT}`);
});