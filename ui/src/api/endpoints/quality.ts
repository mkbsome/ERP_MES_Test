/**
 * Quality API Endpoints
 */
import apiClient from '../client';

export interface DefectDetail {
  id: string;
  tenant_id: string;
  defect_timestamp: string;
  detection_point: 'spi' | 'aoi' | 'xray' | 'ict' | 'fct' | 'visual' | 'customer';
  equipment_code: string;
  line_code: string;
  production_order_no?: string;
  product_code: string;
  lot_no?: string;
  panel_id?: string;
  pcb_serial?: string;
  defect_category: string;
  defect_code: string;
  defect_description?: string;
  defect_location?: string;
  component_ref?: string;
  component_code?: string;
  x_position?: number;
  y_position?: number;
  defect_qty: number;
  severity?: 'critical' | 'major' | 'minor';
  image_url?: string;
  detected_by?: string;
  detection_method?: string;
  repair_action?: string;
  repair_result?: 'repaired' | 'scrapped' | 'pending' | 'no_action';
  repaired_by?: string;
  repaired_at?: string;
  root_cause_category?: string;
  root_cause_detail?: string;
  created_at: string;
}

export interface DefectAnalysis {
  defect_code: string;
  defect_name?: string;
  defect_category: string;
  count: number;
  percentage: number;
  cumulative_percentage: number;
}

export interface DefectTrend {
  date: string;
  line_code: string;
  defect_count: number;
  defect_rate: number;
}

export interface InspectionResult {
  id: string;
  tenant_id: string;
  inspection_no: string;
  inspection_type: 'SPI' | 'AOI' | 'AXI' | 'MANUAL' | 'ICT' | 'FCT';
  production_order_id?: string;
  lot_no: string;
  board_id?: string;
  product_code: string;
  line_code?: string;
  equipment_id?: string;
  operation_no?: number;
  inspection_datetime: string;
  shift?: string;
  inspector_code?: string;
  result: 'PASS' | 'FAIL' | 'REWORK';
  total_inspected: number;
  pass_qty: number;
  fail_qty: number;
  defect_points?: Array<{
    location: string;
    defect_code: string;
    x?: number;
    y?: number;
  }>;
  inspection_time_sec?: number;
  rework_flag: boolean;
  created_at: string;
  pass_rate?: number;
}

export interface SPCData {
  id: string;
  tenant_id: string;
  spc_no: string;
  line_code: string;
  equipment_id?: string;
  product_code: string;
  lot_no?: string;
  measurement_type: string;
  measurement_datetime: string;
  sample_size: number;
  measured_value: number;
  unit?: string;
  spec_lower?: number;
  spec_upper?: number;
  target_value?: number;
  control_lower?: number;
  control_upper?: number;
  cpk_value?: number;
  out_of_spec: boolean;
  out_of_control: boolean;
  shift?: string;
  created_at: string;
}

export interface SPCChartData {
  measurement_type: string;
  measurements: SPCData[];
  mean: number;
  std_dev: number;
  ucl: number;
  lcl: number;
  usl?: number;
  lsl?: number;
  cpk?: number;
}

export interface QualitySummary {
  date: string;
  line_code: string;
  total_inspected: number;
  total_pass: number;
  total_fail: number;
  pass_rate: number;
  defect_rate: number;
  top_defects: DefectAnalysis[];
}

export interface TraceabilityData {
  lot_no: string;
  product_code?: string;
  production_order_no?: string;
  status?: string;
  operations: Array<{
    operation_no: number;
    operation_name?: string;
    equipment_code: string;
    line_code: string;
    timestamp: string;
    operator_code?: string;
    material_lots?: Record<string, any>;
    process_parameters?: Record<string, any>;
    quality_results?: Record<string, any>;
  }>;
  material_traceability?: Record<string, any>;
}

// API Functions

export const getInspections = async (params?: {
  page?: number;
  page_size?: number;
  inspection_type?: string;
  lot_no?: string;
  product_code?: string;
  result?: string;
  start_date?: string;
  end_date?: string;
}): Promise<InspectionResult[]> => {
  const response = await apiClient.get('/mes/quality/inspections', { params });
  return response.data;
};

export const createInspection = async (data: Partial<InspectionResult>): Promise<InspectionResult> => {
  const response = await apiClient.post('/mes/quality/inspections', data);
  return response.data;
};

export const getInspection = async (inspectionId: string): Promise<InspectionResult> => {
  const response = await apiClient.get(`/mes/quality/inspections/${inspectionId}`);
  return response.data;
};

export const getDefects = async (params?: {
  page?: number;
  page_size?: number;
  line_code?: string;
  product_code?: string;
  defect_category?: string;
  defect_code?: string;
  start_date?: string;
  end_date?: string;
}): Promise<DefectDetail[]> => {
  const response = await apiClient.get('/mes/quality/defects', { params });
  return response.data;
};

export const createDefect = async (data: Partial<DefectDetail>): Promise<DefectDetail> => {
  const response = await apiClient.post('/mes/quality/defects', data);
  return response.data;
};

export const getDefectAnalysis = async (params?: {
  line_code?: string;
  product_code?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<DefectAnalysis[]> => {
  const response = await apiClient.get('/mes/quality/defects/analysis', { params });
  return response.data;
};

export const getDefectPareto = async (params?: {
  line_code?: string;
  product_code?: string;
  start_date?: string;
  end_date?: string;
}): Promise<DefectAnalysis[]> => {
  const response = await apiClient.get('/mes/quality/defects/pareto', { params });
  return response.data;
};

export const getSPCData = async (params?: {
  line_code?: string;
  product_code?: string;
  measurement_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}): Promise<SPCData[]> => {
  const response = await apiClient.get('/mes/quality/spc/data', { params });
  return response.data;
};

export const getSPCChartData = async (
  measurementType: string,
  params?: {
    line_code?: string;
    product_code?: string;
    limit?: number;
  }
): Promise<SPCChartData> => {
  const response = await apiClient.get(`/mes/quality/spc/chart/${measurementType}`, { params });
  return response.data;
};

export const getTraceability = async (lotNo: string): Promise<TraceabilityData> => {
  const response = await apiClient.get(`/mes/quality/traceability/${lotNo}`);
  return response.data;
};
