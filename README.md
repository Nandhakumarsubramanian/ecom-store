# ecom-store

Open-source ecommerce demo for anime posters. Node.js/Express backend, vanilla JS frontend, and a stub integration with [ERPNext](https://github.com/frappe/erpnext).

> **Note:** All product images are placeholders from `picsum.photos` and product names are made up. Swap in your own licensed art and titles before using this for anything real.

## Features

- Express REST API: products, cart, checkout
- 10 example poster products (`data/products.json`)
- Static frontend served from `public/` (HTML/CSS/JS, no build step)
- ERPNext integration stub in `erp/erpnext.js` (creates a Sales Order on checkout)
- MIT licensed

## Project structure

```
ecom-store/
  server.js
  package.json
  .env.example
  data/products.json
  erp/erpnext.js
  public/
    index.html
    style.css
    app.js
```

## Run locally

```bash
git clone https://github.com/Nandhakumarsubramanian/ecom-store.git
cd ecom-store
npm install
cp .env.example .env  # edit if you have an ERPNext instance
npm start
```

Then open http://localhost:3000.

## API

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/api/health` | health check |
| GET    | `/api/products` | list all products |
| GET    | `/api/products/:id` | single product |
| POST   | `/api/cart/:sessionId/add` | add `{ productId, qty }` |
| GET    | `/api/cart/:sessionId` | cart with line totals |
| POST   | `/api/checkout/:sessionId` | submits a Sales Order to ERPNext |

## ERPNext integration

Set the following in `.env` to talk to a real ERPNext instance:

```
ERPNEXT_URL=https://your-erpnext.example.com
ERPNEXT_API_KEY=xxxxxxxx
ERPNEXT_API_SECRET=yyyyyyyy
ERPNEXT_DEFAULT_CUSTOMER=Guest Customer
```

If `ERPNEXT_URL` is empty the checkout endpoint returns a stub Sales Order so the demo runs end-to-end without a server.

The stub posts to `/api/resource/Sales Order` using token auth. You'll likely need to ensure the SKUs in `data/products.json` exist as Items in your ERPNext instance.

## License

MIT - see [LICENSE](./LICENSE).
