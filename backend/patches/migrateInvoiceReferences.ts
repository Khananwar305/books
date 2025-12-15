import { Knex } from 'knex';

async function execute(knex: Knex): Promise<void> {
  // Update all existing SalesInvoice records that have a quote
  // to set referenceType to 'SalesQuote'
  await knex('SalesInvoice')
    .whereNotNull('quote')
    .andWhere('quote', '!=', '')
    .update({
      referenceType: 'SalesQuote'
    });

  console.log('Migration: Set referenceType for existing SalesInvoice records with quotes');
}

export default { execute };
