/**
 * ERP Production API Endpoints (BOM, Routing, Work Orders)
 */
import apiClient from '../client';

// Types
export interface BOMItem {
  item_seq: number;
  item_code: string;
  item_name: string;
  qty_per: number;
  unit: string;
  scrap_rate: number;
  remarks?: string;
}

export interface BOM {
  id: number;
  product_code: string;
  product_name: string;
  version: string;
  components: number;
  total_cost: number;
  status: 'active' | 'inactive' | 'draft';
  effective_date: string;
  expiry_date?: string;
  items: BOMItem[];
  created_at: string;
  updated_at: string;
}

export interface RoutingStep {
  step_seq: number;
  operation_code: string;
  operation_name: string;
  work_center_code: string;
  work_center_name: string;
  setup_time: number;
  run_time: number;
  queue_time: number;
  move_time: number;
  unit: string;
}

export interface Routing {
  id: number;
  product_code: string;
  product_name: string;
  version: string;
  operations: number;
  total_time: number;
  status: 'active' | 'inactive' | 'draft';
  effective_date: string;
  expiry_date?: string;
  steps: RoutingStep[];
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: number;
  order_no: string;
  product_code: string;
  product_name: string;
  qty: number;
  produced_qty: number;
  start_date: string;
  end_date: string;
  line_code: string;
  line_name: string;
  status: 'planned' | 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  priority: number;
  sales_order_no?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface WeeklyProductionPlan {
  day: string;
  planned: number;
  actual: number;
}

export interface WorkOrderCreate {
  product_code: string;
  qty: number;
  start_date: string;
  end_date: string;
  line_code: string;
  priority?: number;
  sales_order_no?: string;
  remarks?: string;
}

// API Functions
export const productionApi = {
  // BOM 목록
  getBOMs: async (params?: {
    page?: number;
    page_size?: number;
    product_code?: string;
    status?: string;
  }): Promise<ProductionListResponse<BOM>> => {
    const response = await apiClient.get('/erp/production/bom', { params });
    return response.data;
  },

  // BOM 상세
  getBOM: async (bomId: number): Promise<BOM> => {
    const response = await apiClient.get(`/erp/production/bom/${bomId}`);
    return response.data;
  },

  // BOM 전개
  getBOMExplosion: async (productCode: string, level?: number): Promise<{
    product_code: string;
    product_name: string;
    explosion_level: number;
    items: any[];
    total_components: number;
    total_cost: number;
  }> => {
    const response = await apiClient.get(`/erp/production/bom/${productCode}/explosion`, {
      params: { level },
    });
    return response.data;
  },

  // Routing 목록
  getRoutings: async (params?: {
    page?: number;
    page_size?: number;
    product_code?: string;
    status?: string;
  }): Promise<ProductionListResponse<Routing>> => {
    const response = await apiClient.get('/erp/production/routing', { params });
    return response.data;
  },

  // Routing 상세
  getRouting: async (routingId: number): Promise<Routing> => {
    const response = await apiClient.get(`/erp/production/routing/${routingId}`);
    return response.data;
  },

  // 작업지시 목록
  getWorkOrders: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    line_code?: string;
  }): Promise<ProductionListResponse<WorkOrder>> => {
    const response = await apiClient.get('/erp/production/work-orders', { params });
    return response.data;
  },

  // 작업지시 상세
  getWorkOrder: async (orderId: number): Promise<WorkOrder> => {
    const response = await apiClient.get(`/erp/production/work-orders/${orderId}`);
    return response.data;
  },

  // 작업지시 생성
  createWorkOrder: async (data: WorkOrderCreate): Promise<WorkOrder> => {
    const response = await apiClient.post('/erp/production/work-orders', data);
    return response.data;
  },

  // 작업지시 지시
  releaseWorkOrder: async (orderId: number): Promise<{ message: string; status: string }> => {
    const response = await apiClient.post(`/erp/production/work-orders/${orderId}/release`);
    return response.data;
  },

  // 작업지시 시작
  startWorkOrder: async (orderId: number): Promise<{ message: string; status: string }> => {
    const response = await apiClient.post(`/erp/production/work-orders/${orderId}/start`);
    return response.data;
  },

  // 작업지시 완료
  completeWorkOrder: async (orderId: number): Promise<{ message: string; status: string }> => {
    const response = await apiClient.post(`/erp/production/work-orders/${orderId}/complete`);
    return response.data;
  },

  // 주간 생산 계획
  getWeeklyPlan: async (): Promise<WeeklyProductionPlan[]> => {
    const response = await apiClient.get('/erp/production/weekly-plan');
    return response.data;
  },
};

export default productionApi;
