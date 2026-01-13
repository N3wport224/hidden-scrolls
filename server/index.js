require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// This handles the audio streaming perfectly
app.use('/api/proxy', createProxyMiddleware({
  target: process.env.ABS_BASE_URL,
  changeOrigin: true,
  pathRewrite: (path, req) => req.query.path, // Takes the path from our URL param
  onProxyReq: (proxyReq, req) => {
    // Inject the API Token directly into every outgoing request
    proxyReq.setHeader('Authorization', `Bearer ${process.env.ABS_API_TOKEN}`);
  },
  onProxyRes: (proxyRes) => {
    // Ensure the browser knows we support streaming
    proxyRes.headers['Accept-Ranges'] = 'bytes';
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).send('Proxy encountered an error.');
  }
}));

// Serve the website
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Hidden Scrolls running on port ${PORT}`);
});