const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dbs', 'VITI Books', 'MAHAK INDIA PVT LTD.books.db');
const db = new Database(dbPath);

console.log('\n=== Checking SalesModule table ===\n');

try {
  // Check if SalesModule table exists
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='SalesModule'").get();

  if (!tableExists) {
    console.log('SalesModule table does not exist yet.');
  } else {
    // Get all SalesModule records
    const records = db.prepare('SELECT * FROM SalesModule').all();

    console.log(`Found ${records.length} SalesModule record(s):\n`);
    records.forEach((record, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  Name: ${record.name}`);
      console.log(`  Reference Type: ${record.referenceType}`);
      console.log(`  Abbreviation: ${record.abbreviation}`);
      console.log(`  Number Series: ${record.numberSeries}`);
      console.log('');
    });

    // Ask if we should delete all records
    console.log('To delete all SalesModule records, run this script with "delete" argument:');
    console.log('node check_sales_modules.js delete\n');

    if (process.argv.includes('delete')) {
      console.log('Deleting all SalesModule records...');
      const result = db.prepare('DELETE FROM SalesModule').run();
      console.log(`Deleted ${result.changes} record(s).`);

      // Also delete associated NumberSeries
      console.log('\nDeleting associated NumberSeries records...');
      const nsResult = db.prepare("DELETE FROM NumberSeries WHERE name LIKE 'SINV-%' OR name LIKE 'SQ-%' OR name LIKE 'SO-%'").run();
      console.log(`Deleted ${nsResult.changes} NumberSeries record(s).`);
    }
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}
