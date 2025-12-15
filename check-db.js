const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dbs', 'VITI Books', 'MAHAK INDIA PVT LTD.books.db');
const db = new Database(dbPath, { readonly: true });

console.log('=== SalesModule records ===');
const modules = db.prepare('SELECT name, referenceType FROM SalesModule').all();
console.table(modules);

db.close();
