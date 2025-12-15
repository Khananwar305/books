<template>
  <div v-if="tableFields?.length">
    <div v-if="showLabel" class="text-gray-600 dark:text-gray-400 text-sm mb-1">
      {{ df.label }}
    </div>

    <div :class="border ? 'border dark:border-gray-800 rounded-md' : ''">
      <!-- Title Row -->
      <Row
        :ratio="ratio"
        class="
          border-b
          dark:border-gray-800
          px-2
          text-gray-600
          dark:text-gray-400
          w-full
          flex
          items-center
          bg-gray-50
          dark:bg-gray-875
        "
      >
        <div class="flex items-center ps-2 border-r dark:border-gray-800 h-full font-semibold">#</div>
        <div
          v-for="df in tableFields"
          :key="df.fieldname"
          class="items-center flex px-2 h-row-mid border-r dark:border-gray-800 font-semibold relative"
          :class="{
            'ms-auto': isNumeric(df),
          }"
          :style="{
            height: ``,
          }"
        >
          {{ getFieldLabel(df) }}
          <button
            v-if="df.fieldname === 'itemDiscountPercent'"
            type="button"
            class="ml-1 w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            @click.stop="toggleDiscountMenu"
            title="Change discount type"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
          <!-- Dropdown Menu -->
          <div
            v-if="df.fieldname === 'itemDiscountPercent' && showDiscountMenu"
            class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow-lg z-50 min-w-[160px]"
            @click.stop
          >
            <button
              type="button"
              class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              :class="discountMode === 'percent' ? 'bg-blue-50 dark:bg-blue-900' : ''"
              @click="selectDiscountMode('percent')"
            >
              <span class="text-green-600 dark:text-green-400 font-bold">%</span>
              <span>Discount in %</span>
            </button>
            <button
              type="button"
              class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              :class="discountMode === 'amount' ? 'bg-blue-50 dark:bg-blue-900' : ''"
              @click="selectDiscountMode('amount')"
            >
              <span class="text-blue-600 dark:text-blue-400 font-bold">$</span>
              <span>Discount in AMT</span>
            </button>
          </div>
        </div>
      </Row>

      <!-- Data Rows -->
      <div
        v-if="value"
        class="overflow-auto custom-scroll custom-scroll-thumb1"
        :style="{ 'max-height': maxHeight }"
      >
        <TableRow
          v-for="(row, idx) of value"
          ref="table-row"
          :key="row.name"
          :class="idx < value.length - 1 ? 'border-b dark:border-gray-800' : ''"
          v-bind="{ row, tableFields, size, ratio, isNumeric }"
          :read-only="isReadOnly"
          :can-edit-row="canEditRow"
          @remove="removeRow(row)"
          @change="(field, value) => $emit('row-change', field, value, df)"
        />
      </div>

      <!-- Total Row -->
      <Row
        v-if="value && value.length > 0 && showTotalRow"
        :ratio="ratio"
        class="
          border-t-2
          dark:border-gray-700
          px-2
          text-gray-900
          dark:text-gray-100
          w-full
          flex
          items-center
          bg-gray-100
          dark:bg-gray-850
          font-semibold
        "
      >
        <div class="flex items-center ps-2 border-r dark:border-gray-800 h-full"></div>
        <div
          v-for="df in tableFields"
          :key="df.fieldname"
          class="flex px-2 h-row-mid border-r dark:border-gray-800"
          :class="{
            'justify-end': isNumeric(df),
            'justify-start': !isNumeric(df),
          }"
        >
          <span v-if="df.fieldname === 'item'">TOTAL</span>
          <span v-else-if="df.fieldname === 'quantity'">{{ formatNumber(columnTotals.quantity) }}</span>
          <span v-else-if="df.fieldname === 'amount'">{{ formatCurrency(columnTotals.amount) }}</span>
          <span v-else-if="df.fieldname === 'itemDiscountPercent' && discountMode === 'amount'">{{ formatCurrency(columnTotals.itemDiscountAmount) }}</span>
          <span v-else></span>
        </div>
      </Row>

      <!-- Add Row and Row Count -->
      <Row
        v-if="!isReadOnly"
        :ratio="ratio"
        class="
          text-gray-500
          cursor-pointer
          px-2
          w-full
          h-row-mid
          flex
          items-center
          focus:outline-none focus:ring-1 focus:ring-blue-500
        "
        :class="value.length > 0 ? 'border-t dark:border-gray-800' : ''"
        tabindex="0"
        @click="addRow"
        @keydown.enter="addRow"
      >
        <div class="flex items-center ps-1">
          <feather-icon name="plus" class="w-4 h-4 text-gray-500" />
        </div>
        <div
          class="flex justify-between px-2"
          :style="`grid-column: 2 / ${ratio.length + 1}`"
        >
          <p>
            {{ t`Add Row` }}
          </p>
          <p
            v-if="
              value &&
              maxRowsBeforeOverflow &&
              value.length > maxRowsBeforeOverflow
            "
            class="text-end px-2"
          >
            {{ t`${value.length} rows` }}
          </p>
        </div>
      </Row>
    </div>
  </div>
