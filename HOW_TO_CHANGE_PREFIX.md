# How to Change Sales Quotation Prefix

## Quick Guide

### Step 1: Open Configuration
1. Go to **Configure Sales Modules**
2. Select **Sales Quotation** (or Sales Order/Sales Invoice)
3. Look for the **"Current Prefix"** section

### Step 2: Click "Change Prefix" Button
- A modal will appear titled "Configure Voucher Prefix"
- You'll see a blue help message at the top

### Step 3: Change the Prefix Text ⚠️ IMPORTANT!

**The current prefix will be shown in the input field (e.g., "TM-")**

To change it to something else:
1. **Click in the Prefix input field** (it will auto-select all text)
2. **Type your new prefix** - for example:
   - Type `ABC` → becomes `ABC-`
   - Type `QUOTE-2025` → becomes `QUOTE-2025-`
   - Type `SQ` → becomes `SQ-`

**⚠️ IMPORTANT:** If you don't change the text and just click Save, it will only update the starting number/padding for the SAME prefix!

### Step 4: Adjust Other Settings (Optional)
- **Starting Number**: The number to start from (default: 1)
- **Number of Digits**: How many digits to pad (default: 4)

### Step 5: Preview
- Look at the **Preview** section
- It shows what your generated numbers will look like
- Example: `ABC-0001`, `QUOTE-2025-0001`, etc.

### Step 6: Save
- Click **Save** button
- You'll see: ✅ Success message
- The "Current Prefix" field updates immediately

## Examples

### Example 1: Change from TM to ABC
**Current:** TM-0001, TM-0002, TM-0003
1. Click "Change Prefix"
2. Change text from `TM-` to `ABC`
3. Set Starting Number: 1
4. Preview shows: `ABC-0001`
5. Click Save
**Result:** New quotes will be ABC-0001, ABC-0002, ABC-0003

### Example 2: Use Year-Based Prefix
**Current:** TM-0001
1. Click "Change Prefix"
2. Change text to `QUOTE-2025`
3. Set Starting Number: 1
4. Set Number of Digits: 4
5. Preview shows: `QUOTE-2025-0001`
6. Click Save
**Result:** QUOTE-2025-0001, QUOTE-2025-0002, etc.

### Example 3: Just Change Starting Number (Keep Same Prefix)
**Current:** TM-0005
1. Click "Change Prefix"
2. **DON'T change the prefix text** (leave as `TM-`)
3. Change Starting Number to: 100
4. Preview shows: `TM-0100`
5. Click Save
**Result:** Next quote will be TM-0100, TM-0101, etc.

## Understanding the Logs

When you click Save, watch the browser console:

### If Changing to a Different Prefix:
```
[SalesModuleConfigView] Prefix comparison: {current: 'TM-', new: 'ABC-', isChanging: true}
[SalesModuleConfigView] 🔄 CHANGING PREFIX from TM- to ABC-
[SalesModuleConfigView] Created new NumberSeries: ABC-
[SalesModuleConfigView] ✅ SUCCESS! Prefix configured successfully: ABC-
```

### If Keeping Same Prefix (Just Updating Settings):
```
[SalesModuleConfigView] Prefix comparison: {current: 'TM-', new: 'TM-', isChanging: false}
[SalesModuleConfigView] ⚙️ KEEPING SAME PREFIX, just updating settings
[SalesModuleConfigView] Updated NumberSeries settings (start, padZeros) for: TM-
[SalesModuleConfigView] ✅ SUCCESS! Prefix configured successfully: TM-
```

## Common Mistakes

### ❌ Mistake 1: Not Changing the Prefix Text
**Problem:** You click "Change Prefix", then click Save without editing the prefix text
**Result:** System just updates the settings, doesn't change the prefix
**Solution:** Actually TYPE a new prefix in the input field!

### ❌ Mistake 2: Thinking the Dash is Added Automatically in Display
**Problem:** You see `TM-` in the field and think you need to remove the dash
**Result:** You might delete it, but it gets re-added automatically
**Solution:** Just type the prefix without the dash (e.g., `ABC`), the system adds it

### ❌ Mistake 3: Not Seeing the Change Immediately
**Problem:** After saving, the UI doesn't update
**Result:** You think it didn't work
**Solution:** Check the console logs - if you see ✅ SUCCESS, it worked! Refresh the page if needed.

## Troubleshooting

### Issue: Modal won't open
- Check browser console for errors
- Refresh the page and try again

### Issue: Can't edit the prefix text
- Click directly in the input field
- The text should auto-select
- If not, triple-click to select all, then type

### Issue: Same prefix shows after saving
- Check the console - did you see `isChanging: false`?
- This means you didn't actually change the prefix text
- Try again and make sure to TYPE a different prefix

### Issue: Error when saving
- Check console for the full error message
- Share the error with your developer

## Technical Notes

- The prefix is stored in the `NumberSeries` table
- The SalesModule.numberSeries field points to the NumberSeries.name
- A dash is automatically added to the end of every prefix
- Old documents keep their original numbers
- New documents use the new prefix starting from the specified number

## Need Help?

If you're still having issues:
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Click "Change Prefix" and try to save
4. Copy ALL the log messages
5. Share them with your developer

Look for these specific logs:
- `[SalesModuleConfigView] Prefix comparison:`
- `[SalesModuleConfigView] 🔄 CHANGING PREFIX` or `⚙️ KEEPING SAME PREFIX`
- `[SalesModuleConfigView] ✅ SUCCESS` or `❌ ERROR`
