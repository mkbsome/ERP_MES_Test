/**
 * ERP WebSocket React Hooks
 */
import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  WebSocketClient,
  salesWS,
  inventoryWS,
  purchaseWS,
  erpAlertsWS,
  erpDashboardWS,
} from '../api';
import { dashboardKeys } from './useDashboard';
import { salesKeys } from './useSales';
import { purchaseKeys } from './usePurchase';
import { inventoryKeys } from './useInventory';
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
 * Sales WebSocket hook
 */
export const useSalesWebSocket = () => {
  const queryClient = useQueryClient();

  const handlers: Record<string, MessageHandler> = {
    order_created: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.orders() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary() });
    },
    order_approved: (data) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.orders() });
      if (data.order_id) {
        queryClient.invalidateQueries({ queryKey: salesKeys.order(data.order_id) });
      }
    },
    shipment_created: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.shipments() });
      queryClient.invalidateQueries({ queryKey: salesKeys.orders() });
    },
  };

  return useWebSocket(salesWS, handlers);
};

/**
 * Purchase WebSocket hook
 */
export const usePurchaseWebSocket = () => {
  const queryClient = useQueryClient();

  const handlers: Record<string, MessageHandler> = {
    order_created: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.orders() });
    },
    receipt_completed: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.receipts() });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.orders() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stocks() });
    },
  };

  return useWebSocket(purchaseWS, handlers);
};

/**
 * Inventory WebSocket hook
 */
export const useInventoryWebSocket = () => {
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();

  const handlers: Record<string, MessageHandler> = {
    stock_updated: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stocks() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
    },
    below_safety_alert: (data) => {
      addAlert({
        id: Date.now().toString(),
        type: 'warning',
        message: `안전재고 미달: ${data.item_name} (현재: ${data.current_qty}, 안전재고: ${data.safety_stock})`,
        time: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.belowSafety() });
    },
    out_of_stock_alert: (data) => {
      addAlert({
        id: Date.now().toString(),
        type: 'error',
        message: `재고 부족: ${data.item_name}`,
        time: new Date().toISOString(),
      });
    },
  };

  return useWebSocket(inventoryWS, handlers);
};

/**
 * ERP Alerts WebSocket hook
 */
export const useERPAlertsWebSocket = () => {
  const { addAlert, acknowledgeAlert } = useAlertStore();
  const queryClient = useQueryClient();

  const handlers: Record<string, MessageHandler> = {
    new_alert: (data) => {
      addAlert({
        id: data.alert_id || Date.now().toString(),
        type: data.type || 'info',
        message: data.message,
        time: data.time || new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.alerts() });
    },
    acknowledged: (data) => {
      if (data.alert_id) {
        acknowledgeAlert(data.alert_id);
      }
    },
  };

  const ws = useWebSocket(erpAlertsWS, handlers);

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
 * ERP Dashboard WebSocket hook
 */
export const useERPDashboardWebSocket = () => {
  const queryClient = useQueryClient();

  const handlers: Record<string, MessageHandler> = {
    kpi_update: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.kpis() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary() });
    },
    sales_update: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.salesSummary() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.monthlyTrend() });
    },
    inventory_update: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.inventorySummary() });
    },
    purchase_update: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.purchaseSummary() });
    },
  };

  return useWebSocket(erpDashboardWS, handlers);
};
