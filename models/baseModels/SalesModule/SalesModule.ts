import { Doc } from 'fyo/model/doc';
import { ReadOnlyMap } from 'fyo/model/types';

export default class SalesModule extends Doc {
  _abbreviationChanged = false;

  // Listen for changes to referenceType and abbreviation
  async change(ch: { changedKey: string; oldValue?: unknown; newValue?: unknown }) {
    if (ch.changedKey === 'referenceType' && ch.newValue) {
      console.log('[SalesModule change] referenceType changed to:', ch.newValue);

      // Set name based on referenceType
      const nameMap: Record<string, string> = {
        'SalesInvoice': 'Sales Invoice',
        'SalesQuote': 'Sales Quotation',
        'SalesOrder': 'Sales Order',
        'PurchaseInvoice': 'Purchase Invoice',
        'Payment': 'Payment',
        'JournalEntry': 'Journal Entry',
        'StockMovement': 'Stock Movement',
        'Shipment': 'Shipment',
      };
      const newName = nameMap[ch.newValue as string] || ch.newValue as string;

      console.log('[SalesModule change] Setting name to:', newName);
      await this.set('name', newName);

      // Set abbreviation if not set
      if (!this.abbreviation) {
        const abbreviationMap: Record<string, string> = {
          'SalesInvoice': 'Sale',
          'SalesQuote': 'Quote',
          'SalesOrder': 'Order',
          'PurchaseInvoice': 'Purchase',
          'Payment': 'Pay',
          'JournalEntry': 'JE',
          'StockMovement': 'Stock',
          'Shipment': 'Ship',
        };
        await this.set('abbreviation', abbreviationMap[ch.newValue as string] || 'Doc');
      }
    }

    // Track when abbreviation changes
    if (ch.changedKey === 'abbreviation' && this.inserted) {
      console.log('[SalesModule change] Abbreviation changed from', ch.oldValue, 'to', ch.newValue);
      this._abbreviationChanged = true;
    }
  }

  async beforeInsert() {
    // ALWAYS auto-set name based on referenceType to ensure consistency
    const nameMap: Record<string, string> = {
      'SalesInvoice': 'Sales Invoice',
      'SalesQuote': 'Sales Quotation',
      'SalesOrder': 'Sales Order',
      'PurchaseInvoice': 'Purchase Invoice',
      'Payment': 'Payment',
      'JournalEntry': 'Journal Entry',
      'StockMovement': 'Stock Movement',
      'Shipment': 'Shipment',
    };
    this.name = nameMap[this.referenceType as string] || this.referenceType as string;

    console.log('[SalesModule beforeInsert] Setting name to:', this.name, 'for referenceType:', this.referenceType);

    // Set default abbreviation based on referenceType if not set
    if (!this.abbreviation) {
      const abbreviationMap: Record<string, string> = {
        'SalesInvoice': 'Sale',
        'SalesQuote': 'Quote',
        'SalesOrder': 'Order',
        'PurchaseInvoice': 'Purchase',
        'Payment': 'Pay',
        'JournalEntry': 'JE',
        'StockMovement': 'Stock',
        'Shipment': 'Ship',
      };
      this.abbreviation = abbreviationMap[this.referenceType as string] || 'Doc';
    }

    // Set default values for hidden fields if not already set
    if (!this.start) {
      this.start = 1001;
    }

    if (!this.padZeros) {
      this.padZeros = 4;
    }

    // Initialize current to start value when creating new SalesModule
    if (!this.current || this.current === 0) {
      this.current = this.start;
    }

    // Create corresponding NumberSeries
    await this.createNumberSeries();
  }

