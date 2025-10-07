import { Fyo } from 'fyo';
import { SalesInvoice } from './SalesInvoice';
import { Party } from '../Party/Party';
import { ModelNameEnum } from 'models/types';
import { codeStateMap } from 'regional/in';
import * as crypto from 'crypto';

export interface EInvoiceData {
  Version: string;
  TranDtls: TransactionDetails;
  DocDtls: DocumentDetails;
  SellerDtls: SellerDetails;
  BuyerDtls: BuyerDetails;
  ItemList: EInvoiceItem[];
  ValDtls: ValueDetails;
}

export interface TransactionDetails {
  TaxSch: string; // Tax Scheme (GST)
  SupTyp: string; // Supply Type (B2B, B2C, SEZWP, SEZWOP, EXPWP, EXPWOP, DEXP)
  RegRev?: string; // Reverse Charge (Y/N)
  IgstOnIntra?: string; // IGST on Intra (Y/N)
}

export interface DocumentDetails {
  Typ: string; // Document Type (INV, CRN, DBN)
  No: string; // Document Number
  Dt: string; // Document Date (dd/MM/yyyy)
}

export interface SellerDetails {
  Gstin: string; // GSTIN of Supplier
  LglNm: string; // Legal Name
  Addr1: string; // Address Line 1
  Loc: string; // Location
  Pin: number; // Pincode
  Stcd: string; // State Code
}

export interface BuyerDetails {
  Gstin?: string; // GSTIN of Buyer (optional for B2C)
  LglNm: string; // Legal Name
  Pos: string; // Place of Supply
  Addr1: string; // Address Line 1
  Loc: string; // Location
  Pin: number; // Pincode
  Stcd: string; // State Code
}

export interface EInvoiceItem {
  SlNo: string; // Serial Number
  PrdDesc: string; // Product Description
  IsServc: string; // Is Service (Y/N)
  HsnCd: string; // HSN Code
  Qty: number; // Quantity
  Unit: string; // Unit
  UnitPrice: number; // Unit Price
  TotAmt: number; // Total Amount
  Discount?: number; // Discount Amount
  AssAmt: number; // Assessable Amount
  GstRt: number; // GST Rate
  IgstAmt?: number; // IGST Amount
  CgstAmt?: number; // CGST Amount
  SgstAmt?: number; // SGST Amount
  TotItemVal: number; // Total Item Value
}

export interface ValueDetails {
  AssVal: number; // Assessable Value
  CgstVal?: number; // CGST Value
  SgstVal?: number; // SGST Value
  IgstVal?: number; // IGST Value
  Discount?: number; // Discount
  TotInvVal: number; // Total Invoice Value
}

export interface EInvoiceResponse {
  success: boolean;
  Irn?: string;
  AckNo?: string;
  AckDt?: string;
  SignedQRCode?: string;
  error?: string;
  errorDetails?: string;
}

/**
 * Generates e-Invoice JSON payload for GST Portal
 */
export async function generateEInvoicePayload(
  fyo: Fyo,
  invoice: SalesInvoice
): Promise<EInvoiceData> {
  // Get company GSTIN
  const gstin = (await fyo.getValue(
    ModelNameEnum.AccountingSettings,
    'gstin'
  )) as string;

  if (!gstin) {
    throw new Error('GSTIN not set in Accounting Settings');
  }

  // Get party details
  const party = (await fyo.doc.getDoc(
    ModelNameEnum.Party,
    invoice.party!
  )) as Party;

  // Get company details
  const companyName = (await fyo.getValue(
    ModelNameEnum.AccountingSettings,
    'companyName'
  )) as string;

  // Determine supply type
  const supplyType = await getSupplyType(fyo, invoice, party);

  // Get place of supply
  const pos = await getPlaceOfSupply(fyo, party);

  // Transaction Details
  const tranDtls: TransactionDetails = {
    TaxSch: 'GST',
    SupTyp: supplyType,
    RegRev: party.gstin ? 'N' : 'Y', // Reverse charge if party has no GSTIN
  };

  // Document Details
  const docDtls: DocumentDetails = {
    Typ: invoice.isReturn ? 'CRN' : 'INV',
    No: invoice.name!,
    Dt: formatDate(invoice.date as Date),
  };

  // Seller Details (Company)
  const sellerDtls: SellerDetails = {
    Gstin: gstin,
    LglNm: companyName || 'Company Name',
    Addr1: 'Address Line 1', // Should be fetched from company settings
    Loc: 'City',
    Pin: 110001, // Should be fetched from company settings
    Stcd: gstin.substring(0, 2),
  };

  // Buyer Details (Party)
  const buyerDtls: BuyerDetails = {
    LglNm: party.name!,
    Pos: pos,
    Addr1: 'Address Line 1', // Should be fetched from party address
    Loc: 'City',
    Pin: 110001, // Should be fetched from party address
    Stcd: pos,
  };

  if (party.gstin) {
    buyerDtls.Gstin = party.gstin;
  }

  // Item List
  const itemList: EInvoiceItem[] = [];
  let slNo = 1;

  for (const item of invoice.items ?? []) {
    const taxRate = await getTotalTaxRate(fyo, item.tax as string);
    const isInterState = await isInterStateTransaction(fyo, gstin, pos);

    const itemData: EInvoiceItem = {
      SlNo: slNo.toString(),
      PrdDesc: item.description || item.item!,
      IsServc: 'N', // Should be determined from item master
      HsnCd: (item.hsnCode as string) || '0',
      Qty: item.quantity as number,
      Unit: (item.unit as string) || 'NOS',
      UnitPrice: item.rate!.float,
      TotAmt: item.amount!.float,
      AssAmt: item.amount!.float,
      GstRt: taxRate,
      TotItemVal: item.amount!.float * (1 + taxRate / 100),
    };

    // Calculate tax amounts
    const taxAmount = item.amount!.float * (taxRate / 100);

    if (isInterState) {
      itemData.IgstAmt = taxAmount;
    } else {
      itemData.CgstAmt = taxAmount / 2;
      itemData.SgstAmt = taxAmount / 2;
    }

    itemList.push(itemData);
    slNo++;
  }

  // Value Details
  const valDtls: ValueDetails = {
    AssVal: invoice.netTotal!.float,
    TotInvVal: invoice.grandTotal!.float,
  };

  // Calculate total tax
  const isInterState = await isInterStateTransaction(fyo, gstin, pos);
  const totalTax = invoice.grandTotal!.float - invoice.netTotal!.float;

  if (isInterState) {
    valDtls.IgstVal = totalTax;
  } else {
    valDtls.CgstVal = totalTax / 2;
    valDtls.SgstVal = totalTax / 2;
  }

  // Add discount if applicable
  const discountAmount = invoice.getTotalDiscount();
  if (discountAmount.isPositive()) {
    valDtls.Discount = discountAmount.float;
  }

  return {
    Version: '1.1',
    TranDtls: tranDtls,
    DocDtls: docDtls,
    SellerDtls: sellerDtls,
    BuyerDtls: buyerDtls,
    ItemList: itemList,
    ValDtls: valDtls,
  };
}

