<template>
  <div class="dashboard-container">
    <PageHeader :title="t`Dashboard`">
      <div class="header-actions">
        <div
          class="
            border
            dark:border-gray-900
            rounded
            bg-gray-50
            dark:bg-gray-890
            focus-within:bg-gray-100
            dark:focus-within:bg-gray-900
            flex
            items-center
          "
        >
          <PeriodSelector
            class="px-3"
            :value="period"
            :options="['This Year', 'This Quarter', 'This Month', 'YTD']"
            @change="(value) => (period = value)"
          />
        </div>

        <div class="format-selector">
          <label class="format-label">{{ t`Display:` }}</label>
          <select v-model="currencyFormat" @change="saveCurrencyFormat" class="format-dropdown">
            <option value="actual">{{ t`Actual` }}</option>
            <option value="thousands">{{ t`Thousands` }}</option>
            <option value="lakhs">{{ t`Lakhs` }}</option>
            <option value="crores">{{ t`Crores` }}</option>
            <option value="millions">{{ t`Millions` }}</option>
          </select>
        </div>

        <button
          class="customize-btn"
          @click="showCustomizeModal = true"
          :title="t`Customize Dashboard`"
        >
          <feather-icon name="sliders" class="w-4 h-4" />
          <span>{{ t`Customize` }}</span>
        </button>
      </div>
    </PageHeader>

    <div class="dashboard-content">
      <!-- KPI Cards Grid -->
      <div class="kpi-grid" v-if="visibleKpis.length > 0">
        <div
          v-for="kpi in visibleKpis"
          :key="kpi.id"
          class="kpi-card"
          :class="`kpi-card-${kpi.color}`"
        >
          <div class="kpi-icon-wrapper">
            <feather-icon :name="kpi.icon" class="kpi-icon" />
          </div>
          <div class="kpi-content">
            <p class="kpi-label">{{ kpi.label }}</p>
            <h3 class="kpi-value">{{ formatCurrency(kpi.rawValue, kpi) }}</h3>
            <p class="kpi-change" :class="kpi.changeType">{{ kpi.change }}</p>
          </div>
        </div>
      </div>

      <!-- Format Info Badge -->
      <div v-if="currencyFormat !== 'actual'" class="format-info-badge">
        {{ t`All values in` }} {{ getFormatLabel() }}
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <div
          v-for="widget in visibleWidgets"
          :key="widget.id"
          class="chart-card"
          :class="{ 'chart-full': widget.fullWidth }"
        >
          <Cashflow
            v-if="widget.id === 'cashflow'"
            :common-period="period"
            :dark-mode="darkMode"
            :currency-format="currencyFormat"
            @period-change="handlePeriodChange"
          />
          <UnpaidInvoices
            v-if="widget.id === 'salesInvoices'"
            :schema-name="'SalesInvoice'"
            :common-period="period"
            :dark-mode="darkMode"
            :currency-format="currencyFormat"
            @period-change="handlePeriodChange"
          />
          <UnpaidInvoices
            v-if="widget.id === 'purchaseInvoices'"
            :schema-name="'PurchaseInvoice'"
            :common-period="period"
            :dark-mode="darkMode"
            :currency-format="currencyFormat"
            @period-change="handlePeriodChange"
          />
          <ProfitAndLoss
            v-if="widget.id === 'profitLoss'"
            :common-period="period"
            :dark-mode="darkMode"
            :currency-format="currencyFormat"
            @period-change="handlePeriodChange"
          />
          <Expenses
            v-if="widget.id === 'expenses'"
            :common-period="period"
            :dark-mode="darkMode"
            :currency-format="currencyFormat"
            @period-change="handlePeriodChange"
          />
        </div>
      </div>
    </div>

    <!-- Customization Modal - Compact Design -->
    <div v-if="showCustomizeModal" class="modal-overlay-compact" @click="showCustomizeModal = false">
      <div class="modal-container-compact" @click.stop>
        <div class="modal-header-compact">
          <h2 class="modal-title-compact">{{ t`Customize` }}</h2>
          <button class="modal-close-compact" @click="showCustomizeModal = false">
            <feather-icon name="x" class="w-4 h-4" />
          </button>
        </div>

        <div class="modal-body-compact">
          <!-- KPI Cards Section -->
          <div class="section-compact">
            <h3 class="section-title-compact">{{ t`KPI Cards` }}</h3>
            <div class="widgets-grid-compact">
              <div
                v-for="kpi in allKpis"
                :key="kpi.id"
                class="widget-item-compact"
                :class="{ 'widget-active': kpi.visible }"
                @click="toggleKpi(kpi.id)"
              >
                <div class="widget-icon-compact" :class="`kpi-card-${kpi.color}`">
                  <feather-icon :name="kpi.icon" class="w-3 h-3 text-white" />
                </div>
                <p class="widget-name-compact">{{ kpi.label }}</p>
                <feather-icon
                  :name="kpi.visible ? 'check-circle' : 'circle'"
                  class="widget-check-compact"
                  :class="kpi.visible ? 'text-green-600' : 'text-gray-300'"
                />
              </div>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="section-compact">
            <h3 class="section-title-compact">{{ t`Charts` }}</h3>
            <div class="widgets-grid-compact">
              <div
                v-for="widget in allWidgets"
                :key="widget.id"
                class="widget-item-compact"
                :class="{ 'widget-active': widget.visible }"
                @click="toggleWidget(widget.id)"
              >
                <div class="widget-icon-compact" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <feather-icon :name="widget.icon" class="w-3 h-3 text-white" />
                </div>
                <p class="widget-name-compact">{{ widget.label }}</p>
                <feather-icon
                  :name="widget.visible ? 'check-circle' : 'circle'"
                  class="widget-check-compact"
                  :class="widget.visible ? 'text-green-600' : 'text-gray-300'"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer-compact">
          <button class="btn-compact btn-reset" @click="resetDashboard">
            <feather-icon name="rotate-ccw" class="w-3 h-3" />
            {{ t`Reset` }}
          </button>
          <button class="btn-compact btn-save" @click="saveDashboard">
            <feather-icon name="check" class="w-3 h-3" />
            {{ t`Save` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PageHeader from 'src/components/PageHeader.vue';
import UnpaidInvoices from './UnpaidInvoices.vue';
import Cashflow from './Cashflow.vue';
import Expenses from './Expenses.vue';
import PeriodSelector from './PeriodSelector.vue';
import ProfitAndLoss from './ProfitAndLoss.vue';
import { docsPathRef } from 'src/utils/refs';

export default {
  name: 'Dashboard',
  components: {
    PageHeader,
    Cashflow,
    ProfitAndLoss,
    Expenses,
    PeriodSelector,
    UnpaidInvoices,
  },
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      period: 'This Year',
      showCustomizeModal: false,
      currencyFormat: 'actual',
      allKpis: [
        {
          id: 'revenue',
          label: 'Total Revenue',
          description: 'Total sales revenue',
          icon: 'trending-up',
          color: 'blue',
          rawValue: 0,
          change: '',
          changeType: 'neutral',
          visible: true,
        },
        {
          id: 'profit',
          label: 'Net Profit',
          description: 'Net profit after expenses',
          icon: 'dollar-sign',
          color: 'indigo',
          rawValue: 0,
          change: '',
          changeType: 'neutral',
          visible: true,
        },
        {
          id: 'invoices',
          label: 'Pending Invoices',
          description: 'Unpaid invoices count',
          icon: 'file-text',
          color: 'blue',
          rawValue: 0,
          change: '',
          changeType: 'neutral',
          visible: true,
          isCount: true,
        },
        {
          id: 'customers',
          label: 'Total Customers',
          description: 'Active customer count',
          icon: 'users',
          color: 'indigo',
          rawValue: 0,
          change: '',
          changeType: 'neutral',
          visible: true,
          isCount: true,
        },
        {
          id: 'expenses',
          label: 'Total Expenses',
          description: 'Total expenses amount',
          icon: 'trending-down',
          color: 'blue',
          rawValue: 0,
          change: '',
          changeType: 'neutral',
          visible: false,
        },
        {
          id: 'suppliers',
          label: 'Total Suppliers',
          description: 'Active supplier count',
          icon: 'truck',
          color: 'indigo',
          rawValue: 0,
          change: '',
          changeType: 'neutral',
          visible: false,
          isCount: true,
        },
      ],
      allWidgets: [
        {
          id: 'cashflow',
          label: 'Cash Flow',
          description: 'Income and expense flow',
          icon: 'bar-chart-2',
          fullWidth: true,
          visible: true,
        },
        {
          id: 'salesInvoices',
          label: 'Unpaid Sales Invoices',
          description: 'Outstanding sales invoices',
          icon: 'file-text',
          fullWidth: false,
          visible: true,
        },
        {
          id: 'purchaseInvoices',
          label: 'Unpaid Purchase Invoices',
          description: 'Outstanding purchase invoices',
          icon: 'shopping-cart',
          fullWidth: false,
          visible: true,
        },
        {
          id: 'profitLoss',
          label: 'Profit & Loss',
          description: 'Income vs expenses',
          icon: 'pie-chart',
          fullWidth: false,
          visible: true,
        },
        {
          id: 'expenses',
          label: 'Expenses',
          description: 'Expense breakdown',
          icon: 'credit-card',
          fullWidth: false,
          visible: true,
        },
      ],
    };
  },
  computed: {
    visibleKpis() {
      return this.allKpis.filter(kpi => kpi.visible);
    },
    visibleWidgets() {
      return this.allWidgets.filter(widget => widget.visible);
    },
  },
  mounted() {
    this.loadDashboardConfig();
    this.loadCurrencyFormat();
  },
  activated() {
    docsPathRef.value = 'books/dashboard';
  },
  deactivated() {
    docsPathRef.value = '';
  },
  methods: {
    handlePeriodChange(period) {
      if (period === this.period) {
        return;
      }

      this.period = '';
    },
    toggleKpi(kpiId) {
      const kpi = this.allKpis.find(k => k.id === kpiId);
      if (kpi) {
        kpi.visible = !kpi.visible;
      }
    },
    toggleWidget(widgetId) {
      const widget = this.allWidgets.find(w => w.id === widgetId);
      if (widget) {
        widget.visible = !widget.visible;
      }
    },
    saveDashboard() {
      const config = {
        kpis: this.allKpis.map(kpi => ({
          id: kpi.id,
          visible: kpi.visible,
        })),
        widgets: this.allWidgets.map(widget => ({
          id: widget.id,
          visible: widget.visible,
        })),
      };
      localStorage.setItem('dashboardConfig', JSON.stringify(config));
      this.showCustomizeModal = false;

      // Show success message
      console.log('Dashboard configuration saved!');
    },
    loadDashboardConfig() {
      const savedConfig = localStorage.getItem('dashboardConfig');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);

          // Apply KPI visibility
          if (config.kpis) {
            config.kpis.forEach(savedKpi => {
              const kpi = this.allKpis.find(k => k.id === savedKpi.id);
              if (kpi) {
                kpi.visible = savedKpi.visible;
              }
            });
          }

          // Apply widget visibility
          if (config.widgets) {
            config.widgets.forEach(savedWidget => {
              const widget = this.allWidgets.find(w => w.id === savedWidget.id);
              if (widget) {
                widget.visible = savedWidget.visible;
              }
            });
          }
        } catch (e) {
          console.error('Failed to load dashboard config:', e);
        }
      }
    },
    resetDashboard() {
      // Reset all KPIs to default
      this.allKpis.forEach(kpi => {
        kpi.visible = ['revenue', 'profit', 'invoices', 'customers'].includes(kpi.id);
      });

      // Reset all widgets to visible
      this.allWidgets.forEach(widget => {
        widget.visible = true;
      });

      // Clear localStorage
      localStorage.removeItem('dashboardConfig');

      console.log('Dashboard reset to default!');
    },
    formatCurrency(value, kpi) {
      // If it's a count (not currency), return as is
      if (kpi?.isCount) {
        return value.toLocaleString('en-IN');
      }

      const numValue = typeof value === 'string' ? parseFloat(value) : value;

      if (isNaN(numValue)) {
        return '₹0';
      }

      let formattedValue;
      let suffix = '';

      switch (this.currencyFormat) {
        case 'crores':
          formattedValue = (numValue / 10000000).toFixed(2);
          suffix = ' Cr';
          break;
        case 'lakhs':
          formattedValue = (numValue / 100000).toFixed(2);
          suffix = ' L';
          break;
        case 'thousands':
          formattedValue = (numValue / 1000).toFixed(2);
          suffix = ' K';
          break;
        case 'millions':
          formattedValue = (numValue / 1000000).toFixed(2);
          suffix = ' M';
          break;
        case 'actual':
        default:
          formattedValue = numValue.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          });
          return `₹${formattedValue}`;
      }

      // Remove trailing zeros
      formattedValue = parseFloat(formattedValue).toString();

      return `₹${formattedValue}${suffix}`;
    },
    getFormatLabel() {
      const labels = {
        crores: 'Crores',
        lakhs: 'Lakhs',
        thousands: 'Thousands',
        millions: 'Millions',
        actual: 'Actual',
      };
      return labels[this.currencyFormat] || 'Actual';
    },
    saveCurrencyFormat() {
      localStorage.setItem('dashboardCurrencyFormat', this.currencyFormat);
    },
    loadCurrencyFormat() {
      const savedFormat = localStorage.getItem('dashboardCurrencyFormat');
      if (savedFormat) {
        this.currencyFormat = savedFormat;
      }
    },
  },
};
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
  width: var(--w-desk);
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.dashboard-content {
  height: calc(100vh - var(--h-row-largest) - 1px);
  overflow-y: auto;
  padding: 1.5rem;
}

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.format-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.format-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6c757d;
  margin: 0;
}

