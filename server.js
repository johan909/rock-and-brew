const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('customers.db');

app.use(cors());
app.use(bodyParser.json());

db.run(`
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

  db.run(
    `INSERT INTO customers (name, email, phone, restaurant, discount_code, scanned_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, email, phone, restaurant, discount_code, scanned_at || new Date().toISOString()],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, discount_code: discount_code || 'ROCKS10' });
    }
  );
});

app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM customers ORDER BY scanned_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));