</template>

<script>
import Row from 'src/components/Row.vue';
import { fyo } from 'src/initFyo';
import { nextTick } from 'vue';
import Base from './Base.vue';
import TableRow from './TableRow.vue';

export default {
  name: 'Table',
  components: {
    Row,
    TableRow,
  },
  extends: Base,
  props: {
    value: { type: Array, default: () => [] },
    showHeader: {
      type: Boolean,
      default: true,
    },
    maxRowsBeforeOverflow: {
      type: Number,
      default: 3,
    },
    border: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['editrow', 'row-change'],
  data() {
    return {
      maxHeight: '',
      showDiscountMenu: false,
      discountMode: 'percent', // 'percent' or 'amount'
    };
  },
  async mounted() {
    // Load discount mode from SalesModule config
    await this.loadDiscountMode();
    // Close menu when clicking outside
    document.addEventListener('click', this.closeDiscountMenu);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeDiscountMenu);
  },
  computed: {
    showTotalRow() {
      // Show total row for invoice item tables (SalesInvoiceItem, etc.)
      return this.df.target?.includes('InvoiceItem') ||
             this.df.target?.includes('QuoteItem');
    },
    columnTotals() {
      if (!this.value || this.value.length === 0) {
        return { quantity: 0, amount: 0, itemDiscountAmount: 0 };
      }

      const totals = {
        quantity: 0,
        amount: 0,
        itemDiscountAmount: 0,
      };

      for (const row of this.value) {
        // Sum quantity
        if (row.quantity !== undefined && row.quantity !== null) {
          totals.quantity += Number(row.quantity) || 0;
        }

        // Sum amount (handle Money objects)
        if (row.amount !== undefined && row.amount !== null) {
          const amountValue = typeof row.amount === 'object' && row.amount.float !== undefined
            ? row.amount.float
            : Number(row.amount) || 0;
          totals.amount += amountValue;
        }

        // Sum discount amount (handle Money objects)
        if (row.itemDiscountAmount !== undefined && row.itemDiscountAmount !== null) {
          const discountValue = typeof row.itemDiscountAmount === 'object' && row.itemDiscountAmount.float !== undefined
            ? row.itemDiscountAmount.float
            : Number(row.itemDiscountAmount) || 0;
          totals.itemDiscountAmount += discountValue;
        }
      }

      return totals;
    },
    height() {
      if (this.size === 'small') {
      }
      return 2;
    },
    canEditRow() {
      return this.df.edit;
    },
    ratio() {
      // Custom column widths based on field type and name
      const fieldRatios = this.tableFields.map((field) => {
        // Customize widths for specific fields in invoice items
        switch (field.fieldname) {
          case 'item':
            return 1.5; // Wider for item names
          case 'description':
            return 2.0; // Increased width for text descriptions
          case 'hsnCode':
            return 0.85; // Compact width for 10-digit codes
          case 'setItemDiscountAmount':
            return 0.5; // Very narrow for checkbox toggle
          case 'itemDiscountPercent':
          case 'itemDiscountAmount':
            return 0.8; // Narrow width for discount values
          case 'tax':
            return 1.2; // Medium for tax
          case 'quantity':
          case 'transferQuantity':
            return 0.8; // Narrow for quantities
          case 'rate':
          case 'amount':
          case 'itemDiscountedTotal':
          case 'itemTaxedTotal':
            return 1.1; // Medium for currency values
          case 'unit':
          case 'transferUnit':
            return 0.8; // Narrow for units
          case 'batch':
            return 1; // Medium for batch
          default:
            return 1; // Default width
        }
      });

      const ratio = [0.3].concat(fieldRatios);

      if (this.canEditRow) {
        return ratio.concat(0.3);
      }

      return ratio;
    },
    tableFields() {
      const fields = fyo.schemaMap[this.df.target].tableFields ?? [];
      return fields.map((fieldname) => fyo.getField(this.df.target, fieldname));
    },
  },
  watch: {
    value() {
      this.setMaxHeight();
    },
  },

  methods: {
    focus() {},
    formatNumber(value) {
      // Format number with appropriate decimal places
      if (value === undefined || value === null) {
        return '0';
      }
      return Number(value).toFixed(2);
    },
    formatCurrency(value) {
      // Format currency value
      if (value === undefined || value === null) {
        return fyo.format(0, 'Currency');
      }
      return fyo.format(value, 'Currency');
    },
    getFieldLabel(df) {
      // Show dynamic label for discount field based on mode
      if (df.fieldname === 'itemDiscountPercent') {
        return this.discountMode === 'amount' ? 'Discount AMT' : 'Discount %';
      }
      return df.label;
    },
    async loadDiscountMode() {
      try {
        const parentDoc = this.doc;
        if (!parentDoc || !parentDoc.schemaName) {
          return;
        }

        const configs = await fyo.db.getAllRaw('SalesModule', {
          fields: ['discountType', 'isActive'],
          filters: { referenceType: parentDoc.schemaName },
        });

        if (configs && configs.length > 0) {
          const activeConfig = configs.find(c => c.isActive !== false) || configs[0];
          this.discountMode = activeConfig.discountType || 'percent';
        }
      } catch (error) {
        console.error('Error loading discount mode:', error);
      }
    },
    toggleDiscountMenu() {
      this.showDiscountMenu = !this.showDiscountMenu;
    },
    closeDiscountMenu() {
      this.showDiscountMenu = false;
    },
    async selectDiscountMode(mode) {
      this.discountMode = mode;
      this.showDiscountMenu = false;

      // Save the selection to SalesModule
      try {
        const parentDoc = this.doc;
        if (!parentDoc || !parentDoc.schemaName) {
          return;
        }

        const configs = await fyo.db.getAllRaw('SalesModule', {
          fields: ['name', 'isActive'],
          filters: { referenceType: parentDoc.schemaName },
        });

        if (configs && configs.length > 0) {
          const activeConfig = configs.find(c => c.isActive !== false) || configs[0];
          await fyo.db.update('SalesModule', {
            name: activeConfig.name,
            discountType: mode,
          });
        }

        // Update all rows to switch between percent and amount
        if (this.value && this.value.length > 0) {
          for (const row of this.value) {
            if (mode === 'percent') {
              await row.set('setItemDiscountAmount', false);
            } else {
              await row.set('setItemDiscountAmount', true);
            }
          }
        }
      } catch (error) {
        console.error('Error saving discount mode:', error);
      }
    },
    async addRow() {
      await this.doc.append(this.df.fieldname);

      // Set discount mode on the new row
      const newRow = this.value[this.value.length - 1];
      if (newRow && this.discountMode) {
        try {
          if (this.discountMode === 'amount') {
            await newRow.set('setItemDiscountAmount', true);
          } else {
            await newRow.set('setItemDiscountAmount', false);
          }
        } catch (error) {
          console.error('Error setting discount mode on new row:', error);
        }
      }

      await nextTick();
      this.scrollToRow(this.value.length - 1);
      this.triggerChange(this.value);
      this.$nextTick(() => {
        const rows = this.$refs['table-row'];
        if (rows && rows.length > 0) {
          const lastRow = rows[rows.length - 1];
          if (lastRow.focusFirstInput) {
            lastRow.focusFirstInput();
          }
        }
      });
    },
    removeRow(row) {
      this.doc.remove(this.df.fieldname, row.idx).then((s) => {
        if (!s) {
          return;
        }
        this.triggerChange(this.value);
      });
    },

    scrollToRow(index) {
      const row = this.$refs['table-row'][index];
      row && row.$el.scrollIntoView({ block: 'nearest' });
    },

    setMaxHeight() {
      if (this.maxRowsBeforeOverflow === 0) {
        return (this.maxHeight = '');
      }

      const size = this?.value?.length ?? 0;
      if (size === 0) {
        return (this.maxHeight = '');
      }

      const rowHeight = this.$refs?.['table-row']?.[0]?.$el.offsetHeight;
      if (rowHeight === undefined) {
        return (this.maxHeight = '');
      }

      const maxHeight = rowHeight * Math.min(this.maxRowsBeforeOverflow, size);
      return (this.maxHeight = `${maxHeight}px`);
    },
  },
};
</script>
