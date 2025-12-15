const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dbs', 'VITI Books', 'MAHAK INDIA PVT LTD.books.db');
const db = new Database(dbPath, { readonly: true });

console.log('=== NumberSeries for SalesOrder ===');
const numberSeries = db.prepare('SELECT * FROM NumberSeries WHERE referenceType = ?').all('SalesOrder');
console.table(numberSeries);

console.log('\n=== SalesModule configuration for SalesOrder ===');
const salesModules = db.prepare('SELECT * FROM SalesModule WHERE referenceType = ?').all('SalesOrder');
console.table(salesModules);

db.close();
