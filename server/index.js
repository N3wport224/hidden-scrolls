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
    
    console.log(`📡 Request: ${originalPath}`);
    if (req.headers.range) console.log(`   ↳ Range: ${req.headers.range}`);

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
        'Range': req.headers.range || '', 
        'Accept': '*/*',
        // CRITICAL: Tells server "Don't compress this" so we can stream it
        'Accept-Encoding': 'identity' 
      },
      responseType: 'stream', 
      decompress: false,
      validateStatus: () => true,
    });

    console.log(`   ✅ Upstream Status: ${response.status}`);
    console.log("   ✅ Content-Type:", response.headers['content-type']);
    
    const headersToForward = [
      'content-type',
      'content-length',
      'accept-ranges',
      'content-range',
      'transfer-encoding'
    ];

    headersToForward.forEach(header => {
      if (response.headers[header]) {
        res.setHeader(header, response.headers[header]);
      }
    });

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