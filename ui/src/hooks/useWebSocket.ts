/**
 * WebSocket React Hooks
 */
import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  WebSocketClient,
  productionWS,
  equipmentWS,
  alertsWS,
  dashboardWS,
} from '../api';
import { productionKeys } from './useProduction';
import { equipmentKeys } from './useEquipment';
import { qualityKeys } from './useQuality';
import { useAlertStore } from '../stores/useAlertStore';

type MessageHandler = (data: any) => void;

/**
 * Generic WebSocket hook
 */
export const useWebSocket = (
  client: WebSocketClient,
  messageHandlers?: Record<string, MessageHandler>,
  autoConnect: boolean = true
) => {
  const handlersRef = useRef(messageHandlers);
  handlersRef.current = messageHandlers;

  useEffect(() => {
    if (autoConnect) {
      client.connect();
    }

    // Register message handlers
    if (handlersRef.current) {
      Object.entries(handlersRef.current).forEach(([type, handler]) => {
        client.on(type, handler);
      });
    }

    return () => {
      // Cleanup handlers
      if (handlersRef.current) {
        Object.entries(handlersRef.current).forEach(([type, handler]) => {
          client.off(type, handler);
        });
      }
    };
  }, [client, autoConnect]);

  const send = useCallback(
    (data: any) => {
      client.send(data);
    },
    [client]
  );

  return {
    send,
    isConnected: client.isConnected,
    disconnect: () => client.disconnect(),
    connect: () => client.connect(),
  };
};

/**
 * Production WebSocket hook with automatic query invalidation
 */
export const useProductionWebSocket = () => {
  const queryClient = useQueryClient();

  const handlers: Record<string, MessageHandler> = {
    production_update: (data) => {
      // Invalidate realtime and results queries
      queryClient.invalidateQueries({ queryKey: productionKeys.realtime() });
      queryClient.invalidateQueries({ queryKey: productionKeys.results() });
    },
    order_status: (data) => {
      // Invalidate work orders
      queryClient.invalidateQueries({ queryKey: productionKeys.workOrders() });
      if (data.order_id) {
        queryClient.invalidateQueries({ queryKey: productionKeys.workOrder(data.order_id) });
      }
    },
    line_status: (data) => {
      if (data.line_code) {
        queryClient.invalidateQueries({ queryKey: productionKeys.lineStatus(data.line_code) });
      }
    },
  };

  return useWebSocket(productionWS, handlers);
};

/**
 * Equipment WebSocket hook with automatic query invalidation
 */
export const useEquipmentWebSocket = () => {
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();

  const handlers: Record<string, MessageHandler> = {
    status_change: (data) => {
      // Invalidate equipment status queries
      queryClient.invalidateQueries({ queryKey: equipmentKeys.allStatus() });
      if (data.equipment_code) {
        queryClient.invalidateQueries({ queryKey: equipmentKeys.status(data.equipment_id) });
      }
    },
    alarm: (data) => {
      // Add to alerts
      addAlert({
        id: data.alert_id || Date.now().toString(),
        type: 'alarm',
        severity: data.severity || 'warning',
        equipment_code: data.equipment_code,
        message: data.alarm_message || data.message,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    },
    oee_update: (data) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.oee() });
    },
  };

  return useWebSocket(equipmentWS, handlers);
};

/**
 * Alerts WebSocket hook
 */
export const useAlertsWebSocket = () => {
  const { addAlert, acknowledgeAlert } = useAlertStore();

  const handlers: Record<string, MessageHandler> = {
    alarm: (data) => {
      addAlert({
        id: data.alert_id || Date.now().toString(),
        type: 'alarm',
        severity: data.severity || 'critical',
        equipment_code: data.equipment_code,
        message: data.alarm_message || data.message,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    },
    quality_alert: (data) => {
      addAlert({
        id: data.alert_id || Date.now().toString(),
        type: 'quality',
        severity: 'warning',
        line_code: data.line_code,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    },
    downtime_alert: (data) => {
      addAlert({
        id: data.alert_id || Date.now().toString(),
        type: 'downtime',
        severity: data.severity || 'warning',
        equipment_code: data.equipment_code,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    },
    acknowledged: (data) => {
      if (data.alert_id) {
        acknowledgeAlert(data.alert_id);
      }
    },
  };

  const ws = useWebSocket(alertsWS, handlers);

  const acknowledge = useCallback(
    (alertId: string) => {
      ws.send({ type: 'acknowledge', alert_id: alertId });
      acknowledgeAlert(alertId);
    },
    [ws, acknowledgeAlert]
  );

  return {
    ...ws,
    acknowledge,
  };
};

/**
 * Dashboard WebSocket hook for aggregated updates
 */
export const useDashboardWebSocket = () => {
  const queryClient = useQueryClient();

  const handlers: Record<string, MessageHandler> = {
    kpi_update: (data) => {
      // Update KPI data
      queryClient.invalidateQueries({ queryKey: productionKeys.dailyAnalysis() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.oee() });
    },
    production_summary: (data) => {
      queryClient.invalidateQueries({ queryKey: productionKeys.realtime() });
    },
    equipment_summary: (data) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.allStatus() });
    },
    quality_summary: (data) => {
      queryClient.invalidateQueries({ queryKey: qualityKeys.defectAnalysis() });
    },
  };

  return useWebSocket(dashboardWS, handlers);
};
