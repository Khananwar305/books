<template>
  <div class="setup-wizard-wrapper">
    <div class="configure-button-container">
      <button class="configure-button" @click="openConfigModal">Configure</button>
    </div>
    <ConfigurationModal
      :open-modal="showConfigModal"
      :initial-config="configSettings"
      @closemodal="closeConfigModal"
      @update-config="handleConfigUpdate"
    />
    <FormContainer
      :show-header="false"
      class="justify-content items-center h-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-875 setup-wizard-container"
      :class="{ 'window-drag': platform !== 'Windows' }"
    >
      <template #body>
      <FormHeader
        :form-title="t`Set up your organization`"
        class="
          sticky
          top-0
          bg-gradient-to-r from-blue-600 to-indigo-600
          dark:from-blue-800 dark:to-indigo-800
          text-white
          border-b
          border-blue-700
          dark:border-gray-800
          z-10
          flex-shrink-0
          !text-base
          !font-normal
        "
      >
      </FormHeader>

      <!-- Section Container -->
      <div
        v-if="hasDoc"
        class="overflow-y-auto overflow-x-hidden custom-scroll custom-scroll-thumb1 flex-1"
        style="max-height: 100%;"
      >
        <CommonFormSection
          v-for="([name, fields], idx) in activeGroup.entries()"
          :key="name + idx"
          ref="section"
          class="p-2"
          :class="
            idx !== 0 && activeGroup.size > 1
              ? 'border-t dark:border-gray-800'
              : ''
          "
          :show-title="activeGroup.size > 1 && name !== t`Default`"
          :title="name"
          :fields="fields"
          :doc="doc"
          :errors="errors"
          :collapsible="false"
          @value-change="onValueChange"
        />
      </div>

      <!-- Buttons Bar -->
      <div
        class="
          mt-auto
          p-4
          flex
          items-center
          justify-between
          border-t
          border-gray-200
          dark:border-gray-800
          flex-shrink-0
          sticky
          bottom-0
          bg-gray-50
          dark:bg-gray-890
          z-10
        "
      >
        <div v-if="loading" class="flex items-center gap-3">
          <div class="loading-spinner"></div>
          <div class="flex flex-col">
            <p class="text-base font-medium text-gray-700 dark:text-gray-300">
              {{ t`Setting up your organization...` }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-500">
              {{ t`This may take a moment. Please wait.` }}
            </p>
          </div>
        </div>
        <Button
          v-if="!loading"
          class="w-24 border dark:border-gray-800"
          @click="cancel"
          >{{ t`Cancel` }}</Button
        >
        <Button
          v-if="fyo.store.isDevelopment && !loading"
          class="w-24 ml-auto mr-4 border dark:border-gray-800"
          :disabled="loading"
          @click="fill"
          >{{ t`Fill` }}</Button
        >
        <Button
          type="primary"
          class="w-24"
          data-testid="submit-button"
          :disabled="!areAllValuesFilled || loading"
          @click="submit"
          >{{ t`Submit` }}</Button
        >
      </div>
    </template>
  </FormContainer>
  </div>
</template>
<script lang="ts">
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { Verb } from 'fyo/telemetry/types';
import { TranslationString } from 'fyo/utils/translation';
import { ModelNameEnum } from 'models/types';
import { Field } from 'schemas/types';
import Button from 'src/components/Button.vue';
import FormContainer from 'src/components/FormContainer.vue';
import FormHeader from 'src/components/FormHeader.vue';
import { getErrorMessage } from 'src/utils';
import { showDialog } from 'src/utils/interactive';
import { getSetupWizardDoc } from 'src/utils/misc';
import { getFieldsGroupedByTabAndSection } from 'src/utils/ui';
import { computed, defineComponent } from 'vue';
import CommonFormSection from '../CommonForm/CommonFormSection.vue';
import ConfigurationModal from './ConfigurationModal.vue';

export default defineComponent({
  name: 'SetupWizard',
  components: {
    Button,
    FormContainer,
    FormHeader,
    CommonFormSection,
    ConfigurationModal,
  },
  provide() {
    return {
      doc: computed(() => this.docOrNull),
    };
  },
  emits: ['setup-complete', 'setup-canceled'],
  data() {
    return {
      docOrNull: null,
      errors: {},
      loading: false,
      showConfigModal: false,
      configSettings: {},
    } as {
      errors: Record<string, string>;
      docOrNull: null | Doc;
      loading: boolean;
      showConfigModal: boolean;
      configSettings: Record<string, any>;
    };
  },
  computed: {
    hasDoc(): boolean {
      return this.docOrNull instanceof Doc;
    },
    doc(): Doc {
      if (this.docOrNull instanceof Doc) {
        return this.docOrNull;
      }

      throw new Error(`Doc is null`);
    },
    areAllValuesFilled(): boolean {
      if (!this.hasDoc) {
        return false;
      }

      // Company Name is mandatory even though not marked as required
      if (!this.doc.companyName) {
        return false;
      }

      const values = this.doc.schema.fields
        .filter((f) => f.required)
        .map((f) => this.doc[f.fieldname]);

      return values.every(Boolean);
    },
    activeGroup(): Map<string, Field[]> {
      if (!this.hasDoc) {
        return new Map();
      }

      // Create a modified schema with conditionally visible tax fields
      const modifiedSchema = {
        ...this.doc.schema,
        fields: this.doc.schema.fields.map((field) => {
          const modifiedField = { ...field };

          // Unhide tax fields based on config
          if (field.fieldname === 'gstin' && this.configSettings.enableGST === true) {
            modifiedField.hidden = false;
          }
          if (field.fieldname === 'vatNumber' && this.configSettings.enableVAT === true) {
            modifiedField.hidden = false;
          }
          if (field.fieldname === 'tanNumber' && this.configSettings.enableTDS === true) {
            modifiedField.hidden = false;
          }

          return modifiedField;
        }),
      };

      const groupedFields = getFieldsGroupedByTabAndSection(
        modifiedSchema,
        this.doc
      );

      const firstGroup = [...groupedFields.values()][0];

      // Dynamically update district field label based on country
      const country = this.doc.get('country') as string | undefined;
      if (country) {
        const divisionLabel = this.getDistrictLabel(country);
        const hasDistricts = this.hasDistrictsForCountry(country);

        // Update the district field label
        for (const [sectionName, fields] of firstGroup.entries()) {
          const modifiedFields = fields.map((field) => {
            if (field.fieldname === 'district') {
              return {
                ...field,
                label: hasDistricts ? divisionLabel : 'State/Province',
                placeholder: hasDistricts ? `Select ${divisionLabel}` : 'Not Applicable',
              };
            }
            return field;
          });
          firstGroup.set(sectionName, modifiedFields);
        }
      }

      return firstGroup;
    },
  },
  async mounted() {
    const languageMap = TranslationString.prototype.languageMap;
    this.docOrNull = getSetupWizardDoc(languageMap);
    if (!this.fyo.db.isConnected) {
      await this.fyo.db.init();
    }

    // Initialize default config settings
    this.configSettings = {
      provideContactDetails: true,
      provideBaseCurrencyDetails: true,
      enableEditLog: false,
      enableGST: false,
      enableVAT: false,
      enableTDS: false,
    };

    if (this.fyo.store.isDevelopment) {
      // @ts-ignore
      window.sw = this;
    }
    this.fyo.telemetry.log(Verb.Started, ModelNameEnum.SetupWizard);
  },
  methods: {
    hasDistrictsForCountry(country: string): boolean {
      const countriesWithDistricts = [
        'India',
        'United States',
        'Canada',
        'United Kingdom',
        'Australia',
        'United Arab Emirates',
        'France',
        'Germany',
        'Indonesia',
        'Mexico',
      ];
      return countriesWithDistricts.includes(country);
    },
    getDistrictLabel(country: string): string {
      const labelMap: Record<string, string> = {
        'United States': 'State',
        'India': 'State',
        'Canada': 'Province',
        'United Arab Emirates': 'Emirate',
        'France': 'Region',
        'Germany': 'State',
        'Indonesia': 'Province',
        'Mexico': 'State',
        'United Kingdom': 'Country',
        'Australia': 'State/Territory',
        'China': 'Province',
        'Japan': 'Prefecture',
        'Brazil': 'State',
        'Russia': 'Federal Subject',
        'Italy': 'Region',
        'Spain': 'Autonomous Community',
        'Argentina': 'Province',
        'Saudi Arabia': 'Region',
        'Egypt': 'Governorate',
        'Nigeria': 'State',
        'South Africa': 'Province',
        'Pakistan': 'Province',
        'Bangladesh': 'Division',
        'Philippines': 'Region',
        'Thailand': 'Province',
        'Vietnam': 'Province',
        'Malaysia': 'State',
        'Singapore': 'Region',
        'Netherlands': 'Province',
        'Belgium': 'Region',
        'Switzerland': 'Canton',
        'Austria': 'State',
        'Sweden': 'County',
        'Norway': 'County',
        'Denmark': 'Region',
        'Finland': 'Region',
        'Poland': 'Voivodeship',
        'Turkey': 'Province',
        'Greece': 'Region',
        'Portugal': 'Region',
        'Ireland': 'County',
        'New Zealand': 'Region',
        'South Korea': 'Province',
      };

      return labelMap[country] || 'State/Province';
    },
    async fill() {
      if (!this.hasDoc) {
        return;
      }

      await this.doc.set('companyName', "Lin's Things");
      await this.doc.set('email', 'lin@lthings.com');
      await this.doc.set('mailingName', 'Lin Slovenly');
      await this.doc.set('address', '123 Main Street');
      await this.doc.set('district', 'Central District');
      await this.doc.set('pincode', '110001');
      await this.doc.set('phone', '+91-11-12345678');
      await this.doc.set('country', 'India');
    },
    async onValueChange(field: Field, value: DocValue) {
      if (!this.hasDoc) {
        return;
      }

      const { fieldname } = field;
      delete this.errors[fieldname];

      try {
        await this.doc.set(fieldname, value);

        // Auto-fill mailingName with companyName if mailingName is empty
        if (fieldname === 'companyName' && value) {
          const mailingName = this.doc.get('mailingName');
          if (!mailingName) {
            await this.doc.set('mailingName', value);
          }
        }
      } catch (err) {
        if (!(err instanceof Error)) {
          return;
        }

        this.errors[fieldname] = getErrorMessage(err, this.doc);
      }
    },
    async submit() {
      if (!this.hasDoc) {
        return;
      }

      if (!this.doc.companyName) {
        return await showDialog({
          title: this.t`Company Name Required`,
          detail: this.t`Please enter the Company Name to continue.`,
          type: 'error',
        });
      }

      if (!this.areAllValuesFilled) {
        return await showDialog({
          title: this.t`Mandatory Error`,
          detail: this.t`Please fill all required values.`,
          type: 'error',
        });
      }

      this.loading = true;
      this.fyo.telemetry.log(Verb.Completed, ModelNameEnum.SetupWizard);
      this.$emit('setup-complete', this.doc.getValidDict());
    },
    cancel() {
      this.fyo.telemetry.log(Verb.Cancelled, ModelNameEnum.SetupWizard);
      this.$emit('setup-canceled');
    },
    openConfigModal() {
      this.showConfigModal = true;
    },
    closeConfigModal() {
      this.showConfigModal = false;
    },
    handleConfigUpdate(configOptions: any[]) {
      // Store the configuration settings
      const newConfig: Record<string, any> = {};
      configOptions.forEach((option) => {
        newConfig[option.key] = option.value;
      });

      // Update configSettings to trigger reactivity
      this.configSettings = { ...newConfig };

      // Log the configuration for debugging
      console.log('Configuration updated:', this.configSettings);
    },
  },
});
</script>
<style scoped>
:deep(h1) {
  font-size: 13px !important;
  font-weight: 400 !important;
}
:deep(.px-4) {
  height: 2rem !important;
  padding-top: 0.375rem !important;
  padding-bottom: 0.375rem !important;
}
:deep(.w-form) {
  height: calc(100vh - 2rem) !important;
  max-height: 100vh !important;
}
.setup-wizard-container {
  position: relative;
}
.setup-wizard-container::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100%;
  background: #DEF1FC;
  z-index: 1;
  pointer-events: none;
}
:deep(.custom-scroll::-webkit-scrollbar) {
  width: 0.6rem;
}
:deep(.custom-scroll::-webkit-scrollbar-track) {
  background: #e5e7eb;
}
:deep(.custom-scroll::-webkit-scrollbar-thumb) {
  background: #6b7280;
  border-radius: 0.3rem;
}
:deep(.custom-scroll::-webkit-scrollbar-thumb:hover) {
  background: #4b5563;
}
:deep(.w-form) {
  font-size: 15px !important;
}
:deep(.w-form label) {
  font-size: 15px !important;
}
:deep(.w-form input),
:deep(.w-form textarea),
:deep(.w-form select),
:deep(.w-form .input-class),
:deep(.w-form input[type="date"]),
:deep(.w-form .autocomplete input),
:deep(.w-form .flex.items-center.justify-between),
:deep(.w-form .border-gray-200) {
  font-size: 15px !important;
  border-color: #bfdbfe !important; /* Light blue - a bit darker */
}

