<template>
  <div class="flex flex-col h-full">
    <PageHeader :title="t`Configure Modules`" />

    <div class="modules-container">
      <!-- Sales Modules Section -->
      <div class="module-section">
        <div class="section-header">
          <div class="section-icon-wrapper sales-icon">
            <feather-icon name="shopping-cart" class="section-icon" />
          </div>
          <h2 class="section-title">{{ t`Sales Modules` }}</h2>
        </div>

        <div class="module-list">
          <div
            v-for="module in salesModules"
            :key="module.value"
            class="module-item"
            @click="navigateToModule(module)"
          >
            {{ module.label }}
          </div>
        </div>
      </div>

      <!-- Purchase Modules Section -->
      <div class="module-section">
        <div class="section-header">
          <div class="section-icon-wrapper purchase-icon">
            <feather-icon name="shopping-bag" class="section-icon" />
          </div>
          <h2 class="section-title">{{ t`Purchase Module` }}</h2>
        </div>

        <div class="module-list">
          <div
            v-for="module in purchaseModules"
            :key="module.value"
            class="module-item"
            @click="navigateToModule(module)"
          >
            {{ module.label }}
          </div>
        </div>
      </div>

      <!-- Other Modules Section -->
      <div class="module-section">
        <div class="section-header">
          <div class="section-icon-wrapper other-icon">
            <feather-icon name="file-text" class="section-icon" />
          </div>
          <h2 class="section-title">{{ t`Other Modules` }}</h2>
        </div>

        <div class="module-list">
          <div
            v-for="module in otherModules"
            :key="module.value"
            class="module-item"
            @click="navigateToModule(module)"
          >
            {{ module.label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { defineComponent } from 'vue';
import PageHeader from 'src/components/PageHeader.vue';
import { routeTo } from 'src/utils/ui';
import { fyo } from 'src/initFyo';

interface ModuleOption {
  label: string;
  value: string;
}

export default defineComponent({
  name: 'ConfigureSalesModules',
  components: {
    PageHeader,
  },
  data() {
    return {
      salesModules: [
        { label: t`Sales Quotes`, value: 'SalesQuote' },
        { label: t`Sales Invoices`, value: 'SalesInvoice' },
        { label: t`Sales Orders`, value: 'SalesOrder' },
      ] as ModuleOption[],
      purchaseModules: [
        { label: t`Purchase Invoices`, value: 'PurchaseInvoice' },
      ] as ModuleOption[],
      otherModules: [
        { label: t`Payments`, value: 'Payment' },
        { label: t`Journal Entries`, value: 'JournalEntry' },
        { label: t`Stock Movements`, value: 'StockMovement' },
        { label: t`Shipments`, value: 'Shipment' },
      ] as ModuleOption[],
      showDebugButton: false,
    };
  },
  async mounted() {
    // Listen for Ctrl+Shift+D to show debug button
    window.addEventListener('keydown', this.handleKeyPress);

    // Log all existing SalesModule records on page load for debugging
    try {
      const allRecords = await fyo.db.getAllRaw('SalesModule', {
        fields: ['name', 'referenceType', 'abbreviation'],
      });
      console.log('[ConfigureSalesModules] ALL SalesModule records in database:', allRecords);
    } catch (error) {
      console.log('[ConfigureSalesModules] No SalesModule records found or table does not exist yet');
    }
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress);
  },
  methods: {
    handleKeyPress(event: KeyboardEvent) {
      // Ctrl+Shift+D to toggle debug button
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        this.showDebugButton = !this.showDebugButton;
        console.log('[ConfigureSalesModules] Debug button toggled:', this.showDebugButton);
      }
    },
    async deleteAllAndRefresh() {
      try {
        console.log('[ConfigureSalesModules] Deleting all SalesModule records...');

        // Get all SalesModule records
        const allRecords = await fyo.db.getAllRaw('SalesModule', {
          fields: ['name'],
        });

        console.log('[ConfigureSalesModules] Found records to delete:', allRecords);

        if (!allRecords || allRecords.length === 0) {
          alert('No SalesModule records found to delete.');
          return;
        }

        // Delete each one
        for (const record of allRecords) {
          try {
            const doc = await fyo.doc.getDoc('SalesModule', record.name);
            await doc.delete();
            console.log('[ConfigureSalesModules] Deleted:', record.name);
          } catch (error) {
            console.error('[ConfigureSalesModules] Error deleting record:', record.name, error);
          }
        }

        alert(`Deleted ${allRecords.length} SalesModule record(s). The page will now refresh.`);
        window.location.reload();
      } catch (error) {
        console.error('[ConfigureSalesModules] Error in deleteAllAndRefresh:', error);
        alert('Error deleting configurations: ' + error.message);
      }
    },
    async resetAllConfigs() {
      if (!confirm('This will delete ALL SalesModule configurations. Are you sure?')) {
        return;
      }

      try {
        console.log('[ConfigureSalesModules] Resetting all SalesModule configs...');

        // Get all SalesModule records
        const allConfigs = await fyo.db.getAllRaw('SalesModule', {
          fields: ['name'],
        });

        console.log('[ConfigureSalesModules] Found configs to delete:', allConfigs);

        // Delete each one
        for (const config of allConfigs) {
          const doc = await fyo.doc.getDoc('SalesModule', config.name);
          await doc.delete();
          console.log('[ConfigureSalesModules] Deleted:', config.name);
        }

        alert('All SalesModule configurations have been reset. Please refresh the page.');
        this.showDebugButton = false;
      } catch (error) {
        console.error('[ConfigureSalesModules] Error resetting configs:', error);
        alert('Error resetting configurations: ' + error.message);
      }
    },
    async navigateToModule(module: ModuleOption) {
      console.log('[ConfigureSalesModules] Navigating to module:', module.label, 'value:', module.value);

      // Expected name based on referenceType
      const nameMap: Record<string, string> = {
        'SalesInvoice': 'Sales Invoice',
        'SalesQuote': 'Sales Quotation',
        'SalesOrder': 'Sales Order',
        'PurchaseInvoice': 'Purchase Invoice',
        'Payment': 'Payment',
        'JournalEntry': 'Journal Entry',
        'StockMovement': 'Stock Movement',
        'Shipment': 'Shipment',
      };
      const expectedName = nameMap[module.value] || module.value;
      console.log('[ConfigureSalesModules] Expected record name:', expectedName);

      // Check if a record with the correct name and referenceType exists
      const recordExists = await fyo.db.exists('SalesModule', expectedName);
      console.log('[ConfigureSalesModules] Record exists:', recordExists);

      if (recordExists) {
        // Verify the record has the correct referenceType
        const doc = await fyo.doc.getDoc('SalesModule', expectedName);
        const actualReferenceType = doc.referenceType as string;

        if (actualReferenceType !== module.value) {
          console.log('[ConfigureSalesModules] Wrong referenceType, deleting:', expectedName);
          await doc.delete();
        } else {
          // Record is correct, navigate to it
          console.log('[ConfigureSalesModules] Record is correct, navigating to:', expectedName);
          routeTo({ path: `/edit/SalesModule/${expectedName}` });
          return;
        }
      }

      // Record doesn't exist or was deleted - create it
      console.log('[ConfigureSalesModules] Creating new record');
      try {
        const newDoc = fyo.doc.getNewDoc('SalesModule', {
          name: expectedName,
          referenceType: module.value,
        });

        await newDoc.sync();
        console.log('[ConfigureSalesModules] Created:', expectedName);

        // Navigate to the newly created record
        routeTo({ path: `/edit/SalesModule/${expectedName}` });
      } catch (error) {
        console.error('[ConfigureSalesModules] Error creating record:', error);
        alert('Error creating configuration: ' + error.message);
      }
    },
  },
});
</script>

<style scoped>
.modules-container {
  padding: 2rem 1.5rem;
  max-width: 1400px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.module-section {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f3f4f6;
}

.section-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.sales-icon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.purchase-icon {
  background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%);
}

.other-icon {
  background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);
}

.section-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #374151;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.module-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.module-item {
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9375rem;
  color: #374151;
}

.module-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  transform: translateX(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Dark mode support */
.dark .module-section {
  background: #1f2937;
  border-color: #374151;
}

.dark .section-header {
  border-bottom-color: #374151;
}

.dark .section-title {
  color: #f9fafb;
}

.dark .module-item {
  background: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

.dark .module-item:hover {
  background: #4b5563;
  border-color: #6b7280;
}
</style>
