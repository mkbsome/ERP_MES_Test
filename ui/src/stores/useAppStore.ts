/**
 * Global App Store using Zustand
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Selected Line (for filtering)
  selectedLineCode: string | null;
  setSelectedLineCode: (code: string | null) => void;

  // Selected Date Range
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  setDateRange: (startDate: string | null, endDate: string | null) => void;

  // Auto-refresh
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // in seconds
  setAutoRefresh: (enabled: boolean, interval?: number) => void;

  // Language
  language: 'ko' | 'en';
  setLanguage: (lang: 'ko' | 'en') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      // Sidebar
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Selected Line
      selectedLineCode: null,
      setSelectedLineCode: (code) => set({ selectedLineCode: code }),

      // Date Range
      dateRange: {
        startDate: null,
        endDate: null,
      },
      setDateRange: (startDate, endDate) =>
        set({ dateRange: { startDate, endDate } }),

      // Auto-refresh
      autoRefreshEnabled: true,
      autoRefreshInterval: 5,
      setAutoRefresh: (enabled, interval) =>
        set({
          autoRefreshEnabled: enabled,
          ...(interval !== undefined && { autoRefreshInterval: interval }),
        }),

      // Language
      language: 'ko',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'mes-app-settings',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        autoRefreshEnabled: state.autoRefreshEnabled,
        autoRefreshInterval: state.autoRefreshInterval,
        language: state.language,
      }),
    }
  )
);

// Selectors
export const useTheme = () => useAppStore((state) => state.theme);
export const useSidebarCollapsed = () => useAppStore((state) => state.sidebarCollapsed);
export const useSelectedLineCode = () => useAppStore((state) => state.selectedLineCode);
export const useDateRange = () => useAppStore((state) => state.dateRange);
export const useAutoRefresh = () =>
  useAppStore((state) => ({
    enabled: state.autoRefreshEnabled,
    interval: state.autoRefreshInterval,
  }));
