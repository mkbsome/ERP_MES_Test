import type {
  ProductionLine,
  ProductionSummary,
  EquipmentOEE,
  OEESummary,
  DefectSummary,
  DefectTrend,
  Alert,
  KPIData,
} from '../types';

// Production Lines
export const productionLines: ProductionLine[] = [
  { id: '1', lineCode: 'SMT-L01', lineName: 'SMT Line 1', lineType: 'smt_high_speed', status: 'running', currentProduct: 'MB-001', currentOEE: 0.87, todayProduction: 2450, todayDefectRate: 0.012 },
  { id: '2', lineCode: 'SMT-L02', lineName: 'SMT Line 2', lineType: 'smt_high_speed', status: 'running', currentProduct: 'MB-002', currentOEE: 0.82, todayProduction: 2280, todayDefectRate: 0.018 },
  { id: '3', lineCode: 'SMT-L03', lineName: 'SMT Line 3', lineType: 'smt_mid_speed', status: 'idle', currentProduct: '-', currentOEE: 0.75, todayProduction: 1650, todayDefectRate: 0.025 },
  { id: '4', lineCode: 'SMT-L04', lineName: 'SMT Line 4', lineType: 'smt_mid_speed', status: 'running', currentProduct: 'LB-003', currentOEE: 0.79, todayProduction: 1820, todayDefectRate: 0.015 },
  { id: '5', lineCode: 'SMT-L05', lineName: 'SMT Line 5', lineType: 'smt_flex', status: 'maintenance', currentProduct: '-', currentOEE: 0.0, todayProduction: 850, todayDefectRate: 0.008 },
  { id: '6', lineCode: 'SMT-L06', lineName: 'SMT Line 6', lineType: 'smt_high_speed', status: 'running', currentProduct: 'PB-001', currentOEE: 0.91, todayProduction: 2680, todayDefectRate: 0.009 },
  { id: '7', lineCode: 'SMT-L07', lineName: 'SMT Line 7', lineType: 'smt_high_speed', status: 'running', currentProduct: 'PB-002', currentOEE: 0.85, todayProduction: 2350, todayDefectRate: 0.014 },
  { id: '8', lineCode: 'SMT-L08', lineName: 'SMT Line 8', lineType: 'smt_mid_speed', status: 'down', currentProduct: '-', currentOEE: 0.0, todayProduction: 920, todayDefectRate: 0.035 },
  { id: '9', lineCode: 'THT-L01', lineName: 'THT Line 1', lineType: 'tht', status: 'running', currentProduct: 'AB-001', currentOEE: 0.78, todayProduction: 580, todayDefectRate: 0.022 },
  { id: '10', lineCode: 'ASM-L01', lineName: 'Assembly Line 1', lineType: 'assembly', status: 'running', currentProduct: 'MB-001', currentOEE: 0.83, todayProduction: 420, todayDefectRate: 0.011 },
];

// Daily Production Summary (Last 7 days)
export const productionSummary: ProductionSummary[] = [
  { date: '2024-07-24', totalProduction: 18500, goodProduction: 18220, defectCount: 280, defectRate: 0.0151, achievementRate: 0.92 },
  { date: '2024-07-25', totalProduction: 19200, goodProduction: 18910, defectCount: 290, defectRate: 0.0151, achievementRate: 0.95 },
  { date: '2024-07-26', totalProduction: 17800, goodProduction: 17520, defectCount: 280, defectRate: 0.0157, achievementRate: 0.88 },
  { date: '2024-07-27', totalProduction: 18900, goodProduction: 18620, defectCount: 280, defectRate: 0.0148, achievementRate: 0.94 },
  { date: '2024-07-28', totalProduction: 19500, goodProduction: 19210, defectCount: 290, defectRate: 0.0149, achievementRate: 0.97 },
  { date: '2024-07-29', totalProduction: 18200, goodProduction: 17910, defectCount: 290, defectRate: 0.0159, achievementRate: 0.91 },
  { date: '2024-07-30', totalProduction: 19800, goodProduction: 19510, defectCount: 290, defectRate: 0.0146, achievementRate: 0.98 },
];

