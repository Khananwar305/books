const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dbs', 'VITI Books', 'MAHAK INDIA PVT LTD.books.db');
const db = new Database(dbPath);

console.log('=== BEFORE FIX ===');
const before = db.prepare('SELECT * FROM SalesModule WHERE referenceType = ?').get('SalesOrder');
console.log('SalesModule for SalesOrder:', before);

// Find the NumberSeries with the custom prefix
const customSeries = db.prepare('SELECT * FROM NumberSeries WHERE referenceType = ? AND name LIKE ?').get('SalesOrder', 'SO-2025-2026%');

if (customSeries) {
  console.log('\nFound custom NumberSeries:', customSeries.name);

  // Update SalesModule to use the custom prefix
  const update = db.prepare('UPDATE SalesModule SET numberSeries = ? WHERE referenceType = ?');
  update.run(customSeries.name, 'SalesOrder');

  console.log('\n=== AFTER FIX ===');
  const after = db.prepare('SELECT * FROM SalesModule WHERE referenceType = ?').get('SalesOrder');
  console.log('SalesModule for SalesOrder:', after);

  console.log('\n✅ SUCCESS! Updated numberSeries to:', customSeries.name);
} else {
  console.log('\n❌ ERROR: Could not find NumberSeries with prefix SO-2025-2026');
  console.log('Available NumberSeries for SalesOrder:');
  const available = db.prepare('SELECT * FROM NumberSeries WHERE referenceType = ?').all('SalesOrder');
  console.table(available);
}

db.close();
