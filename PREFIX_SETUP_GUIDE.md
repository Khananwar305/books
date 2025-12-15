# Sales Invoice Prefix Setup Guide

## Overview
This guide explains how to set up custom prefixes for automatic invoice numbering in Viti Books.

## How It Works

When you create a custom prefix (e.g., "INV-2025-"), all new sales invoices will automatically use that prefix followed by a number:
- First invoice: `INV-2025-1001`
- Second invoice: `INV-2025-1002`
- Third invoice: `INV-2025-1003`
- And so on...

## Step-by-Step Setup

### Method 1: Through Settings Menu

1. **Open Configure Sales Modules**
   - Go to Setup → Configure Sales Modules (if available in your sidebar)
   - OR navigate to `/configure-sales-modules` in your app

2. **Select Sales Invoices**
   - Click on "Sales Invoices" in the Sales section
   - This will open the configuration page

3. **Set to Automatic Mode**
   - Ensure "Method of Voucher Numbering" is set to **Automatic**

4. **Create Custom Prefix**
   - Find "Create Set/Alter Additional Numbering Detail"
   - Change it from "No" to **"Yes"**
   - A modal will open

5. **Enter Your Prefix**
   - In the "Prefix Details" section, enter your desired prefix
   - Examples:
     - `INV-2025-` (for Invoice 2025)
     - `EXPORT-` (for Export invoices)
     - `WS-` (for Wholesale)
     - `SI-` (Simple prefix)

6. **Configure Numbers** (Optional)
   - Starting Number: Choose where numbering starts (default: 1001)
   - Width of Numerical Part: How many digits (default: 4)
   - Example: Width 4 means 0001, 0002, 0003...

7. **Preview and Save**
   - Check the preview to see what your invoice numbers will look like
   - Click **"Save"**

8. **Verify**
   - You should see a success message
   - The main configuration page should now show your custom prefix

### Method 2: Direct Database Patch (Automatic)

The system will automatically create a default SalesModule configuration on startup with the prefix `SINV-Default`. You can then customize it using Method 1.

## Creating Sales Invoices

Once the prefix is configured:

1. **Create a New Sales Invoice**
   - Go to Sales Invoices → New

2. **Invoice Number is Auto-Generated**
   - In Automatic mode, the "Invoice No" field is read-only
   - The number is generated when you save the invoice
   - It will use your custom prefix

3. **Save the Invoice**
   - Fill in customer details and items
   - Click "Save"
   - The invoice number will be automatically assigned using your prefix

## Troubleshooting

### Invoice number doesn't use my prefix

1. **Check if SalesModule exists:**
   - Go to Configure Sales Modules → Sales Invoices
   - If it says "No configuration found", the default hasn't been created yet

2. **Verify Automatic Mode:**
   - Make sure "Method of Voucher Numbering" is set to "Automatic"
   - In Manual mode, you must enter the invoice number yourself

3. **Check NumberSeries is linked:**
   - Open browser console (F12)
   - Look for logs when creating an invoice
   - Should see: `[SalesInvoice beforeSync] NumberSeries name: <your-prefix>`

4. **Reload the app:**
   - Close and reopen Viti Books
   - The database patch should run automatically

### I want to change my prefix

1. Open Configure Sales Modules → Sales Invoices
2. Open "Create Set/Alter Additional Numbering Detail" modal
3. Enter a NEW prefix
4. Save
5. All future invoices will use the new prefix
6. Existing invoices keep their old numbers

### I want multiple prefix types

You can create multiple SalesModule configurations:
1. Go to SalesModule list view
2. Create new SalesModule for SalesInvoice
3. Set different prefix for each
4. Activate/deactivate as needed

## Examples

### Example 1: Year-based Prefix
- Prefix: `INV-2025-`
- Starting Number: 1001
- Width: 4
- Result: `INV-2025-1001`, `INV-2025-1002`, ...

### Example 2: Department Prefix
- Prefix: `EXPORT-`
- Starting Number: 1
- Width: 5
- Result: `EXPORT-00001`, `EXPORT-00002`, ...

### Example 3: Simple Prefix
- Prefix: `SI-`
- Starting Number: 1000
- Width: 3
- Result: `SI-1000`, `SI-1001`, `SI-1002`, ...

## Technical Details

### Database Structure
- **SalesModule**: Configuration for document numbering
  - `name`: Configuration name
  - `referenceType`: Document type (e.g., SalesInvoice)
  - `numberingMethod`: Automatic or Manual
  - `numberSeries`: Link to NumberSeries (the prefix)

- **NumberSeries**: Defines the prefix and numbering
  - `name`: The actual prefix (e.g., "INV-2025-")
  - `start`: Starting number
  - `current`: Current number (auto-incremented)
  - `padZeros`: Number of digits

### Code Flow
1. User saves invoice → `SalesInvoice.beforeSync()` is called
2. Loads active `SalesModule` for SalesInvoice
3. Gets linked `NumberSeries`
4. Calls `NumberSeries.next()` to generate next number
5. Sets `invoice.name` to generated number
6. Saves invoice with the number

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify database has SalesModule and NumberSeries entries
3. Check that the patch has run (look for console log: `[Patch] Creating default SalesModule configurations...`)