// OEE Summary (Last 7 days)
export const oeeSummary: OEESummary[] = [
  { date: '2024-07-24', avgAvailability: 0.91, avgPerformance: 0.88, avgQuality: 0.985, avgOEE: 0.79 },
  { date: '2024-07-25', avgAvailability: 0.93, avgPerformance: 0.89, avgQuality: 0.984, avgOEE: 0.81 },
  { date: '2024-07-26', avgAvailability: 0.88, avgPerformance: 0.87, avgQuality: 0.983, avgOEE: 0.75 },
  { date: '2024-07-27', avgAvailability: 0.92, avgPerformance: 0.90, avgQuality: 0.986, avgOEE: 0.82 },
  { date: '2024-07-28', avgAvailability: 0.94, avgPerformance: 0.91, avgQuality: 0.985, avgOEE: 0.84 },
  { date: '2024-07-29', avgAvailability: 0.90, avgPerformance: 0.88, avgQuality: 0.984, avgOEE: 0.78 },
  { date: '2024-07-30', avgAvailability: 0.93, avgPerformance: 0.92, avgQuality: 0.986, avgOEE: 0.85 },
];

// Defect Summary (Pareto)
export const defectSummary: DefectSummary[] = [
  { defectCode: 'BRIDGE', defectName: '솔더 브릿지', count: 145, qty: 145, percentage: 32.5 },
  { defectCode: 'OPEN', defectName: '오픈 (납땜 불량)', count: 98, qty: 98, percentage: 22.0 },
  { defectCode: 'MISSING', defectName: '부품 누락', count: 67, qty: 67, percentage: 15.0 },
  { defectCode: 'TOMBSTONE', defectName: '툼스톤', count: 52, qty: 52, percentage: 11.7 },
  { defectCode: 'SHIFT', defectName: '부품 틀어짐', count: 38, qty: 38, percentage: 8.5 },
  { defectCode: 'INSUFFICIENT', defectName: '솔더 부족', count: 25, qty: 25, percentage: 5.6 },
  { defectCode: 'COLD', defectName: '냉납', count: 21, qty: 21, percentage: 4.7 },
];

// Defect Trend (Last 7 days)
export const defectTrend: DefectTrend[] = [
  { date: '2024-07-24', defectRate: 0.0151, defectCount: 280 },
  { date: '2024-07-25', defectRate: 0.0151, defectCount: 290 },
  { date: '2024-07-26', defectRate: 0.0157, defectCount: 280 },
  { date: '2024-07-27', defectRate: 0.0148, defectCount: 280 },
  { date: '2024-07-28', defectRate: 0.0149, defectCount: 290 },
  { date: '2024-07-29', defectRate: 0.0159, defectCount: 290 },
  { date: '2024-07-30', defectRate: 0.0146, defectCount: 290 },
];

// Equipment OEE
export const equipmentOEE: EquipmentOEE[] = [
  { equipmentCode: 'MOUNTER-L01-01', equipmentName: 'Mounter L01-1', lineCode: 'SMT-L01', date: '2024-07-30', shift: '1', availability: 0.94, performance: 0.92, quality: 0.988, oee: 0.86, plannedTimeMin: 480, runningTimeMin: 451, downtimeMin: 29 },
  { equipmentCode: 'MOUNTER-L01-02', equipmentName: 'Mounter L01-2', lineCode: 'SMT-L01', date: '2024-07-30', shift: '1', availability: 0.92, performance: 0.90, quality: 0.985, oee: 0.82, plannedTimeMin: 480, runningTimeMin: 442, downtimeMin: 38 },
  { equipmentCode: 'REFLOW-L01', equipmentName: 'Reflow L01', lineCode: 'SMT-L01', date: '2024-07-30', shift: '1', availability: 0.96, performance: 0.94, quality: 0.992, oee: 0.90, plannedTimeMin: 480, runningTimeMin: 461, downtimeMin: 19 },
  { equipmentCode: 'AOI-L01', equipmentName: 'AOI L01', lineCode: 'SMT-L01', date: '2024-07-30', shift: '1', availability: 0.98, performance: 0.96, quality: 0.995, oee: 0.94, plannedTimeMin: 480, runningTimeMin: 470, downtimeMin: 10 },
  { equipmentCode: 'PRINTER-L02', equipmentName: 'Printer L02', lineCode: 'SMT-L02', date: '2024-07-30', shift: '1', availability: 0.89, performance: 0.88, quality: 0.982, oee: 0.77, plannedTimeMin: 480, runningTimeMin: 427, downtimeMin: 53 },
];

