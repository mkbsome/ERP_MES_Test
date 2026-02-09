/**
 * Material Management API Endpoints
 */
import apiClient from '../client';

// Types
export interface FeederSetup {
  setup_id: string;
  line_code: string;
  feeder_slot: string;
  feeder_type?: string;
  material_code?: string;
  material_name?: string;
  reel_id?: string;
  lot_no?: string;
  initial_qty: number;
  remaining_qty: number;
  status: 'active' | 'empty' | 'error' | 'standby';
  setup_time?: string;
  setup_by?: string;
  created_at: string;
}

export interface MaterialConsumption {
  consumption_id: string;
  order_id?: string;
  line_code: string;
  equipment_code?: string;
  material_code: string;
  material_name?: string;
  lot_no?: string;
  reel_id?: string;
  consumption_qty: number;
  unit: string;
  consumption_type: 'normal' | 'loss' | 'scrap' | 'rework';
  consumption_time: string;
  product_code?: string;
  result_lot_no?: string;
  created_at: string;
}

export interface MaterialRequest {
  request_id: string;
  request_no?: string;
  request_type: 'replenish' | 'return' | 'transfer';
  line_code: string;
  equipment_code?: string;
  feeder_slot?: string;
  material_code: string;
  material_name?: string;
  requested_qty: number;
  unit: string;
  urgency: 'normal' | 'urgent' | 'critical';
  status: 'requested' | 'approved' | 'in_transit' | 'delivered' | 'cancelled';
  requested_by?: string;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  delivered_by?: string;
  delivered_at?: string;
  delivered_qty?: number;
  remarks?: string;
  created_at: string;
}

export interface MaterialInventory {
  inventory_id: string;
  location_type: 'line' | 'buffer' | 'supermarket' | 'wip';
  location_code: string;
  material_code: string;
  material_name?: string;
  lot_no?: string;
  qty_on_hand: number;
  qty_allocated: number;
  qty_available: number;
  unit: string;
  min_qty: number;
  max_qty: number;
  last_count_date?: string;
  last_count_qty?: number;
  created_at: string;
}

export interface LineMaterialSummary {
  line_code: string;
  line_name?: string;
  total_feeders: number;
  active_feeders: number;
  empty_feeders: number;
  error_feeders: number;
  pending_requests: number;
  urgent_requests: number;
}

export interface MaterialShortageAlert {
  line_code: string;
  feeder_slot: string;
  material_code: string;
  material_name?: string;
  remaining_qty: number;
  estimated_empty_time?: string;
  urgency: string;
}

// Feeder Setup APIs
export const getFeederSetups = async (params?: {
  line_code?: string;
  status?: string;
  material_code?: string;
  page?: number;
  page_size?: number;
}) => {
  const { data } = await apiClient.get('/api/v1/mes/material/feeders', { params });
  return data;
};

export const getLineFeeders = async (lineCode: string) => {
  const { data } = await apiClient.get<FeederSetup[]>(`/api/v1/mes/material/feeders/${lineCode}`);
  return data;
};

export const createFeederSetup = async (feederData: Partial<FeederSetup>) => {
  const { data } = await apiClient.post<FeederSetup>('/api/v1/mes/material/feeders', feederData);
  return data;
};

export const updateFeederSetup = async (setupId: string, feederData: Partial<FeederSetup>) => {
  const { data } = await apiClient.patch<FeederSetup>(`/api/v1/mes/material/feeders/${setupId}`, feederData);
  return data;
};

// Material Consumption APIs
export const getMaterialConsumption = async (params?: {
  line_code?: string;
  material_code?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}) => {
  const { data } = await apiClient.get('/api/v1/mes/material/consumption', { params });
  return data;
};

export const createMaterialConsumption = async (consumptionData: Partial<MaterialConsumption>) => {
  const { data } = await apiClient.post<MaterialConsumption>('/api/v1/mes/material/consumption', consumptionData);
  return data;
};

// Material Request APIs
export const getMaterialRequests = async (params?: {
  line_code?: string;
  status?: string;
  urgency?: string;
  page?: number;
  page_size?: number;
}) => {
  const { data } = await apiClient.get('/api/v1/mes/material/requests', { params });
  return data;
};

export const createMaterialRequest = async (requestData: Partial<MaterialRequest>) => {
  const { data } = await apiClient.post<MaterialRequest>('/api/v1/mes/material/requests', requestData);
  return data;
};

export const updateMaterialRequest = async (requestId: string, requestData: Partial<MaterialRequest>) => {
  const { data } = await apiClient.patch<MaterialRequest>(`/api/v1/mes/material/requests/${requestId}`, requestData);
  return data;
};

// Material Inventory APIs
export const getMaterialInventory = async (params?: {
  location_code?: string;
  material_code?: string;
  low_stock?: boolean;
  page?: number;
  page_size?: number;
}) => {
  const { data } = await apiClient.get('/api/v1/mes/material/inventory', { params });
  return data;
};

export const createMaterialInventory = async (inventoryData: Partial<MaterialInventory>) => {
  const { data } = await apiClient.post<MaterialInventory>('/api/v1/mes/material/inventory', inventoryData);
  return data;
};

export const updateMaterialInventory = async (inventoryId: string, inventoryData: Partial<MaterialInventory>) => {
  const { data } = await apiClient.patch<MaterialInventory>(`/api/v1/mes/material/inventory/${inventoryId}`, inventoryData);
  return data;
};

// Summary & Alerts APIs
export const getLineMaterialSummary = async () => {
  const { data } = await apiClient.get<LineMaterialSummary[]>('/api/v1/mes/material/summary/lines');
  return data;
};

export const getMaterialShortageAlerts = async () => {
  const { data } = await apiClient.get<MaterialShortageAlert[]>('/api/v1/mes/material/alerts/shortage');
  return data;
};