.format-dropdown {
  padding: 0.375rem 0.625rem;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: #f8f9fa;
  color: #1a1d29;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.format-dropdown:hover {
  background: #e9ecef;
  border-color: #0d6efd;
}

.format-dropdown:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.customize-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(13, 110, 253, 0.3);
}

.customize-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.4);
}

.format-info-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* KPI Cards Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.kpi-card {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1), 0 3px 6px rgba(0, 0, 0, 0.06);
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.kpi-card:hover .kpi-icon-wrapper {
  transform: scale(1.05);
}

.kpi-card-blue .kpi-icon-wrapper {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}

.kpi-card-green .kpi-icon-wrapper {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  box-shadow: 0 4px 12px rgba(67, 233, 123, 0.3);
}

.kpi-card-orange .kpi-icon-wrapper {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  box-shadow: 0 4px 12px rgba(250, 112, 154, 0.3);
}

.kpi-card-purple .kpi-icon-wrapper {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.kpi-card-red .kpi-icon-wrapper {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.kpi-card-indigo .kpi-icon-wrapper {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.kpi-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.kpi-content {
  flex: 1;
}

.kpi-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin: 0 0 0.35rem 0;
  font-weight: 500;
  line-height: 1.2;
}

.kpi-value {
  font-size: 1.375rem;
  font-weight: 700;
  color: #1a1d29;
  margin: 0 0 0.2rem 0;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.kpi-change {
  font-size: 0.7rem;
  margin: 0;
  font-weight: 500;
  line-height: 1.2;
}

.kpi-change.positive {
  color: #28a745;
}

.kpi-change.negative {
  color: #dc3545;
}

.kpi-change.neutral {
  color: #6c757d;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  min-height: 350px;
}

.chart-full {
  grid-column: 1 / -1;
}

/* Responsive */
@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 1rem;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
    gap: 0.875rem;
  }

  .charts-grid {
    gap: 1rem;
  }

  .kpi-card {
    padding: 0.875rem;
  }

  .chart-card {
    padding: 1.25rem;
  }
}

@media (min-width: 1400px) {
  .kpi-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .dashboard-container {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }

  .kpi-card,
  .chart-card {
    background: #2d3748;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .kpi-label {
    color: #cbd5e0;
  }

  .kpi-value {
    color: #f7fafc;
  }
}

/* Compact Customization Modal */
.modal-overlay-compact {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
}

.modal-container-compact {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  width: 90%;
  max-width: 550px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: modalSlideIn 0.25s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header-compact {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

.modal-title-compact {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1d29;
  margin: 0;
}

.modal-close-compact {
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
  padding: 0.375rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-compact:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1a1d29;
}

.modal-body-compact {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.section-compact {
  margin-bottom: 1.25rem;
}

.section-compact:last-child {
  margin-bottom: 0;
}

.section-title-compact {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6c757d;
  margin: 0 0 0.625rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.widgets-grid-compact {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.625rem;
}

.widget-item-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  position: relative;
}

.widget-item-compact:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(13, 110, 253, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.widget-item-compact.widget-active {
  background: rgba(13, 110, 253, 0.08);
  border-color: rgba(13, 110, 253, 0.4);
}

.widget-icon-compact {
  width: 32px;
  height: 32px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.widget-name-compact {
  font-size: 0.7rem;
  font-weight: 600;
  color: #1a1d29;
  margin: 0;
  text-align: center;
  line-height: 1.2;
}

.widget-check-compact {
  width: 14px;
  height: 14px;
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
}

.modal-footer-compact {
  padding: 0.875rem 1.25rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 0.625rem;
  justify-content: flex-end;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

.btn-compact {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(40, 167, 69, 0.3);
}

.btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(40, 167, 69, 0.4);
}

.btn-reset {
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

.btn-reset:hover {
  background: rgba(108, 117, 125, 0.2);
  color: #495057;
}
</style>
