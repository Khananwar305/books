import { Fyo, t } from 'fyo';
import { Action, ChangeArg, FiltersMap, FormulaMap, HiddenMap, ListViewSettings, ReadOnlyMap, ValidationMap } from 'fyo/model/types';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { ModelNameEnum } from 'models/types';
import {
  getAddedLPWithGrandTotal,
  getInvoiceActions,
  getReturnLoyaltyPoints,
  getTransactionStatusColumn,
} from '../../helpers';
import { Invoice } from '../Invoice/Invoice';
import { SalesInvoiceItem } from '../SalesInvoiceItem/SalesInvoiceItem';
import { LoyaltyProgram } from '../LoyaltyProgram/LoyaltyProgram';
import { DocValue, DocValueMap } from 'fyo/core/types';
import { Party } from '../Party/Party';
import { ValidationError } from 'fyo/utils/errors';
import { Money } from 'pesa';
import { Doc } from 'fyo/model/doc';
import { EInvoiceService } from './eInvoiceService';
import { showDialog } from 'src/utils/interactive';
import { Schema } from 'schemas/types';

export class SalesInvoice extends Invoice {
  items?: SalesInvoiceItem[];
  referenceType?: 'SalesQuote' | 'SalesOrder';
  quote?: string;
  eInvoiceGenerated?: boolean;
  irn?: string;
  ackNo?: string;
  ackDate?: Date;
  signedQrCode?: string;
  eInvoiceCancelled?: boolean;
  cancelDate?: Date;
  cancelRemark?: string;
  _numberingMethod?: string;
  _isNumberingMethodLoaded?: boolean;
  _isNewInvoice?: boolean;

  constructor(schema: Schema, data: DocValueMap, fyo: Fyo) {
    super(schema, data, fyo);

    // Set invoice number immediately for new documents
    if (!this.inserted && !this.name) {
      this.setInvoiceNumberPreview();
    }
  }

  async setInvoiceNumberPreview() {
    try {
      const salesModuleConfig = await this.getActiveSalesModuleConfig();
      if (!salesModuleConfig || salesModuleConfig.numberingMethod !== 'Automatic') {
        return;
      }

      const numberSeriesName = salesModuleConfig.numberSeries as string;
      if (!numberSeriesName) {
        return;
      }

      // Load the NumberSeries and ensure it has fresh data from database
      const numberSeries = await this.fyo.doc.getDoc('NumberSeries', numberSeriesName);
      await numberSeries.load(); // Reload from database to get latest value

      const nextPreview = numberSeries.getNextPreview();
      console.log('[SalesInvoice] Setting preview number:', nextPreview);
      this.name = nextPreview;
    } catch (error) {
      console.error('[SalesInvoice] Error setting preview:', error);
    }
  }

  async beforeSync() {
    await super.beforeSync();

    // Only process numbering for new invoices (not updates)
    if (this.inserted) {
      return;
    }

    // Mark this as a new invoice so afterSync knows to update counter
    this._isNewInvoice = true;

    console.log('[SalesInvoice beforeSync] Processing new invoice. Current name:', this.name);

    // Get active SalesModule configuration for SalesInvoice
    const salesModuleConfig = await this.getActiveSalesModuleConfig();

    // Ensure numberSeries is always set
    if (salesModuleConfig) {
      const numberSeriesName = salesModuleConfig.numberSeries as string;
      if (numberSeriesName && !this.numberSeries) {
        this.numberSeries = numberSeriesName;
      }
    } else {
      // Fallback: try to get default numberSeries from AccountingSettings
      const accountingSettings = await this.fyo.doc.getDoc('AccountingSettings');
      const defaultNumberSeries = accountingSettings.get('salesInvoiceNumberSeries');
      if (defaultNumberSeries && !this.numberSeries) {
        this.numberSeries = defaultNumberSeries as string;
      }
    }

    // For new unsaved invoices in automatic mode
    if (salesModuleConfig) {
      const isAutomaticMode = salesModuleConfig.numberingMethod === 'Automatic';
      console.log('[SalesInvoice beforeSync] Mode:', salesModuleConfig.numberingMethod);

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
              console.log('[SalesInvoice beforeSync] Preview number available, will use:', this.name);
              return;
            } else {
              console.log('[SalesInvoice beforeSync] Preview number taken, getting next...');
            }
          }

          // Preview number is taken or not set, generate a new one
          const numberSeries = await this.fyo.doc.getDoc('NumberSeries', numberSeriesName);
          this.name = await numberSeries.next(this.schemaName);

