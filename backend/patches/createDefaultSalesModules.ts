import { DatabaseManager } from '../database/manager';
import { Fyo } from 'fyo';

export default async function createDefaultSalesModules(dm: DatabaseManager) {
  const fyo = (dm as any).fyo as Fyo | undefined;

  if (!fyo) {
    console.log('[Patch] createDefaultSalesModules: fyo not available, skipping');
    return;
  }

  console.log('[Patch] Creating default SalesModule configurations...');

  // Define default configurations for different document types
  const defaultConfigs = [
    {
      name: 'Sales Invoice',
      referenceType: 'SalesInvoice',
      numberingMethod: 'Automatic',
      isActive: true,
      abbreviation: 'Sale',
      start: 1001,
      padZeros: 4,
      current: 1001,
      retainOriginalNumber: true,
      allowNarration: true,
    },
    {
      name: 'Sales Quotation',
      referenceType: 'SalesQuote',
      numberingMethod: 'Automatic',
      isActive: true,
      abbreviation: 'Quote',
      start: 1001,
      padZeros: 4,
      current: 1001,
      retainOriginalNumber: true,
      allowNarration: true,
    },
    {
      name: 'Sales Order',
      referenceType: 'SalesOrder',
      numberingMethod: 'Automatic',
      isActive: true,
      abbreviation: 'Order',
      start: 1001,
      padZeros: 4,
      current: 1001,
      retainOriginalNumber: true,
      allowNarration: true,
    },
  ];

  for (const config of defaultConfigs) {
    try {
      // Check if a SalesModule already exists for this referenceType
      const existing = await dm.db.getAllRaw('SalesModule', {
        fields: ['name'],
        filters: { referenceType: config.referenceType },
      });

      if (existing && existing.length > 0) {
        console.log(`[Patch] SalesModule for ${config.referenceType} already exists, skipping`);
        continue;
      }

      // Create the SalesModule
      const salesModule = fyo.doc.getNewDoc('SalesModule', config, false);
      await salesModule.sync();

      console.log(`[Patch] Created default SalesModule for ${config.referenceType}`);
    } catch (error) {
      console.error(`[Patch] Error creating SalesModule for ${config.referenceType}:`, error);
    }
  }

  console.log('[Patch] Default SalesModule configurations created successfully');
}
