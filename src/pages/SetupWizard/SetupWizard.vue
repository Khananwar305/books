<template>
  <FormContainer
    :show-header="false"
    class="justify-content items-center h-full overflow-hidden"
    :class="{ 'window-drag': platform !== 'Windows' }"
  >
    <template #body>
      <FormHeader
        :form-title="t`Set up your organization`"
        class="
          sticky
          top-0
          bg-white
          dark:bg-gray-890
          border-b
          dark:border-gray-800
          z-10
          flex-shrink-0
        "
      >
      </FormHeader>

      <!-- Section Container -->
      <div
        v-if="hasDoc"
        class="overflow-y-auto overflow-x-hidden custom-scroll custom-scroll-thumb1 flex-1"
        style="max-height: calc(100vh - 200px);"
      >
        <CommonFormSection
          v-for="([name, fields], idx) in activeGroup.entries()"
          :key="name + idx"
          ref="section"
          class="p-4"
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
          dark:border-gray-800
          flex-shrink-0
          sticky
          bottom-0
          bg-white
          dark:bg-gray-890
          z-10
        "
      >
        <p v-if="loading" class="text-base text-gray-600 dark:text-gray-400">
          {{ t`Loading instance...` }}
        </p>
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

export default defineComponent({
  name: 'SetupWizard',
  components: {
    Button,
    FormContainer,
    FormHeader,
    CommonFormSection,
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
    } as {
      errors: Record<string, string>;
      docOrNull: null | Doc;
      loading: boolean;
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

      const groupedFields = getFieldsGroupedByTabAndSection(
        this.doc.schema,
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
      await this.doc.set('bankName', 'Max Finance');
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
  },
});
</script>