/**
 * Generate IRN (Invoice Reference Number) using SHA-256 hash
 */
export function generateIRN(eInvoiceData: EInvoiceData): string {
  const dataString = JSON.stringify(eInvoiceData);
  const hash = crypto.createHash('sha256').update(dataString).digest('hex');
  return hash.toUpperCase();
}

/**
 * Determine supply type based on transaction details
 */
async function getSupplyType(
  fyo: Fyo,
  invoice: SalesInvoice,
  party: Party
): Promise<string> {
  if (party.gstin) {
    return 'B2B'; // Business to Business
  }

  // If no GSTIN and grand total >= 2.5 lakhs, it's B2CL (B2C Large)
  if (invoice.grandTotal!.float >= 250000) {
    return 'B2CL';
  }

  return 'B2CS'; // B2C Small
}

/**
 * Get place of supply (state code)
 */
async function getPlaceOfSupply(fyo: Fyo, party: Party): Promise<string> {
  if (party.gstin) {
    return party.gstin.substring(0, 2);
  }

  // If party has address, get state from address
  if (party.address) {
    const pos = (await fyo.getValue(
      ModelNameEnum.Address,
      party.address as string,
      'pos'
    )) as string | undefined;

    if (pos) {
      // Get state code from state name
      for (const [code, stateName] of Object.entries(codeStateMap)) {
        if (stateName === pos) {
          return code;
        }
      }
    }
  }

  // Default to company state
  const gstin = (await fyo.getValue(
    ModelNameEnum.AccountingSettings,
    'gstin'
  )) as string;
  return gstin?.substring(0, 2) || '27'; // Default to Maharashtra
}

/**
 * Check if transaction is inter-state
 */
async function isInterStateTransaction(
  fyo: Fyo,
  sellerGstin: string,
  buyerPos: string
): Promise<boolean> {
  const sellerState = sellerGstin.substring(0, 2);
  return sellerState !== buyerPos;
}

/**
 * Get total tax rate from tax master
 */
async function getTotalTaxRate(fyo: Fyo, tax: string): Promise<number> {
  if (!tax) {
    return 0;
  }

  const details = ((await fyo.getValue('Tax', tax, 'details')) as any[]) ?? [];
  return details.reduce((acc, doc) => {
    return (doc.rate as number) + acc;
  }, 0);
}

/**
 * Format date to dd/MM/yyyy format
 */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Validate e-Invoice data before generation
 */
export function validateEInvoiceData(invoice: SalesInvoice): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!invoice.submitted) {
    errors.push('Invoice must be submitted before generating e-Invoice');
  }

  if (invoice.eInvoiceGenerated) {
    errors.push('E-Invoice already generated for this invoice');
  }

  if (!invoice.items || invoice.items.length === 0) {
    errors.push('Invoice must have at least one item');
  }

  // Check for HSN codes
  for (const item of invoice.items ?? []) {
    if (!item.hsnCode) {
      errors.push(`HSN Code missing for item: ${item.item}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
