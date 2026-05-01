// ecom-store: minimal Express server
// Serves the frontend in /public and exposes a small REST API for products + cart.
// ERPNext integration is stubbed in ./erp/erpnext.js
//
// Locally:   node server.js (or npm start) -> binds to PORT.
// Vercel:    server.js is imported as a serverless function and the Express
//            app is exported. app.listen is only called when run directly.

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const erpnext = require('./erp/erpnext');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const products = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf8')
);

// In-memory cart keyed by sessionId (demo only; resets between serverless
// invocations on Vercel — fine for the demo, not for production).
const carts = new Map();

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/products', (req, res) => res.json(products));

app.get('/api/products/:id', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.post('/api/cart/:sessionId/add', (req, res) => {
  const { sessionId } = req.params;
  const { productId, qty = 1 } = req.body || {};
  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const cart = carts.get(sessionId) || [];
  const existing = cart.find((item) => item.productId === productId);
  if (existing) existing.qty += qty;
  else cart.push({ productId, qty });
  carts.set(sessionId, cart);
  res.json({ cart });
});

app.get('/api/cart/:sessionId', (req, res) => {
  const cart = carts.get(req.params.sessionId) || [];
  const detailed = cart.map((item) => {
    const p = products.find((pp) => pp.id === item.productId);
    return { ...item, product: p, lineTotal: p ? p.price * item.qty : 0 };
  });
  const total = detailed.reduce((s, i) => s + i.lineTotal, 0);
  res.json({ items: detailed, total });
});

app.post('/api/checkout/:sessionId', async (req, res) => {
  const cart = carts.get(req.params.sessionId) || [];
  if (!cart.length) return res.status(400).json({ error: 'Cart is empty' });
  try {
    const order = await erpnext.createSalesOrder({
      customer: req.body && req.body.customer,
      items: cart.map((i) => {
        const p = products.find((pp) => pp.id === i.productId);
        return { item_code: p.sku, qty: i.qty, rate: p.price };
      }),
    });
    carts.delete(req.params.sessionId);
    res.json({ ok: true, order });
  } catch (err) {
    res.status(502).json({ error: 'ERP error', detail: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ecom-store listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
