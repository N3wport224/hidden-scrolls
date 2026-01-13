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

    const baseUrl = process.env.ABS_BASE_URL.replace(/\/$/, '');
    const cleanPath = originalPath.startsWith('/') ? originalPath : `/${originalPath}`;
    let targetUrl = `${baseUrl}${cleanPath}`;

    console.log(`📡 Request: ${originalPath}`);

    // Create a reusable header function to ensure consistency
    const getHeaders = () => ({
      'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`,
      'Range': req.headers.range || '', 
      'Accept': '*/*',
      'Accept-Encoding': 'identity'
    });

    // Handle the request manually to ensure Token isn't dropped
    let response = await axios({
      method: req.method,
      url: targetUrl,
      headers: getHeaders(),
      responseType: 'stream',
      maxRedirects: 0, // We handle redirects manually
      validateStatus: (status) => status < 400
    });

    // If redirected, follow it once with the Token re-attached
    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      const newUrl = response.headers.location.startsWith('http') 
        ? response.headers.location 
        : `${baseUrl}${response.headers.location}`;
      
      console.log(`   ↪ Redirected to real file location`);

      response = await axios({
        method: req.method,
        url: newUrl,
        headers: getHeaders(), // Re-attach the ID badge!
        responseType: 'stream',
        validateStatus: () => true
      });
    }

    console.log(`   ✅ Final Status: ${response.status}`);

    // Set headers and pipe data
    res.status(response.status);
    ['content-type', 'content-length', 'accept-ranges', 'content-range'].forEach(h => {
      if (response.headers[h]) res.setHeader(h, response.headers[h]);
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