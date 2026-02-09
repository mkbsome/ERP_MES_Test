/**
 * ERP Dashboard API Endpoints
 */
import apiClient from '../client';

// Types
export interface KPICard {
  title: string;
  value: string;
  raw_value: number;
  change: number;
  change_period: string;
  trend: 'up' | 'down' | 'stable';
  unit?: string;
}

export interface MonthlySalesData {
  month: string;
  sales: number;
  orders: number;
}

export interface InventoryStatusData {
  name: string;
  value: number;
  color: string;
}

export interface RecentOrder {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

export interface Alert {
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  time: string;
}

export interface ERPDashboardData {
  kpis: KPICard[];
  monthly_sales: MonthlySalesData[];
  inventory_status: InventoryStatusData[];
  recent_orders: RecentOrder[];
  alerts: Alert[];
}

export interface SalesSummary {
  current_month: number;
  current_month_target: number;
  achievement_rate: number;
  quarter_cumulative: number;
  year_cumulative: number;
  yoy_growth: number;
}

export interface InventorySummary {
  total_items: number;
  total_value: number;
  below_safety_count: number;
  excess_count: number;
  out_of_stock_count: number;
  turnover_rate: number;
}

export interface PurchaseSummary {
  pending_orders: number;
  pending_receipts: number;
  pending_payments: number;
  overdue_count: number;
}

export interface MonthlyTrend {
  month: string;
  sales: number;
  orders: number;
  target: number;
}

export interface CustomerRanking {
  rank: number;
  customer_code: string;
  customer_name: string;
  revenue: number;
  ratio: number;
}

export interface ProductRanking {
  rank: number;
  product_code: string;
  product_name: string;
  revenue: number;
  ratio: number;
}

// API Functions
export const dashboardApi = {
  // 전체 대시보드 데이터
  getSummary: async (): Promise<ERPDashboardData> => {
    const response = await apiClient.get('/dashboard/erp/summary');
    return response.data;
  },

  // KPI 데이터
  getKPIs: async (): Promise<KPICard[]> => {
    const response = await apiClient.get('/dashboard/erp/kpis');
    return response.data;
  },

  // 매출 요약
  getSalesSummary: async (): Promise<SalesSummary> => {
    const response = await apiClient.get('/dashboard/erp/sales/summary');
    return response.data;
  },

  // 재고 요약
  getInventorySummary: async (): Promise<InventorySummary> => {
    const response = await apiClient.get('/dashboard/erp/inventory/summary');
    return response.data;
  },

  // 구매 요약
  getPurchaseSummary: async (): Promise<PurchaseSummary> => {
    const response = await apiClient.get('/dashboard/erp/purchase/summary');
    return response.data;
  },

  // 알림 목록
  getAlerts: async (limit: number = 10): Promise<Alert[]> => {
    const response = await apiClient.get('/dashboard/erp/alerts', { params: { limit } });
    return response.data;
  },

  // 월별 트렌드
  getMonthlyTrend: async (months: number = 6): Promise<MonthlyTrend[]> => {
    const response = await apiClient.get('/dashboard/erp/monthly-trend', { params: { months } });
    return response.data;
  },

  // 고객 매출 순위
  getCustomerRanking: async (limit: number = 5): Promise<CustomerRanking[]> => {
    const response = await apiClient.get('/dashboard/erp/customer-ranking', { params: { limit } });
    return response.data;
  },

  // 제품 매출 순위
  getProductRanking: async (limit: number = 5): Promise<ProductRanking[]> => {
    const response = await apiClient.get('/dashboard/erp/product-ranking', { params: { limit } });
    return response.data;
  },
};

export default dashboardApi;
