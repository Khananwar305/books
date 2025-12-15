// Run this script to clean up stuck invoices
// Usage: node cleanup-stuck-invoice.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Find your database file path - check the app for the current database location
// It's usually in something like: C:\Users\HP\AppData\Roaming\viti-books\YOUR_COMPANY.db

console.log('Stuck Invoice Cleanup Script');
console.log('=============================\n');

// You need to provide your database path
const DB_PATH = process.argv[2];

if (!DB_PATH) {
  console.error('ERROR: Please provide database path as argument');
  console.log('Usage: node cleanup-stuck-invoice.js "C:\\path\\to\\your\\database.db"');
  console.log('\nTo find your database path:');
  console.log('1. Open Viti Books app');
  console.log('2. Look at the window title or check File menu');
  console.log('3. The .db file is usually in AppData\\Roaming\\viti-books\\');
  process.exit(1);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database:', DB_PATH);
});

// Find stuck invoices (not submitted, not cancelled, might be corrupted)
db.all(
  `SELECT name, created, submitted, cancelled, party
   FROM SalesInvoice
   WHERE submitted = 0 OR submitted IS NULL
   ORDER BY created DESC
   LIMIT 20`,
  [],
  (err, rows) => {
    if (err) {
      console.error('Error querying:', err.message);
      db.close();
      return;
    }

    console.log('\nFound potentially stuck invoices:');
    console.log('=====================================');

    if (rows.length === 0) {
      console.log('No stuck invoices found!');
      db.close();
      return;
    }

    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name} (Created: ${row.created}, Party: ${row.party || 'N/A'})`);
    });

    console.log('\nTo delete invoice "GST-2025-2026-04", run:');
    console.log('node cleanup-stuck-invoice.js "' + DB_PATH + '" delete GST-2025-2026-04');

    db.close();
  }
);

// Delete functionality
if (process.argv[3] === 'delete' && process.argv[4]) {
  const invoiceName = process.argv[4];

  db.run(
    'DELETE FROM SalesInvoice WHERE name = ?',
    [invoiceName],
    function(err) {
      if (err) {
        console.error('Error deleting:', err.message);
      } else {
        console.log(`\nDeleted invoice: ${invoiceName}`);
        console.log(`Rows affected: ${this.changes}`);

        if (this.changes === 0) {
          console.log('Warning: No invoice found with that name');
        }
      }
      db.close();
    }
  );
}
