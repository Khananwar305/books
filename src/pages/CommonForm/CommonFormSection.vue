<template>
  <div v-if="(fields ?? []).length > 0">
    <div
      v-if="showTitle && title"
      class="flex justify-between items-center select-none"
      :class="[collapsed ? '' : 'mb-2', collapsible ? 'cursor-pointer' : '']"
      @click="toggleCollapsed"
    >
      <h2 class="text-base text-gray-900 dark:text-gray-25 font-semibold">
        {{ title }}
      </h2>
      <feather-icon
        v-if="collapsible"
        :name="collapsed ? 'chevron-up' : 'chevron-down'"
        class="w-4 h-4 text-gray-600 dark:text-gray-400"
      />
    </div>
    <div
      v-if="!collapsed"
      class="grid gap-2 gap-x-8"
      :class="isSalesInvoiceTopFields ? 'grid-cols-3' : 'grid-cols-2'"
    >
      <div
        v-for="field of fields"
        :key="field.fieldname"
        :data-fieldname="field.fieldname"
        :class="[
          field.fieldtype === 'Table' ? (isSalesInvoiceTopFields ? 'col-span-3' : 'col-span-2') + ' text-base' : '',
          field.fieldtype === 'AttachImage' ? 'row-span-2' : '',
          field.fieldtype === 'Check' ? 'mt-auto' : 'mb-auto',
          getSalesInvoiceFieldSpan(field.fieldname),
        ]"
      >
        <Table
          v-if="field.fieldtype === 'Table'"
          ref="fields"
          :show-label="true"
          :border="true"
          :df="field"
          :value="tableValue(doc[field.fieldname])"
          @editrow="(doc: Doc) => $emit('editrow', doc)"
          @change="(value: DocValue) => $emit('value-change', field, value)"
          @row-change="(field:Field, value:DocValue, parentfield:Field) => $emit('row-change',field, value, parentfield)"
        />
        <FormControl
          v-else
          :ref="field.fieldname === 'name' ? 'nameField' : 'fields'"
          :size="field.fieldtype === 'AttachImage' ? 'form' : undefined"
          :show-label="true"
          :border="true"
          :df="field"
          :value="doc[field.fieldname]"
          @editrow="(doc: Doc) => $emit('editrow', doc)"
          @change="(value: DocValue) => $emit('value-change', field, value)"
          @row-change="(field:Field, value:DocValue, parentfield:Field) => $emit('row-change',field, value, parentfield)"
        />
        <div v-if="errors?.[field.fieldname]" class="text-sm text-red-600 mt-1">
          {{ errors[field.fieldname] }}
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { Field } from 'schemas/types';
import FormControl from 'src/components/Controls/FormControl.vue';
import Table from 'src/components/Controls/Table.vue';
import { focusOrSelectFormControl } from 'src/utils/ui';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  components: { FormControl, Table },
  props: {
    title: { type: String, default: '' },
    errors: {
      type: Object as PropType<Record<string, string>>,
      required: true,
    },
    showTitle: Boolean,
    doc: { type: Object as PropType<Doc>, required: true },
    collapsible: { type: Boolean, default: true },
    fields: { type: Array as PropType<Field[]>, required: true },
  },
  emits: ['editrow', 'value-change', 'row-change'],
  data() {
    return { collapsed: false } as {
      collapsed: boolean;
    };
  },
  computed: {
    isSalesInvoiceTopFields(): boolean {
      // Check if this is the Sales Invoice form and this section contains the top fields
      if (this.$route.path.includes('SalesInvoice')) {
        const fieldNames = this.fields.map(f => f.fieldname);
        return fieldNames.includes('name') && fieldNames.includes('date');
      }
      return false;
    },
  },
  mounted() {
    focusOrSelectFormControl(this.doc, this.$refs.nameField);
  },
  methods: {
    tableValue(value: unknown): unknown[] {
      if (Array.isArray(value)) {
        return value;
      }

      return [];
    },
    toggleCollapsed() {
      if (!this.collapsible) {
        return;
      }

      this.collapsed = !this.collapsed;
    },
    getSalesInvoiceFieldSpan(fieldname: string): string {
      // For Sales Invoice, make certain fields span appropriately in 3-column layout
      if (this.isSalesInvoiceTopFields) {
        // First row fields (name, date, quote) - each takes 1 column
        if (['name', 'date', 'quote'].includes(fieldname)) {
          return '';
        }
        // Second row fields and beyond - span across columns as needed
        if (['party', 'account'].includes(fieldname)) {
          return 'col-span-1';
        }
        if (fieldname === 'priceList') {
          return 'col-span-1';
        }
      }
      return '';
    },
  },
});
</script>
<style scoped>
/* Make invoice number field slightly wider */
[data-fieldname="name"] {
  max-width: 280px !important;
  width: 280px !important;
}

/* Make reference field same size as invoice number */
[data-fieldname="quote"] {
  max-width: 280px !important;
  width: 280px !important;
}

/* Make customer field narrower and add space above it */
[data-fieldname="party"] {
  max-width: 300px !important;
  width: 300px !important;
  margin-top: 12px !important;
}

/* Add space above account field to match customer field */
[data-fieldname="account"] {
  margin-top: 12px !important;
}

/* Add space above priceList field to match other fields in the row */
[data-fieldname="priceList"] {
  margin-top: 12px !important;
}

/* Make date field narrower */
[data-fieldname="date"] {
  max-width: 200px !important;
  width: 200px !important;
}
</style>
