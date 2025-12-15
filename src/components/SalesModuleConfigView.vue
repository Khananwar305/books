<template>
  <div class="config-container">
    <div class="config-sections">
      <!-- General Section -->
      <div class="config-section">
        <h2 class="section-header">General</h2>
        <div class="config-items">
          <div class="config-item">
            <span class="config-label">Method of Voucher Numbering</span>
            <span class="config-separator">:</span>
            <select
              class="config-input config-select"
              :value="doc.numberingMethod || 'Automatic'"
              @change="updateField('numberingMethod', $event.target.value)"
            >
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          <div v-if="doc.numberingMethod === 'Automatic'" class="config-item">
            <span class="config-label">Use Prefix</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.usePrefix !== false"
              @change="updateField('usePrefix', $event.target.checked)"
            />
          </div>

          <div v-if="doc.numberingMethod === 'Automatic' && doc.usePrefix !== false" class="config-item highlight-item">
            <span class="config-label">Current Prefix</span>
            <span class="config-separator">:</span>
            <div class="prefix-display">
              <span class="prefix-value">{{ currentPrefix }}</span>
              <button class="change-prefix-btn" @click="openPrefixModal" type="button">
                Change Prefix
              </button>
            </div>
          </div>

          <div v-if="doc.numberingMethod === 'Automatic' && doc.usePrefix !== false" class="config-item">
            <span class="config-label"></span>
            <span class="config-separator"></span>
            <div class="prefix-note">
              💡 You can change the prefix as many times as you want
            </div>
          </div>

          <div class="config-item">
            <span class="config-label">Numbering behaviour on insertion/deletion</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.retainOriginalNumber"
              @change="updateField('retainOriginalNumber', $event.target.checked)"
            />
            <span class="config-checkbox-label">Retain Original Voucher No.</span>
          </div>

          <div class="config-item">
            <span class="config-label">Show unused vch nos. in transactions</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.showUnusedNumbers"
              @change="updateField('showUnusedNumbers', $event.target.checked)"
            />
          </div>

          <div class="config-item">
            <span class="config-label">Use effective dates for vouchers</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.useEffectiveDates"
              @change="updateField('useEffectiveDates', $event.target.checked)"
            />
          </div>

          <div class="config-item">
            <span class="config-label">Enable Discount</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.enableDiscounting"
              @change="updateField('enableDiscounting', $event.target.checked)"
            />
          </div>

          <div class="config-item">
            <span class="config-label">Allow zero-valued transactions</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.allowZeroValuedTransactions"
              @change="updateField('allowZeroValuedTransactions', $event.target.checked)"
            />
          </div>

          <div class="config-item">
            <span class="config-label">Make this voucher type as 'Optional' by default</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.makeOptionalByDefault"
              @change="updateField('makeOptionalByDefault', $event.target.checked)"
            />
          </div>

          <div class="config-item">
            <span class="config-label">Allow narration in voucher</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.allowNarration"
              @change="updateField('allowNarration', $event.target.checked)"
            />
          </div>

          <div class="config-item">
            <span class="config-label">Provide narrations for each ledger in voucher</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.provideNarrationForEachLedger"
              @change="updateField('provideNarrationForEachLedger', $event.target.checked)"
            />
          </div>

          <div class="config-item separator-line"></div>

          <div class="config-item">
            <span class="config-label">Enable default accounting allocations</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.enableDefaultAccountingAllocations"
              @change="updateField('enableDefaultAccountingAllocations', $event.target.checked)"
            />
          </div>

          <div class="config-item">
            <span class="config-label">WhatsApp voucher after saving</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.whatsAppAfterSaving"
              @change="updateField('whatsAppAfterSaving', $event.target.checked)"
            />
          </div>
        </div>
      </div>

      <!-- Printing Section -->
      <div class="config-section">
        <h2 class="section-header">Printing</h2>
        <div class="config-items">
          <div class="config-item">
            <span class="config-label">Print voucher after saving</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.printAfterSaving"
              @change="updateField('printAfterSaving', $event.target.checked)"
            />
          </div>

          <div class="config-item separator-line"></div>

          <div class="config-item">
            <span class="config-label">Use for POS invoicing</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.useForPOSInvoicing"
              @change="updateField('useForPOSInvoicing', $event.target.checked)"
            />
          </div>

          <div class="config-item">
            <span class="config-label">Default title to print</span>
            <span class="config-separator">:</span>
            <input
              type="text"
              class="config-input config-text"
              :value="doc.defaultTitleToPrint || ''"
              @input="updateField('defaultTitleToPrint', $event.target.value)"
              placeholder="e.g., Invoice, Bill, Receipt"
            />
          </div>

          <div class="config-item">
            <span class="config-label">Default bank</span>
            <span class="config-separator">:</span>
            <input
              type="text"
              class="config-input config-text"
              :value="doc.defaultBank || ''"
              @input="updateField('defaultBank', $event.target.value)"
              placeholder="Select account"
            />
          </div>

          <div class="config-item">
            <span class="config-label">Default jurisdiction</span>
            <span class="config-separator">:</span>
            <input
              type="text"
              class="config-input config-text"
              :value="doc.defaultJurisdiction || ''"
              @input="updateField('defaultJurisdiction', $event.target.value)"
            />
          </div>

          <div class="config-item">
            <span class="config-label">Set/alter declaration</span>
            <span class="config-separator">:</span>
            <input
              type="checkbox"
              class="config-checkbox"
              :checked="doc.setAlterDeclaration"
              @change="updateField('setAlterDeclaration', $event.target.checked)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Prefix Configuration Modal -->
    <div v-if="showPrefixModal" class="modal-overlay" @click="closePrefixModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>Configure Voucher Prefix</h2>
          <button class="modal-close" @click="closePrefixModal">×</button>
        </div>

        <div class="modal-body">
          <div class="prefix-help">
            💡 <strong>Change the prefix below:</strong> Delete the current text and type your new prefix (e.g., ABC, QUOTE-2025, etc.)
          </div>

          <div class="field-row">
            <label>Prefix</label>
            <span class="field-separator">:</span>
            <input
              ref="prefixInput"
              type="text"
              class="field-input prefix-input-highlight"
              :value="newPrefix"
              :key="'prefix-input-' + modalKey"
              placeholder="e.g., SINV, INV-2025, ABC"
              :disabled="false"
              :readonly="false"
              @focus="onPrefixInputFocus"
              @input="onPrefixInputChange"
              @keydown="onPrefixInputKeydown"
              @click="onPrefixInputClick"
            />
          </div>

          <div class="field-row">
            <label>Starting Number</label>
            <span class="field-separator">:</span>
            <input
              type="number"
              class="field-input"
              v-model.number="startNumber"
              min="1"
            />
          </div>

          <div class="field-row">
            <label>Number of Digits</label>
            <span class="field-separator">:</span>
            <input
              type="number"
              class="field-input"
              v-model.number="padZeros"
              min="1"
              max="10"
            />
          </div>

          <div class="preview-section">
            <div class="preview-label">Preview:</div>
            <div class="preview-value">{{ prefixPreview }}</div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closePrefixModal">Cancel</button>
          <button class="btn-save" @click="savePrefix">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Doc } from 'fyo/model/doc';

