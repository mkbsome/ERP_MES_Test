/**
 * ERP App Store (Zustand)
 */
import { create } from 'zustand';

interface AppStore {
  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Selected items
  selectedCustomer: string | null;
  setSelectedCustomer: (code: string | null) => void;

  selectedProduct: string | null;
  setSelectedProduct: (code: string | null) => void;

  // Date range filter
  dateRange: {
    from: string | null;
    to: string | null;
  };
  setDateRange: (from: string | null, to: string | null) => void;

  // WebSocket connection status
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Theme
  darkMode: true, // ERP는 기본 다크모드
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // Selected items
  selectedCustomer: null,
  setSelectedCustomer: (code) => set({ selectedCustomer: code }),

  selectedProduct: null,
  setSelectedProduct: (code) => set({ selectedProduct: code }),

  // Date range
  dateRange: { from: null, to: null },
  setDateRange: (from, to) => set({ dateRange: { from, to } }),

  // WebSocket
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
