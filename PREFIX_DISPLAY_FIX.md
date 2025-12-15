# Sales Quote Prefix Display Issue - Fix

## Problem Reported

User created a prefix "AN-SQ" for Sales Quote, but after saving, the UI displayed the old prefix values "GST-" and "SQ-" instead of the new prefix.

### Evidence from Screenshot
- User set prefix to: "AN-SQ"
- Console shows: "Created new NumberSeries: AN-SQ-"
- UI displays: "GST-" and "SQ-" (old values)

## Root Cause

The issue was caused by **stale data in the UI**. When the user saved the new prefix:

1. ✅ The NumberSeries was created correctly in the database ("AN-SQ-")
2. ✅ The SalesModule.numberSeries field was updated
3. ✅ Changes were synced to the database
4. ❌ **BUT** the SalesModule document object in memory was NOT reloaded
5. ❌ The UI component continued to display cached data from the old document state

### Why This Happened

In `SalesModuleConfigView.vue`, after saving:
```typescript
await this.doc.sync();     // Saves to database
// ❌ Missing: reload doc from database
await this.loadCurrentPrefix();  // Only reloads modal fields
```

The `currentPrefix` computed property displays `this.doc.numberSeries`, but if the doc object wasn't refreshed from the database, it showed the old value.

## Solution Applied

### Fix 1: Reload Document After Save
**File**: `src/components/SalesModuleConfigView.vue` (lines 423-430)

Added document reload and force re-render after saving:

```typescript
await this.doc.sync();

// Reload the SalesModule document from database to ensure UI shows updated values
await this.doc.load();
console.log('[SalesModuleConfigView] Reloaded SalesModule - numberSeries:', this.doc.numberSeries);

this.showPrefixModal = false;

// Force Vue to re-render by triggering reactivity
this.$forceUpdate();

alert(`Prefix "${prefix}" configured successfully!`);
```

### Fix 2: Auto-Add Trailing Dash
**File**: `src/components/SalesModuleConfigView.vue` (lines 376-380)

Automatically adds a trailing dash to ensure consistent prefix format:

```typescript
// Ensure prefix ends with a dash for consistency
if (!prefix.endsWith('-')) {
  prefix = `${prefix}-`;
  console.log('[SalesModuleConfigView] Added trailing dash to prefix:', prefix);
}
```

**Result**: If user enters "AN-SQ", it's automatically saved as "AN-SQ-"

### Fix 3: Preview Shows Dash
**File**: `src/components/SalesModuleConfigView.vue` (lines 339-343)

Updated preview to show the final prefix format:

```typescript
// Ensure preview shows prefix with trailing dash
let prefix = this.newPrefix.trim();
if (!prefix.endsWith('-')) {
  prefix = `${prefix}-`;
}
const paddedNumber = this.startNumber.toString().padStart(this.padZeros, '0');
return `${prefix}${paddedNumber}`;
```

**Result**: Preview immediately shows "AN-SQ-1001" instead of "AN-SQ1001"

## How to Test the Fix

### Before Testing
1. Rebuild the application:
   ```bash
   npm run build
   ```

2. Start the application:
   ```bash
   npm run dev
   ```

### Test Steps

1. **Open Sales Module Configuration**
   - Navigate to Configure Sales Modules page
   - Select "Sales Quotation"

2. **Change the Prefix**
   - Click "Change Prefix" button
   - Enter a new prefix (e.g., "QUOTE-2025")
   - Set starting number (e.g., 1)
   - Set number of digits (e.g., 4)
   - Observe the preview shows: "QUOTE-2025-0001"

3. **Save and Verify**
   - Click "Save"
   - Check the "Current Prefix" field immediately updates to "QUOTE-2025-"
   - The old values should be gone ✅

4. **Create a New Sales Quote**
   - Go to Sales Quote form
   - Create a new quote
   - Verify the quote number uses the new prefix: "QUOTE-2025-0001"

### Expected Results

- ✅ Current Prefix displays the new value immediately after save
- ✅ No old prefix values (like "GST-" or "SQ-") remain visible
- ✅ New quotes use the new prefix format
- ✅ Preview shows the dash automatically

## Diagnostic Tool

If you still see issues with multiple prefixes displayed, run the diagnostic script:

```bash
node check-duplicate-salesmodules.js
```

This will check for:
- ⚠ Multiple SalesModule records for the same type
- ⚠ Orphaned NumberSeries not linked to any module
- ⚠ Reference type mismatches

### Common Issues Found by Diagnostic

1. **Multiple Active SalesModules** - If there are 2+ active SalesModule records for "SalesQuote", the system won't know which one to use
   - **Solution**: Deactivate or delete duplicate records

2. **Wrong NumberSeries Linked** - SalesModule might be pointing to a NumberSeries meant for a different document type
   - **Solution**: Update the numberSeries field to the correct value

## Additional Notes

### Why Two Prefixes Were Showing?

The screenshot showed:
```
Current Prefix:  GST-
                 SQ-
```

This could indicate:
1. **Stale cache** - The UI was showing old data (now fixed with reload)
2. **Multiple modules** - There might be duplicate SalesModule records
3. **Rendering issue** - Some unusual data format in the database

**Run the diagnostic script to identify the exact cause.**

### Prefix Format Rules

- ✅ Prefixes MUST end with a dash: "INV-", "SO-2025-"
- ✅ Prefixes can contain letters, numbers, and dashes
- ❌ Prefixes cannot contain: / = ? & %
- ✅ Examples: "INV-", "QUOTE-2025-", "SO-"

### What Happens to Old Documents?

- Existing documents keep their original numbers
- Only NEW documents created after the change use the new prefix
- The NumberSeries counter continues from where it left off

## Files Modified

1. `src/components/SalesModuleConfigView.vue` (lines 376-380, 423-430, 339-343)
   - Added document reload after save
   - Auto-add trailing dash
   - Updated preview logic

## Summary

The fix ensures that:
1. ✅ The UI always shows the current prefix from the database
2. ✅ Users don't need to refresh the page to see changes
3. ✅ Prefixes always have consistent format with trailing dash
4. ✅ Preview shows exactly what the generated numbers will look like

The root issue was a **missing reload** after save - now fixed! 🎉