  async beforeSync() {
    await super.beforeSync();

    // Create new NumberSeries if abbreviation was changed
    if (this._abbreviationChanged) {
      console.log('[SalesModule beforeSync] Abbreviation changed to:', this.abbreviation, '- creating new NumberSeries');

      // Store old numberSeries for reference
      const oldNumberSeries = this.numberSeries;

      // Create new NumberSeries
      await this.createNumberSeries();

      console.log('[SalesModule beforeSync] NumberSeries updated from', oldNumberSeries, 'to', this.numberSeries);
      console.log('[SalesModule beforeSync] Verifying update - current numberSeries field:', this.get('numberSeries'));

      this._abbreviationChanged = false; // Reset flag
    }
  }

  async afterUpdate() {
    // Sync changes to the NumberSeries
    await this.syncToNumberSeries();
  }

  async createNumberSeries() {
    const refType = this.referenceType as string;

    // Use abbreviation from the SalesModule configuration
    let basePrefix = this.abbreviation as string || 'NS';

    // Add '-' suffix if abbreviation doesn't already end with it
    if (!basePrefix.endsWith('-')) {
      basePrefix = `${basePrefix}-`;
    }

    // Generate unique NumberSeries name
    // The name is the prefix that will be used in quote/invoice numbers
    let uniqueName = basePrefix;
    let counter = 1;
    while (await this.fyo.db.exists('NumberSeries', uniqueName)) {
      // Insert counter before the trailing dash to maintain proper format
      // e.g., "Order-" becomes "Order1-", "Order2-", etc.
      const prefixWithoutDash = basePrefix.slice(0, -1);
      uniqueName = `${prefixWithoutDash}${counter}-`;
      counter++;
    }

    // Create NumberSeries doc
    const numberSeries = this.fyo.doc.getNewDoc('NumberSeries', {
      name: uniqueName,
      referenceType: this.referenceType,
      start: this.start,
      padZeros: this.padZeros,
      current: this.current,
    });

    await numberSeries.sync();

    // Use set() to properly update the field so it gets saved
    await this.set('numberSeries', uniqueName);
    console.log('[SalesModule createNumberSeries] Set numberSeries field to:', uniqueName);
  }

  async syncToNumberSeries() {
    if (!this.numberSeries) {
      return;
    }

    const numberSeries = await this.fyo.doc.getDoc('NumberSeries', this.numberSeries as string);
    if (numberSeries) {
      numberSeries.start = this.start;
      numberSeries.padZeros = this.padZeros;
      numberSeries.current = this.current;
      await numberSeries.sync();
    }
  }

  readOnly: ReadOnlyMap = {
    referenceType: () => this.inserted,
    current: () => true,
  };

  // Override the title to show a descriptive name based on referenceType
  getTitle() {
    const refType = this.referenceType as string;
    const titleMap: Record<string, string> = {
      'SalesInvoice': 'Sales Invoice Configuration',
      'SalesQuote': 'Sales Quotes Configuration',
      'SalesOrder': 'Sales Order Configuration',
      'PurchaseInvoice': 'Purchase Invoice Configuration',
      'Payment': 'Payment Configuration',
      'JournalEntry': 'Journal Entry Configuration',
      'StockMovement': 'Stock Movement Configuration',
      'Shipment': 'Shipment Configuration',
    };
    return titleMap[refType] || 'Module Configuration';
  }

  // Helper method to check if automatic numbering is enabled
  isAutomaticNumbering() {
    return this.numberingMethod === 'Automatic';
  }

  // Helper method to check if the configuration is active
  isConfigurationActive() {
    return this.isActive !== false; // Default to true if not set
  }

  // Get display value for the voucher type
  getDisplayValue() {
    const refType = this.referenceType as string;
    const displayMap: Record<string, string> = {
      'SalesInvoice': 'Sales',
      'SalesQuote': 'Sales Quote',
      'SalesOrder': 'Sales Order',
      'PurchaseInvoice': 'Purchase',
      'Payment': 'Payment',
      'JournalEntry': 'Journal Entry',
      'StockMovement': 'Stock Movement',
      'Shipment': 'Shipment',
    };
    return displayMap[refType] || refType;
  }
}
