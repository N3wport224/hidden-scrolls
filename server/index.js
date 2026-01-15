const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
// Serve the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

/**
 * STREAMING PROXY
 * Pipes binary data directly to resolve 404 and buffering issues
 */
app.get('/api/proxy', async (req, res) => {
  const { path: apiPath } = req.query;
  const ABS_URL = `http://localhost:13378${decodeURIComponent(apiPath)}`;

  console.log(`[Proxy] Requesting: ${ABS_URL}`); // Debug log

  try {
    const response = await fetch(ABS_URL, {
      headers: { 
        'Authorization': `Bearer ${process.env.ABS_API_TOKEN}` 
      }
    });

    if (!response.ok) {
      console.error(`[Proxy] Upstream Error: ${response.status}`);
      return res.status(response.status).send("ABS Source Error");
    }

    // Pass the correct content type (audio/mpeg, etc.) to the browser
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    // Stream the binary data directly to the client
    // This fixes the "404" caused by memory timeouts on large files
    const reader = response.body.getReader();
    async function push() {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        return;
      }
      res.write(value);
      push();
    }
    push();

  } catch (error) {
    console.error("[Proxy] Critical Error:", error);
    if (!res.headersSent) res.status(500).json({ error: "Streaming Failed" });
  }
});

// Catch-all for React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Car Engine active on port ${PORT}`));