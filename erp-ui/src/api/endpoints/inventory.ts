/**
 * ERP Inventory API Endpoints
 */
import apiClient from '../client';

// Types
export interface InventoryStock {
  id: number;
  item_code: string;
  item_name: string;
  item_type: 'raw_material' | 'wip' | 'finished_goods';
  warehouse_code: string;
  warehouse_name: string;
  location: string;
  qty: number;
  unit: string;
  unit_cost: number;
  total_value: number;
  safety_stock: number;
  status: 'normal' | 'below_safety' | 'excess' | 'out_of_stock';
  last_movement_date: string;
}

export interface InventoryTransaction {
  id: number;
  transaction_no: string;
  item_code: string;
  item_name: string;
  transaction_type: 'receipt' | 'issue' | 'transfer' | 'adjustment';
  qty: number;
  from_warehouse?: string;
  to_warehouse?: string;
  reference_no?: string;
  transaction_date: string;
  created_by: string;
  remarks?: string;
}

export interface InventoryListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface InventoryAnalysis {
  total_items: number;
  total_value: number;
  by_type: {
    type: string;
    count: number;
    value: number;
  }[];
  by_status: {
    status: string;
    count: number;
  }[];
  turnover_rate: number;
  slow_moving_items: number;
  aging_analysis: {
    period: string;
    count: number;
    value: number;
  }[];
}

export interface TransactionCreate {
  item_code: string;
  transaction_type: 'receipt' | 'issue' | 'transfer' | 'adjustment';
  qty: number;
  from_warehouse?: string;
  to_warehouse?: string;
  reference_no?: string;
  remarks?: string;
}

// API Functions
export const inventoryApi = {
  // 재고 현황 목록
  getStocks: async (params?: {
    page?: number;
    page_size?: number;
    item_type?: string;
    warehouse_code?: string;
    status?: string;
    search?: string;
  }): Promise<InventoryListResponse<InventoryStock>> => {
    const response = await apiClient.get('/erp/inventory/stocks', { params });
    return response.data;
  },

  // 품목별 재고 상세
  getStockByItem: async (itemCode: string): Promise<InventoryStock[]> => {
    const response = await apiClient.get(`/erp/inventory/stocks/${itemCode}`);
    return response.data;
  },

  // 재고 이동/조정 내역
  getTransactions: async (params?: {
    page?: number;
    page_size?: number;
    transaction_type?: string;
    item_code?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<InventoryListResponse<InventoryTransaction>> => {
    const response = await apiClient.get('/erp/inventory/transactions', { params });
    return response.data;
  },

  // 재고 이동/조정 등록
  createTransaction: async (data: TransactionCreate): Promise<InventoryTransaction> => {
    const response = await apiClient.post('/erp/inventory/transactions', data);
    return response.data;
  },

  // 재고 분석
  getAnalysis: async (): Promise<InventoryAnalysis> => {
    const response = await apiClient.get('/erp/inventory/analysis');
    return response.data;
  },

  // 안전재고 미달 품목
  getBelowSafetyStock: async (): Promise<InventoryStock[]> => {
    const response = await apiClient.get('/erp/inventory/below-safety');
    return response.data;
  },

  // 과잉재고 품목
  getExcessStock: async (): Promise<InventoryStock[]> => {
    const response = await apiClient.get('/erp/inventory/excess');
    return response.data;
  },

  // 재고 요약
  getSummary: async (): Promise<{
    total_items: number;
    total_value: number;
    raw_materials: { count: number; value: number };
    wip: { count: number; value: number };
    finished_goods: { count: number; value: number };
    alerts: { below_safety: number; excess: number; out_of_stock: number };
  }> => {
    const response = await apiClient.get('/erp/inventory/summary');
    return response.data;
  },
};

export default inventoryApi;
