/**
 * Test script to verify prefix editing functionality
 * Tests all three sales modules: SalesOrder, SalesInvoice, SalesQuote
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dbs', 'VITI Books', 'MAHAK INDIA PVT LTD.books.db');

console.log('\n=== Testing Prefix Editing Functionality ===\n');
console.log('Database:', dbPath);

const db = new Database(dbPath, { readonly: true });

// Test 1: Check SalesModule configurations
console.log('\n--- Test 1: SalesModule Configurations ---');
console.log('\n1. Sales Order Configuration:');
const soModules = db.prepare('SELECT name, referenceType, numberSeries, start, padZeros, current, abbreviation FROM SalesModule WHERE referenceType = ?').all('SalesOrder');
console.table(soModules);

console.log('\n2. Sales Invoice Configuration:');
const siModules = db.prepare('SELECT name, referenceType, numberSeries, start, padZeros, current, abbreviation FROM SalesModule WHERE referenceType = ?').all('SalesInvoice');
console.table(siModules);

console.log('\n3. Sales Quote Configuration:');
const sqModules = db.prepare('SELECT name, referenceType, numberSeries, start, padZeros, current, abbreviation FROM SalesModule WHERE referenceType = ?').all('SalesQuote');
console.table(sqModules);

// Test 2: Check NumberSeries for each module
console.log('\n--- Test 2: NumberSeries Details ---');

const allModules = [...soModules, ...siModules, ...sqModules];
allModules.forEach(module => {
  if (module.numberSeries) {
    console.log(`\nNumberSeries for ${module.name} (${module.referenceType}):`);
    const ns = db.prepare('SELECT name, referenceType, start, padZeros, current FROM NumberSeries WHERE name = ?').get(module.numberSeries);
    if (ns) {
      console.table([ns]);
      console.log(`  Prefix Preview: ${ns.name}${String(ns.current || ns.start).padStart(ns.padZeros, '0')}`);
    } else {
      console.log('  ⚠ NumberSeries not found!');
    }
  }
});

// Test 3: List all NumberSeries
console.log('\n--- Test 3: All NumberSeries ---');
const allNS = db.prepare('SELECT * FROM NumberSeries ORDER BY referenceType, name').all();
console.table(allNS);

// Test 4: Check for potential issues
console.log('\n--- Test 4: Validation Checks ---');
let issues = 0;

// Check for modules without NumberSeries
const modulesWithoutNS = allModules.filter(m => !m.numberSeries);
if (modulesWithoutNS.length > 0) {
  console.log('⚠ Modules without NumberSeries:', modulesWithoutNS.length);
  modulesWithoutNS.forEach(m => console.log(`  - ${m.name}`));
  issues++;
}

// Check for orphaned NumberSeries
const moduleNSNames = allModules.map(m => m.numberSeries).filter(Boolean);
const orphanedNS = allNS.filter(ns => !moduleNSNames.includes(ns.name) && ['SalesOrder', 'SalesInvoice', 'SalesQuote'].includes(ns.referenceType));
if (orphanedNS.length > 0) {
  console.log('\n⚠ Orphaned NumberSeries (not linked to any SalesModule):');
  orphanedNS.forEach(ns => console.log(`  - ${ns.name} (${ns.referenceType})`));
  issues++;
}

if (issues === 0) {
  console.log('✓ No issues found!');
}

console.log('\n=== Summary ===');
console.log(`Total SalesModules: ${allModules.length}`);
console.log(`Total NumberSeries: ${allNS.length}`);
console.log(`Modules with NumberSeries: ${allModules.filter(m => m.numberSeries).length}`);

db.close();

console.log('\n=== Test Complete ===\n');
