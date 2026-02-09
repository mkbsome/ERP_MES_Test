/**
 * ERP API Module Exports
 */
export { default as apiClient, API_BASE_URL } from './client';
export {
  WebSocketClient,
  salesWS,
  inventoryWS,
  purchaseWS,
  erpAlertsWS,
  erpDashboardWS
} from './websocket';

// Dashboard
export { dashboardApi } from './endpoints/dashboard';
export type {
  KPICard,
  MonthlySalesData,
  InventoryStatusData,
  RecentOrder,
  Alert,
  ERPDashboardData,
  SalesSummary,
  InventorySummary,
  PurchaseSummary,
  MonthlyTrend,
  CustomerRanking,
  ProductRanking,
} from './endpoints/dashboard';

// Sales
export { salesApi } from './endpoints/sales';
export type {
  SalesOrder,
  SalesOrderItem,
  SalesOrderDetail,
  Shipment,
  SalesRevenue,
  SalesListResponse,
  SalesOrderCreate,
} from './endpoints/sales';

// Purchase
export { purchaseApi } from './endpoints/purchase';
export type {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderDetail,
  GoodsReceipt,
  PurchaseInvoice,
  PurchaseListResponse,
  PurchaseOrderCreate,
} from './endpoints/purchase';

// Inventory
export { inventoryApi } from './endpoints/inventory';
export type {
  InventoryStock,
  InventoryTransaction,
  InventoryListResponse,
  InventoryAnalysis,
  TransactionCreate,
} from './endpoints/inventory';

// Production
export { productionApi } from './endpoints/production';
export type {
  BOMItem,
  BOM,
  RoutingStep,
  Routing,
  WorkOrder,
  ProductionListResponse,
  WeeklyProductionPlan,
  WorkOrderCreate,
} from './endpoints/production';

// Master
export { masterApi } from './endpoints/master';
export type {
  Product,
  Customer,
  Vendor,
  Warehouse,
  MasterListResponse,
} from './endpoints/master';
