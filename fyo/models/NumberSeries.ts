import { Doc } from 'fyo/model/doc';
import { ReadOnlyMap, ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';

const invalidNumberSeries = /[/\=\?\&\%]/;

function getPaddedName(prefix: string, next: number, padZeros: number): string {
  return prefix + next.toString().padStart(padZeros ?? 4, '0');
}

export default class NumberSeries extends Doc {
  async beforeInsert() {
    // Auto-generate name (prefix) based on referenceType if not set
    if (!this.name) {
      const refType = this.referenceType as string;
      // Generate a default prefix based on reference type
      const prefixMap: Record<string, string> = {
        'SalesInvoice': 'SINV-',
        'SalesQuote': 'SQ-',
        'SalesOrder': 'SO-',
        'PurchaseInvoice': 'PINV-',
        'Payment': 'PAY-',
        'JournalEntry': 'JE-',
        'StockMovement': 'SM-',
        'StockItems': 'SI-',
        'Shipment': 'SHP-',
        'PurchaseReceipt': 'PR-',
        'PricingRule': 'PRC-',
      };
      const basePrefix = prefixMap[refType] || 'NS-';

      // Check if a NumberSeries with this name already exists
      let uniqueName = basePrefix;
      let counter = 1;
      while (await this.fyo.db.exists('NumberSeries', uniqueName)) {
        // Insert counter before the trailing dash to maintain proper format
        // e.g., "SO-" becomes "SO1-", "SO2-", etc.
        const prefixWithoutDash = basePrefix.slice(0, -1);
        uniqueName = `${prefixWithoutDash}${counter}-`;
        counter++;
      }
      this.name = uniqueName;
    }

    // Initialize current to start value when creating new NumberSeries
    if (!this.current || this.current === 0) {
      this.current = this.start;
    }
  }

  validations: ValidationMap = {
    name: (value) => {
      if (typeof value !== 'string') {
        return;
      }

      if (invalidNumberSeries.test(value)) {
        throw new ValidationError(
          this.fyo
            .t`The following characters cannot be used ${'/, ?, &, =, %'} in a Number Series name.`
        );
      }
    },
  };

  setCurrent() {
    let current = this.get('current') as number | null;

    /**
     * Increment current if it isn't the first entry. This
     * is to prevent reassignment of NumberSeries document ids.
     */

    if (!current) {
      current = this.get('start') as number;
    } else {
      current = current + 1;
    }

    this.current = current;
  }

  async next(schemaName: string) {
    // Reload from database to get the latest current value
    // This prevents race conditions when multiple invoices are created
    await this.load();
    console.log('[NumberSeries.next] Reloaded from DB. Current value:', this.current, 'Series:', this.name);

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      this.setCurrent();
      const generatedName = this.getPaddedName(this.current as number);
      console.log('[NumberSeries.next] Generated name:', generatedName, 'Current:', this.current);

      const exists = await this.checkIfCurrentExists(schemaName);
      console.log('[NumberSeries.next] Checking if exists:', generatedName, 'Exists:', exists);

      if (!exists) {
        // Number is available, save it and return
        await this.sync();
        console.log('[NumberSeries.next] Saved current value:', this.current, 'Returning:', generatedName);
        return generatedName;
      }

      // Number already exists, increment and try again
      console.log('[NumberSeries.next] Number exists, trying next one');
      this.current = (this.current as number) + 1;
      attempts++;
    }

    // If we've exhausted all attempts, throw an error
    throw new Error(
      `Unable to generate unique number for ${schemaName} after ${maxAttempts} attempts`
    );
  }

  async checkIfCurrentExists(schemaName: string) {
    if (!schemaName) {
      return true;
    }

    const name = this.getPaddedName(this.current as number);
    return await this.fyo.db.exists(schemaName, name);
  }

  getPaddedName(next: number): string {
    return getPaddedName(this.name as string, next, this.padZeros as number);
  }

  getNextPreview(): string {
    /**
     * Returns the next invoice number that will be used
     * without incrementing the counter
     */
    let currentValue = (this.current as number);

    // If no current value exists, use start value
    if (!currentValue) {
      currentValue = (this.start as number) || 1001;
    } else {
      // Current exists, so next number is current + 1
      currentValue = currentValue + 1;
    }

    console.log('[NumberSeries.getNextPreview] Current:', this.current, 'Next preview:', currentValue);
    return this.getPaddedName(currentValue);
  }

  readOnly: ReadOnlyMap = {
    referenceType: () => this.inserted,
    // Allow editing padZeros and start even after insertion
    // This enables users to update number series configuration via SalesModule
  };
}
