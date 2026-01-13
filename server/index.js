require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- AUDITED UNIVERSAL PROXY ROUTE ---
app.all('/api/proxy', async (req, res) => {
  const originalPath = req.query.path;
  if (!originalPath) return res.status(400).send("Missing path");

  // AUDIT: Force the token from the .env file to bypass client-side 'null' errors
  const token = (process.env.ABS_API_TOKEN || '').trim();
  const baseUrl = process.env.ABS_BASE_URL.replace(/\/$/, '');
  const cleanPath = originalPath.startsWith('/') ? originalPath : '/' + originalPath;
  const targetUrl = `${baseUrl}${cleanPath}`;
  
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Authorization': `Bearer ${token}`, // Verified format
        'Range': req.headers.range || '',
        'Accept': '*/*'
      },
      data: req.body, 
      responseType: 'stream',
      maxRedirects: 5, // Vital for following Audiobookshelf file redirects
      validateStatus: () => true 
    });

    // DIAGNOSTIC LOGGING: Shows exactly what Audiobookshelf thinks of the request
    if (response.status >= 400) {
        console.error(`❌ ABS ERROR [${response.status}]: ${originalPath}`);
    } else {
        console.log(`✅ ABS SUCCESS [${response.status}]: ${originalPath}`);
    }

    // Forward crucial headers for audio streaming and browser playback
    const forwardHeaders = ['content-type', 'content-range', 'accept-ranges', 'content-length'];
    forwardHeaders.forEach(header => {
      if (response.headers[header]) {
        res.setHeader(header, response.headers[header]);
      }
    });

    res.status(response.status);
    response.data.pipe(res);
  } catch (error) {
    console.error("💀 PROXY CRASH:", error.message);
    if (!res.headersSent) res.status(500).send("Proxy Error");
  }
});

// Serve frontend build files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle SPA routing: return index.html for all non-api routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Audited Hidden Scrolls running on port ${PORT}`);
});