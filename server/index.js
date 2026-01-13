require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Essential for Playback Session POST data

// --- AUDITED PROXY ROUTE ---
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
        'Content-Type': req.headers['content-type'] || 'application/json'
      },
      data: req.body, // Forwards POST data for session initialization
      responseType: 'stream',
      maxRedirects: 5,
      validateStatus: () => true 
    });

    console.log(`   ✅ Status from ABS: ${response.status}`);

    // Forward crucial headers for streaming
    const forwardHeaders = ['content-type', 'content-range', 'accept-ranges', 'content-length'];
    forwardHeaders.forEach(header => {
      if (response.headers[header]) res.setHeader(header, response.headers[header]);
    });

    res.status(response.status);
    response.data.pipe(res);
  } catch (error) {
    console.error("💀 Proxy Error:", error.message);
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