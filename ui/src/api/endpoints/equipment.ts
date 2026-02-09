/**
 * Equipment API Endpoints
 */
import apiClient from '../client';

export interface EquipmentMaster {
  id: string;
  tenant_id: string;
  equipment_code: string;
  equipment_name: string;
  equipment_type: string;
  equipment_category?: string;
  line_code: string;
  position_in_line?: number;
  manufacturer?: string;
  model?: string;
  serial_no?: string;
  firmware_version?: string;
  install_date?: string;
  warranty_end_date?: string;
  standard_cycle_time_sec?: number;
  max_capacity_per_hour?: number;
  ip_address?: string;
  port?: number;
  communication_protocol?: string;
  last_pm_date?: string;
  next_pm_date?: string;
  pm_interval_days: number;
  status: string;
  attributes?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface EquipmentStatus {
  id: string;
  tenant_id: string;
  equipment_code: string;
  status_timestamp: string;
  status: 'running' | 'idle' | 'setup' | 'alarm' | 'breakdown' | 'maintenance' | 'offline' | 'waiting';
  previous_status?: string;
  status_reason?: string;
  alarm_code?: string;
  alarm_message?: string;
  alarm_severity?: 'info' | 'warning' | 'error' | 'critical' | 'fatal';
  production_order_no?: string;
  product_code?: string;
  operator_code?: string;
  speed_actual?: number;
  speed_target?: number;
  temperature_actual?: number;
  temperature_target?: number;
  counters?: Record<string, any>;
  parameters?: Record<string, any>;
  created_at: string;
}

export interface EquipmentCurrentStatus {
  equipment_code: string;
  equipment_name: string;
  equipment_type: string;
  line_code: string;
  position_in_line?: number;
  status: string;
  status_since?: string;
  current_order_no?: string;
  product_code?: string;
  alarm_code?: string;
  alarm_message?: string;
}

export interface EquipmentOEE {
  id: string;
  tenant_id: string;
  calculation_date: string;
  shift_code?: string;
  equipment_code: string;
  line_code: string;
  planned_time_min: number;
  actual_run_time_min: number;
  downtime_min: number;
  setup_time_min: number;
  idle_time_min: number;
  ideal_cycle_time_sec?: number;
  actual_cycle_time_sec?: number;
  total_count: number;
  good_count: number;
  defect_count: number;
  oee?: number;
  availability?: number;
  performance?: number;
  quality?: number;
  downtime_breakdown?: Record<string, any>;
  defect_breakdown?: Record<string, any>;
  calculated_at?: string;
  created_at: string;
}

export interface OEETrend {
  date: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
}

export interface DowntimeEvent {
  id: string;
  tenant_id: string;
  event_no: string;
  equipment_code: string;
  line_code: string;
  start_time: string;
  end_time?: string;
  duration_min?: number;
  downtime_category: string;
  downtime_code: string;
  downtime_reason?: string;
  alarm_code?: string;
  alarm_message?: string;
  production_order_no?: string;
  product_code?: string;
  operator_code?: string;
  root_cause?: string;
  corrective_action?: string;
  maintenance_ticket_no?: string;
  impact_qty?: number;
  impact_cost?: number;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolved_by?: string;
  resolved_at?: string;
  notes?: string;
  reported_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface LineStatus {
  line_code: string;
  line_name: string;
  line_type: string;
  status: string;
  equipment_count: number;
  running_count: number;
  idle_count: number;
  down_count: number;
  current_oee?: number;
  today_production?: number;
  today_defects?: number;
}

// API Functions

export const getEquipmentList = async (params?: {
  line_code?: string;
  equipment_type?: string;
  status?: string;
}): Promise<EquipmentMaster[]> => {
  const response = await apiClient.get('/mes/equipment', { params });
  return response.data;
};

export const getEquipment = async (equipmentId: string): Promise<EquipmentMaster> => {
  const response = await apiClient.get(`/mes/equipment/${equipmentId}`);
  return response.data;
};

export const getEquipmentStatus = async (equipmentId: string): Promise<EquipmentStatus> => {
  const response = await apiClient.get(`/mes/equipment/${equipmentId}/status`);
  return response.data;
};

export const updateEquipmentStatus = async (
  equipmentId: string,
  data: Partial<EquipmentStatus>
): Promise<EquipmentStatus> => {
  const response = await apiClient.post(`/mes/equipment/${equipmentId}/status`, data);
  return response.data;
};

export const getAllEquipmentStatus = async (params?: {
  line_code?: string;
}): Promise<EquipmentCurrentStatus[]> => {
  const response = await apiClient.get('/mes/equipment/status/all', { params });
  return response.data;
};

export const getOEEData = async (params?: {
  line_code?: string;
  equipment_code?: string;
  start_date?: string;
  end_date?: string;
}): Promise<EquipmentOEE[]> => {
  const response = await apiClient.get('/mes/equipment/oee', { params });
  return response.data;
};

export const getOEETrend = async (
  equipmentCode: string,
  days?: number
): Promise<OEETrend[]> => {
  const response = await apiClient.get(`/mes/equipment/oee/${equipmentCode}/trend`, {
    params: { days },
  });
  return response.data;
};

export const getDowntimeEvents = async (params?: {
  page?: number;
  page_size?: number;
  equipment_code?: string;
  line_code?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}): Promise<DowntimeEvent[]> => {
  const response = await apiClient.get('/mes/equipment/downtime', { params });
  return response.data;
};

export const createDowntimeEvent = async (data: Partial<DowntimeEvent>): Promise<DowntimeEvent> => {
  const response = await apiClient.post('/mes/equipment/downtime', data);
  return response.data;
};

export const updateDowntimeEvent = async (
  eventId: string,
  data: Partial<DowntimeEvent>
): Promise<DowntimeEvent> => {
  const response = await apiClient.patch(`/mes/equipment/downtime/${eventId}`, data);
  return response.data;
};

export const getMaintenanceHistory = async (params?: {
  equipment_code?: string;
  page?: number;
  page_size?: number;
}): Promise<DowntimeEvent[]> => {
  const response = await apiClient.get('/mes/equipment/maintenance', { params });
  return response.data;
};

export const createMaintenanceRecord = async (data: Partial<DowntimeEvent>): Promise<DowntimeEvent> => {
  const response = await apiClient.post('/mes/equipment/maintenance', data);
  return response.data;
};