          console.log('[SalesInvoice beforeSync] Generated new invoice number:', this.name);
        } catch (error) {
          console.error('[SalesInvoice beforeSync] Error generating invoice number:', error);
          throw error;
        }
      } else {
        // Manual mode: user must enter invoice number
        if (!this.name || this.name.trim() === '') {
          throw new ValidationError(this.fyo.t`Please enter invoice number in Manual mode`);
        }
        console.log('[SalesInvoice beforeSync] Manual mode - using user-entered number:', this.name);
      }
    } else {
      // Fallback to old logic if no SalesModule configuration exists
      console.log('[SalesInvoice beforeSync] No SalesModule config, using fallback');
      const accountingSettings = await this.fyo.doc.getDoc('AccountingSettings');
      const isManualMode = accountingSettings.get('enableManualInvoiceNumbering');

      if (!isManualMode) {
        try {
          this.name = await accountingSettings.generateNextInvoiceNumber();
          const defaultNumberSeries = accountingSettings.get('salesInvoiceNumberSeries');
          if (defaultNumberSeries) {
            this.numberSeries = defaultNumberSeries as string;
          }
          console.log('[SalesInvoice beforeSync] Fallback generated number:', this.name);
        } catch (error) {
          console.error('Error generating invoice number:', error);
          throw error;
        }
      }
    }

    // Final validation: ensure numberSeries is set
    if (!this.numberSeries) {
      throw new ValidationError(
        this.fyo.t`Number Series is required. Please configure it in Sales Module Settings or Accounting Settings.`
      );
    }
  }

  async getActiveSalesModuleConfig() {
    try {
      const configs = await this.fyo.db.getAllRaw('SalesModule', {
        fields: ['name', 'numberingMethod', 'numberSeries', 'isActive'],
        filters: { referenceType: 'SalesInvoice' },
      });

      if (configs && configs.length > 0) {
        // Return the first active configuration, or the first one if none are explicitly active
        const activeConfig = configs.find(c => c.isActive !== false) || configs[0];
        console.log('[SalesInvoice] Found active config:', {
          name: activeConfig.name,
          numberingMethod: activeConfig.numberingMethod,
          numberSeries: activeConfig.numberSeries,
          isActive: activeConfig.isActive
        });
        return activeConfig;
      }
      console.log('[SalesInvoice] No SalesModule configurations found for SalesInvoice');
      return null;
    } catch (error) {
      console.error('[SalesInvoice] Error fetching SalesModule configuration:', error);
      return null;
    }
  }

  async handleReferenceChange() {
    if (!this.referenceType || !this.quote) {
      return;
    }

    // Check for existing items and show confirmation
    const hasExistingItems = (this.items?.length ?? 0) > 0;

    if (hasExistingItems) {
      const confirmed = await showDialog({
        title: this.fyo.t`Replace Existing Items?`,
        detail: this.fyo.t`This invoice already has items. Do you want to replace them with items from the selected reference?`,
        type: 'warning',
        buttons: [
          { label: this.fyo.t`Cancel`, action: () => false, isEscape: true },
          { label: this.fyo.t`Replace`, action: () => true, isPrimary: true },
        ],
      });

      if (!confirmed) {
        this.quote = undefined;
        return;
      }

      this.items = [];
    }

    // Load reference document
    try {
      const referenceDoc = await this.fyo.doc.getDoc(
        this.referenceType,
        this.quote
      ) as Invoice;

      // Validate submission
      if (!referenceDoc.isSubmitted) {
        await showDialog({
          title: this.fyo.t`Invalid Reference`,
          detail: this.fyo.t`The selected ${this.referenceType} is not submitted yet.`,
          type: 'error',
        });
        this.quote = undefined;
        return;
      }

      // Copy items
      for (const row of referenceDoc.items ?? []) {
        await this.append('items', row.getValidDict(false, true));
      }

      // Copy party if not set
      if (!this.party && referenceDoc.party) {
        this.party = referenceDoc.party;
      }

      // Copy account if not set (and exists on reference)
      if (!this.account && referenceDoc.account) {
        this.account = referenceDoc.account;
      }
    } catch (error) {
      await showDialog({
        title: this.fyo.t`Reference Not Found`,
        detail: this.fyo.t`The selected reference document could not be loaded.`,
        type: 'error',
      });
      this.quote = undefined;
    }
  }

  async afterSync() {
    await super.afterSync();

    // Update NumberSeries counter after successful save
    // This ensures the counter is only updated when the invoice is actually saved
    if (this._isNewInvoice) {
      // This was a new invoice that just got saved
      await this.updateNumberSeriesCounter();
      this._isNewInvoice = false; // Reset flag
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

      // Extract the numeric part from the invoice number
      const invoiceNumber = this.name.replace(numberSeriesName, '');
      const numericValue = parseInt(invoiceNumber, 10);

      // Only update if this number is greater than current
      if (!isNaN(numericValue) && numericValue > (numberSeries.current as number)) {
        numberSeries.current = numericValue;
        await numberSeries.sync();
        console.log('[SalesInvoice afterSync] Updated NumberSeries current to:', numericValue);
      }
    } catch (error) {
      console.error('[SalesInvoice afterSync] Error updating NumberSeries:', error);
      // Don't throw - the invoice is already saved
    }
  }

  async afterSubmit() {
    await super.afterSubmit();
    await this.updateReferenceInvoicedStatus();
  }

  async afterCancel() {
    await super.afterCancel();
    await this.updateReferenceInvoicedStatus();
  }

  async updateReferenceInvoicedStatus() {
    if (!this.referenceType || !this.quote) {
      return;
    }

    try {
      const refDoc = await this.fyo.doc.getDoc(this.referenceType, this.quote);
      const hasRemaining = await (refDoc as any).hasRemainingQuantity();

      await refDoc.setAndSync('fullyInvoiced', !hasRemaining);
    } catch (error) {
      console.error('Error updating reference invoiced status:', error);
    }
  }

  async getPosting() {
    const exchangeRate = this.exchangeRate ?? 1;
    const posting: LedgerPosting = new LedgerPosting(this, this.fyo);
    if (this.isReturn) {
      await posting.credit(this.account!, this.baseGrandTotal!);
    } else {
      await posting.debit(this.account!, this.baseGrandTotal!);
    }

    for (const item of this.items!) {
      if (this.isReturn) {
        await posting.debit(item.account!, item.amount!.mul(exchangeRate));
        continue;
      }
      await posting.credit(item.account!, item.amount!.mul(exchangeRate));
    }

    if (this.redeemLoyaltyPoints) {
      const loyaltyProgramDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.LoyaltyProgram,
        this.loyaltyProgram
      )) as LoyaltyProgram;

      let totalAmount;

      if (this.isReturn) {
        totalAmount = this.fyo.pesa(await getReturnLoyaltyPoints(this));
      } else {
        totalAmount = await getAddedLPWithGrandTotal(
          this.fyo,
          this.loyaltyProgram as string,
          this.loyaltyPoints as number
        );
      }

      await posting.debit(
        loyaltyProgramDoc.expenseAccount as string,
        totalAmount
      );

      await posting.credit(this.account!, totalAmount);
    }

    if (this.taxes) {
      for (const tax of this.taxes) {
        if (this.isReturn) {
          await posting.debit(tax.account!, tax.amount!.mul(exchangeRate));
          continue;
        }
        await posting.credit(tax.account!, tax.amount!.mul(exchangeRate));
      }
    }

    // Discount is applied at item level and reflected in item amounts
    // No separate discount GL entry needed

    await posting.makeRoundOffEntry();
    return posting;
  }

  validations: ValidationMap = {
    loyaltyPoints: async (value: DocValue) => {
      if (!this.redeemLoyaltyPoints || this.isSubmitted || this.isReturn) {
        return;
      }

      const partyDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.Party,
        this.party
      )) as Party;

      if ((value as number) <= 0) {
        throw new ValidationError(t`Points must be greather than 0`);
      }

      if ((value as number) > (partyDoc?.loyaltyPoints || 0)) {
        throw new ValidationError(
          t`${this.party as string} only has ${
            partyDoc.loyaltyPoints as number
          } points`
        );
      }

      const loyaltyProgramDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.LoyaltyProgram,
        this.loyaltyProgram
      )) as LoyaltyProgram;

      if (!this?.grandTotal) {
        return;
      }

      const loyaltyPoint =
        ((value as number) || 0) *
        ((loyaltyProgramDoc?.conversionFactor as number) || 0);

      if (!this.isReturn) {
        const totalDiscount = this.getTotalDiscount();
        let baseGrandTotal;

        if (!this.taxes!.length) {
          baseGrandTotal = (this.netTotal as Money).sub(totalDiscount);
        } else {
          baseGrandTotal = ((this.taxes ?? []) as Doc[])
            .map((doc) => doc.amount as Money)
            .reduce((a, b) => {
              if (this.isReturn) {
                return a.abs().add(b.abs()).neg();
              }
              return a.add(b.abs());
            }, (this.netTotal as Money).abs())
            .sub(totalDiscount);
        }

        if (baseGrandTotal?.lt(loyaltyPoint)) {
          throw new ValidationError(
            t`no need ${value as number} points to purchase this item`
          );
        }
      }
    },
  };

  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'name',
        getTransactionStatusColumn(),
        'party',
        'date',
        'baseGrandTotal',
        'outstandingAmount',
      ],
    };
  }

  static getActions(fyo: Fyo): Action[] {
    const invoiceActions = getInvoiceActions(fyo, ModelNameEnum.SalesInvoice);

    // Add e-Invoice actions
    const eInvoiceActions: Action[] = [
      {
        label: t`Generate E-Invoice`,
        group: 'E-Invoice',
        condition: (doc: Doc) => {
          const invoice = doc as SalesInvoice;
          return (
            invoice.submitted &&
            !invoice.cancelled &&
            !invoice.eInvoiceGenerated &&
            !invoice.isReturn
          );
        },
        action: async (doc: Doc) => {
          const invoice = doc as SalesInvoice;
          const eInvoiceService = new EInvoiceService(fyo);

          const result = await eInvoiceService.generateEInvoice(invoice);

          if (!result.success) {
            await showDialog({
              title: fyo.t`E-Invoice Generation Failed`,
              detail: result.errorDetails || result.error || fyo.t`Unknown error occurred`,
              type: 'error',
            });
          }
        },
      },
      {
        label: t`Cancel E-Invoice`,
        group: 'E-Invoice',
        condition: (doc: Doc) => {
          const invoice = doc as SalesInvoice;
          return (
            invoice.eInvoiceGenerated &&
            !invoice.eInvoiceCancelled
          );
        },
        action: async (doc: Doc) => {
          const invoice = doc as SalesInvoice;

          // Show cancellation dialog to get reason and remark
          const cancelReasons = [
            { value: '1', label: 'Duplicate' },
            { value: '2', label: 'Data Entry Mistake' },
            { value: '3', label: 'Order Cancelled' },
            { value: '4', label: 'Other' },
          ];

          // This is a simplified version - in production, you'd use a proper form dialog
          const reason = '2'; // Data Entry Mistake
          const remark = 'Cancelled due to error';

          const eInvoiceService = new EInvoiceService(fyo);
          const result = await eInvoiceService.cancelEInvoice(
            invoice,
            reason,
            remark
          );

          if (!result.success) {
            await showDialog({
              title: fyo.t`E-Invoice Cancellation Failed`,
              detail: result.errorDetails || result.error || fyo.t`Unknown error occurred`,
              type: 'error',
            });
          }
        },
      },
      {
        label: t`View E-Invoice Details`,
        group: 'E-Invoice',
        condition: (doc: Doc) => {
          const invoice = doc as SalesInvoice;
          return invoice.eInvoiceGenerated === true;
        },
        action: async (doc: Doc) => {
          const invoice = doc as SalesInvoice;

          let details = `IRN: ${invoice.irn}\n`;
          details += `Acknowledgement No: ${invoice.ackNo}\n`;
          details += `Acknowledgement Date: ${invoice.ackDate}\n`;

          if (invoice.eInvoiceCancelled) {
            details += `\nStatus: CANCELLED\n`;
            details += `Cancelled Date: ${invoice.cancelDate}\n`;
            details += `Cancellation Remark: ${invoice.cancelRemark}`;
          } else {
            details += `\nStatus: ACTIVE`;
          }

          await showDialog({
            title: fyo.t`E-Invoice Details`,
            detail: details,
            type: 'info',
          });
        },
      },
      {
        label: t`Download E-Invoice PDF`,
        group: 'E-Invoice',
        condition: (doc: Doc) => {
          const invoice = doc as SalesInvoice;
          return invoice.eInvoiceGenerated === true;
        },
        action: async (doc: Doc) => {
          const invoice = doc as SalesInvoice;
          const eInvoiceService = new EInvoiceService(fyo);
          await eInvoiceService.downloadEInvoicePDF(invoice);
        },
      },
    ];

    return [...invoiceActions, ...eInvoiceActions];
  }


  async change({ changed }: ChangeArg) {
    await super.change({ changed });

    if (changed === 'referenceType') {
      this.quote = undefined;
    }

    if (changed === 'quote' && this.quote) {
      await this.handleReferenceChange();
    }
  }

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
        console.log('[SalesInvoice readOnly] Method:', this._numberingMethod, ', ReadOnly:', isAutomatic);
        return isAutomatic;
      }

      // Default to editable (Manual mode) until loaded
      // This ensures the field is accessible while loading
      console.log('[SalesInvoice readOnly] Not loaded yet, defaulting to editable');
      return false;
    },
  };

  hidden: HiddenMap = {
    quote: () => !this.referenceType, // Only show when reference type is selected
  };

  static filters: FiltersMap = {
    quote: (doc: Doc) => {
      const invoice = doc as SalesInvoice;

      if (!invoice.referenceType) {
        return { name: ['is', null] };
      }

      const filter: any = {
        submitted: true,
        cancelled: false,
        fullyInvoiced: false, // Only show partially invoiced references
      };

      if (invoice.party) {
        filter.party = invoice.party;
      }

      return filter;
    },
  };

}
