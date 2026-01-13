require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Helper to remove double slashes from URLs
const cleanUrl = (base, path) => {
  const baseUrl = base.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

app.use('/api/proxy', async (req, res) => {
  try {
    const originalPath = req.query.path;
    if (!originalPath) return res.status(400).send("Missing path");

    const targetUrl = cleanUrl(process.env.ABS_BASE_URL, originalPath);
    
    // Log the attempt
    console.log(`📡 Proxying: ${originalPath}`);
    if (req.headers.range) console.log(`   ↳ Range Request: ${req.headers.range}`);

    // 1. COPY ALL HEADERS from the Phone
    const headers = { ...req.headers };
    
    // 2. OVERRIDE specific Auth/Host headers
    delete headers.host; // Don't send 'localhost:3000' to the real server
    headers['Authorization'] = `Bearer ${process.env.ABS_API_TOKEN}`;
    headers['Accept-Encoding'] = 'identity'; // Disable compression to allow streaming

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers, // Send the exact headers the phone sent
      responseType: 'stream', 
      decompress: false,
      validateStatus: () => true,
    });

    console.log(`   ✅ Upstream Status: ${response.status}`);

    // 3. COPY ALL HEADERS back to the Phone
    res.status(response.status);
    
    Object.keys(response.headers).forEach(key => {
      res.setHeader(key, response.headers[key]);
    });

    response.data.pipe(res);

  } catch (error) {
    console.error("💀 PROXY ERROR:", error.message);
    if (!res.headersSent) res.status(500).send("Proxy Error");
  }
});

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Hidden Scrolls running on port ${PORT}`);
});