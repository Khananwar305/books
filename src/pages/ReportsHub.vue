<template>
  <div class="reports-hub-container">
    <!-- Header -->
    <div class="header-section">
      <div class="header-content">
        <div class="title-wrapper">
          <div class="title-icon-bg">
            <feather-icon name="bar-chart-2" class="title-icon" />
          </div>
          <div>
            <h1 class="page-title">{{ t`Reports` }}</h1>
            <p class="page-subtitle">{{ t`Comprehensive insights and analytics at your fingertips` }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Reports Grid -->
    <div class="reports-grid">
      <!-- General Ledger Card -->
      <div class="report-card" @click="navigateToReport('GeneralLedger')">
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <feather-icon name="book-open" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`General Ledger` }}</h3>
          <p class="card-description">{{ t`View all transactions for each account` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>

      <!-- Profit & Loss Card -->
      <div class="report-card" @click="navigateToReport('ProfitAndLoss')">
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <feather-icon name="trending-up" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`Profit And Loss` }}</h3>
          <p class="card-description">{{ t`View income and expenses summary` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>

      <!-- Balance Sheet Card -->
      <div class="report-card" @click="navigateToReport('BalanceSheet')">
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <feather-icon name="pie-chart" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`Balance Sheet` }}</h3>
          <p class="card-description">{{ t`View assets, liabilities and equity` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>

      <!-- Trial Balance Card -->
      <div class="report-card" @click="navigateToReport('TrialBalance')">
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <feather-icon name="list" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`Trial Balance` }}</h3>
          <p class="card-description">{{ t`View debit and credit balances` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>

      <!-- Stock Ledger Card (if inventory enabled) -->
      <div
        v-if="hasInventory"
        class="report-card"
        @click="navigateToReport('StockLedger')"
      >
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
          <feather-icon name="package" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`Stock Ledger` }}</h3>
          <p class="card-description">{{ t`View stock movement details` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>

      <!-- Stock Balance Card (if inventory enabled) -->
      <div
        v-if="hasInventory"
        class="report-card"
        @click="navigateToReport('StockBalance')"
      >
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
          <feather-icon name="box" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`Stock Balance` }}</h3>
          <p class="card-description">{{ t`View current stock quantities` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>

      <!-- GST Reports Card (if GSTIN configured) -->
      <div
        v-if="hasGstin"
        class="report-card gst-card"
        :class="{ 'gst-active': showGstMenu }"
      >
        <div class="card-main" @click="handleGstCardClick">
          <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);">
            <feather-icon name="file-text" class="card-icon" />
          </div>
          <div class="card-content">
            <h3 class="card-title">{{ t`GST Reports` }}</h3>
            <p class="card-description">{{ t`GSTR1 & GSTR2 reports` }}</p>
          </div>
          <div class="card-footer">
            <feather-icon :name="showGstMenu ? 'chevron-up' : 'chevron-down'" class="arrow-icon" />
          </div>
        </div>

        <!-- GST Sub-menu -->
        <transition name="slide-down">
          <div v-if="showGstMenu" class="gst-submenu" @click.stop>
            <div class="gst-submenu-item" @click="navigateToReport('GSTR1')">
              <feather-icon name="trending-up" class="submenu-icon" />
              <div>
                <div class="submenu-title">{{ t`GSTR1` }}</div>
                <div class="submenu-desc">{{ t`Sales report` }}</div>
              </div>
              <feather-icon name="arrow-right" class="submenu-arrow" />
            </div>
            <div class="gst-submenu-divider"></div>
            <div class="gst-submenu-item" @click="navigateToReport('GSTR2')">
              <feather-icon name="trending-down" class="submenu-icon" />
              <div>
                <div class="submenu-title">{{ t`GSTR2` }}</div>
                <div class="submenu-desc">{{ t`Purchase report` }}</div>
              </div>
              <feather-icon name="arrow-right" class="submenu-arrow" />
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { fyo } from 'src/initFyo';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ReportsHub',
  data() {
    return {
      hasInventory: false,
      hasGstin: false,
      showGstMenu: false,
    };
  },
  mounted() {
    this.hasInventory = !!fyo.singles.AccountingSettings?.enableInventory;
    this.hasGstin = !!fyo.singles?.AccountingSettings?.gstin;

    // Debug: Log GST status
    console.log('GST Status:', {
      hasGstin: this.hasGstin,
      gstin: fyo.singles?.AccountingSettings?.gstin
    });
  },
  methods: {
    navigateToReport(reportName: string) {
      this.showGstMenu = false;
      this.$router.push(`/report/${reportName}`);
    },
    handleGstCardClick() {
      console.log('GST Card clicked, current state:', this.showGstMenu);
      this.showGstMenu = !this.showGstMenu;
      console.log('GST Card new state:', this.showGstMenu);
    },
  },
});
</script>

