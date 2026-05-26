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

app.post('/api/register', (req, res) => {
  const { name, email, phone, restaurant, discount_code, scanned_at } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });

  db.prepare(`
    INSERT INTO customers (name, email, phone, restaurant, discount_code, scanned_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, email, phone, restaurant, discount_code, scanned_at || new Date().toISOString());

  res.json({ success: true, discount_code: discount_code || 'SPICE20' });
});

app.get('/api/customers', (req, res) => {
  const rows = db.prepare('SELECT * FROM customers ORDER BY scanned_at DESC').all();
  res.json(rows);
});

const path = require('path');
app.use(express.static(path.join(__dirname)));

app.listen(3001, () => console.log('✅ Server running on http://localhost:3001'));