export default defineComponent({
  name: 'SalesModuleConfigView',
  props: {
    doc: {
      type: Object as PropType<Doc>,
      required: true,
    },
  },
  data() {
    return {
      showPrefixModal: false,
      newPrefix: '',
      startNumber: 1001,
      padZeros: 4,
      modalKey: 0, // Increment this to force input recreation
    };
  },
  async mounted() {
    await this.loadCurrentPrefix();
  },
  computed: {
    currentPrefix() {
      const numberSeriesName = this.doc.numberSeries as string;
      if (numberSeriesName) {
        return numberSeriesName;
      }
      const refType = this.doc.referenceType as string;
      const prefixMap: Record<string, string> = {
        'SalesInvoice': 'SINV-',
        'SalesQuote': 'SQ-',
        'SalesOrder': 'SO-',
        'PurchaseInvoice': 'PINV-',
        'Payment': 'PAY-',
        'JournalEntry': 'JE-',
        'StockMovement': 'SM-',
        'Shipment': 'SHP-',
      };
      return prefixMap[refType] || 'NS-';
    },
    prefixPreview() {
      if (!this.newPrefix) {
        return 'Enter a prefix to see preview';
      }
      // Ensure preview shows prefix with trailing dash
      let prefix = this.newPrefix.trim();
      if (!prefix.endsWith('-')) {
        prefix = `${prefix}-`;
      }
      const paddedNumber = this.startNumber.toString().padStart(this.padZeros, '0');
      return `${prefix}${paddedNumber}`;
    },
  },
  methods: {
    async loadCurrentPrefix() {
      try {
        console.log('[SalesModuleConfigView.loadCurrentPrefix] Starting...');
        const numberSeriesName = this.doc.numberSeries as string;
        console.log('[SalesModuleConfigView.loadCurrentPrefix] numberSeriesName:', numberSeriesName);

        if (numberSeriesName) {
          console.log('[SalesModuleConfigView.loadCurrentPrefix] Loading NumberSeries doc:', numberSeriesName);
          const numberSeriesDoc = await this.doc.fyo.doc.getDoc('NumberSeries', numberSeriesName);
          console.log('[SalesModuleConfigView.loadCurrentPrefix] NumberSeries loaded:', {
            name: numberSeriesDoc.name,
            start: numberSeriesDoc.start,
            padZeros: numberSeriesDoc.padZeros,
            current: numberSeriesDoc.current
          });

          this.newPrefix = numberSeriesDoc.name as string;
          this.startNumber = (numberSeriesDoc.start as number) || 1001;
          this.padZeros = (numberSeriesDoc.padZeros as number) || 4;

          console.log('[SalesModuleConfigView.loadCurrentPrefix] Modal form populated:', {
            newPrefix: this.newPrefix,
            startNumber: this.startNumber,
            padZeros: this.padZeros
          });
        } else {
          console.log('[SalesModuleConfigView.loadCurrentPrefix] No numberSeries, using fallback');
          this.newPrefix = this.currentPrefix;
          this.startNumber = (this.doc.start as number) || 1001;
          this.padZeros = (this.doc.padZeros as number) || 4;
        }
      } catch (error) {
        console.error('[SalesModuleConfigView.loadCurrentPrefix] ❌ Error:', error);
        console.error('[SalesModuleConfigView.loadCurrentPrefix] Error stack:', error.stack);
        throw error; // Re-throw so openPrefixModal can handle it
      }
    },
    async openPrefixModal() {
      console.log('[SalesModuleConfigView] Opening prefix modal (unlimited changes allowed)...');
      console.log('[SalesModuleConfigView] Current doc.numberSeries:', this.doc.numberSeries);

      try {
        // INCREMENT MODAL KEY to force Vue to recreate input elements
        this.modalKey++;
        console.log('[SalesModuleConfigView] Incremented modalKey to:', this.modalKey);

        // FORCE RESET all modal data to ensure clean state
        this.newPrefix = '';
        this.startNumber = 1;
        this.padZeros = 4;
        console.log('[SalesModuleConfigView] Reset modal data fields');

        // Reset any flags that might block changes
        this.doc._abbreviationChanged = false;

        // Load current values from the database (fresh data)
        await this.doc.load();
        console.log('[SalesModuleConfigView] Reloaded doc from database');

        await this.loadCurrentPrefix();
        console.log('[SalesModuleConfigView] Loaded prefix values - newPrefix:', this.newPrefix, 'start:', this.startNumber, 'padZeros:', this.padZeros);

        // Use nextTick to ensure Vue has updated the DOM
        await this.$nextTick();
        console.log('[SalesModuleConfigView] Vue DOM updated');

        this.showPrefixModal = true;
        console.log('[SalesModuleConfigView] ✅ Modal opened successfully');

        // Force focus on the input after modal opens
        await this.$nextTick();
        const input = document.querySelector('.prefix-input-highlight') as HTMLInputElement;
        if (input) {
          console.log('[SalesModuleConfigView] Found input element');
          console.log('[SalesModuleConfigView] Input initial state:', {
            disabled: input.disabled,
            readOnly: input.readOnly,
            value: input.value
          });

          // FORCE input to be editable
          input.disabled = false;
          input.readOnly = false;
          input.contentEditable = 'true';

          console.log('[SalesModuleConfigView] Forcing input to be editable...');
          console.log('[SalesModuleConfigView] Input state after force:', {
            disabled: input.disabled,
            readOnly: input.readOnly,
            contentEditable: input.contentEditable
          });

          // Focus and select
          input.focus();
          input.select();

          console.log('[SalesModuleConfigView] Input focused and text selected');
        } else {
          console.error('[SalesModuleConfigView] ❌ Input element not found!');
        }
      } catch (error) {
        console.error('[SalesModuleConfigView] ❌ Error opening modal:', error);
        alert(`Error opening prefix modal: ${error.message}`);
      }
    },
    closePrefixModal() {
      this.showPrefixModal = false;
    },
    onPrefixInputFocus(event: FocusEvent) {
      console.log('[SalesModuleConfigView] Prefix input focused');
      console.log('[SalesModuleConfigView] Input element:', event.target);
      console.log('[SalesModuleConfigView] Current value:', this.newPrefix);

      // Select all text when focused
      const input = event.target as HTMLInputElement;
      input.select();

      console.log('[SalesModuleConfigView] Text selected, ready for editing');
    },
    onPrefixInputChange(event: Event) {
      const input = event.target as HTMLInputElement;
      console.log('[SalesModuleConfigView] 📝 Input event fired! Value:', input.value);
      console.log('[SalesModuleConfigView] newPrefix BEFORE update:', this.newPrefix);

      // CRITICAL: Update data directly
      this.newPrefix = input.value;

      console.log('[SalesModuleConfigView] newPrefix AFTER update:', this.newPrefix);
      console.log('[SalesModuleConfigView] Input state:', {
        disabled: input.disabled,
        readOnly: input.readOnly,
        value: input.value,
        selectionStart: input.selectionStart,
        selectionEnd: input.selectionEnd
      });

      // Force the input to stay editable
      input.disabled = false;
      input.readOnly = false;
    },
    onPrefixInputKeydown(event: KeyboardEvent) {
      console.log('[SalesModuleConfigView] ⌨️  Key pressed:', event.key);
      const input = event.target as HTMLInputElement;
      console.log('[SalesModuleConfigView] Input value before key:', input.value);
      console.log('[SalesModuleConfigView] Input is editable:', !input.disabled && !input.readOnly);
    },
    onPrefixInputClick(event: MouseEvent) {
      console.log('[SalesModuleConfigView] Prefix input clicked');
      const input = event.target as HTMLInputElement;
      console.log('[SalesModuleConfigView] Input is editable:', !input.disabled && !input.readOnly);
    },
    async savePrefix() {
      try {
        let prefix = this.newPrefix.trim();
        if (!prefix) {
          alert('Please enter a prefix');
          return;
        }

        // Ensure prefix ends with a dash for consistency
        if (!prefix.endsWith('-')) {
          prefix = `${prefix}-`;
          console.log('[SalesModuleConfigView] Added trailing dash to prefix:', prefix);
        }

        const referenceType = this.doc.referenceType as string;
        const currentNumberSeries = this.doc.numberSeries as string;

        // Check if we're changing to a different prefix or just updating settings
        const isChangingPrefix = currentNumberSeries !== prefix;

        console.log('[SalesModuleConfigView] Prefix comparison:', {
          current: currentNumberSeries,
          new: prefix,
          isChanging: isChangingPrefix
        });

        if (isChangingPrefix) {
          console.log('[SalesModuleConfigView] 🔄 CHANGING PREFIX from', currentNumberSeries, 'to', prefix);
          // Changing to a different prefix - create or update NumberSeries with new name
          const existingNumberSeries = await this.doc.fyo.db.exists('NumberSeries', prefix);

          if (existingNumberSeries) {
            // Prefix already exists - update it
            const numberSeriesDoc = await this.doc.fyo.doc.getDoc('NumberSeries', prefix);
            await numberSeriesDoc.set('start', this.startNumber);
            await numberSeriesDoc.set('padZeros', this.padZeros);
            await numberSeriesDoc.set('referenceType', referenceType);
            await numberSeriesDoc.sync();
            console.log('[SalesModuleConfigView] Updated existing NumberSeries:', prefix);
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
            console.log('[SalesModuleConfigView] Created new NumberSeries:', prefix);
          }

          // Update SalesModule to point to the new NumberSeries
          console.log('[SalesModuleConfigView] Setting numberSeries from', currentNumberSeries, 'to', prefix);
        } else {
          console.log('[SalesModuleConfigView] ⚙️  KEEPING SAME PREFIX, just updating settings');
          // Same prefix - just update the existing NumberSeries settings
          const numberSeriesDoc = await this.doc.fyo.doc.getDoc('NumberSeries', prefix);
          await numberSeriesDoc.set('start', this.startNumber);
          await numberSeriesDoc.set('padZeros', this.padZeros);
          await numberSeriesDoc.sync();
          console.log('[SalesModuleConfigView] Updated NumberSeries settings (start, padZeros) for:', prefix);
        }

        // CRITICAL FIX: The set() method is not working for the hidden numberSeries field
        // We need to update the database directly using fyo.db.update()

        console.log('[SalesModuleConfigView] Attempting direct database update...');
        console.log('[SalesModuleConfigView] SalesModule name:', this.doc.name);
        console.log('[SalesModuleConfigView] New values - numberSeries:', prefix, 'start:', this.startNumber, 'padZeros:', this.padZeros);

        // Update using database directly (bypasses Doc model restrictions on hidden fields)
        await this.doc.fyo.db.update('SalesModule', {
          name: this.doc.name as string,
          modified: new Date().toISOString(),
          numberSeries: prefix,
          start: this.startNumber,
          padZeros: this.padZeros,
        });

        console.log('[SalesModuleConfigView] Database updated directly');

        // Verify the update worked
        const dbValue = await this.doc.fyo.db.get('SalesModule', this.doc.name as string);
        console.log('[SalesModuleConfigView] Database record after update:', dbValue);

        // Reload the document to sync with database
        await this.doc.load();
        console.log('[SalesModuleConfigView] After reload - numberSeries:', this.doc.numberSeries, 'start:', this.doc.start, 'padZeros:', this.doc.padZeros);

        // Close modal
        this.showPrefixModal = false;

        // Force Vue to re-render by triggering reactivity
        this.$forceUpdate();

        // Reset any state that might block future changes
        this.doc._abbreviationChanged = false;

        console.log('[SalesModuleConfigView] ✅ SUCCESS! Prefix configured successfully:', prefix);
        console.log('[SalesModuleConfigView] 🔓 State reset - ready for next prefix change');
        alert(`✅ Prefix "${prefix}" configured successfully!\n\nNew documents will use: ${this.prefixPreview}\n\n💡 You can change the prefix again anytime!`);
      } catch (error) {
        console.error('[SalesModuleConfigView] ❌ ERROR saving prefix:', error);
        console.error('[SalesModuleConfigView] Error stack:', error.stack);
        alert(`❌ Error: ${error.message || 'Failed to save prefix'}\n\nCheck console for details.`);
        // Don't close modal on error so user can try again
      }
    },
    async updateField(fieldname: string, value: any) {
      try {
        await this.doc.set(fieldname, value);
      } catch (error) {
        console.error('Error updating field:', error);
      }
    },
  },
});
</script>

