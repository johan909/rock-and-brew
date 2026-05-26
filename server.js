const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync('customers.json');
const db = low(adapter);

db.defaults({ customers: [] }).write();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/register', (req, res) => {
  const { name, email, phone, restaurant, discount_code, scanned_at } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });

  const customer = {
    id: Date.now(),
    name, email, phone, restaurant, discount_code,
    scanned_at: scanned_at || new Date().toISOString(),
    status: 'new'
  };

  db.get('customers').push(customer).write();
  res.json({ success: true, discount_code: discount_code || 'ROCKS10' });
});

app.get('/api/customers', (req, res) => {
  const customers = db.get('customers').orderBy('scanned_at', 'desc').value();
  res.json(customers);
});

app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));