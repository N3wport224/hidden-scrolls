const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

/**
 * UNIFIED STREAMING PROXY
 * Pipes binary data directly from ABS to fix 404 errors
 */
app.get('/api/proxy', async (req, res) => {
  const { path: apiPath } = req.query;
  const ABS_URL = `http://localhost:13378${decodeURIComponent(apiPath)}`;

  try {
    const response = await fetch(ABS_URL, {
      headers: { 'Authorization': `Bearer ${process.env.ABS_API_TOKEN}` }
    });

    if (!response.ok) {
      console.error(`ABS Failed: ${response.status}`);
      return res.status(response.status).send("ABS Source Error");
    }

    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType);

    // Stream the binary data directly to resolve playback errors
    const reader = response.body.getReader();
    function push() {
      reader.read().then(({ done, value }) => {
        if (done) { res.end(); return; }
        res.write(value);
        push();
      });
    }
    push();
  } catch (error) {
    res.status(500).json({ error: "Streaming Proxy Failed" });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Diagnostic Engine active on port ${PORT}`));