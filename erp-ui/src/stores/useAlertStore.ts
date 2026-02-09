/**
 * ERP Alert Store (Zustand)
 */
import { create } from 'zustand';

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  time: string;
  acknowledged?: boolean;
}

interface AlertStore {
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  clearAll: () => void;
  getUnacknowledged: () => Alert[];
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],

  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100), // 최대 100개 유지
    }));
  },

  removeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    }));
  },

  acknowledgeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    }));
  },

  clearAll: () => {
    set({ alerts: [] });
  },

  getUnacknowledged: () => {
    return get().alerts.filter((a) => !a.acknowledged);
  },
}));
