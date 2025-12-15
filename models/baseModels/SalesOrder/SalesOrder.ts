import { Fyo } from 'fyo';
import { DocValueMap } from 'fyo/core/types';
import { Action, FiltersMap, FormulaMap, ListViewSettings, ReadOnlyMap } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import { getTransactionStatusColumn } from '../../helpers';
import { Invoice } from '../Invoice/Invoice';
import { SalesOrderItem } from '../SalesOrderItem/SalesOrderItem';
import { Defaults } from '../Defaults/Defaults';
import { Doc } from 'fyo/model/doc';
import { Schema } from 'schemas/types';
import { ValidationError } from 'fyo/utils/errors';

export class SalesOrder extends Invoice {
  items?: SalesOrderItem[];
  party?: string;
  name?: string;
  quote?: string;
  fullyInvoiced?: boolean;
  deliveryDate?: Date;
  _numberingMethod?: string;
  _isNewOrder?: boolean;

  constructor(schema: Schema, data: DocValueMap, fyo: Fyo) {
    super(schema, data, fyo);

    // Set order number immediately for new documents
    if (!this.inserted && !this.name) {
      this.setOrderNumberPreview();
    }
  }

  async setOrderNumberPreview() {
    try {
      const salesModuleConfig = await this.getActiveSalesModuleConfig();
      if (!salesModuleConfig || salesModuleConfig.numberingMethod !== 'Automatic') {
        return;
      }

      const numberSeriesName = salesModuleConfig.numberSeries as string;
      if (!numberSeriesName) {
        return;
      }

      console.log('[SalesOrder] Loading NumberSeries:', numberSeriesName);

      // Load the NumberSeries and ensure it has fresh data from database
      const numberSeries = await this.fyo.doc.getDoc('NumberSeries', numberSeriesName);
      await numberSeries.load(); // Reload from database to get latest value

      console.log('[SalesOrder] NumberSeries details:', {
        name: numberSeries.name,
        current: numberSeries.current,
        start: numberSeries.start,
        padZeros: numberSeries.padZeros
      });

      const nextPreview = numberSeries.getNextPreview();
      console.log('[SalesOrder] Setting preview number:', nextPreview);
      this.name = nextPreview;
    } catch (error) {
      console.error('[SalesOrder] Error setting preview:', error);
    }
  }

  async beforeSync() {
    await super.beforeSync();

    // Only process numbering for new orders (not updates)
    if (this.inserted) {
      return;
    }

    // Mark this as a new order so afterSync knows to update counter
    this._isNewOrder = true;

    console.log('[SalesOrder beforeSync] Processing new order. Current name:', this.name);

    // Get active SalesModule configuration for SalesOrder
    const salesModuleConfig = await this.getActiveSalesModuleConfig();

    // Ensure numberSeries is always set
    if (salesModuleConfig) {
      const numberSeriesName = salesModuleConfig.numberSeries as string;
      if (numberSeriesName && !this.numberSeries) {
        this.numberSeries = numberSeriesName;
      }
    }

    // For new unsaved orders in automatic mode
    if (salesModuleConfig) {
      const isAutomaticMode = salesModuleConfig.numberingMethod === 'Automatic';
      console.log('[SalesOrder beforeSync] Mode:', salesModuleConfig.numberingMethod);

      if (isAutomaticMode) {
        // Auto mode: check if preview number is available, otherwise get next
        try {
          const numberSeriesName = salesModuleConfig.numberSeries as string;
          if (!numberSeriesName) {
            throw new ValidationError(this.fyo.t`Number series not configured for this document type`);
          }

          // Check if current name (from preview) is still available
          if (this.name && this.name.trim() !== '') {
            const exists = await this.fyo.db.exists(this.schemaName, this.name);
            if (!exists) {
              // Preview number is still available, use it
              // We'll update the counter in afterSync (after successful save)
              console.log('[SalesOrder beforeSync] Preview number available, will use:', this.name);
              return;
            } else {
              console.log('[SalesOrder beforeSync] Preview number taken, getting next...');
            }
          }

          // Preview number is taken or not set, generate a new one
          const numberSeries = await this.fyo.doc.getDoc('NumberSeries', numberSeriesName);
          this.name = await numberSeries.next(this.schemaName);

          console.log('[SalesOrder beforeSync] Generated new order number:', this.name);
        } catch (error) {
          console.error('[SalesOrder beforeSync] Error generating order number:', error);
          throw error;
        }
      } else {
        // Manual mode: user must enter order number
        if (!this.name || this.name.trim() === '') {
          throw new ValidationError(this.fyo.t`Please enter order number in Manual mode`);
        }
        console.log('[SalesOrder beforeSync] Manual mode - using user-entered number:', this.name);
      }
    } else {
      // Fallback to old logic if no SalesModule configuration exists
      console.log('[SalesOrder beforeSync] No SalesModule config, using fallback');
    }
  }

