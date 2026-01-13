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
  pathRewrite: (path, req) => req.query.path,
  // This injects the token exactly like your successful curl command
  headers: {
    'Authorization': `Bearer ${process.env.ABS_API_TOKEN.trim()}`
  },
  onProxyReq: (proxyReq, req) => {
    // Remove headers that often cause 401s during proxying
    proxyReq.removeHeader('cookie');
    proxyReq.removeHeader('referer');
    proxyReq.removeHeader('origin');
  },
  onProxyRes: (proxyRes) => {
    proxyRes.headers['accept-ranges'] = 'bytes';
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