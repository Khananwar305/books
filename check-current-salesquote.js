/**
 * Check current state of Sales Quote SalesModule
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dbs', 'VITI Books', 'MAHAK INDIA PVT LTD.books.db');
const db = new Database(dbPath, { readonly: true });

console.log('\n=== Current Sales Quote Configuration ===\n');

// Get all SalesModule records for SalesQuote
const modules = db.prepare(`
  SELECT name, referenceType, numberSeries, abbreviation, isActive,
         start, padZeros, current, created, modified
  FROM SalesModule
  WHERE referenceType = 'SalesQuote'
  ORDER BY modified DESC
`).all();

console.log(`Found ${modules.length} SalesModule record(s) for SalesQuote:\n`);
console.table(modules);

// Check which NumberSeries they point to
console.log('\n--- Associated NumberSeries ---\n');
modules.forEach(mod => {
  if (mod.numberSeries) {
    const ns = db.prepare('SELECT * FROM NumberSeries WHERE name = ?').get(mod.numberSeries);
    console.log(`SalesModule "${mod.name}" → NumberSeries "${mod.numberSeries}":`);
    if (ns) {
      console.table([ns]);
    } else {
      console.log('  ⚠ WARNING: NumberSeries not found in database!');
    }
  } else {
    console.log(`SalesModule "${mod.name}" has no numberSeries set!`);
  }
  console.log('');
});

// Check all NumberSeries for SalesQuote
console.log('\n--- All NumberSeries for SalesQuote ---\n');
const allNS = db.prepare(`
  SELECT * FROM NumberSeries
  WHERE referenceType = 'SalesQuote'
  ORDER BY created DESC
`).all();

console.log(`Found ${allNS.length} NumberSeries record(s) for SalesQuote:\n`);
console.table(allNS);

db.close();

console.log('\n=== End of Report ===\n');
