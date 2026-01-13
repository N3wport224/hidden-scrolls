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
  const targetUrl = `${baseUrl}${originalPath.startsWith('/') ? originalPath : '/' + originalPath}`;
  
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Range': req.headers.range || '',
      },
      data: req.body,
      responseType: 'stream',
      validateStatus: () => true 
    });

    // VERBOSE DIAGNOSTIC LOGGING
    if (response.status >= 400) {
        console.error(`❌ ABS ERROR [${response.status}] on path: ${originalPath}`);
        if (response.status === 401) console.error("   ↳ Reason: API Token rejected. Check your .env file.");
        if (response.status === 404) console.error("   ↳ Reason: Endpoint not found. Check Audiobookshelf version compatibility.");
    } else {
        console.log(`✅ ABS SUCCESS [${response.status}]: ${originalPath}`);
    }

    const forwardHeaders = ['content-type', 'content-range', 'accept-ranges', 'content-length'];
    forwardHeaders.forEach(h => { if (response.headers[h]) res.setHeader(h, response.headers[h]); });

    res.status(response.status);
    response.data.pipe(res);
  } catch (error) {
    console.error("💀 CRITICAL PROXY ERROR:", error.message);
    if (!res.headersSent) res.status(500).json({ error: error.message, detail: "Proxy crash" });
  }
});

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

app.listen(PORT, () => console.log(`🚀 Diagnostic Server running on port ${PORT}`));