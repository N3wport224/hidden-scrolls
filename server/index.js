const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve the static files from the React app's build folder
app.use(express.static(path.join(__dirname, '../client/dist')));

/**
 * API PROXY ROUTE
 * Fixed to use ABS_API_TOKEN to match your .env file
 */
app.get('/api/proxy', async (req, res) => {
  const { path: apiPath } = req.query;
  
  // Use localhost since ABS and this server are on the same Pi
  const ABS_URL = `http://localhost:13378${decodeURIComponent(apiPath)}`;

  try {
    const response = await fetch(ABS_URL, {
      headers: { 
        'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`, // MATCHED TO YOUR .env
        'Content-Type': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      // Handles book covers and audio streams
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', contentType);
      res.send(Buffer.from(buffer));
    }
  } catch (error) {
    console.error("❌ Proxy Error:", error);
    res.status(500).json({ error: "Failed to connect to Audiobookshelf" });
  }
});

app.post('/api/proxy/play', async (req, res) => {
    const { path: apiPath } = req.query;
    const ABS_URL = `http://localhost:13378${decodeURIComponent(apiPath)}`;
  
    try {
      const response = await fetch(ABS_URL, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${process.env.ABS_API_TOKEN}`, // MATCHED TO YOUR .env
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Playback session failed" });
    }
});

// For individual book items
app.get('/api/items/:id', async (req, res) => {
  const ABS_URL = `http://localhost:13378/api/items/${req.params.id}`;
  try {
    const response = await fetch(ABS_URL, {
      headers: { 'Authorization': `Bearer ${process.env.ABS_API_TOKEN}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// React Catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Car Mode Engine active on port ${PORT}`);
});