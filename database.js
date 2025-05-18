const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./books.db'); // Persist data to disk

const genres = ['Fiction', 'Non-Fiction', 'Self-Help', 'Classic', 'Bengali Literature'];
const books = [];

for (let i = 1; i <= 1000; i++) {
  books.push({
    title: `Book ${i}`,
    author: `Author ${i}`,
    price: (Math.random() * 20 + 5).toFixed(2),
    image: `book${i % 10 + 1}.jpg`,
    genre: genres[i % genres.length]
  });
}

books.push(
  { title: 'Pather Panchali', author: 'Bibhutibhushan Bandyopadhyay', price: 9.99, image: 'patherpanchali.jpg', genre: 'Bengali Literature' },
  { title: 'Gitanjali', author: 'Rabindranath Tagore', price: 11.99, image: 'gitanjali.jpg', genre: 'Bengali Literature' }
);

db.serialize(() => {
  // Create table if it doesn't exist
  db.run("CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY, title TEXT, author TEXT, price REAL, image TEXT, genre TEXT)");

  // Check if table is empty before inserting
  db.get("SELECT COUNT(*) as count FROM books", (err, row) => {
    if (err) {
      console.error("DB count check error:", err);
      return;
    }
    if (row.count === 0) {
      const stmt = db.prepare("INSERT INTO books (title, author, price, image, genre) VALUES (?, ?, ?, ?, ?)");
      books.forEach(book => {
        stmt.run(book.title, book.author, parseFloat(book.price), book.image, book.genre);
      });
      stmt.finalize();
      console.log("Books inserted into DB");
    } else {
      console.log("Books already present in DB, skipping insertion");
    }
  });
});

module.exports = db;