// Alerts
export const alerts: Alert[] = [
  { id: '1', type: 'critical', title: 'SMT-L08 설비 정지', message: 'Mounter 노즐 막힘으로 라인 정지. 즉각적인 조치 필요.', timestamp: '2024-07-30T14:25:00', source: 'SMT-L08', acknowledged: false },
  { id: '2', type: 'warning', title: 'SMT-L03 불량률 상승', message: '솔더 브릿지 불량률이 2.5%로 상승. 원인 분석 필요.', timestamp: '2024-07-30T13:42:00', source: 'SMT-L03', acknowledged: false },
  { id: '3', type: 'warning', title: 'SMT-L05 PM 예정', message: '예방 보전 일정: 14:00 ~ 18:00', timestamp: '2024-07-30T09:00:00', source: 'SMT-L05', acknowledged: true },
  { id: '4', type: 'info', title: '자재 입고 완료', message: 'PO-20240730-001245 입고 완료. IQC 검사 대기.', timestamp: '2024-07-30T11:15:00', source: 'WH-RM', acknowledged: true },
  { id: '5', type: 'info', title: 'OEE 목표 달성', message: 'SMT-L06 일간 OEE 91% 달성 (목표: 85%)', timestamp: '2024-07-30T08:30:00', source: 'SMT-L06', acknowledged: true },
];

// KPI Data
export const kpiData: KPIData[] = [
  { label: '금일 생산량', value: 19800, unit: 'EA', target: 20000, trend: 'up', trendValue: 3.2 },
  { label: '평균 OEE', value: 85, unit: '%', target: 85, trend: 'up', trendValue: 2.1 },
  { label: '불량률', value: 1.46, unit: '%', target: 1.5, trend: 'down', trendValue: 0.8 },
  { label: '가동률', value: 93, unit: '%', target: 92, trend: 'stable', trendValue: 0.1 },
  { label: '납기 준수율', value: 97.5, unit: '%', target: 95, trend: 'up', trendValue: 1.5 },
  { label: '재고 회전율', value: 12.3, unit: '회/년', target: 12, trend: 'up', trendValue: 0.5 },
];

// Hourly Production (Today)
export const hourlyProduction = [
  { hour: '06:00', production: 820, target: 850 },
  { hour: '07:00', production: 890, target: 850 },
  { hour: '08:00', production: 920, target: 850 },
  { hour: '09:00', production: 880, target: 850 },
  { hour: '10:00', production: 910, target: 850 },
  { hour: '11:00', production: 850, target: 850 },
  { hour: '12:00', production: 420, target: 425 },
  { hour: '13:00', production: 870, target: 850 },
  { hour: '14:00', production: 830, target: 850 },
  { hour: '15:00', production: 0, target: 850 },
  { hour: '16:00', production: 0, target: 850 },
  { hour: '17:00', production: 0, target: 850 },
];

// Product family distribution
export const productDistribution = [
  { name: '메인보드 (MB)', value: 35, color: '#22c55e' },
  { name: '전원보드 (PB)', value: 25, color: '#3b82f6' },
  { name: 'LED 드라이버 (LB)', value: 20, color: '#f59e0b' },
  { name: 'IoT 모듈 (IM)', value: 12, color: '#8b5cf6' },
  { name: '자동차용 (AB)', value: 8, color: '#ef4444' },
];
