/**
 * API Module Exports
 */

// Client
export { default as apiClient, API_BASE_URL } from './client';

// WebSocket
export {
  WebSocketClient,
  productionWS,
  equipmentWS,
  alertsWS,
  dashboardWS,
} from './websocket';

// Production API
export * from './endpoints/production';

// Equipment API
export * from './endpoints/equipment';

// Quality API
export * from './endpoints/quality';

// Material API
export * from './endpoints/material';
