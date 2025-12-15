<template>
  <div class="flex flex-col h-full">
    <PageHeader :title="t`Purchase Setup`" />

    <div class="purchase-setup-container">
      <!-- Purchase Setup Grid -->
      <div class="setup-grid">
      <!-- Add Items Card -->
      <div class="setup-card" @click="navigateToItems">
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <feather-icon name="package" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`Add Items` }}</h3>
          <p class="card-description">{{ t`Add products or services that you buy from your suppliers` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>

      <!-- Add Suppliers Card -->
      <div class="setup-card" @click="navigateToSuppliers">
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <feather-icon name="users" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`Add Suppliers` }}</h3>
          <p class="card-description">{{ t`Add a few suppliers to create your first purchase invoice` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { defineComponent } from 'vue';
import { routeTo } from 'src/utils/ui';
import PageHeader from 'src/components/PageHeader.vue';

export default defineComponent({
  name: 'PurchaseSetup',
  components: {
    PageHeader,
  },
  methods: {
    navigateToItems() {
      routeTo({
        path: `/list/Item/${t`Purchase Items`}`,
        query: {
          filters: JSON.stringify({ for: 'Purchases' }),
        },
      });
    },
    navigateToSuppliers() {
      routeTo({
        path: `/list/Party/${t`Suppliers`}`,
        query: {
          filters: JSON.stringify({ role: 'Supplier' }),
        },
      });
    },
  },
});
</script>

<style scoped>
.purchase-setup-container {
  padding: 2rem 1.5rem;
  max-width: 1400px;
}

.setup-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(200px, 280px));
  gap: 1rem;
  max-width: 600px;
  justify-content: start;
}

.setup-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.setup-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.setup-card:hover::before {
  transform: scaleX(1);
}

.setup-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(102, 126, 234, 0.25);
  border-color: #667eea;
}

.card-icon-wrapper {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.card-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: white;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.25rem 0;
  letter-spacing: 0.2px;
}

.card-description {
  font-size: 0.75rem;
  color: #718096;
  margin: 0;
  line-height: 1.35;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.375rem;
}

.arrow-icon {
  width: 1rem;
  height: 1rem;
  color: #a0aec0;
  transition: all 0.3s ease;
}

.setup-card:hover .arrow-icon {
  color: #667eea;
  transform: translateX(4px);
}

/* Dark mode support */
.dark .purchase-setup-container {
  background: #1a202c;
}

.dark .page-title {
  color: #f7fafc;
}

.dark .page-subtitle {
  color: #a0aec0;
}

.dark .setup-card {
  background: #2d3748;
  border-color: #4a5568;
}

.dark .card-title {
  color: #f7fafc;
}

.dark .card-description {
  color: #cbd5e0;
}
</style>
