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
  secure: false, // Useful if using internal IPs
  autoRewrite: true,
  followRedirects: true,
  pathRewrite: (path, req) => req.query.path,
  onProxyReq: (proxyReq, req) => {
    const token = process.env.ABS_API_TOKEN ? process.env.ABS_API_TOKEN.trim() : '';
    proxyReq.setHeader('Authorization', `Bearer ${token}`);
    // Clear any existing cookies that might be confusing the server
    proxyReq.removeHeader('Cookie');
  },
  onProxyRes: (proxyRes) => {
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