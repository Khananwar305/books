# Test: Unlimited Prefix Changes

## Purpose
Verify that users can change the Sales Quotation prefix as many times as they want, without any limits.

## Test Scenario

### Initial State
- SalesModule for Sales Quotation exists
- Current prefix: `TM-`

### Test Steps: Change Prefix 5 Times

#### Change 1: TM → ABC
1. Open Configure Sales Modules → Sales Quotation
2. Click "Change Prefix"
3. Change prefix from `TM-` to `ABC`
4. Click Save
5. **Expected**: Success message, prefix changes to `ABC-`
6. **Check logs for**: `🔄 CHANGING PREFIX from TM- to ABC-`

#### Change 2: ABC → XYZ
1. Click "Change Prefix" again
2. Change prefix from `ABC-` to `XYZ`
3. Click Save
4. **Expected**: Success message, prefix changes to `XYZ-`
5. **Check logs for**: `🔄 CHANGING PREFIX from ABC- to XYZ-`

#### Change 3: XYZ → QUOTE-2025
1. Click "Change Prefix" again
2. Change prefix from `XYZ-` to `QUOTE-2025`
3. Click Save
4. **Expected**: Success message, prefix changes to `QUOTE-2025-`
5. **Check logs for**: `🔄 CHANGING PREFIX from XYZ- to QUOTE-2025-`

#### Change 4: QUOTE-2025 → SQ
1. Click "Change Prefix" again
2. Change prefix from `QUOTE-2025-` to `SQ`
3. Click Save
4. **Expected**: Success message, prefix changes to `SQ-`
5. **Check logs for**: `🔄 CHANGING PREFIX from QUOTE-2025- to SQ-`

#### Change 5: SQ → FINAL
1. Click "Change Prefix" again
2. Change prefix from `SQ-` to `FINAL`
3. Click Save
4. **Expected**: Success message, prefix changes to `FINAL-`
5. **Check logs for**: `🔄 CHANGING PREFIX from SQ- to FINAL-`

## Expected Results

### ✅ Success Criteria
- [ ] All 5 prefix changes succeed
- [ ] No error messages
- [ ] Each change shows in console: `🔄 CHANGING PREFIX from X to Y`
- [ ] Each change shows: `✅ SUCCESS! Prefix configured successfully`
- [ ] Each change shows: `🔓 State reset - ready for next prefix change`
- [ ] Modal opens successfully every time
- [ ] "Current Prefix" field updates after each save
- [ ] Success alert says "You can change the prefix again anytime!"

### ❌ Failure Indicators
- Modal won't open after N changes
- Save button doesn't work after N changes
- Error message appears
- Console shows errors
- Prefix doesn't update in UI
- Database value doesn't change

## Key Logs to Watch

### When Opening Modal (Should happen every time):
```
[SalesModuleConfigView] Opening prefix modal (unlimited changes allowed)...
[SalesModuleConfigView] Current doc.numberSeries: [current-prefix]
[SalesModuleConfigView] Reloaded doc from database
[SalesModuleConfigView.loadCurrentPrefix] Starting...
[SalesModuleConfigView.loadCurrentPrefix] NumberSeries loaded: {...}
[SalesModuleConfigView] ✅ Modal opened successfully
```

### When Saving (Should succeed every time):
```
[SalesModuleConfigView] Prefix comparison: {current: 'X-', new: 'Y-', isChanging: true}
[SalesModuleConfigView] 🔄 CHANGING PREFIX from X- to Y-
[SalesModuleConfigView] Created new NumberSeries: Y-
[SalesModuleConfigView] Attempting direct database update...
[SalesModuleConfigView] Database updated directly
[SalesModuleConfigView] After reload - numberSeries: Y-
[SalesModuleConfigView] ✅ SUCCESS! Prefix configured successfully: Y-
[SalesModuleConfigView] 🔓 State reset - ready for next prefix change
```

## Code Changes to Enable Unlimited Changes

### 1. Reset Flags on Modal Open
```typescript
async openPrefixModal() {
  // Reset any flags that might block changes
  this.doc._abbreviationChanged = false;

  // Load fresh data from database
  await this.doc.load();

  await this.loadCurrentPrefix();
  this.showPrefixModal = true;
}
```

### 2. Reset State After Save
```typescript
async savePrefix() {
  // ... save logic ...

  // Reset any state that might block future changes
  this.doc._abbreviationChanged = false;

  console.log('🔓 State reset - ready for next prefix change');
}
```

### 3. Direct Database Update
- Bypasses Doc model restrictions
- Uses `fyo.db.update()` directly
- Ensures numberSeries field always updates

## Database Verification

After each change, verify in database:

```sql
-- Check SalesModule
SELECT name, referenceType, numberSeries, start, padZeros
FROM SalesModule
WHERE referenceType = 'SalesQuote';

-- Check NumberSeries
SELECT name, referenceType, start, padZeros, current
FROM NumberSeries
WHERE referenceType = 'SalesQuote'
ORDER BY created DESC;
```

Expected after 5 changes:
- SalesModule.numberSeries = 'FINAL-'
- 5 NumberSeries records (one for each prefix used)
- Latest NumberSeries has name = 'FINAL-'

## Troubleshooting

### If Modal Won't Open After N Changes

**Check console for:**
```
[SalesModuleConfigView] ❌ Error opening modal: ...
```

**Possible causes:**
- Document failed to load
- NumberSeries not found
- Vue component state corrupted

**Solution:**
- Refresh the page
- Check that doc.load() succeeds
- Verify NumberSeries exists in database

### If Save Fails After N Changes

**Check console for:**
```
[SalesModuleConfigView] ❌ ERROR saving prefix: ...
```

**Possible causes:**
- Database update failed
- NumberSeries creation failed
- Validation error

**Solution:**
- Check database connection
- Verify no duplicate NumberSeries names
- Check for database locks

### If Prefix Doesn't Update in UI

**Check console for:**
```
[SalesModuleConfigView] After reload - numberSeries: ???
```

**If it shows old value:**
- Database update might have failed
- Load might have failed
- Check database directly

## Performance Note

Creating many NumberSeries records is normal and expected:
- Each prefix change creates a new NumberSeries
- Old NumberSeries records are kept for historical documents
- This allows documents with old prefixes to continue working

After 100 prefix changes, you'll have:
- 1 SalesModule record (pointing to latest prefix)
- 100 NumberSeries records (one for each prefix ever used)
- Old quotes still reference their original NumberSeries

This is intentional and correct behavior!

## Summary

**NO LIMITS** - The system allows unlimited prefix changes by:
1. ✅ Resetting blocking flags on modal open
2. ✅ Loading fresh data each time
3. ✅ Using direct database updates
4. ✅ Resetting state after each save
5. ✅ Creating new NumberSeries for each unique prefix

**Users can change the prefix as many times as they want! 🎉**
