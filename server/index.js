require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- UNIVERSAL PROXY ROUTE ---
app.all('/api/proxy', async (req, res) => {
  const originalPath = req.query.path;
  if (!originalPath) return res.status(400).send("Missing path");

  const token = (process.env.ABS_API_TOKEN || '').trim();
  const baseUrl = process.env.ABS_BASE_URL.replace(/\/$/, '');
  const cleanPath = originalPath.startsWith('/') ? originalPath : '/' + originalPath;
  const targetUrl = `${baseUrl}${cleanPath}`;
  
  try {
    console.log(`📡 Proxying ${req.method}: ${originalPath}`);

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Range': req.headers.range || '',
        'Accept': '*/*'
      },
      data: req.body, 
      responseType: 'stream',
      validateStatus: () => true 
    });

    console.log(`   ✅ Status from ABS: ${response.status}`);

    // Forward crucial headers for audio streaming
    const forwardHeaders = [
      'content-type', 
      'content-range', 
      'accept-ranges', 
      'content-length'
    ];
    
    forwardHeaders.forEach(header => {
      if (response.headers[header]) {
        res.setHeader(header, response.headers[header]);
      }
    });

    res.status(response.status);
    response.data.pipe(res);
  } catch (error) {
    console.error("💀 Proxy Error:", error.message);
    if (!res.headersSent) res.status(500).send("Proxy Error");
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Hidden Scrolls running on port ${PORT}`);
});