require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// This handles the audio streaming perfectly
app.get('/api/proxy', async (req, res) => {
  const originalPath = req.query.path;
  if (!originalPath) return res.status(400).send("Missing path");

  const targetUrl = `${process.env.ABS_BASE_URL}${originalPath.startsWith('/') ? originalPath : '/' + originalPath}`;
  
  try {
    console.log(`📡 Manual Proxying: ${originalPath}`);

    const response = await axios({
      method: 'GET',
      url: targetUrl,
      headers: {
        'Authorization': `Bearer ${process.env.ABS_API_TOKEN.trim()}`,
        'Range': req.headers.range || '',
        'Accept': '*/*'
      },
      responseType: 'stream',
      validateStatus: () => true // Allow all statuses so we can log them
    });

    console.log(`   ✅ Status from ABS: ${response.status}`);

    // Forward the content type and streaming headers
    if (response.headers['content-type']) res.setHeader('content-type', response.headers['content-type']);
    if (response.headers['content-range']) res.setHeader('content-range', response.headers['content-range']);
    if (response.headers['accept-ranges']) res.setHeader('accept-ranges', response.headers['accept-ranges']);

    res.status(response.status);
    response.data.pipe(res);
  } catch (error) {
    console.error("💀 Proxy Error:", error.message);
    res.status(500).send("Proxy Error");
  }
});

// Serve the website
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Hidden Scrolls running on port ${PORT}`);
});