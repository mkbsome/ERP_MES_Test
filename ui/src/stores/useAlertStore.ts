/**
 * Alert Store using Zustand
 */
import { create } from 'zustand';

export interface Alert {
  id: string;
  type: 'alarm' | 'quality' | 'downtime' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  equipment_code?: string;
  line_code?: string;
  message: string;
  timestamp: string;
  acknowledged?: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

interface AlertStore {
  alerts: Alert[];
  unacknowledgedCount: number;

  // Actions
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;
  acknowledgeAlert: (id: string, by?: string) => void;
  clearAlerts: () => void;
  clearAcknowledged: () => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],
  unacknowledgedCount: 0,

  addAlert: (alert) => {
    set((state) => {
      // Avoid duplicates
      if (state.alerts.some((a) => a.id === alert.id)) {
        return state;
      }

      const newAlerts = [alert, ...state.alerts].slice(0, 100); // Keep max 100 alerts
      return {
        alerts: newAlerts,
        unacknowledgedCount: newAlerts.filter((a) => !a.acknowledged).length,
      };
    });
  },

  removeAlert: (id) => {
    set((state) => {
      const newAlerts = state.alerts.filter((a) => a.id !== id);
      return {
        alerts: newAlerts,
        unacknowledgedCount: newAlerts.filter((a) => !a.acknowledged).length,
      };
    });
  },

  acknowledgeAlert: (id, by) => {
    set((state) => {
      const newAlerts = state.alerts.map((a) =>
        a.id === id
          ? {
              ...a,
              acknowledged: true,
              acknowledgedAt: new Date().toISOString(),
              acknowledgedBy: by,
            }
          : a
      );
      return {
        alerts: newAlerts,
        unacknowledgedCount: newAlerts.filter((a) => !a.acknowledged).length,
      };
    });
  },

  clearAlerts: () => {
    set({ alerts: [], unacknowledgedCount: 0 });
  },

  clearAcknowledged: () => {
    set((state) => {
      const newAlerts = state.alerts.filter((a) => !a.acknowledged);
      return {
        alerts: newAlerts,
        unacknowledgedCount: newAlerts.length,
      };
    });
  },
}));

// Selectors
export const useCriticalAlerts = () =>
  useAlertStore((state) =>
    state.alerts.filter((a) => a.severity === 'critical' && !a.acknowledged)
  );

export const useAlertsByType = (type: Alert['type']) =>
  useAlertStore((state) => state.alerts.filter((a) => a.type === type));

export const useUnacknowledgedAlerts = () =>
  useAlertStore((state) => state.alerts.filter((a) => !a.acknowledged));