:deep(.w-form input:focus),
:deep(.w-form textarea:focus),
:deep(.w-form select:focus),
:deep(.w-form .input-class:focus),
:deep(.w-form input[type="date"]:focus),
:deep(.w-form .autocomplete input:focus),
:deep(.w-form .flex.items-center.justify-between:focus-within) {
  border-color: #60a5fa !important; /* Medium blue on focus */
}

:deep(.dark .w-form input),
:deep(.dark .w-form textarea),
:deep(.dark .w-form select),
:deep(.dark .w-form .input-class),
:deep(.dark .w-form input[type="date"]),
:deep(.dark .w-form .autocomplete input),
:deep(.dark .w-form .flex.items-center.justify-between),
:deep(.dark .w-form .border-gray-800) {
  border-color: #1e3a8a !important; /* Dark blue for dark mode */
}

:deep(.dark .w-form input:focus),
:deep(.dark .w-form textarea:focus),
:deep(.dark .w-form select:focus),
:deep(.dark .w-form .input-class:focus),
:deep(.dark .w-form input[type="date"]:focus),
:deep(.dark .w-form .autocomplete input:focus),
:deep(.dark .w-form .flex.items-center.justify-between:focus-within) {
  border-color: #3b82f6 !important; /* Brighter blue on focus in dark mode */
}
.setup-wizard-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
.configure-button-container {
  position: fixed;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  z-index: 1000;
}
.configure-button {
  background: transparent;
  color: #000000;
  padding: 4px 8px;
  border: none;
  outline: none;
  border-radius: 0;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}