  async afterSync() {
    await super.afterSync();

    // Update NumberSeries counter after successful save
    // This ensures the counter is only updated when the order is actually saved
    if (this._isNewOrder) {
      // This was a new order that just got saved
      await this.updateNumberSeriesCounter();
      this._isNewOrder = false; // Reset flag
    }
  }

  async updateNumberSeriesCounter() {
    try {
      const salesModuleConfig = await this.getActiveSalesModuleConfig();
      if (!salesModuleConfig || salesModuleConfig.numberingMethod !== 'Automatic') {
        return;
      }

      const numberSeriesName = salesModuleConfig.numberSeries as string;
      if (!numberSeriesName || !this.name) {
        return;
      }

      const numberSeries = await this.fyo.doc.getDoc('NumberSeries', numberSeriesName);
      await numberSeries.load();

      // Extract the numeric part from the order number
      const orderNumber = this.name.replace(numberSeriesName, '');
      const numericValue = parseInt(orderNumber, 10);

      // Only update if this number is greater than current
      if (!isNaN(numericValue) && numericValue > (numberSeries.current as number)) {
        numberSeries.current = numericValue;
        await numberSeries.sync();
        console.log('[SalesOrder afterSync] Updated NumberSeries current to:', numericValue);
      }
    } catch (error) {
      console.error('[SalesOrder afterSync] Error updating NumberSeries:', error);
      // Don't throw - the order is already saved
    }
  }

  async getActiveSalesModuleConfig() {
    try {
      const configs = await this.fyo.db.getAllRaw('SalesModule', {
        fields: ['name', 'numberingMethod', 'numberSeries', 'isActive'],
        filters: { referenceType: 'SalesOrder' },
      });

      if (configs && configs.length > 0) {
        // Return the first active configuration, or the first one if none are explicitly active
        const activeConfig = configs.find(c => c.isActive !== false) || configs[0];
        console.log('[SalesOrder] Found active config:', {
          name: activeConfig.name,
          numberingMethod: activeConfig.numberingMethod,
          numberSeries: activeConfig.numberSeries,
          isActive: activeConfig.isActive
        });
        return activeConfig;
      }
      console.log('[SalesOrder] No SalesModule configurations found for SalesOrder');
      return null;
    } catch (error) {
      console.error('[SalesOrder] Error fetching SalesModule configuration:', error);
      return null;
    }
  }

  // This is an inherited method and it must keep the async from the parent
  // class
  // eslint-disable-next-line @typescript-eslint/require-await
  async getPosting() {
    return null;
  }

  async getInvoice(): Promise<Invoice | null> {
    if (!this.isSubmitted) {
      return null;
    }

    const schemaName = ModelNameEnum.SalesInvoice;
    const defaults = (this.fyo.singles.Defaults as Defaults) ?? {};
    const terms = defaults.salesInvoiceTerms ?? '';
    const numberSeries = defaults.salesInvoiceNumberSeries ?? undefined;

    const data: DocValueMap = {
      ...this.getValidDict(false, true),
      date: new Date().toISOString(),
      terms,
      numberSeries,
      referenceType: 'SalesOrder',
      quote: this.name,
      items: [],
      submitted: false,
    };

    const invoice = this.fyo.doc.getNewDoc(schemaName, data) as Invoice;
    for (const row of this.items ?? []) {
      await invoice.append('items', row.getValidDict(false, true));
    }

    if (!invoice.items?.length) {
      return null;
    }

    return invoice;
  }

