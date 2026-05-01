// erp/erpnext.js
// Stub integration with ERPNext (https://erpnext.com / https://github.com/frappe/erpnext).
// Reads connection settings from environment variables. If ERPNEXT_URL is unset,
// the stub returns a fake order so the demo can run end-to-end without a server.
//
// Wire up a real instance by setting:
//   ERPNEXT_URL=https://your-erpnext.example.com
//   ERPNEXT_API_KEY=xxxxxxxx
//   ERPNEXT_API_SECRET=yyyyyyyy
//   ERPNEXT_DEFAULT_CUSTOMER="Guest Customer"

const BASE = process.env.ERPNEXT_URL;
const KEY = process.env.ERPNEXT_API_KEY;
const SECRET = process.env.ERPNEXT_API_SECRET;
const DEFAULT_CUSTOMER = process.env.ERPNEXT_DEFAULT_CUSTOMER || 'Guest Customer';

function authHeader() {
    if (!KEY || !SECRET) return {};
    return { Authorization: `token ${KEY}:${SECRET}` };
}

async function createSalesOrder({ customer, items }) {
    const payload = {
          customer: customer || DEFAULT_CUSTOMER,
          items: items.map((i) => ({ item_code: i.item_code, qty: i.qty, rate: i.rate })),
    };

  if (!BASE) {
        // Demo mode: no ERP configured. Return a fake order id.
      return {
              mode: 'stub',
              name: `SO-DEMO-${Date.now()}`,
              payload,
      };
  }

  const res = await fetch(`${BASE}/api/resource/Sales Order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload),
  });
    if (!res.ok) {
          const text = await res.text();
          throw new Error(`ERPNext ${res.status}: ${text}`);
    }
    const data = await res.json();
    return { mode: 'live', ...data };
}

module.exports = { createSalesOrder };
