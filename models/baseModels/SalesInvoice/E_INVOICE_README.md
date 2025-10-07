# E-Invoice Implementation for Sales Invoices

This implementation adds e-Invoice functionality to Sales Invoices for GST compliance in India.

## Features

### 1. E-Invoice Generation
- Generates IRN (Invoice Reference Number) using SHA-256 hash
- Creates JSON payload as per GST e-Invoice schema version 1.1
- Supports B2B, B2CL, and B2CS supply types
- Handles both intra-state and inter-state transactions
- Automatic CGST/SGST or IGST calculation based on place of supply

### 2. E-Invoice Cancellation
- Cancel e-Invoices with proper reason codes
- Stores cancellation date and remarks
- Prevents duplicate cancellations

### 3. E-Invoice Details Display
- View IRN, Acknowledgement Number, and Date
- Check e-Invoice status (Active/Cancelled)
- Download signed QR code

### 4. PDF Generation
- Download e-Invoice PDF (requires GSP integration)

## Schema Fields Added

The following fields have been added to the SalesInvoice schema:

| Field | Type | Description |
|-------|------|-------------|
| `eInvoiceGenerated` | Check | Indicates if e-Invoice is generated |
| `irn` | Data | Invoice Reference Number (64 characters) |
| `ackNo` | Data | Acknowledgement Number from GST Portal |
| `ackDate` | Datetime | Acknowledgement Date |
| `signedQrCode` | Text | Signed QR Code for e-Invoice |
| `eInvoiceCancelled` | Check | Indicates if e-Invoice is cancelled |
| `cancelDate` | Datetime | Cancellation Date |
| `cancelRemark` | Text | Cancellation Remark |

## Usage

### Generating an E-Invoice

1. Create and submit a Sales Invoice
2. Click on the **Actions** button
3. Select **Generate E-Invoice** from the E-Invoice group
4. The system will:
   - Validate the invoice (HSN codes, GSTIN, etc.)
   - Generate e-Invoice JSON payload
   - Call GSP API to register the invoice
   - Store IRN and acknowledgement details

### Cancelling an E-Invoice

1. Open a Sales Invoice with generated e-Invoice
2. Click on the **Actions** button
3. Select **Cancel E-Invoice** from the E-Invoice group
4. Provide cancellation reason and remark (currently hardcoded, to be enhanced)
5. The e-Invoice will be marked as cancelled

### Viewing E-Invoice Details

1. Open a Sales Invoice with generated e-Invoice
2. Click on the **Actions** button
3. Select **View E-Invoice Details**
4. A dialog will show:
   - IRN
   - Acknowledgement Number
   - Acknowledgement Date
   - Status (Active/Cancelled)
   - Cancellation details (if applicable)

## Prerequisites

Before generating e-Invoices, ensure:

1. **GSTIN is configured** in Accounting Settings
2. **Company details** are properly set up (name, address, state)
3. **Party has GSTIN** (for B2B transactions)
4. **HSN codes** are set for all invoice items
5. **Tax rates** are properly configured (GST/IGST)

## Files Created

### 1. `eInvoiceUtils.ts`
Contains utility functions for e-Invoice processing:
- `generateEInvoicePayload()` - Creates GST-compliant JSON payload
- `generateIRN()` - Generates Invoice Reference Number
- `validateEInvoiceData()` - Validates invoice before generation
- Helper functions for supply type, place of supply, tax calculations

### 2. `eInvoiceService.ts`
Service class for e-Invoice operations:
- `generateEInvoice()` - Generate e-Invoice via GSP API
- `cancelEInvoice()` - Cancel e-Invoice
- `getEInvoiceByIRN()` - Fetch e-Invoice details
- API integration methods (placeholder for production)

### 3. Updated `SalesInvoice.ts`
- Added e-Invoice properties
- Added action buttons for e-Invoice operations
- Integrated with EInvoiceService

## GSP API Integration

### Current Implementation
The current implementation uses **simulated API responses** for testing purposes.

### Production Implementation

To integrate with a GSP (GST Suvidha Provider), you need to:

1. **Choose a GSP Provider**
   - Adaequare
   - ClearTax
   - IRIS
   - Karvy
   - Others

