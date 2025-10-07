<template>
  <div
    class="
      py-2
      h-full
      flex
      justify-between
      flex-col
      relative
      transition-all
      duration-300
    "
    :class="{
      'window-drag': platform !== 'Windows',
    }"
    :style="{
      background: 'linear-gradient(180deg, #e3f2fd 0%, #bbdefb 100%)',
      boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
      width: isExpanded ? '240px' : '70px',
      minWidth: isExpanded ? '240px' : '70px',
    }"
  >
    <div>
      <!-- Company name -->
      <div
        class="px-4 flex flex-row items-center justify-between mb-4"
        :class="
          platform === 'Mac' && languageDirection === 'ltr' ? 'mt-10' : 'mt-2'
        "
      >
        <h6
          v-if="isExpanded"
          data-testid="company-name"
          class="
            font-semibold
            whitespace-nowrap
            overflow-auto
            no-scrollbar
            select-none
            transition-opacity
            duration-300
          "
          style="color: #1565c0; font-size: 1.2rem; letter-spacing: 0.5px;"
        >
          {{ companyName }}
        </h6>
        <div
          v-else
          class="flex justify-center items-center w-full"
          style="color: #1565c0; font-size: 1.5rem; font-weight: bold;"
        >
          {{ companyName.charAt(0).toUpperCase() }}
        </div>
      </div>

      <!-- Sidebar Items -->
      <div v-for="group in groups" :key="group.label">
        <div
          class="
            flex
            items-center
            cursor-pointer
            h-12
            transition-all
            duration-300
          "
          :class="isExpanded ? 'px-4' : 'justify-center'"
          :style="
            isGroupActive(group) && !group.items
              ? 'background: #ffffff; border-radius: 8px; margin: 4px 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-left: 3px solid #1976d2;'
              : 'margin: 4px 8px; border-radius: 8px;'
          "
          @mouseover="(e) => !isGroupActive(group) && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)')"
          @mouseout="(e) => !isGroupActive(group) && (e.currentTarget.style.background = '')"
          @click="routeToSidebarItem(group)"
          :title="!isExpanded ? group.label : ''"
        >
          <Icon
            class="flex-shrink-0"
            :name="group.icon"
            :size="group.iconSize || '18'"
            :height="group.iconHeight ?? 0"
            :active="!!isGroupActive(group)"
            :darkMode="darkMode"
            :class="isGroupActive(group) && !group.items ? '-ms-1' : ''"
          />
          <div
            v-if="isExpanded"
            class="ms-2 text-base transition-opacity duration-300"
            :style="
              isGroupActive(group) && !group.items
                ? 'color: #1565c0; font-weight: 600;'
                : 'color: #546e7a; font-weight: 500;'
            "
          >
            {{ group.label }}
          </div>
        </div>

        <!-- Expanded Group -->
        <div v-if="group.items && isGroupActive(group) && isExpanded">
          <div
            v-for="item in group.items"
            :key="item.label"
            class="
              text-sm
              h-10
              ps-10
              cursor-pointer
              flex
              items-center
              transition-all
              duration-300
            "
            :style="
              isItemActive(item)
                ? 'background: #ffffff; color: #1565c0; border-radius: 8px; margin: 2px 8px; font-weight: 600; border-left: 3px solid #42a5f5;'
                : 'color: #546e7a; margin: 2px 8px; border-radius: 8px; font-weight: 500;'
            "
            @mouseover="(e) => !isItemActive(item) && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)')"
            @mouseout="(e) => !isItemActive(item) && (e.currentTarget.style.background = '')"
            @click="routeToSidebarItem(item)"
          >
            <p :style="isItemActive(item) ? 'margin-left: -4px' : ''">
              {{ item.label }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Report Issue and DB Switcher -->
    <div class="window-no-drag flex flex-col gap-2 py-2" :class="isExpanded ? 'px-4' : 'px-2'">
      <button
        class="
          flex
          text-sm
          gap-2
          items-center
          px-2
          py-1
          rounded-lg
          transition-all
          duration-300
        "
        :class="isExpanded ? '' : 'justify-center'"
        :title="!isExpanded ? t`Help` : ''"
        style="color: #546e7a;"
        @mouseover="(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'; e.currentTarget.style.color = '#1565c0'; }"
        @mouseout="(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#546e7a'; }"
        @click="openDocumentation"
      >
        <feather-icon name="help-circle" class="h-4 w-4 flex-shrink-0" />
        <p v-if="isExpanded">
          {{ t`Help` }}
        </p>
      </button>

      <button
        class="
          flex
          text-sm
          gap-2
          items-center
          px-2
          py-1
          rounded-lg
          transition-all
          duration-300
        "
        :class="isExpanded ? '' : 'justify-center'"
        :title="!isExpanded ? t`Shortcuts` : ''"
        style="color: #546e7a;"
        @mouseover="(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'; e.currentTarget.style.color = '#1565c0'; }"
        @mouseout="(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#546e7a'; }"
        @click="viewShortcuts = true"
      >
        <feather-icon name="command" class="h-4 w-4 flex-shrink-0" />
        <p v-if="isExpanded">{{ t`Shortcuts` }}</p>
      </button>

      <button
        data-testid="change-db"
        class="
          flex
          text-sm
          gap-2
          items-center
          px-2
          py-1
          rounded-lg
          transition-all
          duration-300
        "
        :class="isExpanded ? '' : 'justify-center'"
        :title="!isExpanded ? t`Change DB` : ''"
        style="color: #546e7a;"
        @mouseover="(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'; e.currentTarget.style.color = '#1565c0'; }"
        @mouseout="(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#546e7a'; }"
        @click="$emit('change-db-file')"
      >
        <feather-icon name="database" class="h-4 w-4 flex-shrink-0" />
        <p v-if="isExpanded">{{ t`Change DB` }}</p>
      </button>

      <button
        class="
          flex
          text-sm
          gap-2
          items-center
          px-2
          py-1
          rounded-lg
          transition-all
          duration-300
        "
        :class="isExpanded ? '' : 'justify-center'"
        :title="!isExpanded ? t`Report Issue` : ''"
        style="color: #546e7a;"
        @mouseover="(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'; e.currentTarget.style.color = '#1565c0'; }"
        @mouseout="(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#546e7a'; }"
        @click="() => reportIssue()"
      >
        <feather-icon name="flag" class="h-4 w-4 flex-shrink-0" />
        <p v-if="isExpanded">
          {{ t`Report Issue` }}
        </p>
      </button>

      <p
        v-if="showDevMode"
        class="text-xs text-gray-500 select-none cursor-pointer"
        @click="showDevMode = false"
        title="Open dev tools with Ctrl+Shift+I"
      >
        dev mode
      </p>
    </div>

    <!-- Expand/Collapse Toggle Button -->
    <button
      class="
        absolute
        top-4
        end-0
        rounded-lg
        p-2
        m-2
        transition-all
        duration-300
      "
      style="color: #546e7a; background: rgba(255, 255, 255, 0.5);"
      @mouseover="(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#1565c0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'; }"
      @mouseout="(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'; e.currentTarget.style.color = '#546e7a'; e.currentTarget.style.boxShadow = ''; }"
      @click="toggleExpand"
      :title="isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'"
    >
      <feather-icon :name="isExpanded ? 'chevrons-left' : 'chevrons-right'" class="w-4 h-4" />
    </button>

    <Modal :open-modal="viewShortcuts" @closemodal="viewShortcuts = false">
      <ShortcutsHelper class="w-form" />
    </Modal>
  </div>
</template>
<script lang="ts">
import { reportIssue } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import { languageDirectionKey, shortcutsKey } from 'src/utils/injectionKeys';
import { docsPathRef } from 'src/utils/refs';
import { getSidebarConfig } from 'src/utils/sidebarConfig';
import { SidebarConfig, SidebarItem, SidebarRoot } from 'src/utils/types';
import { routeTo, toggleSidebar } from 'src/utils/ui';
import { defineComponent, inject } from 'vue';
import router from '../router';
import Icon from './Icon.vue';
import Modal from './Modal.vue';
import ShortcutsHelper from './ShortcutsHelper.vue';

const COMPONENT_NAME = 'Sidebar';

export default defineComponent({
  components: {
    Icon,
    Modal,
    ShortcutsHelper,
  },
  props: {
    darkMode: { type: Boolean, default: false },
  },
  emits: ['change-db-file', 'toggle-darkmode'],
  setup() {
    return {
      languageDirection: inject(languageDirectionKey),
      shortcuts: inject(shortcutsKey),
    };
  },
  data() {
    return {
      companyName: '',
      groups: [],
      viewShortcuts: false,
      activeGroup: null,
      showDevMode: false,
      isExpanded: true,
    } as {
      companyName: string;
      groups: SidebarConfig;
      viewShortcuts: boolean;
      activeGroup: null | SidebarRoot;
      showDevMode: boolean;
      isExpanded: boolean;
    };
  },
  computed: {
    appVersion() {
      return fyo.store.appVersion;
    },
  },
  async mounted() {
    const { companyName } = await fyo.doc.getDoc('AccountingSettings');
    this.companyName = companyName as string;
    this.groups = await getSidebarConfig();

    // Restore sidebar state from localStorage
    const savedState = localStorage.getItem('sidebarExpanded');
    if (savedState !== null) {
      this.isExpanded = savedState === 'true';
    }

    this.setActiveGroup();
    router.afterEach(() => {
      this.setActiveGroup();
    });

    this.shortcuts?.shift.set(COMPONENT_NAME, ['KeyH'], () => {
      if (document.body === document.activeElement) {
        this.toggleSidebar();
      }
    });
    this.shortcuts?.set(COMPONENT_NAME, ['F1'], () => this.openDocumentation());

    this.showDevMode = this.fyo.store.isDevelopment;
  },
  unmounted() {
    this.shortcuts?.delete(COMPONENT_NAME);
  },
  methods: {
    routeTo,
    reportIssue,
    toggleSidebar,
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
      // Store preference in localStorage
      localStorage.setItem('sidebarExpanded', this.isExpanded.toString());
    },
    openDocumentation() {
      ipc.openLink('https://docs.vitibook.io/' + docsPathRef.value);
    },
    setActiveGroup() {
      const { fullPath } = this.$router.currentRoute.value;
      const fallBackGroup = this.activeGroup;
      this.activeGroup =
        this.groups.find((g) => {
          if (fullPath.startsWith(g.route) && g.route !== '/') {
            return true;
          }

          if (g.route === fullPath) {
            return true;
          }

          if (g.items) {
            let activeItem = g.items.filter(
              ({ route }) => route === fullPath || fullPath.startsWith(route)
            );

            if (activeItem.length) {
              return true;
            }
          }
        }) ??
        fallBackGroup ??
        this.groups[0];
    },
    isItemActive(item: SidebarItem) {
      const { path: currentRoute, params } = this.$route;
      const routeMatch = currentRoute === item.route;

      const schemaNameMatch =
        item.schemaName && params.schemaName === item.schemaName;

      const isMatch = routeMatch || schemaNameMatch;
      if (params.name && item.schemaName && !isMatch) {
        return currentRoute.includes(`${item.schemaName}/${params.name}`);
      }

      return isMatch;
    },
    isGroupActive(group: SidebarRoot) {
      return this.activeGroup && group.label === this.activeGroup.label;
    },
    routeToSidebarItem(item: SidebarItem | SidebarRoot) {
      routeTo(this.getPath(item));
    },
    getPath(item: SidebarItem | SidebarRoot) {
      const { route: path, filters } = item;
      if (!filters) {
        return path;
      }

      return { path, query: { filters: JSON.stringify(filters) } };
    },
  },
});
</script>
