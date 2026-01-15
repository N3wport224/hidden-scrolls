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
 * This allows the frontend to bypass CORS and talk to the Audiobookshelf API
 */
app.get('/api/proxy', async (req, res) => {
  const { path: apiPath } = req.query;
  
  // Audiobookshelf typically runs on port 13378
  const ABS_URL = `http://localhost:13378${decodeURIComponent(apiPath)}`;

  try {
    const response = await fetch(ABS_URL, {
      headers: { 
        'Authorization': `Bearer ${process.env.ABS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // Check if it's a JSON response or a binary (like an image/audio stream)
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      // For images/covers or audio streams, pipe the data directly
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', contentType);
      res.send(Buffer.from(buffer));
    }
  } catch (error) {
    console.error("❌ Proxy Error:", error);
    res.status(500).json({ error: "Failed to connect to Audiobookshelf" });
  }
});

// Post route to start sessions (used in Player.jsx)
app.post('/api/proxy/play', async (req, res) => {
    const { path: apiPath } = req.query;
    const ABS_URL = `http://localhost:13378${decodeURIComponent(apiPath)}`;
  
    try {
      const response = await fetch(ABS_URL, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${process.env.ABS_TOKEN}`,
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

// "The Catch-All": Serve React's index.html for any unknown routes
// This prevents 404s when you refresh the page on the /player/:id route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Car Mode Engine active on port ${PORT}`);
});