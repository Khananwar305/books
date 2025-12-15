const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dbs', 'VITI Books', 'MAHAK INDIA PVT LTD.books.db');
const db = new Database(dbPath);

console.log('=== SalesModule Configuration ===');
const salesModules = db.prepare('SELECT * FROM SalesModule WHERE referenceType = ?').all('SalesOrder');
console.table(salesModules);

console.log('\n=== All NumberSeries ===');
const allNumberSeries = db.prepare('SELECT * FROM NumberSeries').all();
console.table(allNumberSeries);

console.log('\n=== NumberSeries for SalesOrder ===');
const orderSeries = db.prepare('SELECT * FROM NumberSeries WHERE referenceType = ?').all('SalesOrder');
console.table(orderSeries);

db.close();
