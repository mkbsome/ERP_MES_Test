// Production types
export interface ProductionResult {
  id: string;
  lineCode: string;
  productCode: string;
  productName: string;
  shift: string;
  goodQty: number;
  defectQty: number;
  totalQty: number;
  productionDate: string;
  cycleTimeAvg: number;
}

export interface ProductionSummary {
  date: string;
  totalProduction: number;
  goodProduction: number;
  defectCount: number;
  defectRate: number;
  achievementRate: number;
}

// Equipment types
export interface Equipment {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  equipmentType: string;
  lineCode: string;
  status: 'running' | 'idle' | 'down' | 'maintenance';
  manufacturer: string;
  model: string;
}

export interface EquipmentOEE {
  equipmentCode: string;
  equipmentName: string;
  lineCode: string;
  date: string;
  shift: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  plannedTimeMin: number;
  runningTimeMin: number;
  downtimeMin: number;
}

export interface OEESummary {
  date: string;
  avgAvailability: number;
  avgPerformance: number;
  avgQuality: number;
  avgOEE: number;
}

// Defect types
export interface DefectSummary {
  defectCode: string;
  defectName: string;
  count: number;
  qty: number;
  percentage: number;
}

export interface DefectTrend {
  date: string;
  defectRate: number;
  defectCount: number;
}

// Line types
export interface ProductionLine {
  id: string;
  lineCode: string;
  lineName: string;
  lineType: string;
  status: 'running' | 'idle' | 'down' | 'maintenance';
  currentProduct?: string;
  currentOEE: number;
  todayProduction: number;
  todayDefectRate: number;
}

// KPI types
export interface KPIData {
  label: string;
  value: number;
  unit: string;
  target?: number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

// Alert types
export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
}

// Chart types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}
