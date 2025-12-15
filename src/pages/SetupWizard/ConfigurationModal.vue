<template>
  <Modal :open-modal="openModal" @closemodal="$emit('closemodal')">
    <div class="config-modal">
      <div class="config-header">
        <h2 class="config-title">Configuration</h2>
      </div>
      <div class="config-content">
        <div
          v-for="(option, index) in configOptions"
          :key="index"
          class="config-option"
        >
          <span class="option-label">{{ option.label }}</span>
          <span class="option-separator">:</span>
          <button
            class="option-value"
            :class="{ active: option.value }"
            @click="toggleOption(index)"
          >
            {{ option.value ? 'Yes' : 'No' }}
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Modal from 'src/components/Modal.vue';

export default defineComponent({
  name: 'ConfigurationModal',
  components: {
    Modal,
  },
  props: {
    openModal: {
      type: Boolean,
      default: false,
    },
    initialConfig: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['closemodal', 'update-config'],
  data() {
    return {
      configOptions: [
        {
          label: 'Provide Contact Details',
          value: true,
          key: 'provideContactDetails',
        },
        {
          label: 'Provide Base Currency details',
          value: true,
          key: 'provideBaseCurrencyDetails',
        },
        {
          label: 'Enable Edit Log',
          value: false,
          key: 'enableEditLog',
        },
        {
          label: 'Enable GST',
          value: false,
          key: 'enableGST',
        },
        {
          label: 'Enable VAT',
          value: false,
          key: 'enableVAT',
        },
        {
          label: 'Enable TDS',
          value: false,
          key: 'enableTDS',
        },
      ],
    };
  },
  watch: {
    openModal(newValue: boolean) {
      // Reinitialize when modal opens
      if (newValue && this.initialConfig && Object.keys(this.initialConfig).length > 0) {
        this.configOptions.forEach((option) => {
          if (this.initialConfig[option.key] !== undefined) {
            option.value = this.initialConfig[option.key];
          }
        });
      }
    },
  },
  mounted() {
    // Initialize with saved config values if available
    if (this.initialConfig && Object.keys(this.initialConfig).length > 0) {
      this.configOptions.forEach((option) => {
        if (this.initialConfig[option.key] !== undefined) {
          option.value = this.initialConfig[option.key];
        }
      });
    }
  },
  methods: {
    toggleOption(index: number) {
      this.configOptions[index].value = !this.configOptions[index].value;
      this.$emit('update-config', this.configOptions);
    },
  },
});
</script>

<style scoped>
.config-modal {
  width: 600px;
  max-width: 90vw;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.config-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.config-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.config-content {
  padding: 16px;
}

.config-option {
  display: flex;
  align-items: center;
  padding: 6px 0;
  gap: 8px;
}

.option-label {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.option-separator {
  color: #666;
  font-size: 13px;
}

.option-value {
  min-width: 50px;
  padding: 3px 10px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #333;
  background: white;
  color: #333;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}

.option-value.active {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #333;
}

.option-value:hover {
  background: #f9fafb;
}

.option-value.active:hover {
  background: #fde68a;
}

/* Dark mode support */
.dark .config-modal {
  background: #1f2937;
}

.dark .config-header {
  border-bottom-color: #374151;
}

.dark .config-title {
  color: #f9fafb;
}

.dark .option-label {
  color: #e5e7eb;
}

.dark .option-separator {
  color: #9ca3af;
}

.dark .option-value {
  background: #374151;
  color: #e5e7eb;
  border-color: #4b5563;
}

.dark .option-value.active {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #333;
}

.dark .option-value:hover {
  background: #4b5563;
}

.dark .option-value.active:hover {
  background: #fde68a;
}
</style>
