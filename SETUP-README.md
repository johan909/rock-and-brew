# QR Loyalty System — Setup Guide

## System Overview

```
Customer scans QR → customer-page.html → fills form → POST /api/register → saved to DB
Restaurant admin  → admin-dashboard.html → views customers, sends bulk SMS via Twilio
```

---

## Files

| File | Purpose |
|---|---|
| `customer-page.html` | Customer-facing page (host this on your web server) |
| `admin-dashboard.html` | Staff dashboard (open locally or host on private URL) |

---

## 1. Backend Setup (Node.js + Express)

Create a folder and run:

```bash
npm init -y
npm install express cors body-parser better-sqlite3
```

Create `server.js`:

```js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('customers.db');

app.use(cors());
app.use(bodyParser.json());

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    restaurant TEXT,
    discount_code TEXT,
    scanned_at TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Register customer (called from customer-page.html)
app.post('/api/register', (req, res) => {
  const { name, email, phone, restaurant, discount_code, scanned_at } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });

  const today = new Date().toISOString().slice(0, 10);
  const existing = db.prepare(
    `SELECT id FROM customers WHERE phone = ? AND date(scanned_at) = ?`
  ).get(phone, today);

  if (existing) {
    return res.json({ success: true, message: 'already_registered', existing: true });
  }

  db.prepare(`
    INSERT INTO customers (name, email, phone, restaurant, discount_code, scanned_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, email, phone, restaurant, discount_code, scanned_at || new Date().toISOString());

  res.json({ success: true, discount_code: discount_code || 'SPICE20' });
});

// Get all customers (called from admin dashboard)
app.get('/api/customers', (req, res) => {
  const rows = db.prepare('SELECT * FROM customers ORDER BY scanned_at DESC').all();
  res.json(rows);
});

// Send SMS via Twilio (keeps credentials server-side)
const twilio = require('twilio'); // npm install twilio

app.post('/api/send-sms', async (req, res) => {
  const { to, body } = req.body;
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  try {
    const msg = await client.messages.create({
      from: process.env.TWILIO_FROM,
      to,
      body,
    });
    res.json({ success: true, sid: msg.sid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('API running on http://localhost:3001'));
```

Start the server:
```bash
TWILIO_SID=ACxxx TWILIO_TOKEN=your_token TWILIO_FROM=+1415... node server.js
```

---

## 2. Twilio Setup

1. Sign up at https://www.twilio.com (free trial: ~$15 credit)
2. Get your **Account SID**, **Auth Token**, and a **Twilio phone number**
3. In the admin dashboard, fill in the Twilio Configuration panel

---

## 3. QR Code

Once `customer-page.html` is hosted online, generate a QR code at:
- https://qr.io
- https://goqr.me

Point it to your hosted URL and print for each table.

---

## 4. Customisation Checklist

- [ ] Replace "Spice & Ember" with your restaurant name in both HTML files
- [ ] Change `SPICE20` discount code
- [ ] Change `20%` discount percentage
- [ ] Set `API_URL` in `customer-page.html` to your backend
- [ ] Set backend URL in admin dashboard settings panel

---

## 5. SMS Message Tags

In the SMS composer, use:
- `{name}` → customer's name
- `{phone}` → customer's phone

Example:
```
Hi {name}! Thanks for visiting us. Come back soon for 15% off with code LOYAL15. Show this to your server!
```
