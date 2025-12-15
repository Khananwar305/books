/**
 * Diagnostic script to check for duplicate or conflicting SalesModule records
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dbs', 'VITI Books', 'MAHAK INDIA PVT LTD.books.db');

console.log('\n=== Checking for Duplicate SalesModule Records ===\n');

const db = new Database(dbPath, { readonly: true });

// Check for multiple SalesModules per referenceType
console.log('--- SalesModule Records by Type ---\n');

const types = ['SalesOrder', 'SalesInvoice', 'SalesQuote'];

types.forEach(type => {
  console.log(`\n${type}:`);
  const modules = db.prepare(`
    SELECT name, referenceType, numberSeries, abbreviation, isActive,
           start, padZeros, current
    FROM SalesModule
    WHERE referenceType = ?
    ORDER BY name
  `).all(type);

  if (modules.length === 0) {
    console.log('  ⚠ No SalesModule found');
  } else if (modules.length > 1) {
    console.log(`  ⚠ WARNING: Multiple SalesModules found (${modules.length})`);
    console.table(modules);

    // Check which ones are active
    const activeOnes = modules.filter(m => m.isActive !== 0 && m.isActive !== false);
    console.log(`  Active modules: ${activeOnes.length}`);
    if (activeOnes.length > 1) {
      console.log('  ⚠⚠ WARNING: Multiple active modules! This will cause conflicts.');
    }
  } else {
    console.table(modules);
    console.log('  ✓ Single module found');
  }
});

// Check NumberSeries associations
console.log('\n\n--- NumberSeries Associations ---\n');

const allModules = db.prepare('SELECT name, referenceType, numberSeries FROM SalesModule').all();
const allNumberSeries = db.prepare('SELECT name, referenceType FROM NumberSeries').all();

console.log('SalesModules pointing to NumberSeries:');
allModules.forEach(mod => {
  const ns = allNumberSeries.find(n => n.name === mod.numberSeries);
  const status = ns ? '✓' : '✗ MISSING';
  console.log(`  ${status} ${mod.name} (${mod.referenceType}) → ${mod.numberSeries || 'NULL'}`);
});

// Check for orphaned NumberSeries
console.log('\n\nOrphaned NumberSeries (not linked to any SalesModule):');
const linkedNS = allModules.map(m => m.numberSeries).filter(Boolean);
const orphaned = allNumberSeries.filter(ns =>
  !linkedNS.includes(ns.name) &&
  ['SalesOrder', 'SalesInvoice', 'SalesQuote'].includes(ns.referenceType)
);

if (orphaned.length > 0) {
  orphaned.forEach(ns => {
    console.log(`  ⚠ ${ns.name} (${ns.referenceType})`);
  });
} else {
  console.log('  ✓ None found');
}

// Check for mismatched referenceTypes
console.log('\n\n--- Reference Type Validation ---\n');
allModules.forEach(mod => {
  if (mod.numberSeries) {
    const ns = db.prepare('SELECT referenceType FROM NumberSeries WHERE name = ?').get(mod.numberSeries);
    if (ns && ns.referenceType !== mod.referenceType) {
      console.log(`  ✗ MISMATCH: ${mod.name} (${mod.referenceType}) → ${mod.numberSeries} (${ns.referenceType})`);
    }
  }
});
console.log('  ✓ Check complete');

db.close();

console.log('\n=== Diagnostic Complete ===\n');
