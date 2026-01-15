const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// THE ONLY PROXY ROUTE YOU NEED
app.get('/api/proxy', async (req, res) => {
  const { path: apiPath } = req.query;
  const ABS_URL = `http://localhost:13378${decodeURIComponent(apiPath)}`;

  try {
    const response = await fetch(ABS_URL, {
      headers: { 'Authorization': `Bearer ${process.env.ABS_API_TOKEN}` }
    });

    const contentType = response.headers.get('content-type');
    
    // Crucial for audio: Pipe the stream and set correct headers
    res.set('Content-Type', contentType);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: "Audio stream failed" });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Car Engine active on ${PORT}`));