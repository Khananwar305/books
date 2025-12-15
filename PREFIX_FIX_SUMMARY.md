# Sales Module Prefix Editing Fix

## Problem Summary

The prefix function was not working properly in all three sales sub-modules (Sales Order, Sales Invoice, and Sales Quotation). Users were unable to edit the prefix properly through the Sales Module configuration interface.

## Root Causes

### Issue 1: NumberSeries Read-Only Fields
**File**: `fyo/models/NumberSeries.ts`

The NumberSeries model had read-only restrictions on the `start` and `padZeros` fields after the record was first created:

```typescript
readOnly: ReadOnlyMap = {
  referenceType: () => this.inserted,
  padZeros: () => this.inserted,      // ❌ Couldn't edit after creation
  start: () => this.inserted,         // ❌ Couldn't edit after creation
};
```

This meant that once a NumberSeries was created, users could not change the starting number or padding settings, even though the UI allowed them to try.

### Issue 2: SalesModuleConfigView Update Logic
**File**: `src/components/SalesModuleConfigView.vue`

The UI component attempted to update the read-only fields when users clicked "Save" in the prefix configuration modal:

```typescript
// This code would fail silently because fields were read-only
await numberSeriesDoc.set('start', this.startNumber);      // ❌ Failed
await numberSeriesDoc.set('padZeros', this.padZeros);      // ❌ Failed
await numberSeriesDoc.set('referenceType', referenceType); // ❌ Failed
```

## Solutions Implemented

### Fix 1: Removed Read-Only Restrictions
**File**: `fyo/models/NumberSeries.ts` (lines 151-155)

Removed the read-only restrictions on `start` and `padZeros` fields to allow post-creation editing:

```typescript
readOnly: ReadOnlyMap = {
  referenceType: () => this.inserted,
  // Allow editing padZeros and start even after insertion
  // This enables users to update number series configuration via SalesModule
};
```

**Why**: Users need to be able to adjust the starting number and padding settings as their business needs change. Only `referenceType` should remain read-only to prevent changing which document type a NumberSeries is associated with.

### Fix 2: Improved Prefix Update Logic
**File**: `src/components/SalesModuleConfigView.vue` (lines 368-433)

Enhanced the `savePrefix()` function to properly handle both prefix changes and settings updates:

```typescript
async savePrefix() {
  const currentNumberSeries = this.doc.numberSeries as string;
  const isChangingPrefix = currentNumberSeries !== prefix;

  if (isChangingPrefix) {
    // Changing to a different prefix - create or update NumberSeries
    if (existingNumberSeries) {
      // Update existing NumberSeries with new settings
      const numberSeriesDoc = await this.doc.fyo.doc.getDoc('NumberSeries', prefix);
      await numberSeriesDoc.set('start', this.startNumber);
      await numberSeriesDoc.set('padZeros', this.padZeros);
      await numberSeriesDoc.set('referenceType', referenceType);
      await numberSeriesDoc.sync();
    } else {
      // Create new NumberSeries
      const numberSeriesDoc = this.doc.fyo.doc.getNewDoc('NumberSeries', {
        name: prefix,
        start: this.startNumber,
        padZeros: this.padZeros,
        referenceType: referenceType,
        current: this.startNumber,
      }, false);
      await numberSeriesDoc.sync();
    }
    // Update SalesModule to point to the new NumberSeries
    await this.doc.set('numberSeries', prefix);
  } else {
    // Same prefix - just update settings
    const numberSeriesDoc = await this.doc.fyo.doc.getDoc('NumberSeries', prefix);
    await numberSeriesDoc.set('start', this.startNumber);
    await numberSeriesDoc.set('padZeros', this.padZeros);
    await numberSeriesDoc.sync();
  }

  // Always update SalesModule settings
  await this.doc.set('start', this.startNumber);
  await this.doc.set('padZeros', this.padZeros);
  await this.doc.sync();
}
```

**Why**: This approach:
1. Detects whether the user is changing the prefix name or just updating settings
2. Creates a new NumberSeries if needed, or updates the existing one
3. Properly syncs all changes to both NumberSeries and SalesModule
4. Provides better error handling and user feedback

## How Prefix System Works

### Data Flow

1. **SalesModule** → stores configuration for a document type (e.g., Sales Order)
   - `referenceType`: Which document type (SalesOrder, SalesInvoice, SalesQuote)
   - `numberSeries`: Name of the linked NumberSeries (this IS the prefix, e.g., "SO-")
   - `abbreviation`: User-friendly abbreviation (used for initial setup)
   - `start`, `padZeros`: Copied from/synced with NumberSeries

2. **NumberSeries** → stores the actual numbering configuration
   - `name`: The prefix itself (e.g., "SO-", "INV-2025-")
   - `start`: Starting number (e.g., 1001)
   - `padZeros`: Number of digits to pad (e.g., 4)
   - `current`: Current counter value
   - `referenceType`: Which document type it's for

3. **Invoice/Order/Quote** → uses NumberSeries to generate document numbers
   - Looks up active SalesModule config
   - Gets the linked NumberSeries
   - Generates number like: "SO-1001", "INV-2025-0001"

### Example

If user configures:
- Prefix: `"INV-2025-"`
- Starting Number: `1001`
- Number of Digits: `4`

Generated invoice numbers will be:
- `INV-2025-1001`
- `INV-2025-1002`
- `INV-2025-1003`
- etc.

## Testing

Users can now:

1. **Open Sales Module Configuration**
   - Navigate to Configure Sales Modules page
   - Select a module (Sales Order, Sales Invoice, or Sales Quote)

2. **Edit Prefix Settings**
   - Click "Change Prefix" button
   - Modify the prefix text (e.g., change "SO-" to "ORDER-")
   - Update starting number
   - Change number of digits
   - See live preview of how numbers will look

3. **Save Changes**
   - Changes are properly saved to both NumberSeries and SalesModule
   - Existing documents retain their numbers
   - New documents use the updated prefix settings

## Impact

### Before Fix
- ❌ Users could not edit prefix settings after initial creation
- ❌ Attempts to change starting number or padding failed silently
- ❌ Had to manually edit database to change prefix configuration

### After Fix
- ✅ Users can freely edit prefix at any time
- ✅ Can change starting number and padding as needed
- ✅ Can switch to different prefix names
- ✅ Proper error handling and user feedback
- ✅ Works consistently across all three sales modules

## Files Modified

1. `fyo/models/NumberSeries.ts` - Removed read-only restrictions
2. `src/components/SalesModuleConfigView.vue` - Improved save logic
3. `test-prefix-edit.js` - Created test script (for validation)

## Notes

- The fix maintains backward compatibility - existing NumberSeries continue to work
- Only `referenceType` remains read-only to prevent associating a NumberSeries with wrong document type
- The `abbreviation` field in SalesModule is for initial setup convenience; the actual prefix is stored in NumberSeries.name