.configure-button:hover {
  color: #1a1a1a;
}
.configure-button:focus {
  outline: none;
  box-shadow: none;
}
/* Logo and Company Name side by side layout */
:deep(.grid > div:has([placeholder="Company Logo"])) {
  grid-column: 1;
  grid-row: 1;
  align-self: start;
}

:deep(.grid > div:has(input[placeholder="Company Name"])) {
  grid-column: 2;
  grid-row: 1;
  margin-left: -4rem !important;
}

:deep(.grid > div:has(input[placeholder="Company Name"]) input) {
  width: 100% !important;
}

/* Keep other fields in normal 2-column layout */
:deep(.grid > div:has([placeholder="Company Logo"]) ~ div:not(:has(input[placeholder="Company Name"]))) {
  grid-column: auto;
}

/* Professional button styling */
.setup-wizard-container :deep(.w-24) {
  width: auto !important;
  min-width: 7rem !important;
  border-radius: 0.5rem !important;
  font-weight: 500 !important;
  transition: all 0.2s ease-in-out !important;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
  padding: 0.625rem 1.5rem !important;
  font-size: 0.9375rem !important;
}

.setup-wizard-container :deep(.w-24:hover:not(:disabled)) {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

.setup-wizard-container :deep(.w-24:active:not(:disabled)) {
  transform: translateY(0) !important;
}

.setup-wizard-container :deep([data-testid="submit-button"]) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  border: none !important;
  color: white !important;
}

.setup-wizard-container :deep([data-testid="submit-button"]:hover:not(:disabled)) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
  box-shadow: 0 6px 12px -2px rgba(37, 99, 235, 0.3) !important;
}

.setup-wizard-container :deep(.w-24:disabled) {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
  transform: none !important;
}

/* Loading spinner animation */
.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

:deep(.dark) .loading-spinner {
  border-color: #374151;
  border-top-color: #60a5fa;
}
</style>