<style scoped>
.config-container {
  width: 100%;
  background: white;
  border: 1px solid #e5e7eb;
  font-family: monospace;
}

.config-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-top: 2px solid #1f2937;
}

.config-section {
  border-right: 1px solid #e5e7eb;
  min-height: 400px;
}

.config-section:last-child {
  border-right: none;
}

.section-header {
  font-size: 16px;
  font-weight: bold;
  padding: 12px 16px;
  margin: 0;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.config-items {
  padding: 16px;
}

.config-item {
  display: grid;
  grid-template-columns: 3fr auto 2fr;
  gap: 12px;
  padding: 8px 0;
  align-items: start;
  min-height: 32px;
}

.config-item.separator-line {
  border-bottom: 1px solid #e5e7eb;
  margin: 8px 0;
  padding: 0;
  min-height: 1px;
}

.config-label {
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
}

.config-separator {
  color: #6b7280;
  font-weight: bold;
}

/* Input styles */
.config-input {
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-family: inherit;
}

.config-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.config-select {
  cursor: pointer;
  font-weight: 500;
  padding-right: 24px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  appearance: none;
}

.config-text {
  width: 100%;
  max-width: 250px;
}

.config-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.config-checkbox-label {
  font-size: 13px;
  color: #374151;
  margin-left: 8px;
}

/* Prefix Configuration Styles */
.highlight-item {
  background: #eff6ff;
  border: 1px solid #93c5fd;
  border-radius: 4px;
  padding: 12px 8px !important;
  margin: 8px 0 !important;
}

.prefix-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.prefix-value {
  font-size: 14px;
  font-weight: bold;
  color: #1f2937;
  font-family: monospace;
  padding: 4px 12px;
  background: white;
  border-radius: 3px;
  border: 1px solid #d1d5db;
}

.change-prefix-btn {
  padding: 4px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.change-prefix-btn:hover {
  background: #2563eb;
}

.prefix-note {
  font-size: 12px;
  color: #059669;
  font-style: italic;
  padding: 4px 0;
  font-weight: 500;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: auto !important;
}

.modal-container {
  background: white;
  width: 500px;
  max-height: 90vh;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto !important;
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #1f2937;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.prefix-help {
  background: #eff6ff;
  border: 2px solid #3b82f6;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 13px;
  line-height: 1.5;
  color: #1e40af;
}

.prefix-help strong {
  color: #1e3a8a;
  font-weight: 600;
}

.prefix-input-highlight {
  border: 2px solid #3b82f6 !important;
  background: #fffbeb !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  cursor: text !important;
  pointer-events: auto !important;
  user-select: text !important;
  -webkit-user-select: text !important;
}

.prefix-input-highlight:focus {
  border-color: #2563eb !important;
  background: #fff !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
  cursor: text !important;
}

.field-row {
  display: grid;
  grid-template-columns: 150px auto 1fr;
  gap: 12px;
  padding: 12px 0;
  align-items: center;
}

.field-row label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.field-separator {
  color: #6b7280;
  font-weight: bold;
}

.field-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  width: 100%;
}

.field-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.preview-section {
  margin-top: 24px;
  padding: 16px;
  background: #eff6ff;
  border: 2px solid #3b82f6;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.preview-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.preview-value {
  font-size: 16px;
  font-weight: bold;
  color: #2563eb;
  font-family: monospace;
  padding: 6px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #93c5fd;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f9fafb;
}

.btn-cancel,
.btn-save {
  padding: 8px 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-cancel {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-cancel:hover {
  background: #f3f4f6;
}

.btn-save {
  background: #3b82f6;
  color: white;
}

.btn-save:hover {
  background: #2563eb;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .config-container {
    background: #1f2937;
    border-color: #374151;
  }

  .section-header {
    background: #111827;
    border-color: #374151;
    color: #f9fafb;
  }

  .config-section {
    border-color: #374151;
  }

  .config-label {
    color: #d1d5db;
  }

  .config-separator {
    color: #9ca3af;
  }

  .config-item.separator-line {
    border-color: #374151;
  }

  .config-input {
    background: #374151;
    border-color: #4b5563;
    color: #f3f4f6;
  }

  .config-input:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
  }

  .config-checkbox-label {
    color: #d1d5db;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .config-sections {
    grid-template-columns: 1fr;
  }

  .config-section {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .config-section:last-child {
    border-bottom: none;
  }
}
</style>
