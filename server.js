const express = require('express');
const path = require('path');
const db = require('./db/database');
const stripe = require('stripe')('sk_test_YourSecretKeyHere'); // Replace with your Stripe Secret Key
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API to get list of books
app.get('/api/books', (req, res) => {
  const { search, genre } = req.query;

  if (!search && !genre) {
    const query = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY genre ORDER BY id) as rn FROM books
      ) WHERE rn <= 5
    `;

    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ books: rows });
    });
  } else {
    let query = 'SELECT * FROM books';
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('title LIKE ?');
      params.push(`%${search}%`);
    }
    if (genre) {
      conditions.push('genre = ?');
      params.push(genre);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ books: rows });
    });
  }
});

// Stripe Checkout route
app.post('/api/create-checkout-session', async (req, res) => {
  const { items } = req.body;

  const line_items = items.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.title,
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: 1,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: 'http://localhost:3000/success.html',
      cancel_url: 'http://localhost:3000/cancel.html',
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