<style scoped>
.reports-hub-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 2.5rem 3rem;
}

.header-section {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.title-icon-bg {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(13, 110, 253, 0.25);
  flex-shrink: 0;
}

.title-icon {
  width: 32px;
  height: 32px;
  color: white;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1d29;
  margin-bottom: 0.5rem;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 1rem;
  color: #6c757d;
  font-weight: 400;
  letter-spacing: 0.2px;
}

.reports-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.report-card {
  background: white;
  border-radius: 10px;
  padding: 0.875rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  overflow: visible;
  min-height: 110px;
}

.gst-card {
  overflow: visible;
  z-index: 10;
}

.gst-card.gst-active {
  max-height: none;
}

.card-main {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.report-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
  border-color: rgba(13, 110, 253, 0.15);
}

.report-card:active {
  transform: translateY(-2px);
}

.card-icon-wrapper {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.report-card:hover .card-icon-wrapper {
  transform: scale(1.05);
}

.card-icon {
  width: 18px;
  height: 18px;
  color: white;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 0.2rem;
  line-height: 1.3;
  letter-spacing: -0.2px;
}

.card-description {
  font-size: 0.7rem;
  color: #6c757d;
  line-height: 1.3;
  margin: 0;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-top: 0.3rem;
  margin-top: auto;
}

.arrow-icon {
  width: 14px;
  height: 14px;
  color: #adb5bd;
  transition: all 0.3s ease;
}

.report-card:hover .arrow-icon {
  color: #0d6efd;
  transform: translateX(4px);
}

/* GST Submenu Styles */
.gst-submenu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.75rem;
  background: white;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  z-index: 100;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.gst-submenu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.gst-submenu-item:hover {
  background: rgba(13, 110, 253, 0.04);
}

.submenu-icon {
  width: 22px;
  height: 22px;
  color: #0d6efd;
  flex-shrink: 0;
}

.submenu-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 0.25rem;
  letter-spacing: -0.2px;
}

.submenu-desc {
  font-size: 0.8125rem;
  color: #6c757d;
}

.submenu-arrow {
  width: 18px;
  height: 18px;
  color: #adb5bd;
  margin-left: auto;
  transition: transform 0.2s ease, color 0.2s ease;
}

.gst-submenu-item:hover .submenu-arrow {
  color: #0d6efd;
  transform: translateX(4px);
}

.gst-submenu-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .reports-hub-container {
    padding: 1.5rem;
  }

  .title-wrapper {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .page-subtitle {
    font-size: 0.9rem;
  }

  .reports-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .report-card {
    padding: 1.5rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .reports-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1025px) {
  .reports-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1400px) {
  .reports-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 1600px) {
  .reports-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .reports-hub-container {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }

  .page-title {
    color: #f7fafc;
  }

  .page-subtitle {
    color: #cbd5e0;
  }

  .report-card {
    background: #2d3748;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .card-title {
    color: #f7fafc;
  }

  .card-description {
    color: #cbd5e0;
  }

  .report-card:hover {
    border-color: rgba(102, 126, 234, 0.3);
  }
}
</style>
