import { Fyo, t } from 'fyo';
import { Action, ListViewSettings, ValidationMap } from 'fyo/model/types';
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
import { DocValue } from 'fyo/core/types';
import { Party } from '../Party/Party';
import { ValidationError } from 'fyo/utils/errors';
import { Money } from 'pesa';
import { Doc } from 'fyo/model/doc';
import { EInvoiceService } from './eInvoiceService';
import { showDialog } from 'src/utils/interactive';

export class SalesInvoice extends Invoice {
  items?: SalesInvoiceItem[];
  eInvoiceGenerated?: boolean;
  irn?: string;
  ackNo?: string;
  ackDate?: Date;
  signedQrCode?: string;
  eInvoiceCancelled?: boolean;
  cancelDate?: Date;
  cancelRemark?: string;

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

    const discountAmount = this.getTotalDiscount();
    const discountAccount = this.fyo.singles.AccountingSettings
      ?.discountAccount as string | undefined;
    if (discountAccount && discountAmount.isPositive()) {
      if (this.isReturn) {
        await posting.credit(discountAccount, discountAmount.mul(exchangeRate));
      } else {
        await posting.debit(discountAccount, discountAmount.mul(exchangeRate));
      }
    }

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
}