2. **Update API Endpoint**
   ```typescript
   // In eInvoiceService.ts
   this.apiEndpoint = 'https://your-gsp-provider.com/api/';
   ```

3. **Implement Authentication**
   ```typescript
   async authenticate(username: string, password: string) {
     // Implement GSP-specific authentication
     // Store auth token
   }
   ```

4. **Update API Call Method**
   ```typescript
   private async callGSPAPI(endpoint: string, data: any) {
     const response = await fetch(`${this.apiEndpoint}${endpoint}`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${this.authToken}`,
         'gstin': await this.getGSTIN(),
       },
       body: JSON.stringify(data),
     });
     return await response.json();
   }
   ```

5. **Add API Credentials**
   - Store credentials securely
   - Add settings for GSP username/password
   - Implement token refresh mechanism

## E-Invoice JSON Structure

The e-Invoice payload follows the GST e-Invoice schema:

```json
{
  "Version": "1.1",
  "TranDtls": {
    "TaxSch": "GST",
    "SupTyp": "B2B",
    "RegRev": "N"
  },
  "DocDtls": {
    "Typ": "INV",
    "No": "SINV-00001",
    "Dt": "01/01/2024"
  },
  "SellerDtls": {
    "Gstin": "27AAAAA0000A1Z5",
    "LglNm": "Company Name",
    "Addr1": "Address",
    "Loc": "City",
    "Pin": 110001,
    "Stcd": "27"
  },
  "BuyerDtls": {
    "Gstin": "29BBBBB0000B1Z5",
    "LglNm": "Customer Name",
    "Pos": "29",
    "Addr1": "Address",
    "Loc": "City",
    "Pin": 560001,
    "Stcd": "29"
  },
  "ItemList": [
    {
      "SlNo": "1",
      "PrdDesc": "Product Description",
      "IsServc": "N",
      "HsnCd": "1234",
      "Qty": 10,
      "Unit": "NOS",
      "UnitPrice": 100,
      "TotAmt": 1000,
      "AssAmt": 1000,
      "GstRt": 18,
      "IgstAmt": 180,
      "TotItemVal": 1180
    }
  ],
  "ValDtls": {
    "AssVal": 1000,
    "IgstVal": 180,
    "TotInvVal": 1180
  }
}
```

## Validation Rules

Before generating e-Invoice, the system validates:

1. Invoice must be submitted
2. E-Invoice not already generated
3. At least one item present
4. All items have HSN codes
5. GSTIN configured in settings
6. Tax rates properly set

## Error Handling

The implementation includes error handling for:
- Missing GSTIN
- Missing HSN codes
- API failures
- Network errors
- Validation errors

Errors are displayed to the user via dialog boxes with appropriate messages.

## Future Enhancements

1. **User Input for Cancellation**
   - Form dialog for cancellation reason selection
   - Custom remark input

2. **Bulk E-Invoice Generation**
   - Generate e-Invoices for multiple invoices at once

3. **E-Invoice Settings**
   - GSP provider selection
   - API credentials configuration
   - Sandbox/Production mode toggle

4. **QR Code Display**
   - Visual QR code display on invoice print
   - QR code scanning support

5. **E-Invoice Reports**
   - List of invoices with e-Invoice status
   - Export e-Invoice data for filing

6. **Auto-generation**
   - Option to auto-generate e-Invoice on submission
   - Configurable threshold for auto-generation

## Testing

To test the implementation:

1. Create a test Sales Invoice
2. Set GSTIN in Accounting Settings
3. Add HSN codes to items
4. Submit the invoice
5. Click "Generate E-Invoice"
6. Verify mock IRN and acknowledgement details are stored
7. Test "View E-Invoice Details"
8. Test "Cancel E-Invoice"
9. Verify cancellation status

## Notes

- Currently uses simulated API responses for testing
- Production deployment requires actual GSP integration
- E-Invoice cancellation has a 24-hour window from generation
- IRN is unique and cannot be reused
- Signed QR code is mandatory for invoice printing

## Support

For issues or questions:
1. Check validation errors in the dialog
2. Verify GSTIN and HSN codes are set
3. Check browser console for detailed error logs
4. Refer to GST e-Invoice documentation
