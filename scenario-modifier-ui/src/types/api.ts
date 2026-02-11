// ============ Base Data Types ============

export interface BaseDataSummary {
  date_range: {
    start: string;
    end: string;
    total_orders: number;
  };
  erp_records: Record<string, number>;
  mes_records: Record<string, number>;
  business_flow_stats: {
    orders_by_status: Record<string, number>;
  };
}

export interface BaseDataGenerateRequest {
  start_date: string;
  end_date: string;
  orders_per_day?: number;
  include_production?: boolean;
  include_procurement?: boolean;
}

export interface BaseDataStatus {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  current_date?: string;
  records_generated: Record<string, number>;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

// ============ Scenario Modifier Types ============

// Extended AnomalyType to include all 23 scenarios
export type AnomalyType =
  // Quality Anomalies
  | 'defect_spike'
  | 'yield_degradation'
  | 'quality_hold'
  | 'spc_violation'
  // Equipment Anomalies
  | 'oee_drop'
  | 'equipment_breakdown'
  | 'cycle_time_increase'
  | 'downtime_spike'
  | 'maintenance_overdue'
  // Production Anomalies
  | 'production_delay'
  | 'underproduction'
  | 'schedule_deviation'
  | 'bottleneck'
  | 'shift_variance'
  // Material Anomalies
  | 'material_shortage'
  | 'incoming_reject'
  | 'lot_contamination'
  // Business Anomalies
  | 'delivery_delay'
  | 'order_cancellation'
  | 'supplier_delay'
  | 'demand_spike'
  // HR Anomalies
  | 'mass_absence'
  | 'overtime_spike';

export type ModificationMode = 'last_n_days' | 'date_range' | 'realtime_stream';

export interface ScenarioApplyRequest {
  anomaly_type: AnomalyType | string;
  modification_mode: ModificationMode;
  days?: number;
  start_date?: string;
  end_date?: string;
  intensity?: number;
  target_line?: string;
  target_product?: string;
  target_equipment?: string;
  preserve_original?: boolean;
}

export interface ScenarioApplyResponse {
  success: boolean;
  anomaly_type: string;
  modification_mode: string;
  records_modified: number;
  date_range: {
    start: string;
    end: string;
  };
  details: Record<string, unknown>;
  revert_command?: string;
}

export interface ModificationHistory {
  id: string;
  timestamp: string;
  anomaly_type: string;
  modification_mode: string;
  records_modified: number;
  original_values: Record<string, unknown>;
  can_revert: boolean;
}

export interface AnomalyTypeInfo {
  type: AnomalyType;
  name: string;
  description: string;
  implemented?: boolean;
  affects?: string[];
  intensity_range?: {
    min: number;
    max: number;
    default: number;
  };
}

export interface AnomalyTypesResponse {
  quality_anomalies: AnomalyTypeInfo[];
  equipment_anomalies: AnomalyTypeInfo[];
  production_anomalies: AnomalyTypeInfo[];
  material_anomalies: AnomalyTypeInfo[];
  business_anomalies: AnomalyTypeInfo[];
  hr_anomalies: AnomalyTypeInfo[];
}

export interface RevertResponse {
  success: boolean;
  message: string;
  modification_id: string;
}

// ============ API Response Types ============

export interface ApiError {
  detail: string;
}
