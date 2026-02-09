/**
 * Production API Endpoints
 */
import apiClient from '../client';

export interface ProductionOrder {
  id: string;
  tenant_id: string;
  production_order_no: string;
  erp_work_order_no?: string;
  product_code: string;
  product_name?: string;
  product_rev?: string;
  line_code: string;
  target_qty: number;
  unit: string;
  started_qty: number;
  produced_qty: number;
  good_qty: number;
  defect_qty: number;
  scrap_qty: number;
  planned_start: string;
  planned_end: string;
  actual_start?: string;
  actual_end?: string;
  status: 'planned' | 'released' | 'started' | 'paused' | 'completed' | 'closed' | 'cancelled';
  current_operation?: number;
  priority: number;
  lot_no?: string;
  customer_code?: string;
  sales_order_no?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  completion_rate?: number;
  defect_rate?: number;
}

export interface ProductionOrderListResponse {
  items: ProductionOrder[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProductionResult {
  id: string;
  tenant_id: string;
  production_order_no: string;
  result_timestamp: string;
  shift_code: string;
  line_code: string;
  equipment_code?: string;
  operation_no: number;
  operation_name?: string;
  product_code: string;
  lot_no?: string;
  input_qty: number;
  output_qty: number;
  good_qty: number;
  defect_qty: number;
  rework_qty: number;
  scrap_qty: number;
  unit: string;
  cycle_time_sec?: number;
  takt_time_sec?: number;
  operator_code?: string;
  operator_name?: string;
  result_type: 'normal' | 'rework' | 'test' | 'trial' | 'sample';
  created_at: string;
  yield_rate?: number;
  defect_rate?: number;
}

export interface RealtimeProduction {
  id: string;
  timestamp: string;
  line_code: string;
  equipment_code: string;
  production_order_no?: string;
  product_code?: string;
  current_operation?: string;
  takt_count: number;
  good_count: number;
  defect_count: number;
  cycle_time_ms?: number;
  target_cycle_time_ms?: number;
  equipment_status?: string;
  operator_code?: string;
}

export interface DailyProductionSummary {
  date: string;
  line_code: string;
  total_input: number;
  total_output: number;
  total_good: number;
  total_defect: number;
  yield_rate: number;
  defect_rate: number;
}

export interface LineProductionStatus {
  line_code: string;
  line_name?: string;
  current_order_no?: string;
  product_code?: string;
  target_qty?: number;
  produced_qty?: number;
  completion_rate: number;
  status: string;
  equipment_count: number;
  running_count: number;
  down_count: number;
}

// API Functions

export const getWorkOrders = async (params?: {
  page?: number;
  page_size?: number;
  status?: string;
  line_code?: string;
  product_code?: string;
  start_date?: string;
  end_date?: string;
}): Promise<ProductionOrderListResponse> => {
  const response = await apiClient.get('/mes/production/work-orders', { params });
  return response.data;
};

export const getWorkOrder = async (orderId: string): Promise<ProductionOrder> => {
  const response = await apiClient.get(`/mes/production/work-orders/${orderId}`);
  return response.data;
};

export const startWorkOrder = async (orderId: string): Promise<{ message: string; order_no: string }> => {
  const response = await apiClient.post(`/mes/production/work-orders/${orderId}/start`);
  return response.data;
};

export const completeWorkOrder = async (orderId: string): Promise<{ message: string; order_no: string }> => {
  const response = await apiClient.post(`/mes/production/work-orders/${orderId}/complete`);
  return response.data;
};

export const getProductionResults = async (params?: {
  page?: number;
  page_size?: number;
  production_order_no?: string;
  line_code?: string;
  shift_code?: string;
  start_datetime?: string;
  end_datetime?: string;
}): Promise<ProductionResult[]> => {
  const response = await apiClient.get('/mes/production/results', { params });
  return response.data;
};

export const createProductionResult = async (data: Partial<ProductionResult>): Promise<ProductionResult> => {
  const response = await apiClient.post('/mes/production/results', data);
  return response.data;
};

export const getRealtimeProduction = async (params?: {
  line_code?: string;
  limit?: number;
}): Promise<RealtimeProduction[]> => {
  const response = await apiClient.get('/mes/production/results/realtime', { params });
  return response.data;
};

export const getDailyProductionAnalysis = async (params?: {
  line_code?: string;
  start_date?: string;
  end_date?: string;
}): Promise<DailyProductionSummary[]> => {
  const response = await apiClient.get('/mes/production/analysis/daily', { params });
  return response.data;
};

export const getLineProductionStatus = async (lineCode: string): Promise<LineProductionStatus> => {
  const response = await apiClient.get(`/mes/production/analysis/line/${lineCode}`);
  return response.data;
};
