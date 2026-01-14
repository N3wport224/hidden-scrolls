require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// --- EXISTING PROXY ---
app.all('/api/proxy', async (req, res) => {
  const originalPath = req.query.path;
  if (!originalPath) return res.status(400).send("Missing path");

  const token = (process.env.ABS_API_TOKEN || '').trim();
  const baseUrl = process.env.ABS_BASE_URL.replace(/\/$/, '');
  const targetUrl = `${baseUrl}/${originalPath.replace(/^\//, '')}`;
  
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Range': req.headers.range || 'bytes=0-',
        'User-Agent': req.headers['user-agent']
      },
      data: req.body,
      responseType: 'stream',
      validateStatus: () => true 
    });

    const headersToForward = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    headersToForward.forEach(h => { if (response.headers[h]) res.setHeader(h, response.headers[h]); });

    res.status(response.status);
    response.data.pipe(res);
  } catch (error) {
    if (!res.headersSent) res.status(500).send("Proxy Error");
  }
});

// --- NEW: PROGRESS SYNC ENDPOINT ---
app.post('/api/sync', async (req, res) => {
  const { sessionId, currentTime, duration, isFinished } = req.body;
  const token = (process.env.ABS_API_TOKEN || '').trim();
  const baseUrl = process.env.ABS_BASE_URL.replace(/\/$/, '');
  
  // Audiobookshelf expects sync updates at this endpoint
  const targetUrl = `${baseUrl}/api/session/${sessionId}/sync`;

  try {
    await axios.post(targetUrl, {
      currentTime: currentTime,
      timeListened: 10, // Assume 10s sync interval
      duration: duration,
      isFinished: isFinished || false
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Sync Error:", error.message);
    res.status(200).send({ success: false }); // Don't crash the player if sync fails
  }
});

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

app.listen(PORT, () => console.log(`🚀 Car Mode Engine active on port ${PORT}`));