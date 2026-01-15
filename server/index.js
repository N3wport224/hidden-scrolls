const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// GENERIC PROXY: For metadata and covers
app.get('/api/proxy', async (req, res) => {
  const { path: apiPath } = req.query;
  const ABS_URL = `http://localhost:13378${decodeURIComponent(apiPath)}`;
  try {
    const response = await fetch(ABS_URL, {
      headers: { 'Authorization': `Bearer ${process.env.ABS_API_TOKEN}` }
    });
    const contentType = response.headers.get('content-type');
    res.set('Content-Type', contentType);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) { res.status(500).send("Proxy Error"); }
});

// FILE PROXY: Specifically for streaming the audio file
app.get('/api/items/:id/file', async (req, res) => {
  const ABS_URL = `http://localhost:13378/api/items/${req.params.id}/file`;
  try {
    const response = await fetch(ABS_URL, {
      headers: { 'Authorization': `Bearer ${process.env.ABS_API_TOKEN}` }
    });
    
    // Pipe the stream directly to the browser
    const contentType = response.headers.get('content-type');
    res.set('Content-Type', contentType);
    const reader = response.body.getReader();
    function push() {
      reader.read().then(({ done, value }) => {
        if (done) { res.end(); return; }
        res.write(value);
        push();
      });
    }
    push();
  } catch (err) { res.status(500).send("Stream Error"); }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Engine active on ${PORT}`));