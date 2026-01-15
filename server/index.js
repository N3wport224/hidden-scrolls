const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// ENHANCED STREAMING PROXY
app.get('/api/proxy', async (req, res) => {
  const { path: apiPath } = req.query;
  const ABS_URL = `http://localhost:13378${decodeURIComponent(apiPath)}`;

  // Forward the Range header (Critical for Audio Playback)
  const headers = { 
    'Authorization': `Bearer ${process.env.ABS_API_TOKEN}` 
  };
  if (req.headers.range) {
    headers['Range'] = req.headers.range;
  }

  try {
    const response = await fetch(ABS_URL, { headers });

    if (!response.ok) {
      console.error(`[Proxy Error] ${response.status} at ${ABS_URL}`);
      return res.status(response.status).send("ABS Source Error");
    }

    // Forward critical response headers to the browser
    const forwardHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
    forwardHeaders.forEach(h => {
      if (response.headers.has(h)) res.setHeader(h, response.headers.get(h));
    });

    // Send the correct status code (200 OK or 206 Partial Content)
    res.status(response.status);

    // Pipe the binary stream
    const reader = response.body.getReader();
    async function push() {
      const { done, value } = await reader.read();
      if (done) { res.end(); return; }
      res.write(value);
      push();
    }
    push();
    
  } catch (error) {
    console.error("Stream Failed:", error);
    if (!res.headersSent) res.status(500).json({ error: "Stream Failed" });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Car Engine V2 active on port ${PORT}`));