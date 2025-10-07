<template>
  <div class="setup-hub-container">
    <!-- Header -->
    <div class="header-section">
      <div class="header-content">
        <div class="title-wrapper">
          <div class="title-icon-bg">
            <feather-icon name="settings" class="title-icon" />
          </div>
          <div>
            <h1 class="page-title">{{ t`Setup` }}</h1>
            <p class="page-subtitle">{{ t`Configure and customize your accounting system` }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Setup Grid -->
    <div class="setup-grid">
      <!-- Chart of Accounts Card -->
      <div class="setup-card" @click="navigateTo('/chart-of-accounts')">
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <feather-icon name="git-branch" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`Chart of Accounts` }}</h3>
          <p class="card-description">{{ t`Manage your account hierarchy` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>

      <!-- Tax Templates Card -->
      <div class="setup-card" @click="navigateTo('/list/Tax')">
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <feather-icon name="percent" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`Tax Templates` }}</h3>
          <p class="card-description">{{ t`Configure tax rates and rules` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>

      <!-- Import Wizard Card -->
      <div class="setup-card" @click="navigateTo('/import-wizard')">
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <feather-icon name="upload" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`Import Wizard` }}</h3>
          <p class="card-description">{{ t`Import data from external sources` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>

      <!-- Print Templates Card -->
      <div class="setup-card" @click="navigateTo('/list/PrintTemplate')">
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <feather-icon name="printer" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`Print Templates` }}</h3>
          <p class="card-description">{{ t`Customize invoice print layouts` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>

      <!-- Customize Form Card -->
      <div
        v-if="enableFormCustomization"
        class="setup-card"
        @click="navigateTo('/list/CustomForm')"
      >
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
          <feather-icon name="edit-3" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`Customize Form` }}</h3>
          <p class="card-description">{{ t`Modify form fields and layouts` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>

      <!-- Settings Card -->
      <div class="setup-card" @click="navigateTo('/settings')">
        <div class="card-icon-wrapper" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
          <feather-icon name="sliders" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ t`Settings` }}</h3>
          <p class="card-description">{{ t`Configure system preferences` }}</p>
        </div>
        <div class="card-footer">
          <feather-icon name="arrow-right" class="arrow-icon" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { fyo } from 'src/initFyo';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SetupHub',
  data() {
    return {
      enableFormCustomization: false,
    };
  },
  mounted() {
    this.enableFormCustomization = !!fyo.singles.AccountingSettings?.enableFormCustomization;
  },
  methods: {
    navigateTo(route: string) {
      this.$router.push(route);
    },
  },
});
</script>

<style scoped>
.setup-hub-container {
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
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(108, 117, 125, 0.25);
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

.setup-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.setup-card {
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

.setup-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
  border-color: rgba(108, 117, 125, 0.15);
}

.setup-card:active {
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

.setup-card:hover .card-icon-wrapper {
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

.setup-card:hover .arrow-icon {
  color: #6c757d;
  transform: translateX(4px);
}

/* Responsive */
@media (max-width: 768px) {
  .setup-hub-container {
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

  .setup-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .setup-card {
    padding: 1.5rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .setup-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1025px) {
  .setup-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1400px) {
  .setup-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 1600px) {
  .setup-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .setup-hub-container {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }

  .page-title {
    color: #f7fafc;
  }

  .page-subtitle {
    color: #cbd5e0;
  }

  .setup-card {
    background: #2d3748;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .card-title {
    color: #f7fafc;
  }

  .card-description {
    color: #cbd5e0;
  }

  .setup-card:hover {
    border-color: rgba(108, 117, 125, 0.3);
  }
}
</style>
