// public/app.js
// Simple frontend that talks to the Express API for products and cart.

const SESSION_ID = (() => {
  let s = localStorage.getItem('ecom-session');
  if (!s) { s = 's-' + Math.random().toString(36).slice(2); localStorage.setItem('ecom-session', s); }
  return s;
})();

const fmt = (n) => '$' + n.toFixed(2);

async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  const grid = document.getElementById('products');
  grid.innerHTML = products.map((p) => `
    <article class="product-card">
      <img src="${p.image}" alt="${p.name}" loading="lazy" />
      <div class="body">
        <h3>${p.name}</h3>
        <p class="desc">${p.description}</p>
        <p class="price">${fmt(p.price)}</p>
        <button data-id="${p.id}">Add to cart</button>
      </div>
    </article>`).join('');
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    await fetch(`/api/cart/${SESSION_ID}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: btn.dataset.id, qty: 1 }),
    });
    refreshCart();
  });
}

async function refreshCart() {
  const res = await fetch(`/api/cart/${SESSION_ID}`);
  const { items, total } = await res.json();
  document.getElementById('cart-count').textContent = items.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cart-items').innerHTML = items.map((i) => `
    <li><span>${i.product.name} × ${i.qty}</span><span>${fmt(i.lineTotal)}</span></li>`).join('');
  document.getElementById('cart-total').textContent = fmt(total);
}

document.getElementById('cart-toggle').addEventListener('click', () => {
  document.getElementById('cart').classList.toggle('hidden');
});

document.getElementById('checkout').addEventListener('click', async () => {
  const out = document.getElementById('checkout-result');
  out.textContent = 'Submitting…';
  const res = await fetch(`/api/checkout/${SESSION_ID}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer: 'Guest Customer' })
  });
  const data = await res.json();
  if (data.ok) {
    out.textContent = 'Order ' + (data.order && data.order.name) + ' (' + (data.order && data.order.mode) + ' mode)';
    refreshCart();
  } else {
    out.textContent = 'Error: ' + (data.error || 'unknown');
  }
});

loadProducts();
refreshCart();