  /**
   * Get remaining quantities for each item in this order
   * Returns a map of item name to remaining quantity
   */
  async getRemainingQuantities(): Promise<Map<string, number>> {
    if (!this.isSubmitted || !this.name) {
      return new Map();
    }

    const remainingQty = new Map<string, number>();

    // Initialize with original quantities
    for (const item of this.items ?? []) {
      if (item.item && item.quantity) {
        remainingQty.set(item.item as string, item.quantity as number);
      }
    }

    // Query invoices referencing this order
    const invoices = await this.fyo.db.getAllRaw('SalesInvoice', {
      fields: ['name'],
      filters: {
        referenceType: 'SalesOrder',
        quote: this.name,
        submitted: true,
        cancelled: false,
        isReturned: false,
      },
    });

    // Subtract invoiced quantities
    for (const invoiceData of invoices) {
      const invoice = await this.fyo.doc.getDoc(
        'SalesInvoice',
        invoiceData.name as string
      );

      for (const invoiceItem of (invoice.items ?? [])) {
        const itemName = invoiceItem.item as string;
        const qty = invoiceItem.quantity as number;

        if (remainingQty.has(itemName)) {
          const current = remainingQty.get(itemName)!;
          remainingQty.set(itemName, current - qty);
        }
      }
    }

    return remainingQty;
  }

  /**
   * Check if this order has any remaining uninvoiced items
   */
  async hasRemainingQuantity(): Promise<boolean> {
    const remaining = await this.getRemainingQuantities();

    for (const qty of remaining.values()) {
      if (qty > 0) {
        return true;
      }
    }

    return false;
  }

  static filters: FiltersMap = {
    numberSeries: (doc: Doc) => ({ referenceType: doc.schemaName }),
  };

  formulas: FormulaMap = {
    _numberingMethod: {
      formula: async () => {
        const config = await this.getActiveSalesModuleConfig();
        if (config && config.numberingMethod) {
          return config.numberingMethod as string;
        }
        return 'Manual';
      },
      dependsOn: [],
    },
  };

  readOnly: ReadOnlyMap = {
    name: () => {
      if (this.inserted) {
        return true;
      }

      // Check if numbering method is loaded
      if (this._numberingMethod) {
        const isAutomatic = this._numberingMethod === 'Automatic';
        console.log('[SalesOrder readOnly] Method:', this._numberingMethod, ', ReadOnly:', isAutomatic);
        return isAutomatic;
      }

      // Default to editable (Manual mode) until loaded
      // This ensures the field is accessible while loading
      console.log('[SalesOrder readOnly] Not loaded yet, defaulting to editable');
      return false;
    },
  };

  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'name',
        getTransactionStatusColumn(),
        'party',
        'date',
        'deliveryDate',
        'baseGrandTotal',
        'outstandingAmount',
      ],
    };
  }

  static getActions(fyo: Fyo): Action[] {
    return [
      {
        label: fyo.t`Create Invoice`,
        condition: (doc: Doc) => doc.isSubmitted && !doc.cancelled,
        action: async (doc, router) => {
          const invoice = await (doc as SalesOrder).getInvoice();
          if (!invoice) return;

          const route = `/edit/${ModelNameEnum.SalesInvoice}/${invoice.name}`;
          await router.push(route);
        },
      },
      {
        label: fyo.t`Duplicate`,
        condition: (doc: Doc) => !doc.isSubmitted && !doc.cancelled,
        action: async (doc, router) => {
          const dupe = await doc.duplicate();
          const route = `/edit/${doc.schemaName}/${dupe.name}`;
          await router.push(route);
        },
      },
    ];
  }
}
