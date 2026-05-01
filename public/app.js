// public/app.js
// Frontend for INKLINE storefront. Talks to /api endpoints.

const SESSION_ID = (() => {
  let s = localStorage.getItem('ecom-session');
  if (!s) { s = 's-' + Math.random().toString(36).slice(2); localStorage.setItem('ecom-session', s); }
  return s;
})();

const fmt = (n) => '$' + n.toFixed(2);

const BADGE_LABEL = {
  new: 'New',
  limited: 'Limited',
  bestseller: 'Bestseller',
  sale: 'Sale',
};

async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  const grid = document.getElementById('products');
  grid.innerHTML = products.map((p) => {
    const badge = p.badge ? `<span class="product-badge ${p.badge}">${BADGE_LABEL[p.badge] || p.badge}</span>` : '';
    const cat = p.category || 'Poster';
    return `
      <article class="product-card" data-id="${p.id}">
        <div class="product-media">
          ${badge}
          <img src="${p.image}" alt="${p.name}" loading="lazy" />
        </div>
        <div class="product-body">
          <span class="product-cat">${cat}</span>
          <h3 class="product-name">${p.name}</h3>
          <p class="product-price">${fmt(p.price)}</p>
          <button class="product-add" data-id="${p.id}" type="button">Add to bag</button>
        </div>
      </article>`;
  }).join('');
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('button.product-add');
    if (!btn) return;
    btn.disabled = true; btn.textContent = 'Added ✓';
    await fetch(`/api/cart/${SESSION_ID}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: btn.dataset.id, qty: 1 }),
    });
    setTimeout(() => { btn.disabled = false; btn.textContent = 'Add to bag'; }, 900);
    refreshCart(true);
  });
}

async function refreshCart(openIfAdded) {
  const res = await fetch(`/api/cart/${SESSION_ID}`);
  const { items, total } = await res.json();
  document.getElementById('cart-count').textContent = items.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cart-items').innerHTML = items.map((i) => `
    <li>
      <img src="${i.product.image}" alt="" />
      <div class="meta">
        <strong>${i.product.name}</strong>
        <span>Qty ${i.qty} · ${fmt(i.product.price)}</span>
      </div>
      <span class="line-total">${fmt(i.lineTotal)}</span>
    </li>`).join('') || '<li style="justify-content:center;color:#888">Your bag is empty.</li>';
  document.getElementById('cart-total').textContent = fmt(total);
  if (openIfAdded) document.getElementById('cart').classList.remove('hidden');
}

document.getElementById('cart-toggle').addEventListener('click', () => {
  document.getElementById('cart').classList.toggle('hidden');
});
document.querySelector('.cart-close').addEventListener('click', () => {
  document.getElementById('cart').classList.add('hidden');
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
