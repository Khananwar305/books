<template>
  <div
    class="
      flex
      overflow-x-auto
      custom-scroll custom-scroll-thumb1
    "
    :style="getBackgroundStyle()"
  >
    <div class="flex flex-1 flex-col">
      <!-- Page Header (Title, Buttons, etc) -->
      <PageHeader
        v-if="showHeader"
        :title="title"
        :border="false"
        :searchborder="searchborder"
      >
        <template #left>
          <slot name="header-left" />
        </template>
        <slot name="header" />
      </PageHeader>

      <!-- Common Form -->
      <div
        class="
          flex flex-col
          self-center
          h-full
          max-h-screen
          overflow-hidden
        "
        :style="getFormStyle()"
        :class="[
          route.path.includes('SalesInvoice') ? '' : 'bg-white dark:bg-gray-890',
          useFullWidth
            ? 'w-full border-t dark:border-gray-800'
            : 'w-form rounded-lg mb-4 mx-4',
          route.path.includes('SalesInvoice')
            ? (useFullWidth ? 'border-t border-blue-200' : 'border border-blue-200 shadow-xl')
            : (useFullWidth ? 'border-t border-gray-200 dark:border-gray-800' : 'border border-gray-200 dark:border-gray-800 shadow-lg')
        ]"
      >
        <slot name="body" />
      </div>
    </div>

    <!-- Invoice Quick Edit -->
    <slot name="quickedit" />
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from './PageHeader.vue';

export default defineComponent({
  components: { PageHeader },
  props: {
    title: { type: String, default: '' },
    useFullWidth: { type: Boolean, default: false },
    showHeader: { type: Boolean, default: true },
    searchborder: { type: Boolean, default: true },
  },
  setup() {
    const route = useRoute();
    return { route };
  },
  methods: {
    getBackgroundStyle() {
      // Check if current route is for SalesInvoice (both new and edit)
      const isSalesInvoice = this.route.path.includes('SalesInvoice');

      if (isSalesInvoice) {
        return {
          background: 'linear-gradient(180deg, #e3f2fd 0%, #bbdefb 100%)',
        };
      }

      return {
        background: 'var(--bg-gray-50)',
      };
    },
    getFormStyle() {
      const isSalesInvoice = this.route.path.includes('SalesInvoice');

      if (isSalesInvoice) {
        return {
          background: '#ffffff',
        };
      }

      return {};
    },
  },
});
</script>
