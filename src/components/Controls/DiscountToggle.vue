<template>
  <div class="w-full">
    <FormControl
      :size="size"
      :df="currentDf"
      :value="currentValue"
      :border="false"
      :show-label="false"
      :container-styles="{ padding: '0', width: '100%' }"
      @change="onValueChange"
    />
  </div>
</template>

<script lang="ts">
import { DocValue } from 'fyo/core/types';
import { Field } from 'schemas/types';
import FormControl from './FormControl.vue';
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'DiscountToggle',
  components: { FormControl },
  provide() {
    return {
      doc: computed(() => this.doc),
    };
  },
  props: {
    doc: { type: Object, required: true },
    size: { type: String, default: 'small' },
  },
  computed: {
    isAmountMode(): boolean {
      return !!this.doc.setItemDiscountAmount;
    },
    currentValue(): DocValue {
      if (this.isAmountMode) {
        const val = this.doc.itemDiscountAmount;
        return val || this.doc.fyo.pesa(0);
      }
      return this.doc.itemDiscountPercent || 0;
    },
    currentDf(): Field {
      if (this.isAmountMode) {
        return {
          fieldname: 'itemDiscountAmount',
          label: 'Discount',
          fieldtype: 'Currency',
          placeholder: 'Amount',
          readOnly: false,
          required: false,
        } as Field;
      }
      return {
        fieldname: 'itemDiscountPercent',
        label: 'Discount',
        fieldtype: 'Float',
        placeholder: '%',
        readOnly: false,
        required: false,
      } as Field;
    },
  },
  methods: {
    async onValueChange(value: DocValue) {
      try {
        if (this.isAmountMode) {
          await this.doc.set('itemDiscountAmount', value);
        } else {
          await this.doc.set('itemDiscountPercent', value);
        }
      } catch (error) {
        console.error('Error setting discount value:', error);
      }
    },
  },
});
</script>
