/**
 * Generator UI Types
 */

// 시나리오 카테고리
export type ScenarioCategory =
  | 'mes_production'
  | 'mes_equipment'
  | 'mes_quality'
  | 'mes_material'
  | 'mes_system'
  | 'erp_sales'
  | 'erp_purchase'
  | 'erp_inventory'
  | 'erp_accounting'
  | 'erp_hr'
  | 'erp_master';

// 시나리오 정보
export interface Scenario {
  id: string;
  name: string;
  description: string;
  category: ScenarioCategory;
  enabled: boolean;
  ai_use_cases: string[];
  trigger_type: 'scheduled' | 'condition' | 'random' | 'always';
  start_date?: string;
  duration_days?: number;
}

// 생성 설정
export interface GeneratorConfig {
  start_date: string;
  end_date: string;
  tenant_id: string;
  random_seed: number;
  enabled_scenarios: string[];
  output_format: 'json' | 'database';
}

// 생성 작업 상태
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// 생성 작업
export interface GeneratorJob {
  id: string;
  status: JobStatus;
  config: GeneratorConfig;
  progress: GeneratorProgress;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

// 진행 상태
export interface GeneratorProgress {
  current_day: number;
  total_days: number;
  current_date: string;
  percentage: number;
  current_module?: string;
  records_generated: RecordCounts;
}

// 레코드 카운트
export interface RecordCounts {
  mes: {
    production_orders: number;
    production_results: number;
    equipment_status: number;
    quality_inspections: number;
    defect_records: number;
    material_consumption: number;
  };
  erp: {
    sales_orders: number;
    purchase_orders: number;
    inventory_transactions: number;
    journal_entries: number;
    attendance_records: number;
  };
}

// 생성 요약
export interface GeneratorSummary {
  mes: {
    production: ModuleSummary;
    equipment: ModuleSummary;
    quality: ModuleSummary;
    material: ModuleSummary;
  };
  erp: {
    sales: ModuleSummary;
    purchase: ModuleSummary;
    inventory: ModuleSummary;
    accounting: ModuleSummary;
    hr: ModuleSummary;
  };
}

export interface ModuleSummary {
  [key: string]: number | string;
}

// WebSocket 메시지
export interface WSMessage {
  type: 'progress' | 'completed' | 'error' | 'log';
  job_id: string;
  data: GeneratorProgress | GeneratorSummary | string;
  timestamp: string;
}

// API 응답
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 시나리오 카테고리 메타데이터
export const SCENARIO_CATEGORIES: Record<ScenarioCategory, { label: string; icon: string; color: string }> = {
  mes_production: { label: '생산관리', icon: 'Factory', color: 'blue' },
  mes_equipment: { label: '설비관리', icon: 'Cog', color: 'orange' },
  mes_quality: { label: '품질관리', icon: 'CheckCircle', color: 'green' },
  mes_material: { label: '자재관리', icon: 'Package', color: 'purple' },
  mes_system: { label: '시스템/환경', icon: 'Settings', color: 'gray' },
  erp_sales: { label: '영업관리', icon: 'ShoppingCart', color: 'indigo' },
  erp_purchase: { label: '구매관리', icon: 'Truck', color: 'yellow' },
  erp_inventory: { label: '재고관리', icon: 'Warehouse', color: 'teal' },
  erp_accounting: { label: '회계관리', icon: 'Calculator', color: 'red' },
  erp_hr: { label: '인사급여', icon: 'Users', color: 'pink' },
  erp_master: { label: '기준정보', icon: 'Database', color: 'cyan' },
};
