require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.all('/api/proxy', async (req, res) => {
  const originalPath = req.query.path;
  if (!originalPath) return res.status(400).send("Missing path");

  const token = (process.env.ABS_API_TOKEN || '').trim();
  const baseUrl = process.env.ABS_BASE_URL.replace(/\/$/, '');
  
  // SANITIZE THE PATH: Remove leading slash and redundant subfolder
  let sanitizedPath = originalPath.startsWith('/') ? originalPath.substring(1) : originalPath;
  if (baseUrl.endsWith('/audiobookshelf') && sanitizedPath.startsWith('audiobookshelf/')) {
    sanitizedPath = sanitizedPath.replace('audiobookshelf/', '');
  }

  const targetUrl = `${baseUrl}/${sanitizedPath}`;
  
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Range': req.headers.range || 'bytes=0-',
      },
      data: req.body,
      responseType: 'stream',
      maxRedirects: 5,
      validateStatus: () => true 
    });

    if (response.status >= 400) {
      console.error(`❌ ABS ERROR [${response.status}] for URL: ${targetUrl}`);
    } else {
      console.log(`✅ ABS SUCCESS [${response.status}]: ${sanitizedPath}`);
    }

    const forwardHeaders = ['content-type', 'content-range', 'accept-ranges', 'content-length'];
    forwardHeaders.forEach(h => { if (response.headers[h]) res.setHeader(h, response.headers[h]); });

    res.status(response.status);
    response.data.pipe(res);
  } catch (error) {
    console.error("💀 Proxy Crash:", error.message);
    if (!res.headersSent) res.status(500).send("Proxy Error");
  }
});

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

app.listen(PORT, () => console.log(`🚀 Final Proxy running on port ${PORT}`));